
  var createEvent = require('basis.event').create;
  var SourceCode = require('basis.ui.code').SourceCode;
  var Node = require('basis.ui').Node;
  var fnInfo = require('basis.utils.info').fn;
  var getDeclFromSource = require('basis.template').getDeclFromSource;
  var getFunctions = require('basis.template.htmlfgen').getFunctions;
  var buildTemplateTree = require('./buildTemplateTree.js');

  function resolveFunction(fn){
    var info = fnInfo(fn);
    var result = {
      asIs: info.source
    };

    if (info.getter)
      result.getter = info.getter;

    return result;
  }

 /**
  * @class
  */
  var bindingsPanel = new Node({
    template: resource('./template/bindingsPanel.tmpl'),

    handler: {
      update: function(){
        var template = this.delegate.templateView;
        var binding;

        if (template)
        {
          var matchBinding = getFunctions(getDeclFromSource(template.source).tokens, true, '', '').keys;
          binding = basis.object.iterate(this.data.obj.prototype.binding, function(key, value){
            if (typeof value == 'object')
              return {
                data: {
                  name: key,
                  getter: value.getter,
                  events: value.events,
                  used: matchBinding && matchBinding.indexOf(key) != -1
                }
              };
          }).filter(Boolean);
        }

        this.setChildNodes(binding);
      }
    },

    sorting: 'data.name',
    childClass: {
      expanded: false,
      emit_toggle: createEvent('toggle'),

      template: resource('./template/bindingsPanelItem.tmpl'),
      binding: {
        name: 'data:',
        events: 'data:events || ""',
        used: 'data:',
        expanded: {
          events: 'toggle',
          getter: 'expanded'
        },
        source: 'satellite:'
      },
      action: {
        toggle: function(){
          this.expanded = !this.expanded;
          this.emit_toggle();
        }
      },

      satellite: {
        source: {
          events: 'toggle',
          existsIf: basis.getter('expanded'),
          instance: SourceCode.subclass({
            autoDelegate: true,
            lang: 'js',
            lineNumber: false,
            codeGetter: function(node){
              var code = resolveFunction(node.data.getter);
              return code.getter || code.asIs;
            }
          })
        }
      }
    }
  });

 /**
  *
  */
  var actionsPanel = new Node({
    handler: {
      update: function(){
        var cls = this.data.obj;

        if (cls && basis.Class.isClass(cls))
        {
          var action = cls.prototype.action;
          var childNodes = [];

          if (action)
            for (var actionName in action)
              if (actionName != '__extend__' && typeof action[actionName] == 'function')
                childNodes.push({
                  data: {
                    name: actionName,
                    action: action[actionName],
                    used: true
                  }
                });

          this.setChildNodes(childNodes);
        }
      }
    },

    template: resource('./template/actionsPanel.tmpl'),

    sorting: 'data.name',
    childClass: {
      expanded: false,
      emit_toggle: createEvent('toggle'),

      template: resource('./template/actionsPanelItem.tmpl'),
      binding: {
        name: 'data:',
        used: 'data:',
        expanded: {
          events: 'toggle',
          getter: 'expanded'
        },
        source: 'satellite:'
      },
      action: {
        toggle: function(){
          this.expanded = !this.expanded;
          this.emit_toggle();
        }
      },

      satellite: {
        source: {
          events: 'toggle',
          existsIf: basis.getter('expanded'),
          instance: SourceCode.subclass({
            autoDelegate: true,
            lang: 'js',
            lineNumber: false,
            codeGetter: function(node){
              var code = resolveFunction(node.data.action);
              return code.getter || code.asIs;
            }
          })
        }
      }
    }
  });

  function tmplUrl(fn){
    return {
      events: 'update',
      getter: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        return fn(template && template.source && template.source.url);
      }
    };
  }

 /**
  * @class
  */
  var TemplatePanel = Node.subclass({
    template: resource('./template/templatePanel.tmpl'),
    binding: {
      bindings: 'satellite:',
      actions: 'satellite:',
      isExternalFile: tmplUrl(Boolean),
      externalFileCaption: tmplUrl(function(url){
        return basis.path.basename(url || '');
      }),
      externalFileUrl: tmplUrl(function(url){
        return url && basis.path.relative(url);
      })
    },

    emit_templateViewChanged: createEvent('templateViewChanged'),

    processTemplate: function(){
      var rootCfg = {};
      var template = this.data.obj.prototype.template;

      if (this.templateView === template)
        return;

      if (template)
      {
        if (!template.docsCache_)
          template.docsCache_ = buildTemplateTree(
            getDeclFromSource(template.source, template.baseURI).tokens
          );

        rootCfg.childNodes = template.docsCache_;
      }

      this.setChildNodes(rootCfg.childNodes || [], true);

      this.templateView = template;
      this.emit_templateViewChanged();
    },
    init: function(){
      Node.prototype.init.call(this);
      this.processTemplate();
    },
    handler: {
      update: function(){
        this.processTemplate();
      }
    },

    satellite: {
      bindings: {
        events: 'templateViewChanged',
        existsIf: basis.getter('templateView'),
        delegate: basis.fn.$self,
        instance: bindingsPanel
      },
      actions: {
        events: 'templateViewChanged',
        existsIf: basis.getter('templateView'),
        delegate: basis.fn.$self,
        instance: actionsPanel
      }
    }
  });

  //
  // exports
  //
  module.exports = TemplatePanel;
