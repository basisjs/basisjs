
  basis.require('app.view.templateView.actions');
  basis.require('app.view.templateView.bindings');

  basis.require('app.view.templateView.tree');

  var buildTemplate = app.view.templateView.tree.buildTemplate;

 /**
  * @class
  */
  var TemplatePanel = basis.ui.Node.subclass({
    template: resource('template/templatePanel.tmpl'),

    binding: {
      bindings: 'satellite:',
      actions: 'satellite:',
      isExternalFile: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        if (template && template.source && template.source.url)
          return 'isExternalFile';
        return '';
      },
      externalFileCaption: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        return ((template && template.source && template.source.url) || '').split('src/basis/').pop();
      },
      externalFileUrl: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        return ((template && template.source && template.source.url) || '').replace(/^(.*)(src\/basis\/)/i, '$2');
      }
    },

    event_templateViewChanged: basis.event.create('templateViewChanged'),

    templateUpdate: function(tmpl, object, oldDelegate){
      var rootCfg = {};

      var template = this.data.obj.prototype.template;

      if (this.templateView === template)
        return;

      if (template)
      {
        rootCfg.childNodes = template.docsCache_;

        if (!rootCfg.childNodes)
        {
          rootCfg.childNodes = [];

          var source = String(typeof template.source == 'function' ? template.source() : template.source);
          var decl = basis.template.makeDeclaration(source, template.baseURI);

          rootCfg.childNodes = buildTemplate(decl.tokens);
        }
      }

      this.setChildNodes(rootCfg.childNodes || [], true);
      this.updateBind('isExternalFile');
      this.updateBind('externalFileCaption');
      this.updateBind('externalFileUrl');

      if (template)
        template.docsCache_ = Array.from(this.childNodes);

      var oldTemplate = this.templateView;
      this.templateView = template;
      this.event_templateViewChanged(oldTemplate);
    },

    satelliteConfig: {
      bindings: {
        hook: { templateViewChanged: true },
        existsIf: Function.getter('templateView'),
        delegate: Function.$self,
        instanceOf: app.view.templateView.bindings.BindingsPanel
      },
      actions: {
        hook: { templateViewChanged: true },
        existsIf: Function.getter('templateView'),
        delegate: Function.$self,
        instanceOf: app.view.templateView.actions.ActionsPanel
      }
    }
  });

  //
  // exports
  //
  module.exports = {
    TemplatePanel: TemplatePanel
  }
