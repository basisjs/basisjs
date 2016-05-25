var Node = require('basis.ui').Node;
var domEventUtils = require('basis.dom.event');

var templates = require('basis.template').define('app.menu', {
  View: resource('./template/view.tmpl'),
  Item: resource('./template/item.tmpl')
});

module.exports = Node.subclass({
  opened: false,

  template: resource('./template/view.tmpl'),
  binding: {
    opened: 'opened'
  },

  childClass: {
    template: resource('./template/item.tmpl')
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
    this.opened = false;
    this.updateBind('opened');
    domEventUtils.removeGlobalHandler('click', this.hide, this);
    this.setDelegate();
  }
});
