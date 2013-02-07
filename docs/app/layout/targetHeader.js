
  var viewPrototype = basis.resource('app/views/prototype/prototype.js')();
  var prototypeMapPopup = resource('prototypeMapPopup.js');
  
  module.exports = new basis.ui.Node({
    childClass: basis.ui.button.Button.subclass({
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
    }),

    template: resource('template/targetHeader.tmpl'),

    binding: {
      kind: 'data:',
      path: 'data:path || ""',
      title: {
        events: 'update',
        getter: function(node){
          return (node.data.title || '') + (/^(method|function|class)$/.test(node.data.kind) ? app.core.getFunctionDescription(node.data.obj).args.quote('(') : '');
        }
      }
    }
  });