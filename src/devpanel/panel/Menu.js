var Node = require('basis.ui').Node;
var domEventUtils = require('basis.dom.event');

var templates = require('basis.template').define('app.menu', {
  View: resource('./template/menu.tmpl'),
  Item: resource('./template/menu-item.tmpl')
});

module.exports = Node.subclass({
  opened: false,

  template: templates.View,
  binding: {
    opened: 'opened'
  },

  childClass: {
    template: templates.Item
  },

  handler: {
    delegateChanged: function(object, oldDelegate){
      if (this.delegate)
      {
        this.delegate.activated = true;
        this.delegate.updateBind('activated');
        this.show();
      }
      else
        this.hide();

      if (oldDelegate)
      {
        oldDelegate.activated = false;
        oldDelegate.updateBind('activated');
      }
    }
  },

  show: function(){
    this.opened = true;
    this.updateBind('opened');
    domEventUtils.addGlobalHandler('click', this.hide, this);
  },
  hide: function(){
    setTimeout(function(){
      this.opened = false;
      this.updateBind('opened');
      domEventUtils.removeGlobalHandler('click', this.hide, this);
      this.setDelegate();
    }.bind(this), 10);
  }
});
