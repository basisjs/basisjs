var resolveTemplateById = require('basis.template').resolveTemplateById;
var HtmlTemplate = require('basis.template.html').Template;
//;;;basis.require('basis.devpanel');

var srcMap = [];
var tmplMap = [];

function templateWrapper(src){
  var index = srcMap.indexOf(src);
  if (index != -1)
    return tmplMap[index];

  var template = new HtmlTemplate(src);

  srcMap.push(src);
  tmplMap.push(template);

  return template;
}

global.bt = module.exports = basis.object.extend(templateWrapper, {
  init: function(config){
    if (!config)
      return this;

    if (config.noConflict)
    {
      delete window.bt;
      return this;
    }
  },

  dispose: function(tmpl){
    var template = resolveTemplateById(tmpl.templateId_);

    if (!template)
    {
      basis.dev.warn('Template is not resolved for ', tmpl);
      return;
    }

    template.clearInstance(tmpl);
  },

  template: templateWrapper
});
