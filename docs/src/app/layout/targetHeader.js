var Button = require('basis.ui.button').Button;
var Node = require('basis.ui').Node;
var getFunctionDescription = require('app.core').getFunctionDescription;
var viewPrototype = require('./views/prototype/prototype.js');
var prototypeMapPopup = resource('./prototypeMapPopup.js');

module.exports = new Node({
  template: resource('./template/targetHeader.tmpl'),
  binding: {
    kind: 'data:',
    path: 'data:path || ""',
    title: {
      events: 'update',
      getter: function(node){
        return (node.data.title || '') +
          (/^(method|function|class)$/.test(node.data.kind)
            ? '(' + getFunctionDescription(node.data.obj).args + ')'
            : ''
          );
      }
    },
    hasTarget: {
      events: 'rootChanged',
      getter: function(node){
        return node.delegate != node.root;
      }
    }
  },

  childClass: Button.subclass({
    binding: {
      caption: function(button){
        return button.delegate.viewHeader;
      }
    },
    click: function(){
      if (this.delegate === viewPrototype)
        prototypeMapPopup().show(this.element);
      else
        this.delegate.parentNode.scrollTo(this.delegate.element);
    }
  })
});
