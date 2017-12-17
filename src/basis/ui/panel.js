
 /**
  * @namespace basis.ui.panel
  */

  var namespace = 'basis.ui.panel';


  //
  // import name
  //

  var document = global.document;
  var listenResize = require('../dom/resize.js').add;
  var computedStyle = require('../dom/computedStyle.js').get;
  var Node = require('../ui.js').Node;

  var templates = require('../template.js').define(namespace, {
    Panel: resource('./templates/layout/VerticalPanel.tmpl'),
    Stack: resource('./templates/layout/VerticalPanelStack.tmpl')
  });


  //
  // tests
  //

  var testElement = document.createElement('div');
  var SUPPORT_DISPLAYBOX = (function(){
    var prefixes = ['', '-webkit-'];

    for (var i = 0; i < prefixes.length; i++)
      try
      {
        // Opera tries to use -webkit-box but doesn't set "-webkit-box-orient" dynamically for cssRule
        if (prefixes[i] == '-webkit-' && 'WebkitBoxOrient' in testElement.style == false)
          continue;

        var value = prefixes[i] + 'box';
        testElement.style.display = value;
        if (testElement.style.display == value)
          return true;
      } catch(e) {}

    return false;
  })();


  //
  // helpers
  //

  function getHeight(element){
    return element.clientHeight
      - parseInt(computedStyle(element, 'padding-top'))
      - parseInt(computedStyle(element, 'padding-bottom'));
  }


  //
  // main part
  //

 /**
  * @class
  */
  var VerticalPanel = Node.subclass({
    className: namespace + '.VerticalPanel',

    template: templates.Panel,
    binding: {
      height: 'height',
      isFlex: function(node){
        return !!node.flex;
      },
      flexboxSupported: function(){
        return SUPPORT_DISPLAYBOX;
      },
      content: 'content'
    },

    flex: 0,
    height: 'auto',

    setHeight: function(height){
      this.height = height;
      this.updateBind('height');
    }
  });

 /**
  * @class
  */
  var VerticalPanelStack = Node.subclass({
    className: namespace + '.VerticalPanelStack',

    template: templates.Stack,
    binding: {
      flexboxSupported: function(){
        return SUPPORT_DISPLAYBOX;
      }
    },

    childClass: VerticalPanel,

    templateSync: function(){
      Node.prototype.templateSync.call(this);

      if (!SUPPORT_DISPLAYBOX)
      {
        listenResize(this.element, this.realign, this);
        listenResize(this.childNodesElement, this.realign, this);
      }
    },
    realign: function(){
      if (SUPPORT_DISPLAYBOX || !this.tmpl)
        return;

      var contentHeight = this.childNodesElement.offsetHeight;
      var availHeight = getHeight(this.element);
      var delta = availHeight - contentHeight;

      if (!delta)
        return;

      var flexNodes = [];
      var flexHeight = delta;

      for (var i = 0, node; node = this.childNodes[i]; i++)
      {
        if (node.flex)
        {
          flexNodes.push(node);
          flexHeight += getHeight(node.element);
        }
      }

      while (node = flexNodes.shift())
      {
        var height = Math.max(0, parseInt(flexHeight / (flexNodes.length + 1)));
        flexHeight -= height;

        node.setHeight(height);
      }
    }
  });


  //
  // exports
  //

  module.exports = {
    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack
  };
