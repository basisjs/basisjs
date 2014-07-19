var Node = require('basis.ui').Node;
var eventUtils = require('basis.dom.event');

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
    eventUtils.addGlobalHandler('click', this.hide, this);
  },
  hide: function(){
    this.opened = false;
    this.updateBind('opened');
    eventUtils.removeGlobalHandler('click', this.hide, this);
    this.setDelegate();
  }
});
