function createSandboxAPI(sandbox){
  var outerHTML = sandbox.require('basis.dom').outerHTML;
  var HtmlTemplate = sandbox.require('basis.template.html').Template;
  var nsTemplate = sandbox.require('basis.template');

  var createTemplate = function(source, createInstance){
    var template = new HtmlTemplate(source);
    if (createInstance)
      template.createInstance(); // trigger template
    return template;
  };

  var getHTML = function(el){
    var cursor = el;
    var res = '';

    if (cursor.parentNode && cursor.parentNode.nodeType == 11) // DocumentFragment
      cursor = cursor.parentNode.firstChild;

    while (cursor)
    {
      res += outerHTML(cursor);
      cursor = cursor.nextSibling;
    }

    return res;
  };

  var text = function(template, binding){
    var instance;

    if (typeof template == 'string')
      template = createTemplate(template);

    if (template instanceof HtmlTemplate)
      instance = template.createInstance();
    else
      instance = template;

    if (binding)
      for (var key in binding)
        instance.set(key, binding[key]);

    return getHTML(instance.element);
  };

  return {
    createTemplate: createTemplate,
    text: text
  };
}

module.exports = {
  createSandboxAPI: createSandboxAPI
};
