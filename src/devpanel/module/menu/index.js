require('basis.event');
require('basis.dom.event');
require('basis.ui');

module.exports = basis.ui.Node.subclass({
  visible: false,
  emit_visibleChanged: basis.event.create('visibleChanged'),

  template: resource('./template/view.tmpl'),
  binding: {
    visible: {
      events: 'visibleChanged',
      getter: function(node){
        return node.visible;
      }
    }
  },

  childClass: {
    template: resource('./template/item.tmpl')
  },

  handler: {
    delegateChanged: function(object, oldDelegate){
      if (this.delegate)
        this.show();
      else
        this.hide();
    },
    visibleChanged: function(){
      if (!this.visible)
        this.setDelegate();
    }
  },

  show: function(){
    if (!this.visible)
    {
      this.visible = true;
      this.emit_visibleChanged();
      basis.dom.event.addGlobalHandler('click', this.hide, this);
    }
  },
  hide: function(){
    if (this.visible)
    {
      basis.dom.event.removeGlobalHandler('click', this.hide, this);
      this.visible = false;
      this.emit_visibleChanged();
    }
  }
});
