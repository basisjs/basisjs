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
    },
    {
      name: '<b:isolate> and style',
      test: [
        {
          name: 'inline style',
          test: function(){
            var template = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<b:style>' +
                '.isolate_and_inline_style { width: 33px; }' +
                '.isolate_and_inline_style_selected { height: 33px; }' +
              '</b:style>' +
              '<div class="isolate_and_inline_style isolate_and_inline_style_{selected}"/>'
            );
            var tmpl = template.createInstance();
            tmpl.set('selected', 'selected');
            document.body.appendChild(tmpl.element);

            assert(tmpl.element.className == 'xxx--isolate_and_inline_style xxx--isolate_and_inline_style_selected');
            assert(tmpl.element.offsetWidth == 33);
            assert(tmpl.element.offsetHeight == 33);
          }
        },
        {
          name: 'inline style',
          test: function(){
            var template = new Template(
              '<b:style src="../fixture/isolate_style.css"/>' +
              '<b:isolate prefix="xxx--"/>' +
              '<div class="isolate_and_style isolate_and_style_{selected}"/>'
            );
            var tmpl = template.createInstance();
            tmpl.set('selected', 'selected');
            document.body.appendChild(tmpl.element);

            assert(tmpl.element.className == 'xxx--isolate_and_style xxx--isolate_and_style_selected');
            assert(tmpl.element.offsetWidth == 33);
            assert(tmpl.element.offsetHeight == 33);
          }
        }
      ]
    },
    {
      name: 'inherit isolate from nested <b:include>',
      test: [
        {
          name: 'one level',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{selected}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{selected}">' +
                '<b:include src="#' + templateA.templateId + '">' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('selected', 'selected');

            var className = tmpl.element.className;
            assert(className != 'outer outer_selected');
            assert(/\Bouter\b/.test(className));
            assert(/\Bouter_selected\b/.test(className));
            // should be prefix
            assert(/^(\S+)outer \1outer_selected$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--outer xxx--outer_selected');

            var className = tmpl.element.firstChild.className;
            assert(className != 'test test_selected');
            assert(/\Btest\b/.test(className));
            assert(/\Btest_selected\b/.test(className));
            // should be prefix
            assert(/^(\S+)test \1test_selected$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--test xxx--test_selected');
          }
        },
        {
          name: 'two levels',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{selected}"/>'
            );
            var templateB = new Template(
              '<b:include src="#' + templateA.templateId + '">'
            );
            var templateC = new Template(
              '<div class="outer outer_{selected}">' +
                '<b:include src="#' + templateB.templateId + '">' +
              '</div>'
            );
            var tmpl = templateC.createInstance();
            tmpl.set('selected', 'selected');

            var className = tmpl.element.className;
            assert(className != 'outer outer_selected');
            assert(/\Bouter\b/.test(className));
            assert(/\Bouter_selected\b/.test(className));
            // should be prefix
            assert(/^(\S+)outer \1outer_selected$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--outer xxx--outer_selected');

            var className = tmpl.element.firstChild.className;
            assert(className != 'test test_selected');
            assert(/\Btest\b/.test(className));
            assert(/\Btest_selected\b/.test(className));
            // should be prefix
            assert(/^(\S+)test \1test_selected$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--test xxx--test_selected');
          }
        }
      ]
    }
  ]
};
