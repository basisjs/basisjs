
  basis.require('basis.format.highlight');

  basis.require('app.view');

  var ActionsPanel = basis.ui.Node.subclass({
    templateUpdate: function(){
      var cls = this.data.obj;

      if (cls && basis.Class.isClass(cls))
      {
        var action = cls.prototype.action;
        var childNodes = [];
        if (action)
        {
          for (var actionName in action)
            if (actionName != '__extend__' && typeof action[actionName] == 'function')
            {
              childNodes.push({
                data: {
                  name: actionName,
                  action: action[actionName],
                  used: true
                }
              });
            }
        }

        this.setChildNodes(childNodes);
      }
    },

    template: resource('template/actionsPanel.tmpl'),

    sorting: 'data.name',

    childClass: {
      expanded: false,
      event_toggle: basis.event.create('toggle'),

      template: resource('template/actionsPanelItem.tmpl'),

      binding: {
        name: 'data:',
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
              var code = app.view.resolveFunction(node.data.action);
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
    ActionsPanel: ActionsPanel
  }
