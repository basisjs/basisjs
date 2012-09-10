
  basis.require('basis.format.highlight');
  basis.require('basis.dom.wrapper');

  basis.require('app.view');

 /**
  * @class
  */
  var BindingsPanel = basis.ui.Node.subclass({
    templateUpdate: function(){
      var template = this.delegate.templateView;
      var binding;
      if (template)
      {
        var matchBinding = template.getBinding(this.data.obj.prototype.binding);
        binding = Object.iterate(this.data.obj.prototype.binding, function(key, value){
          return typeof value == 'object' ? {
            data: {
              name: key,
              getter: value.getter,
              events: value.events,
              used: matchBinding && matchBinding.names.indexOf(key) != -1
            }
          } : null
        }).filter(Boolean);
      }

      this.setChildNodes(binding);
    },

    template: resource('template/bindingsPanel.tmpl'),

    sorting: 'data.name',

    childClass: {
      expanded: false,
      event_toggle: basis.event.create('toggle'),

      template: resource('template/bindingsPanelItem.tmpl'),

      binding: {
        name: 'data:',
        events: 'data:events || ""',
        used: function(node){
          return node.data.used ? 'used' : '';
        },
        expanded: {
          events: 'toggle',
          getter: function(node){
            return node.expanded ? 'expanded' : '';
          }
        },
        source: 'satellite:'
      },

      action: {
        toggle: function(){
          this.expanded = !this.expanded;
          this.event_toggle();
        }
      },

      satelliteConfig: {
        source: {
          hook: { toggle: true },
          existsIf: Function.getter('expanded'),
          instanceOf: basis.format.highlight.SourceCodeNode.subclass({
            autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
            lang: 'js',
            lineNumber: false,
            codeGetter: function(node){
              var code = app.view.resolveFunction(node.data.getter);
              return code.getter || code.asIs;
            }
          })
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = {
    BindingsPanel: BindingsPanel
  }
