(function(){

 /**
  * @namespace Basis.Plugin.X
  */  
  var namespace = 'Basis.Plugin.X';
    
  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Template = Basis.Html.Template;

  var nsWrappers = Basis.DOM.Wrapper;

  var XControlItemHeader = Class(nsWrappers.TmplNode, {
    template: new Template(
      '<div{element} class="XControl-Item-Header">' +
        '<span>{titleText}</span>' +
      '</div>'
    ),
    titleGetter: Function.getter('data.title'),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);
        this.titleText.nodeValue = this.titleGetter(this) || '[no title]';
      }
    },
    init: function(config){
      this.inherit(config);
      Event.addHandler(this.element, 'click', function(){
        if (this.owner && this.owner.parentNode)
          this.owner.parentNode.scrollToNode(this.owner);

      }, this)
    }
  });

  var XControlItem = Class(nsWrappers.TmplContainer, {
    template: new Template(
      '<div{element} class="XControl-Item">' +
        '<span{header}/>' +
        '<div{content|childNodesElement} class="XControl-Item-Content"/>' +
      '</div>'
    ),
    satelliteConfig: {
      header: {
        delegate: Function.$self,
        instanceOf: XControlItemHeader
      }
    }
  });

  var MW_SUPPORTED = true;
  var XControlHeaderList = Class(nsWrappers.TmplContainer, {
    behaviour: {
      click: function(event, node){
        if (node)
          node.delegate.parentNode.scrollToNode(node.delegate);
      }
    },
    init: function(config){
      this.inherit(config);

      this.document = this;

      if (MW_SUPPORTED)
      {
        Event.addHandler(this.element, 'mousewheel', function(event){
          //console.log('mousewheel')
          try {
            this.owner.content.dispatchEvent(event);
          } catch(e) {
            MW_SUPPORTED = false;
            Event.removeHandler(this.element, 'mousewheel');
          }
        }, this);
      }

      this.addEventListener('click');
    }
  });

 /**
  * @class
  */
  var XControl = Class(nsWrappers.Control, {
    className: namespace + '.Control',
    childClass: XControlItem,
    template: new Template(
      '<div{element} class="XControl">' +
        '<div{content|childNodesElement} class="XControl-Content"/>' +
      '</div>'
    ),
    behaviour: {
      childNodesModified: function(object, delta){
        this.recalc();
      }
    },

    clientHeight_: -1,
    scrollHeight_: -1,
    scrollTop_: -1,
    lastTopPoint: -1,
    lastBottomPoint: -1,
    isFit: true,

    init: function(config){
      this.inherit(Object.complete({ childNodes: null }, config));

      var headerClass = this.childClass.prototype.satelliteConfig.header.instanceOf;
      this.meterHeader = new headerClass({
        container: this.element,
        data: { title: 'meter' }
      });
      this.meterElement = this.meterHeader.element;
      DOM.Style.setStyle(this.meterElement, {
        position: 'absolute',
        visibility: 'hidden'
      });

      this.childNodesDataset = new nsWrappers.ChildNodesDataset(this);

      this.header = new XControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'XControlHeader'
      });
      this.footer = new XControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'XControlFooter'
      });

      DOM.hide(this.header.element);
      DOM.hide(this.footer.element);

      this.header.owner = this;
      this.footer.owner = this;
      
      this.thread = new Basis.Animation.Thread({
        duration: 400,
        interval: 15
      });
      var self = this;
      this.modificator = new Basis.Animation.Modificator(this.thread, function(value){
        //console.log('set scrollTop ', self.content.scrollTop = parseInt(value));
        self.content.scrollTop = parseInt(value);
        self.recalc();
      }, 0, 0, true)
      this.modificator.timeFunction = function(value){
        return Math.sin(Math.acos(1 - value));
      }

      Event.addHandler(this.content, 'scroll', this.recalc, this);
      Event.addHandler(window, 'resize', this.recalc, this);
      this.addEventListener('click', 'click', true);

      if (config.childNodes)
        this.setChildNodes(config.childNodes);

      this.timer_ = setInterval(function(){ self.recalc() }, 500);
    },
    scrollToNode: function(node){
      if (node && node.parentNode === this)
      {
        var scrollTop = Math.min(this.content.scrollHeight - this.content.clientHeight, this.topPoints[DOM.index(node)]);

        if (this.thread)
        {
          var curScrollTop = this.content.scrollTop;
          this.modificator.setRange(curScrollTop, curScrollTop);
          this.thread.stop();
          this.modificator.setRange(curScrollTop, scrollTop);
          this.thread.start();
        }
        else
        {
          this.content.scrollTop = scrollTop;
          //console.log('set scroll top#2', this.content.scrollTop = scrollTop);
        }
      }
    },

   /**
    * xx
    */
    recalc: function(){
      //console.log('>>', this.content.scrollTop);

      var content = this.content;
      var clientHeight = content.clientHeight;
      var scrollHeight = content.scrollHeight;
      var scrollTop = content.scrollTop;
      var isFit = clientHeight == scrollHeight;

      if (this.clientHeight_ != clientHeight || this.scrollHeight_ != scrollHeight)
      {
        // save values 
        this.clientHeight_ = clientHeight;
        this.scrollHeight_ = scrollHeight;

        var top = [];
        var bottom = [];

        if (!isFit)
        {
          // calc scroll points
          var headerElementHeight = this.meterElement.offsetHeight;
          var topHeight = 0;
          var bottomHeight = headerElementHeight * this.childNodes.length - clientHeight;
          for (var node, i = 0; node = this.childNodes[i]; i++)
          {
            var height = node.element.offsetHeight;
            var offsetTop = node.element.offsetTop;

            top.push(offsetTop ? offsetTop - topHeight : top[i - 1] || 0);
            bottom.push(offsetTop ? offsetTop + bottomHeight : bottom[i - 1] || bottomHeight);

            topHeight += headerElementHeight;
            bottomHeight -= headerElementHeight;
          }
        }

        this.topPoints = top;
        this.bottomPoints = bottom;

        // values that's trigger for update headers
        this.scrollTop_ = -1;
        this.lastTopPoint = -1;
        this.lastBottomPoint = -1;
      }

      if (this.isFit != isFit)
      {
        this.isFit = isFit;
        DOM.display(this.header.element, !isFit);
        DOM.display(this.footer.element, !isFit);
      }

      if (isFit)
        return;

      if (this.scrollTop_ != scrollTop)
      {
        this.scrollTop_ = scrollTop;

        if (!isFit)
        {
          var topPoint = this.topPoints.binarySearchPos(scrollTop);
          var bottomPoint = this.bottomPoints.binarySearchPos(scrollTop);
          
          if (this.lastTopPoint != topPoint)
          {
            this.lastTopPoint = topPoint;
            this.header.childNodes.forEach(function(node, index){
              node.element.style.display = index >= topPoint ? 'none' : '';
            });
          }

          if (this.lastBottomPoint != bottomPoint)
          {
            this.lastBottomPoint = bottomPoint;
            this.footer.childNodes.forEach(function(node, index){
              node.element.style.display = index < bottomPoint ? 'none' : '';
            });
          }
        }
        else
        {
          this.lastTopPoint = 0;
          this.lastBottomPoint = this.childNodes.length;
        }
      }
    },
    destroy: function(){
      clearInterval(this.timer_);

      this.thread.destroy();
      this.modificator.destroy();
      this.header.destroy();
      this.footer.destroy();
      this.childNodesDataset.destroy();

      Event.removeHandler(this.content, 'scroll', this.recalc, this);
      Event.removeHandler(window, 'resize', this.recalc, this);

      this.inherit();
    }
  });

  Basis.namespace(namespace).extend({
    Control: XControl,
    ControlItem: XControlItem,
    ControlItemHeader: XControlItemHeader,
    ControlHeaderList: XControlHeaderList
  })

})();