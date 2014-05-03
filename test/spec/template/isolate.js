module.exports = {
  name: '<b:isolate>',
  init: function(){
    var isolateCss = basis.require('basis.template').isolateCss;
    var Template = basis.require('basis.template.html').Template;
    var DOM = basis.require('basis.dom');
  },
  test: [
    {
      name: 'isolateCss',
      test: function(){
        assert(isolateCss('.foo.bar{color:red}', 'xxx-') == '.xxx-foo.xxx-bar{color:red}');
        assert(isolateCss('.asd{color:red}', 'xxx-') == '.xxx-asd{color:red}');
        assert(isolateCss('.asd, .foo{color:red}', 'xxx-') == '.xxx-asd, .xxx-foo{color:red}');
        assert(isolateCss('.asd, .foo{} .baz {}', 'xxx-') == '.xxx-asd, .xxx-foo{} .xxx-baz {}');
        assert(isolateCss('.asd, /* .bar */ .foo{color:red}', 'xxx-') == '.xxx-asd, /* .bar */ .xxx-foo{color:red}');
        assert(isolateCss('[asd=".asd"], .foo.bar {color:red}', 'xxx-') == '[asd=".asd"], .xxx-foo.xxx-bar {color:red}');
        assert(isolateCss('[asd=".asd"], .foo.bar {color:.error}', 'xxx-') == '[asd=".asd"], .xxx-foo.xxx-bar {color:.error}');
        assert(isolateCss(':not(.asd) {color:"}"; val: .error }', 'xxx-') == ':not(.xxx-asd) {color:"}"; val: .error }');
        assert(isolateCss('/*/ .error */', 'xxx-') == '/*/ .error */');
      }
    },
    {
      name: '<b:isolate>',
      test: function(){
        var template = new Template(
          '<b:isolate/>' +
          '<div class="test test_{selected}"/>'
        );
        var tmpl = template.createInstance();
        tmpl.set('selected', 'selected');

        var m = tmpl.element.className.match(/^(\S+)test/);
        var prefix = m ? m[1] : '';

        assert(prefix != '');
        assert(tmpl.element.className == prefix + 'test ' + prefix + 'test_selected');
      }
    },
    {
      name: '<b:isolate> with `prefix` attribute',
      test: function(){
        var template = new Template(
          '<b:isolate prefix="xxx--"/>' +
          '<div class="test test_{selected}"/>'
        );
        var tmpl = template.createInstance();
        tmpl.set('selected', 'selected');

        assert(tmpl.element.className == 'xxx--test xxx--test_selected');
      }
    }
  ]
};
