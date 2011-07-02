
  (function(){

    // namespace

    var namespace = 'Basis.Layout';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var CSS = Basis.CSS;

    var Browser = Basis.Browser;
    var extend = Object.extend;
    var classList = Basis.CSS.classList;

    var nsWrappers = DOM.Wrapper;
    var EventObject = Basis.EventObject;

    var Property = Basis.Data.Property.Property;
    var DataObjectSet = Basis.Data.Property.DataObjectSet;

    //
    // Main part
    //

    var ALIGN_TOP    = 0x01;
    var ALIGN_LEFT   = 0x02;
    var ALIGN_RIGHT  = 0x04;
    var ALIGN_BOTTOM = 0x08;
    var ALIGN_CLIENT = 0x10;

    var ALIGN_BY_NAME = {
      'top':    ALIGN_TOP,
      'left':   ALIGN_LEFT,
      'right':  ALIGN_RIGHT,
      'bottom': ALIGN_BOTTOM,
      'client': ALIGN_CLIENT
    };
    var ALIGN_NAME_BY_CODE = {};
    Object.keys(ALIGN_BY_NAME).forEach(function(key){ ALIGN_NAME_BY_CODE[ALIGN_BY_NAME[key]] = key });

    var isTwoSideLayoutSupport = !Browser.is('IE7-');

    var LayoutHelper = DOM.createElement('DIV');
    extend(LayoutHelper.style, {
      visibility: 'hidden',
      position: 'absolute',
      width: '1px',
      height: '1px'
    });

    var RealignManager = {
      layout: [],
      realign: function(){
        //;;; if (typeof console != 'undefined') console.log('start fallback realign');
        var realignQueue = [];
        for (var i = 0; i < this.layout.length; i++)
        {
          if (this.layout[i].isVisible())
          {
            realignQueue.push(this.layout[i]);
          }
        }
        //;;; console.log(realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).map(function(item){ return DOM.deep(item.element) }).join(' '));
        //alert(realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).map(function(item){ return DOM.deep(item.element)}));
        realignQueue.sortAsObject(function(item){ return DOM.deep(item.element) }).forEach(function(item){ item.realign() });
      }
    };

    var Layout = Class(EventObject, {
      className: namespace + '.Layout',

      init: function(config){
        config = config || {};

        //var asd = { change: function(value){console.log('changed to ' + value)} };
        var anchors = {
          top: new Property(0),
          left: new Property(0),
          right: new Property(0),
          bottom: new Property(0),
          width: new Property(0),
          height: new Property(0),
          clientWidth: new Property(0),
          clientHeight: new Property(0)
        };
        var layoutConfig = {
          realign: new Property(false),
          realignFactors: new DataObjectSet(),
          anchor:  anchors
        };
        layoutConfig.realignFactors.add(layoutConfig.realign);

        this.clientWidth  = new DataObjectSet(anchors.left, anchors.right, anchors.width);
        this.clientWidth.addHandler({
          change: function(){
            var value = anchors.width - anchors.left - anchors.right;
            anchors.clientWidth.set(value < 0 ? 0 : value);
          }
        });
        this.clientHeight = new DataObjectSet(anchors.top, anchors.bottom, anchors.height);
        this.clientHeight.addHandler({
          change: function(){
            var value = anchors.height - anchors.top - anchors.bottom;
            anchors.clientHeight.set(value < 0 ? 0 : value);
          }
        });

        layoutConfig.realignFactors.addHandler({ change: this.realign }, this);
        this.layoutConfig = layoutConfig;

        this.side = {};
        var sideElement = [];
        for (var side in ALIGN_BY_NAME)
        {
          this.side[side] = {};
          var buildSideConfig = config[side];
          if (buildSideConfig)
          {
            var content  = typeof buildSideConfig == 'object' && 'content' in buildSideConfig ? buildSideConfig.content : buildSideConfig;
            var isConfig = content != buildSideConfig;

            var sideConfig = this.addSide(side, true);
            if (isConfig)
              this.applySideProperties(side, buildSideConfig);

            sideElement.push(sideConfig.element);

            if (Function.$isNotNull(content))
              if (content instanceof Layout)
                content.attach(sideConfig.element);
              else
                this.insert(side, content, sideConfig.position || DOM.INSERT_END, sideConfig.relElement || null);
          }
        }

        if (config.container)
          this.attach(config.container);

        if (this.element)
          DOM.insert(this.element, sideElement);

        RealignManager.layout.push(this);

        //Cleaner.add(this);
      },
      
      attach: function(element){
        this.detach();

        // determine offsetParent
        var parent;
        if (element = DOM.get(element))
        {
          // find really parent; it must be block with relative, fixed or absolute position
          if (element.firstChild)
            parent = element.firstChild.offsetParent;
          else
          {
            parent = DOM.insert(element, LayoutHelper).offsetParent;
            DOM.remove(LayoutHelper);
          }
          parent = element;
        }

        if (!parent)
          parent = document.body;

        // only one Layout must be attached to element
        if (parent.basisLayoutConfig)
          throw new Error('Some Layout already attached to current element');

        // attach elements to new parent
        this.element = parent;
        this.element.basisLayoutConfig = this;
        var sideElement = [];
        for (var side in this.side)
        {
          if (this.side[side].element)
            sideElement.push(this.side[side].element);
            //DOM.insert(parent, this.side[side].element);
        }
        DOM.insert(parent, sideElement);

        this.layoutConfig.realign.set(true);
      },
      detach: function(){
        if (this.element)
        {
          for (var side in this.side)
            if (this.side[side].element)
              DOM.remove(this.side[side].element);
          this.element.basisLayoutConfig = undefined;  // IE6 crush on property delete
          delete this.element;
        }
      },

      isVisible: function(){
        return this.element && this.element.ownerDocument == document && this.element.offsetHeight && this.element.offsetWidth;
      },
      realign: function(){
        this.layoutConfig.realign.value = false;

        if (this.isVisible())
        {
          //;;; if (typeof console != 'undefined') console.log(this.element, ' realign');

          var anchors = this.layoutConfig.anchor;

          anchors.width.set(this.element.clientWidth);
          anchors.height.set(this.element.clientHeight);

          for (var side in this.side)
          {
            var sideConfig = this.side[side];

            if (sideConfig.element)
            {
              sideConfig.realign.value = false;

              if (!sideConfig.emptyAllow && !sideConfig.element.firstChild)
                this.removeSide(side);
              else
                if (side != 'client')
                  anchors[side].set(sideConfig.element[ALIGN_BY_NAME[side] & (ALIGN_LEFT | ALIGN_RIGHT) ? 'offsetWidth' : 'offsetHeight']);
            }
          }
        }
        else {
        //;;; if (typeof console != 'undefined') console.log('realign aborted');
        }
      },

      addSide: function(side, notInsert){
        var config = this.side[side];

        if (!config)
          return;

        if (!config.element)
        {
          var element = DOM.createElement('.Basis-Layout-Panel-' + side.capitalize());

          config.element = element;
          config.realign = new Property(false);
          this.layoutConfig.realignFactors.add(config.realign); // triger main realign

          if (side != 'client')
            element.style[side] = '0px';

          var style = element.style;
          //style.position = 'absolute';
          style.overflow = 'hidden';
          //style.padding  = '0';
          style.margin   = '0';
          //style.border   = '0';
          switch (side)
          {
            case 'top': 
            case 'bottom':
              style.width = '100%';
              style.left  = '0';
              break;
            case 'left':
            case 'right':
            case 'client':
              this.layoutConfig.anchor.top.addLink(style, 'top', CSS.px);
              if (isTwoSideLayoutSupport)
                this.layoutConfig.anchor.bottom.addLink(style, 'bottom', CSS.px);
              else
                this.layoutConfig.anchor.clientHeight.addLink(style, 'height', CSS.px);
              break;
            default:
          }
          if (side == 'client')
          {
            this.layoutConfig.anchor.left.addLink(style, 'left', CSS.px);
            if (isTwoSideLayoutSupport)
              this.layoutConfig.anchor.right.addLink(style, 'right', CSS.px);
            else
            {
              this.layoutConfig.anchor.clientWidth.addLink(style, 'width', CSS.px);
            }
          }

          // save config to element
          element.basisLayoutSideConfig = {
            parent: this,
            align:  side
          };

          this.applySideProperties();

          // attach to element
          if (this.element)
          {
            if (!notInsert)
            {
              DOM.insert(this.element, element);
              config.realign.set(true);
            }
          }
        }
        return config;
      },
      removeSide: function(side){
        var config = this.side[side];

        if (!config)
          return;

        if (config.element)
        {
          for (var name in this.layoutConfig.anchor)
            this.layoutConfig.anchor[name].removeLink(config.element.style);
/*            if (!isTwoSideLayoutSupport)
          {
            config.element.style.removeExpression('height');
            config.element.style.removeExpression('width');
          }*/

          config.realign.destroy();  // doing this.layoutConfig.realign.remove(config.realign) on destroy
          config.element.basisLayoutSideConfig = undefined;
          DOM.remove(config.element);
          delete config.element;
          delete config.realign;
        }
      },
      applySideProperties: function(side, properties){
        var config = this.side[side];

        if (!config)
          return;

        if (properties)
          extend(config.properties = {}, properties);

        if ('emptyAllow' in config.properties)
        {
          config.emptyAllow = !!config.properties.emptyAllow;
          delete config.properties.emptyAllow;
          if (config.emptyAllow && !config.element)
          {
            this.addSide(side);
            return;
          }
        }

        if (config.element)
        {
          for (var name in config.properties)
          {
            var value = config.properties[name];
            switch (name){
              case 'overflow':
              case 'overflowX':
              case 'overflowY':
                config.element.style[name] = value;
              break;
              case 'cssClassName':
                classList(config.element).add(value);
              break;
              case 'id':
                config.element.id = value;
              break;
              case 'size':
                if (side == 'left' || side == 'right')
                  config.element.style.width  = value;
                if (side == 'top' || side == 'bottom')
                  config.element.style.height = value;
              break;
              default:
                delete config.properties[name];
            }
          }
          if (Object.keys(config.properties).length)
            this.realign();
        }
      },

      insert: function(side, content, position, rel){
        var sideConfig = this.addSide(side);
        if (sideConfig && sideConfig.element)
        {
          DOM.insert(sideConfig.element, content, position, rel);
          this.layoutConfig.realign.set(true);
        }
      },
      remove: function(element){
        DOM.remove(element);
        this.layoutConfig.realign.set(true);
      },

      destroy: function(){
        RealignManager.layout.remove(this);
        //Cleaner.remove(this);

        this.layoutConfig.realign.destroy();
        this.layoutConfig.realignFactors.destroy();
        for (var side in this.side)
          this.removeSide(side);
        this.detach();

        this.inherit();
      }
    });

    Event.onLoad(function(){
      // init LAYOUT_MODE (make tests)
//      makeLayoutModeTest();
//      makeLayoutModeTest = Function.$undef;

      Event.addHandler(window, 'resize', RealignManager.realign, RealignManager);
      setTimeout(function(){ RealignManager.realign(); }, 20);
    });
    Event.onUnload(function(){
      Event.removeHandler(window, 'resize', RealignManager.realign, RealignManager);
    });


    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Layout: Layout
    });

  })();