module.exports = {
  name: '<b:isolate>',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

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
          '.prefix { font-size: 10px; /* \' */} .prefix {}',
          '.prefix { font-size: 10px; /* \' */ } .prefix {}',
          '.prefix { font-size: 10px; /* " */} .prefix {}',
          '.prefix { font-size: 10px; /* " */ } .prefix {}',
          '@import "foo.css";',
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
      name: 'should not inherit isolate from nested templates (<b:include>)',
      test: [
        {
          name: 'one level',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<b:style>.test{}</b:style>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:style>.outer{}</b:style>' +
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateA.templateId + '"/>' +
              '</div>'
            );
            var tmpl = templateB.createInstance();
            tmpl.set('mod', 'mod');

            // should not prefix classes in template
            assert(tmpl.element.className == 'outer outer_mod');
            assert(tmpl.element.firstChild.className == 'test test_mod');

            // should not prefix classes in css
            var allStyles = templateB.resources.map(function(r){
              return basis.resource(r).get(true);
            }).join('\n');
            assert(/\.outer\b/.test(allStyles));
            assert(/\.test\b/.test(allStyles));
          }
        },
        {
          name: 'two levels',
          test: function(){
            var templateA = new Template(
              '<b:isolate prefix="xxx--"/>' +
              '<b:style>.test{}</b:style>' +
              '<div class="test test_{mod}"/>'
            );
            var templateB = new Template(
              '<b:include src="#' + templateA.templateId + '"/>'
            );
            var templateC = new Template(
              '<b:style>.outer{}</b:style>' +
              '<div class="outer outer_{mod}">' +
                '<b:include src="#' + templateB.templateId + '"/>' +
              '</div>'
            );
            var tmpl = templateC.createInstance();
            tmpl.set('mod', 'mod');

            // should not prefix classes in template
            assert(tmpl.element.className == 'outer outer_mod');
            assert(tmpl.element.firstChild.className == 'test test_mod');

            // should not prefix classes in css
            var allStyles = templateC.resources.map(function(r){
              return basis.resource(r).get(true);
            }).join('\n');
            assert(/\.outer\b/.test(allStyles));
            assert(/\.test\b/.test(allStyles));
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
          name: 'class modifications should on with <b:include> with isolate should not to be isolated',
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
            assert(className == 'zzz--yyy--test zzz--foo zzz--yyy--test_mod zzz--foo_mod');
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
              name: 'should warn when namespace is not used',
              test: function(){
                var template = new Template(
                  '<b:style ns="foo"/>' +
                  '<div/>'
                );
                var tmpl = template.createInstance();

                assert(template.decl_.warns && template.decl_.warns.length == 1);
              }
            },
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
              name: 'should not spread namespace to include',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<div{b} class="foo:global-class foo:global-class_{mod}"/>'
                );
                var template = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo">' +
                    '.global-class { width: 66px; }' +
                    '.global-class_mod { height: 66px; }' +
                  '</b:style>' +
                  '<div style="width: 123px;">' +
                    '<div{a} class="foo:global-class foo:global-class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className != 'xxx-global-class xxx-global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.a.className));
                assert(tmpl.a.offsetWidth == 66);
                assert(tmpl.a.offsetHeight == 66);

                assert(tmpl.b.className === '');
                assert(tmpl.b.offsetWidth == 123);
                assert(tmpl.b.offsetHeight == 0);

                assert(tmpl.a.className != tmpl.b.className);
                assert(template.decl_.warns && template.decl_.warns.length == 2);
              }
            },
            {
              name: 'should not use namespace from include',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<div{b} class="foo:global-class foo:global-class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style>' +
                    '.global-class { width: 66px; }' +
                    '.global-class_mod { height: 66px; }' +
                  '</b:style>' +
                  '<div style="width: 123px">' +
                    '<div{a} class="foo:global-class foo:global-class_{mod}"/>' +
                    '<b:include src="#' + include.templateId + '"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className === '');
                assert(tmpl.a.offsetWidth == 123);
                assert(tmpl.a.offsetHeight == 0);

                assert(tmpl.b.className != 'xxx-global-class xxx-global-class_mod');
                assert(/^(\S+)global-class \1global-class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 73);
                assert(tmpl.b.offsetHeight == 73);

                assert(tmpl.a.className != tmpl.b.className);
                assert(template.decl_.warns && template.decl_.warns.length == 2);
              }
            },
            {
              name: 'should has own namespace that doesn\'t depend from includes',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1px; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:define name="mod" type="bool"/>' +
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
                assert(tmpl.b.offsetWidth == 1);
                assert(tmpl.b.offsetHeight == 1);

                assert(tmpl.a.className != tmpl.b.className);
                assert(template.decl_.warns === false);
              }
            },
            {
              name: '<b:style> inside include should override template\'s namespace',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1x; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:define name="mod" type="bool"/>' +
                  '<div style="width: 123px;">' +
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

                assert(tmpl.a.className === '');
                assert(tmpl.a.offsetWidth == 123);
                assert(tmpl.a.offsetHeight == 0);

                assert(tmpl.b.className != 'xxx-class xxx-class_mod');
                assert(/^(\S+)class \1class_mod$/.test(tmpl.b.className));
                assert(tmpl.b.offsetWidth == 2);
                assert(tmpl.b.offsetHeight == 2);

                assert(tmpl.a.className != tmpl.b.className);
                assert(template.decl_.warns && template.decl_.warns.length == 2);
              }
            },
            {
              name: 'should add classes with own namespace into includes',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo"/>' +
                  '<div{a} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo"/>' +
                  '<div>' +
                    '<b:include src="#' + include.templateId + '" class="foo:class foo:class_{mod}"/>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                var classes = tmpl.a.className.split(/\s+/);
                var duplicates = 0;

                classes.forEach(function(cls, idx, ar){
                  duplicates += ar.indexOf(cls, idx + 1) != -1;
                });

                assert(classes.length === 4);
                assert(duplicates === 0);
                assert(template.decl_.warns === false);
              }
            },
            {
              name: 'should add classes with own namespace into includes',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo"/>' +
                  '<div{a} class="foo:class foo:class_{mod}">' +
                    '<div{b} class="foo:class foo:class_{mod}"/>' +
                  '</div>'
                );
                var template = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo"/>' +
                  '<div>' +
                    '<b:include src="#' + include.templateId + '">' +
                      '<b:set-class value="foo:class foo:class_{mod}"/>' +
                    '</b:include>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className !== tmpl.b.className);
                assert(template.decl_.warns === false);
              }
            },
            {
              name: 'should remove classes with foreign namespace in includes',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo"/>' +
                  '<div{a} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:style ns="foo"/>' +
                  '<div>' +
                    '<b:include src="#' + include.templateId + '">' +
                      '<b:remove-class value="foo:class foo:class_{mod}"/>' +
                    '</b:include>' +
                  '</div>'
                );
                var tmpl = template.createInstance();
                tmpl.set('mod', 'mod');
                document.body.appendChild(tmpl.element);

                assert(tmpl.a.className == '');
                assert(template.decl_.warns && template.decl_.warns.length === 1); // unused namespace `foo` in template
              }
            },
            {
              name: 'override namespace priority',
              test: function(){
                var include = new Template(
                  '<b:define name="mod" type="bool"/>' +
                  '<b:style ns="foo">' +
                    '.class { width: 1px; }' +
                    '.class_mod { height: 1x; }' +
                  '</b:style>' +
                  '<div{b} class="foo:class foo:class_{mod}"/>'
                );
                var template = new Template(
                  '<b:isolate prefix="xxx-"/>' +
                  '<b:define name="mod" type="bool"/>' +
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
                assert(tmpl.b.offsetWidth == 2);
                assert(tmpl.b.offsetHeight == 2);

                assert(tmpl.a.className != tmpl.b.className);
                assert(template.decl_.warns === false);
              }
            },
            {
              name: 'the same style file for various templates should has the same prefix',
              test: function(){
                var templateA = new Template(
                  '<b:style src="../fixture/global_style.css" ns="foo"/>' +
                  '<b:define name="mod" type="bool"/>' +
                  '<b:isolate/>' +
                  '<div{a} class="foo:class foo:class_{mod}"/>'
                );
                var templateB = new Template(
                  '<b:style src="../fixture/global_style.css" ns="bar"/>' +
                  '<b:define name="mod" type="bool"/>' +
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
                assert(templateA.decl_.warns === false);
                assert(templateB.decl_.warns === false);
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
                assert.deep(templateA.resources, templateB.resources);
              }
            }
          ]
        }
      ]
    }
  ]
};
