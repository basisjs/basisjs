module.exports = {
  name: '<b:style>',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Template = basis.require('basis.template.html').Template;

    var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
    var createTemplate = api.createTemplate;

    var GLOBAL_CLASS_WIDTH = 73;

    var appendedElements = [];
    function renderTemplate(text) {
      var template = new Template(text);

      var tmpl = template.createInstance();
      document.body.appendChild(tmpl.element);
      appendedElements.push(tmpl.element);

      return tmpl;
    }
  },
  afterEach: function(){
    appendedElements.forEach(function(element){
      document.body.removeChild(element);
    });
    appendedElements = [];
  },
  test: [
    {
      name: 'it applies inline styles',
      test: function(){
        var tmpl = renderTemplate(
          '<b:style>' +
            '.life-meaning { width: 42px; }' +
          '</b:style>' +
          '<div class="life-meaning"/>'
        );

        assert(tmpl.element.offsetWidth === 42);
      }
    },
    {
      name: 'it applies styles by src',
      test: function(){
        var tmpl = renderTemplate(
          '<b:style src="../fixture/global_style.css"/>' +
          '<div class="global-class"/>'
        );

        assert(tmpl.element.offsetWidth === GLOBAL_CLASS_WIDTH);
      }
    },
    {
      name: 'it includes styles from templates and redefines them by outer styles',
      test: function(){
        var includedTemplate = new Template(
          '<b:style>' +
            '.life-meaning { width: 4242px; height: 100px; }' +
          '</b:style>' +
          '<div class="life-meaning"/>'
        );
        var tmpl = renderTemplate(
          '<b:style>' +
            '.life-meaning { width: 42px; }' +
          '</b:style>' +
          '<b:include src="#' + includedTemplate.templateId + '"/>'
        );

        assert(tmpl.element.offsetWidth === 42);
        assert(tmpl.element.offsetHeight === 100);
      }
    },
    {
      name: 'it may include different styles for the same class using namespaces',
      test: function(){
        var tmpl = renderTemplate(
          '<b:style>' +
            '.life-meaning { width: 42px; }' +
          '</b:style>' +
          '<b:style ns="fake">' +
            '.life-meaning { width: 4242px; }' +
          '</b:style>' +
          '<div>' +
            '<div{lifeMeaning} class="life-meaning"/>' +
            '<div{fakeLifeMeaning} class="fake:life-meaning"/>' +
          '</div>'
        );

        assert(tmpl.lifeMeaning.offsetWidth === 42);
        assert(tmpl.fakeLifeMeaning.offsetWidth === 4242);
      }
    },
    {
      name: 'it ignores unknown namespaces',
      test: function(){
        var tmpl = renderTemplate(
          '<b:style ns="known">' +
            '.life-meaning { width: 4242px; }' +
          '</b:style>' +
          '<div class="unknown:life-meaning"/>'
        );

        assert(tmpl.element.className === '');
      }
    },
    {
      name: 'it may include different styles for template depending on properties (has effect with isolate)',
      test: function(){
        var includedTemplate = new Template(
          '<b:style>' +
            '.plain-div { width: 1px; height: 1px; }' +
          '</b:style>' +
          '<b:style options="wide: true">' +
            '.plain-div { width: 960px; }' +
          '</b:style>' +
          '<b:style options="tall: yes">' +
            '.plain-div { height: 480px; }' +
          '</b:style>' +
          '<b:style options="tall:yes,  wide: true">' +
            '.plain-div { width: 960px; height: 480px; }' +
          '</b:style>' +
          '<div class="plain-div"/>'
        );

        var empty = renderTemplate(
          '<b:isolate/>' +
          '<b:include src="#' + includedTemplate.templateId + '"/>'
        );
        var wide = renderTemplate(
          '<b:isolate/>' +
          '<b:include src="#' + includedTemplate.templateId + '" options="wide:   true"/>'
        );
        var tall = renderTemplate(
          '<b:isolate/>' +
          '<b:include src="#' + includedTemplate.templateId + '" options="tall:yes"/>'
        );
        var wideTall = renderTemplate(
          '<b:isolate/>' +
          '<b:include src="#' + includedTemplate.templateId + '" options="wide:true, tall:  yes"/>'
        );

        assert(empty.element.offsetWidth === 1);
        assert(empty.element.offsetHeight === 1);

        assert(wide.element.offsetWidth === 960);
        assert(wide.element.offsetHeight === 1);

        assert(tall.element.offsetWidth === 1);
        assert(tall.element.offsetHeight === 480);

        assert(wideTall.element.offsetWidth === 960);
        assert(wideTall.element.offsetHeight === 480);
      }
    },
    {
      name: 'should warn on wrong place',
      test: [
        {
          name: 'inside element',
          test: function(){
            var template = createTemplate(
              '<span>' +
                '<b:style src="./style.css"/>' +
              '</span>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(/^Instruction tag <b:style> should place in /.test(String(template.decl_.warns[0])));
          }
        },
        {
          name: 'after text',
          test: function(){
            var template = createTemplate(
              'hello world' +
              '<b:style src="./style.css"/>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(/^Instruction tag <b:style> should place in /.test(String(template.decl_.warns[0])));
          }
        },
        {
          name: 'after <b:include>',
          test: function(){
            var include = createTemplate('<span/>');
            var template = createTemplate(
              '<b:include src="#' + include.templateId + '"/>' +
              '<b:style src="./style.css"/>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(/^Instruction tag <b:style> should place in /.test(String(template.decl_.warns[0])));
          }
        }
      ]
    }
  ]
};
