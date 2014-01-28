var templates = basis.template.define('app.menu', {
  View: resource('template/view.tmpl'),
  Item: resource('template/item.tmpl')
})

module.exports = basis.ui.Node.subclass({
  opened: false,

  template: templates.View,
  binding: {
    opened: 'opened'
  },

  childClass: {
    template: templates.Item,
    action: {
      select: function(){
        this.select();
      }
    }
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
    basis.dom.event.addGlobalHandler('click', this.hide, this);
  },
  hide: function(){
    this.opened = false;
    this.updateBind('opened');
    basis.dom.event.removeGlobalHandler('click', this.hide, this);
    this.setDelegate();
  }
});
