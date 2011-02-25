(function(){
  
  var namespace = 'Basis.Plugin.X';
    
  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Template = Basis.Html.Template;

  var nsWrappers = Basis.DOM.Wrapper;

  var XControlItemHeader = Class(nsWrappers.HtmlNode, {
    template: new Template(
      '<div{element} class="XControl-Item-Header">' +
        '<span>{titleText}</span>' +
      '</div>'
    ),
    titleGetter: Function.getter('info.title'),
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

  var XControlItem = Class(nsWrappers.HtmlContainer, {
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
  var XControlHeaderList = Class(nsWrappers.HtmlContainer, {
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
            this.pp.content.dispatchEvent(event);
          } catch(e) {
            Event.removeHandler(this.element, 'mousewheel');
          }
        }, this);
      }

      this.addEventListener('click');
    }
  });

  var XControl = Class(nsWrappers.Control, {
    childClass: XControlItem,
    template: new Template(
      '<div{element} class="XControl">' +
        '<div{content|childNodesElement} class="XControl-Content"/>' +
      '</div>'
    ),
    behaviour: {
      childNodesModified: function(object, delta){
        //console.log('mm')
        //console.log('master childNodesModified');
        //this.header.setChildNodes(this.childNodes);
        //this.footer.setChildNodes(this.childNodes);
        this.recalc();
        /*if (this.satellite)
        {
          this.satellite.header.setChildNodes(this.childNodes);
          this.satellite.footer.setChildNodes(this.childNodes);
        }*/
      }
    },

    /*satelliteConfig: {
      header: {
        instanceOf: XControlHeaderList
      },
      footer: {
        instanceOf: XControlHeaderList
      }
    },*/

    clientHeight_: -1,
    scrollHeight_: -1,
    scrollTop_: -1,
    lastTopPoint: -1,
    lastBottomPoint: -1,
    isFit: true,

    init: function(config){
      this.inherit(Object.complete({ childNodes: null }, config));

      var headerClass = this.childClass.prototype.satelliteConfig.header.instanceOf;
      this.meterHeader = new headerClass({ info: { title: 'test' } });
      this.meterElement = this.meterHeader.element;
      this.element.appendChild(this.meterElement);
      DOM.Style.setStyle(this.meterElement, {
        position: 'absolute',
        visibility: 'hidden'
      });

      this.childNodesDataset = new nsWrappers.ChildNodesDataset(this/*, {
        handlers: {
          datasetChanged: function(){
            console.log('datasetChanged');
          }
        }
      }*/);

      this.header = new XControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'XControlHeader'/*,
        handlers: {
          childNodesModified: function(){
            console.log('related childNodesModified')
          }
        }*/
      });
      this.footer = new XControlHeaderList({
        container: this.element,
        childClass: headerClass,
        collection: this.childNodesDataset,
        cssClassName: 'XControlFooter'/*,
        handlers: {
          childNodesModified: function(){
            console.log('related childNodesModified')
          }
        }*/
      });

      DOM.hide(this.header.element);
      DOM.hide(this.footer.element);

      this.header.pp = this;
      this.footer.pp = this;
      
      this.thread = new Basis.Animation.Thread({
        duration: 400,
        interval: 15
      });
      var self = this;
      this.modificator = new Basis.Animation.Modificator(this.thread, function(value){
        self.content.scrollTop = parseInt(value);
        self.recalc();
      }, 0, 0, true)
      this.modificator.timeFunction = function(value){
        return Math.sin(Math.acos(1 - value));
      }

      Event.addHandler(this.content, 'scroll', this.recalc, this);
      Event.addHandler(window, 'resize', this.recalc, this);

      if (config.childNodes)
        this.setChildNodes(config.childNodes);

      this.recalc();
      setInterval(function(){ self.recalc() }, 500);

      this.addEventListener('click');
      //this.dispatch('childNodesModified', {});
    },
    scrollToNode: function(node){
      if (node && node.parentNode === this)
      {
        var scrollTop = this.topPoints[DOM.index(node)];

        if (this.thread)
        {
          var curScrollTop = this.content.scrollTop;
          this.modificator.setRange(curScrollTop, curScrollTop);
          this.thread.stop();
          this.modificator.setRange(curScrollTop, scrollTop);
          this.thread.start();
        }
        else
          this.content.scrollTop = scrollTop;
      }
    },
    recalc: function(){
      var content = this.content;
      var clientHeight = content.clientHeight;
      var scrollHeight = content.scrollHeight;
      var scrollTop = content.scrollTop;
      var isFit = clientHeight == scrollHeight;

      //console.log('clientHeight: {0}, scrollHeight: {1}'.format(clientHeight, scrollHeight))

      if (this.clientHeight_ != clientHeight || this.scrollHeight_ != scrollHeight)
      {
        // save values 
        this.clientHeight_ = clientHeight;
        this.scrollHeight_ = scrollHeight;

        if (!isFit)
        {
          // calc scroll points
          var headerElementHeight = this.meterElement.offsetHeight;
          var heights = [];
          var topPoints = [0];
          var bottomPoints = [scrollHeight - clientHeight];
          //var v = scrollHeight - clientHeight;
          var xx = [];
          var yy = [];
          var hh = 0;
          var hh2 = headerElementHeight * this.childNodes.length - clientHeight;
          //console.log(headerElementHeight);
          for (var node, height, i = 0; node = this.childNodes[i]; i++)
          {
            //console.log(node.element.offsetTop);
            height = node.element.offsetHeight;
            var offsetTop = node.element.offsetTop;

            if (height)
            {
              height -= headerElementHeight;
              //hh += headerElementHeight;
            }

            heights.unshift(height);
            //v-= height;
            //xx.push(v);
            topPoints.push(topPoints[i] + height);
            xx.push(offsetTop ? offsetTop - hh : xx[i - 1] || 0);
            yy.push(offsetTop ? offsetTop + hh2 : yy[i - 1] || hh2);

            hh2 -= headerElementHeight;
            if (1 || height)
            {
              hh += headerElementHeight;
            }
          }
          //console.log(topPoints);
          //console.log(xx);
          //console.log(heights);
          //console.log(xx, clientHeight, scrollHeight);
          for (var i = 0; i < heights.length; i++)
          {
            bottomPoints.unshift(bottomPoints[0] - heights[i]);
          }
          //console.log(scrollHeight, clientHeight, scrollHeight - clientHeight)
          //console.log(bottomPoints);
          //console.log(yy);

          this.topPoints = xx;
          this.bottomPoints = yy;
        }
        else
        {
          this.topPoints = [];
          this.bottomPoints = [];
        }

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
            this.header.childNodes.forEach(function(node, index){
              node.element.style.display = index >= topPoint ? 'none' : '';
            });
          }

          if (this.lastBottomPoint != bottomPoint)
          {
            this.footer.childNodes.forEach(function(node, index){
              node.element.style.display = index < bottomPoint ? 'none' : '';
            });
          }

          this.lastTopPoint = topPoint;
          this.lastBottomPoint = bottomPoint;
        }
        else
        {
          this.lastTopPoint = 0;
          this.lastBottomPoint = this.childNodes.length;
        }
      }
    }
  });

  Basis.namespace(namespace).extend({
    Control: XControl,
    ControlItem: XControlItem,
    ControlItemHeader: XControlItemHeader,
    XControlHeaderList: XControlHeaderList
  })

})();