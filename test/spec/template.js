module.exports = {
  name: 'basis.template',

  html: __dirname + 'template.html',
  init: function(){
    var outerHTML = basis.require('basis.dom').outerHTML;
    var HtmlTemplate = basis.require('basis.template.html').Template;
    var nsTemplate = basis.require('basis.template');

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
      if (typeof template == 'string')
        template = createTemplate(template);

      var tmpl = template.createInstance();
      if (binding)
        for (var key in binding)
          tmpl.set(key, binding[key]);

      return getHTML(tmpl.element);
    };
  },

  test: [
    {
      name: 'Source',
      test: [
        {
          name: 'Path resolving',
          test: [
            {
              name: 'Template baseURI on theme change, when templates on different locations',
              test: function(){
                nsTemplate.theme('base').define('test', basis.resource('./foo/1.tmpl'));
                nsTemplate.theme('custom').define('test', basis.resource('./foo/custom/2.tmpl'));
                nsTemplate.setTheme('base');

                var tmpl = createTemplate(nsTemplate.get('test'), true);
                this.is(1, tmpl.resources.length);
                this.is(basis.path.resolve('foo/1.css'), tmpl.resources[0]);

                nsTemplate.setTheme('custom');
                this.is(1, tmpl.resources.length);
                this.is(basis.path.resolve('foo/custom/2.css'), tmpl.resources[0]);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Create',
      test: [
        {
          name: 'style attribute',
          test: [
            {
              name: 'use multiple property several times',
              test: function(){
                var tmpl = createTemplate('<span style="color: red; color: green">');
                var el = document.createElement('div');
                el.innerHTML = '<span style="color: red; color: green;"></span>';

                this.is(el.innerHTML, text(tmpl));
              }
            },
            {
              name: 'should keep property order',
              test: function(){
                var tmpl = createTemplate('<span style="color: {foo}; color: green">');
                var el = document.createElement('div');

                el.innerHTML = '<span style="color: green;"></span>';
                this.is(el.innerHTML, text(tmpl));

                el.innerHTML = '<span style="color: red;"></span>';
                this.is(el.innerHTML, text(tmpl, { foo: 'red' }));
              }
            }
          ]
        }
      ]
    },
    require('./template/attr-bindings.js'),
    require('./template/text-bindings.js'),
    require('./template/b-include.js'),
    require('./template/b-define.js'),
    require('./template/isolate.js')
  ]
};
