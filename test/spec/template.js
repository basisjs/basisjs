module.exports = {
  name: 'basis.template',

  html: __dirname + '/template.html',
  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox(window.basis.config);

    var HtmlTemplate = basis.require('basis.template.html').Template;
    var nsTemplate = basis.require('basis.template');
    var nsTheme = basis.require('basis.template.theme');

    var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
    var createTemplate = api.createTemplate;
    var text = api.text;

    function normalizeNS(actual, expected){
      // Firefox don't xmlns: attribute when it was set with element.setAttributeNS()
      // remove those attributes from expected in this case
      if (/xmlns:/.test(expected) && !/xmlns:/.test(actual))
        expected = expected.replace(/\s+xmlns:[a-z]+="[^"]+"/g, '');

      return expected;
    }
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
                assert(tmpl.resources.length === 1);
                assert(tmpl.resources[0].url === basis.path.resolve('foo/1.css'));

                nsTemplate.setTheme('custom');
                assert(tmpl.resources.length === 1);
                assert(tmpl.resources[0].url === basis.path.resolve('foo/custom/2.css'));
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

                assert(text(tmpl) === el.innerHTML);
              }
            },
            {
              name: 'should keep property order',
              test: function(){
                var tmpl = createTemplate('<span style="color: {foo}; color: green">');
                var el = document.createElement('div');

                el.innerHTML = '<span style="color: green;"></span>';
                assert(text(tmpl) === el.innerHTML);

                el.innerHTML = '<span style="color: red;"></span>';
                assert(text(tmpl, { foo: 'red' }) === el.innerHTML);
              }
            }
          ]
        }
      ]
    },
    require('./template/declaration.js'),
    require('./template/namespaces.js'),
    require('./template/attr-bindings.js'),
    require('./template/text-bindings.js'),
    require('./template/b-text.js'),
    require('./template/b-include.js'),
    require('./template/b-template.js'),
    require('./template/b-import.js'),
    require('./template/b-define.js'),
    require('./template/b-content.js'),
    require('./template/b-svg.js'),
    require('./template/b-style.js'),
    require('./template/isolate.js'),
    require('./template/l10n.js'),
    require('./template/touch.js'),
    {
      name: 'Themes',
      test: [
        {
          name: 'should not exception if fallback theme doesn\'t exist yet',
          test: function(){
            var theme = basis.genUID();
            var fallbackTheme = basis.genUID();

            assert(nsTheme.getThemeList().indexOf(theme) === -1);
            assert(nsTheme.getThemeList().indexOf(fallbackTheme) === -1);

            nsTemplate.theme(theme).fallback(fallbackTheme);

            assert(nsTheme.getThemeList().indexOf(theme) !== -1);
            assert(nsTheme.getThemeList().indexOf(fallbackTheme) !== -1);
            assert.deep([fallbackTheme, 'base'], nsTemplate.theme(theme).fallback());
          }
        }
      ]
    }
  ]
};
