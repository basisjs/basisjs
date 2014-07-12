
  basis.require('basis.dom.computedStyle');
  basis.require('basis.dom.resize');
  basis.require('basis.template');
  basis.require('basis.ui');


 /**
  * @namespace basis.ui.panel
  */

  var namespace = this.path;

  var document = global.document;
  var listenResize = basis.dom.resize.add;
  var computedStyle = basis.dom.computedStyle.get;
  var UINode = basis.ui.Node;


  // tests

  var testElement = document.createElement('div');
  var SUPPORT_ONRESIZE = typeof testElement.onresize != 'undefined';
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
  // Vertical stack panel
  //

  var templates = basis.template.define(namespace, {
    Panel: resource('./templates/layout/VerticalPanel.tmpl'),
    Stack: resource('./templates/layout/VerticalPanelStack.tmpl')
  });

 /**
  * @class
  */
  var VerticalPanel = UINode.subclass({
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
  var VerticalPanelStack = UINode.subclass({
    className: namespace + '.VerticalPanelStack',

    template: templates.Stack,
    binding: {
      flexboxSupported: function(){
        return SUPPORT_DISPLAYBOX;
      }
    },

    childClass: VerticalPanel,

    templateSync: function(){
      UINode.prototype.templateSync.call(this);

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

  module.exports = {
    VerticalPanel: VerticalPanel,
    VerticalPanelStack: VerticalPanelStack
  };
