module.exports = {
  name: '<b:isolate>',
  init: function(){
    var isolateCss = basis.require('basis.template.isolateCss');
    var Template = basis.require('basis.template.html').Template;
    var DOM = basis.require('basis.dom');
  },
  test: [
    {
      name: 'isolateCss',
      test: function(){
        var tests = [
          '.prefix{color:red}',
          '..prefix{color:red}',
          '.2foo{color:red}',
          '.prefix.preFIX{color:red}',
          '.PREfix, .preFIX{color:red}',
          '.prefix, .prefix{color:red}',
          '.prefix, .prefix{} .prefix {}',
          '.prefix, /* .bar */ .prefix{color:red}',
          '[asd=".asd"], .prefix.prefix {color:red}',
          '[asd=".asd"], .prefix.prefix {color:.error}',
          '[/* .foo */ asd=".asd"], .prefix.prefix {color:.error}',
          '[asd=.asd], .prefix.prefix {color:red}',
          ':not(.prefix) {color:"}"; val: .error }',
          ':not(/* .foo */ .prefix /* .baz */) { }',
          ':not([foo=.bar]) { }',
          ':not .prefix { }',
          ':not() { }',
          '[:not(.foo)] { }',
          ':has(.prefix) { }',
          ':has([foo=.bar]) { }',
          ':not(:has(.prefix)) { }',
          ':matches(.prefix) { }',
          ':nth-child(2n + 1 of .prefix:not(.prefix)) { }',
          ':nth-last-child(2n + 1 of .prefix:not(.prefix)) { }',
          '/*/ .error */',
          '/* .error {}',
          '@import url(foo.html)',
          '@media(min-width:100px){ .prefix {} .prefix.prefix {} }',
          '@media (min-width:100px){ .prefix {} .prefix.prefix {} }',
          '@supports(width: .23em){ .prefix {} }',
          '@supports (something: url(".foo")){ .prefix {} }',
          '@supports (something: url(.foo)){ .prefix {} }',
          '@supports (something: .2px){ .prefix {} }',
          '@supports (something: .error){ .prefix {} }',
          '@document url(http://example.com/index.html?asd={asd}) { .prefix {} }',
          '@document url("http://example.com/?asd={asd}") { .prefix {} }',
          '@document-foo { .prefix {} }',
          '@keyframes foo { 0% { color: .error } 100% { color: url("}"); content: ".error"; content: "\'\\"}"; } } .prefix {}'
        ];

        for (var i = 0; i < tests.length; i++)
        {
          var css = tests[i];
          var isolated = isolateCss(css, 'xxx-');
          var answer = css.replace(/\.(prefix)/ig, '.xxx-$1');

          assert(isolated === answer);
        }
      }
    },
    {
      name: '<b:isolate>',
      test: function(){
        var template = new Template(
          '<b:isolate/>' +
          '<div class="test test_{mod}"/>'
        );
        var tmpl = template.createInstance();
        tmpl.set('mod', 'mod');

        var m = tmpl.element.className.match(/^(\S+)test/);
        var prefix = m ? m[1] : '';

        assert(prefix != '');
        assert(tmpl.element.className == prefix + 'test ' + prefix + 'test_mod');
      }
    },
    {
      name: '<b:isolate> with `prefix` attribute',
      test: function(){
        var template = new Template(
          '<b:isolate prefix="xxx--"/>' +
          '<div class="test test_{mod}"/>'
        );
        var tmpl = template.createInstance();
        tmpl.set('mod', 'mod');

        assert(tmpl.element.className == 'xxx--test xxx--test_mod');
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
                '.isolate-and-inline-style { width: 33px; }' +
                '.isolate-and-inline-style_mod { height: 33px; }' +
              '</b:style>' +
              '<div class="isolate-and-inline-style isolate-and-inline-style_{mod}"/>'
            );
            var tmpl = template.createInstance();
            tmpl.set('mod', 'mod');
            document.body.appendChild(tmpl.element);

            assert(tmpl.element.className == 'xxx--isolate-and-inline-style xxx--isolate-and-inline-style_mod');
            assert(tmpl.element.offsetWidth == 33);
            assert(tmpl.element.offsetHeight == 33);
          }
        },
        {
          name: 'style in file',
          test: function(){
            var template = new Template(
              '<b:style src="../fixture/isolate_style.css"/>' +
              '<b:isolate prefix="xxx--"/>' +
              '<div class="isolate-and-style isolate-and-style_{mod}"/>'
            );
            var tmpl = template.createInstance();
            tmpl.set('mod', 'mod');
            document.body.appendChild(tmpl.element);

            assert(tmpl.element.className == 'xxx--isolate-and-style xxx--isolate-and-style_mod');
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
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className != 'outer outer_mod');
            assert(/\Bouter\b/.test(className));
            assert(/\Bouter_mod\b/.test(className));
            // should be prefix
            assert(/^(\S+)outer \1outer_mod$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--outer xxx--outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className != 'test test_mod');
            assert(/\Btest\b/.test(className));
            assert(/\Btest_mod\b/.test(className));
            // should be prefix
            assert(/^(\S+)test \1test_mod$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--test xxx--test_mod');
          }
        },
        {
          name: 'two levels',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:include src="#' + templateA.templateId + '"/>'
            );
            var templateC = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateB.templateId + '"/>' +
              '</div>'
            );
            var tmpl = templateC.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className != 'outer outer_mod');
            assert(/\Bouter\b/.test(className));
            assert(/\Bouter_mod\b/.test(className));
            // should be prefix
            assert(/^(\S+)outer \1outer_mod$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--outer xxx--outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className != 'test test_mod');
            assert(/\Btest\b/.test(className));
            assert(/\Btest_mod\b/.test(className));
            // should be prefix
            assert(/^(\S+)test \1test_mod$/.test(className));
            // isolate prefix should be ignored
            assert(className != 'xxx--test xxx--test_mod');
          }
        }
      ]
    },
    {
      name: '<b:include isolate="prefix"/>',
      test: [
        {
          name: 'included things should be isolated, but not outside of them',
          test: function(){
            var templateA = new Template(
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate="yyy--"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'outer outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className == 'yyy--test yyy--test_mod');
          }
        },
        {
          name: 'no value for isolate attribute should generate prefix',
          test: function(){
            var templateA = new Template(
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'outer outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(/^(\S+)test \1test_mod$/.test(className));
          }
        },
        {
          name: 'when <b:include> has isolate attribute, nested <b:isolate> should be ignored',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate="yyy--"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'outer outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className == 'yyy--test yyy--test_mod');
          }
        },
        {
          name: 'when <b:include> has isolate attribute, nested <b:isolate> should be ignored, even if no value for isolate attribute',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'outer outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className != 'xxx--test xxx--test_mod');
            assert(/^(\S+)test \1test_mod$/.test(className));
          }
        },
        {
          name: 'two levels <b:include> with isolate attr',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:include src="#' + templateA.templateId + '" isolate="yyy--"/>'
            );
            var templateC = new Template(
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateB.templateId + '" isolate="zzz--"/>' +
              '</div>'
            );
            var tmpl = templateC.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'outer outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className == 'zzz--yyy--test zzz--yyy--test_mod');
          }
        },
        {
          name: '<b:isolate> should apply to <b:include> with prefix',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:isolate prefix="zzz--"/>' +
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate="yyy--"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'zzz--outer zzz--outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className == 'zzz--yyy--test zzz--yyy--test_mod');
          }
        },
        {
          name: 'class modifications should works with <b:include> with isolate attribute as expected',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:isolate prefix="zzz--"/>' +
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '" isolate="yyy--" class="foo foo_{mod}"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            var className = tmpl.element.className;
            assert(className == 'zzz--outer zzz--outer_mod');

            var className = tmpl.element.firstChild.className;
            assert(className == 'zzz--yyy--test zzz--yyy--foo zzz--yyy--test_mod zzz--yyy--foo_mod');
          }
        },
        {
          name: 'should isolate included styles',
          test: function(){
            var templateA = new Template(
              '<b:style src="../fixture/isolate_style.css"/>' +
              '<b:isolate prefix="xxx--"/>' + // to make sure b:isolate doesn't affect css
              '<div class="isolate-and-style isolate-and-style_{mod}"/>'
            );
            var templateB = new Template(
              '<b:style>' +
                '.xxx1--isolate-and-style { width: 44px; }' +
                '.xxx2--isolate-and-style { width: 55px; }' +
              '</b:style>' +
              '<div>' +
                '<b:include src="#' + templateA.templateId + '" isolate="xxx1--"/>' +
                '<b:include src="#' + templateA.templateId + '" isolate="xxx2--"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');
            document.body.appendChild(tmpl.element);

            var el = tmpl.element.firstChild;
            assert(el.className == 'xxx1--isolate-and-style xxx1--isolate-and-style_mod');
            assert(el.offsetWidth == 44);
            assert(el.offsetHeight == 33);

            var el = tmpl.element.lastChild;
            assert(el.className == 'xxx2--isolate-and-style xxx2--isolate-and-style_mod');
            assert(el.offsetWidth == 55);
            assert(el.offsetHeight == 33);
          }
        },
        {
          name: 'should isolate included styles and own <b:isolate>',
          test: function(){
            var templateA = new Template(
              '<b:style src="../fixture/isolate_style.css"/>' +
              '<b:isolate prefix="xxx--"/>' + // to make sure b:isolate doesn't affect css
              '<div class="isolate-and-style isolate-and-style_{mod}"/>'
            );
            var templateB = new Template(
              '<b:isolate prefix="zzz--"/>' +
              '<b:style>' +
                '.xxx1--isolate-and-style { width: 44px; }' +
                '.xxx2--isolate-and-style { width: 55px; }' +
              '</b:style>' +
              '<div>' +
                '<b:include src="#' + templateA.templateId + '" isolate="xxx1--"/>' +
                '<b:include src="#' + templateA.templateId + '" isolate="xxx2--"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');
            document.body.appendChild(tmpl.element);

            var el = tmpl.element.firstChild;
            assert(el.className == 'zzz--xxx1--isolate-and-style zzz--xxx1--isolate-and-style_mod');
            assert(el.offsetWidth == 44);
            assert(el.offsetHeight == 33);

            var el = tmpl.element.lastChild;
            assert(el.className == 'zzz--xxx2--isolate-and-style zzz--xxx2--isolate-and-style_mod');
            assert(el.offsetWidth == 55);
            assert(el.offsetHeight == 33);
          }
        },
        {
          name: 'should isolate included styles',
          test: function(){
            var templateA = new Template(
              '<b:style src="../fixture/isolate_style.css"/>' +
              '<div class="isolate-and-style isolate-and-style_{mod}"/>'
            );
            var templateB = new Template(
              '<div>' +
                '<b:include src="#' + templateA.templateId + '" isolate>' +
                  '<b:style>' +
                    '.isolate-and-style { width: 44px; }' +
                  '</b:style>' +
                '</b:include>' +
                '<b:include src="#' + templateA.templateId + '" isolate>' +
                  '<b:style>' +
                    '.isolate-and-style { width: 55px; }' +
                  '</b:style>' +
                '</b:include>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');
            document.body.appendChild(tmpl.element);

            var el = tmpl.element.firstChild;
            assert(el.offsetWidth == 44);
            assert(el.offsetHeight == 33);

            var el = tmpl.element.lastChild;
            assert(el.offsetWidth == 55);
            assert(el.offsetHeight == 33);
          }
        }
      ]
    },
    {
      name: 'style namespaces',
      test: [
        {
          name: 'global namespace',
          test: [
            {
              name: 'using global styles in isolated scope',
              test: function(){
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:style>' +
                    '.global-class { width: 66px; }' +
                    '.global-class_mod { height: 66px; }' +
                  '</b:style>' +
                  '<div>' +
                    '<div{a} class="global-class global-class_{mod}"/>' +
                    '<div{b} class=":global-class :global-class_{mod}"/>' +
                    '<div{c} class=":global-class global-class_{mod}"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className == 'xxx-global-class xxx-global-class_mod');
                assert(tmpl.a.offsetWidth == 66);
                assert(tmpl.a.offsetHeight == 66);

                assert(tmpl.b.className == 'global-class global-class_mod');
                assert(tmpl.b.offsetWidth == 73);
                assert(tmpl.b.offsetHeight == 73);

                assert(tmpl.c.className == 'global-class xxx-global-class_mod');
                assert(tmpl.c.offsetWidth == 73);
                assert(tmpl.c.offsetHeight == 66);
              }
            },
            {
              name: 'using global styles in include',
              test: function(){
                var include = new Template(
                  '<div{a} class="global-class global-class_{mod}"/>' +
                  '<div{b} class=":global-class :global-class_{mod}"/>' +
                  '<div{c} class=":global-class global-class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<div>' +
                    '<b:include src="#' + include.templateId + '"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className == 'xxx-global-class xxx-global-class_mod');
                assert(tmpl.b.className == 'global-class global-class_mod');
                assert(tmpl.c.className == 'global-class xxx-global-class_mod');
              }
            },
            {
              name: 'using global styles in include with isolate attribute',
              test: function(){
                var include = new Template(
                  '<div{a} class="global-class global-class_{mod}"/>' +
                  '<div{b} class=":global-class :global-class_{mod}"/>' +
                  '<div{c} class=":global-class global-class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<div>' +
                    '<b:include src="#' + include.templateId + '" isolate="yyy-"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className == 'xxx-yyy-global-class xxx-yyy-global-class_mod');
                assert(tmpl.b.className == 'global-class global-class_mod');
                assert(tmpl.c.className == 'global-class xxx-yyy-global-class_mod');
              }
            }
          ]
        },
        {
          name: 'style namespaces',
          test: [
            {
              name: 'using style with namespace w/o isolate',
              test: function(){
                var template = new Template(
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<div>' +
                    '<div{a} class="foo:global-class foo:global-class_{mod}"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'foo:global-class foo:global-class_mod');
                assert(tmpl.a.className != 'global-class global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 73);
                assert(tmpl.a.offsetHeight == 73);
              }
            },
            {
              name: 'using style with namespace',
              test: function(){
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<b:style>' +
                    '.global-class { width: 66px; }' +
                    '.global-class_mod { height: 66px; }' +
                  '</b:style>' +
                  '<div>' +
                    '<div{a} class="global-class global-class_{mod}"/>' +
                    '<div{b} class="foo:global-class foo:global-class_{mod}"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className == 'xxx-global-class xxx-global-class_mod');
                assert(tmpl.a.offsetWidth == 66);
                assert(tmpl.a.offsetHeight == 66);

                assert(tmpl.b.className != 'xxx-global-class xxx-global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 73);
                assert(tmpl.b.offsetHeight == 73);
              }
            },
            {
              name: 'use namespace from include',
              test: function(){
                var include = new Template(
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<div{b} class="foo:global-class foo:global-class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:style>' +
                    '.global-class { width: 66px; }' +
                    '.global-class_mod { height: 66px; }' +
                  '</b:style>' +
                  '<div>' +
                    '<div{a} class="foo:global-class foo:global-class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'xxx-global-class xxx-global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 73);
                assert(tmpl.a.offsetHeight == 73);

                assert(tmpl.b.className != 'xxx-global-class xxx-global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 73);
                assert(tmpl.b.offsetHeight == 73);
              }
            },
            {
              name: 'override namespace from include',
              test: function(){
                var include = new Template(
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1x; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:style ns="foo">' +
                    '.class { width: 2px; }' +
                    '.class_mod { height: 2px; }' +
                  '</b:style>' +
                  '<div>' +
                    '<div{a} class="foo:class foo:class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 2);
                assert(tmpl.a.offsetHeight == 2);

                assert(tmpl.b.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 2);
                assert(tmpl.b.offsetHeight == 2);
              }
            },
            {
              name: 'override namespace from include',
              test: function(){
                var include = new Template(
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1x; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<div>' +
                    '<div{a} class="foo:class foo:class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '">' +
                      '<b:style ns="foo">' +
                        '.class { width: 2px; }' +
                        '.class_mod { height: 2px; }' +
                      '</b:style>' +
                    '</b:include>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 2);
                assert(tmpl.a.offsetHeight == 2);

                assert(tmpl.b.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 2);
                assert(tmpl.b.offsetHeight == 2);
              }
            },
            {
              name: 'override namespace priority include -> include/style -> template/style',
              test: function(){
                var include = new Template(
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1x; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:style ns="foo">' +
                    '.class { width: 3px; }' +
                    '.class_mod { height: 3px; }' +
                  '</b:style>' +
                  '<div>' +
                    '<div{a} class="foo:class foo:class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '">' +
                      '<b:style ns="foo">' +
                        '.class { width: 2px; }' +
                        '.class_mod { height: 2px; }' +
                      '</b:style>' +
                    '</b:include>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 3);
                assert(tmpl.a.offsetHeight == 3);

                assert(tmpl.b.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 3);
                assert(tmpl.b.offsetHeight == 3);
              }
            },
            {
              name: 'the same style file for various templates should has the same prefix',
              test: function(){
                var templateA = new Template(
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<b:isolate/>' +
                  '<div{a} class="foo:class foo:class_{mod}"/>'
                );
                var templateB = new Template(
                  '<b:style src="../fixture/global_style.css" ns="bar"/>' +
                  '<b:isolate/>' +
                  '<div{a} class="bar:class bar:class_{mod}"/>'
                );
                var tmplA = templateA.createInstance();
                tmplA.set('mod', 'mod');
                var tmplB = templateB.createInstance();
                tmplB.set('mod', 'mod');

                assert(tmplA.a.className != 'foo:class foo:class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmplA.a.className));

                assert(tmplB.a.className != 'foo:class foo:class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmplB.a.className));

                assert(tmplA.a.className == tmplB.a.className);
              }
            },
            {
              name: 'the same style file for various templates should refer for same resource',
              test: function(){
                var templateA = new Template(
                  '<b:style src="../fixture/global_style.css" ns="foo"/>'
                );
                var templateB = new Template(
                  '<b:style src="../fixture/global_style.css" ns="bar"/>'
                );
                var tmplA = templateA.createInstance();
                var tmplB = templateB.createInstance();

                assert(templateA.resources.length == 1);
                assert(templateA.resources, templateB.resources);
              }
            }
          ]
        }
      ]
    }
  ]
};
