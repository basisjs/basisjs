module.exports = {
  name: '<b:include>',
  test: [
    {
      name: 'Various kind of sources',
      test: [
        {
          name: 'file reference <b:include src="./foo.tmpl">',
          test: function(){
            var template = createTemplate('<b:include src="./test.tmpl"/>');

            assert(text(template) == text('resource test'));

            // included source change
            var newContent = 'updated resource test';
            basis.resource('./test.tmpl').update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'namespaced file reference <b:include src="ns:./foo.tmpl">',
          test: function(){
            var template = createTemplate('<b:include src="fixture:test.tmpl"/>');

            assert(text(template) == text('fixture template'));

            // included source change
            var newContent = 'updated fixture test';
            basis.resource('fixture:test.tmpl').update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'script reference <b:include src="id:foo">',
          test: function(){
            var template = createTemplate('<b:include src="id:test-template"/>');

            assert(text(template) == text('script test'));
          }
        },
        {
          name: 'template reference <b:include src="#123">',
          test: function(){
            var sourceTemplate = createTemplate('reference test');
            var template = createTemplate('<b:include src="#' + sourceTemplate.templateId + '"/>');

            assert(text(template) == text('reference test'));

            // included source change
            var newContent = 'updated reference test';
            sourceTemplate.setSource(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'template with resource reference <b:include src="#123">',
          test: function(){
            var resource = basis.resource.virtual('tmpl', 'template with resource');
            var sourceTemplate = createTemplate(resource);
            var template = createTemplate('<b:include src="#' + sourceTemplate.templateId + '"/>');

            assert(text(template) == text('template with resource'));

            // included source change
            var newContent = 'updated template with resource';
            resource.update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'namespace <b:include src="foo.bar"/>',
          test: function(){
            var resource = basis.resource.virtual('tmpl', 'namespace test');
            nsTemplate.define('include.source.namespace.test', resource);
            var template = createTemplate('<b:include src="include.source.namespace.test"/>');

            assert(text(template) == text('namespace test'));

            // included source change
            var newContent = 'updated namespace test';
            resource.update(newContent);
            assert(text(template) == text(newContent));
          }
        }
      ]
    },
    {
      name: 'Attributes',
      test: [
        {
          name: '<b:include class>',
          test: [
            {
              name: '<b:include class> when class attribute does not exist',
              test: function(){
                var a = createTemplate('<span title="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"/>');

                assert(text(b) === text('<span title="a" class="b"/>'));
              }
            },
            {
              name: '<b:include class> class when class attribute exists',
              test: function(){
                var a = createTemplate('<span class="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"/>');

                assert(text(b) === text('<span class="a b"/>'));
              }
            },
            {
              name: '<b:include class> class with binding',
              test: function(){
                var a = createTemplate('<span class="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b}"/>');

                assert(text(b, { b: 'b' }) === text('<span class="a b"/>'));

                var a = createTemplate('<span class="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} {b2}"/>');

                assert(text(b, { b: 'b', b2: 'b2' }) === text('<span class="a b b2"/>'));
              }
            },
            {
              name: '<b:include class> class binding and value',
              test: function(){
                var a = createTemplate('<span class="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} c"/>');

                assert(text(b, { b: 'b' }) === text('<span class="a c b"/>'));

                var a = createTemplate('<span class="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="a2 {b} {b2} c"/>');

                assert(text(b, { b: 'b', b2: 'b2' }) === text('<span class="a a2 c b b2"/>'));
              }
            }
          ]
        },
        {
          name: '<b:include id>',
          test: [
            {
              name: ' when id attribute does not exist',
              test: function(){
                var a = createTemplate('<span title="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"/>');

                assert(text(b) === text('<span title="a" id="b"/>'));
              }
            },
            {
              name: '<b:include id> when id exists',
              test: function(){
                var a = createTemplate('<span id="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"/>');

                assert(text(b) === text('<span id="b"/>'));
              }
            }
          ]
        },
        {
          name: '<b:include show>',
          test: [
            {
              name: 'simple case',
              test: function(){
                var nested = createTemplate('<span/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" show="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == 'none');

                instance.set('foo', true);
                assert(instance.element.style.display == '');
              }
            },
            {
              name: 'simple case with static display',
              test: function(){
                var nested = createTemplate('<span style="display: inline;"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" show="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == 'none');

                instance.set('foo', true);
                assert(instance.element.style.display == '');
              }
            },
            {
              name: 'should override another b:show',
              test: function(){
                var nested = createTemplate('<span b:show="{bar}"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" show="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == 'none');

                instance.set('bar', true);
                assert(instance.element.style.display == 'none');

                instance.set('foo', true);
                assert(instance.element.style.display == '');
              }
            },
            {
              name: 'should override b:hide',
              test: function(){
                var nested = createTemplate('<span b:hide="{bar}"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" show="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == 'none');

                instance.set('foo', true);
                instance.set('bar', true);
                assert(instance.element.style.display == '');
              }
            }
          ]
        },
        {
          name: '<b:include hide>',
          test: [
            {
              name: 'simple case',
              test: function(){
                var nested = createTemplate('<span/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" hide="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == '');

                instance.set('foo', true);
                assert(instance.element.style.display == 'none');
              }
            },
            {
              name: 'simple case with static display',
              test: function(){
                var nested = createTemplate('<span style="display: none;"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" hide="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == '');

                instance.set('foo', true);
                assert(instance.element.style.display == 'none');
              }
            },
            {
              name: 'should override another b:hide',
              test: function(){
                var nested = createTemplate('<span b:hide="{bar}"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" hide="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == '');

                instance.set('bar', true);
                assert(instance.element.style.display == '');

                instance.set('foo', true);
                assert(instance.element.style.display == 'none');
              }
            },
            {
              name: 'should override b:show',
              test: function(){
                var nested = createTemplate('<span b:show="{bar}"/>');
                var t = createTemplate('<b:include src="#' + nested.templateId + '" hide="{foo}"/>');
                var instance = t.createInstance();

                assert(instance.element.style.display == '');

                instance.set('foo', true);
                instance.set('bar', true);
                assert(instance.element.style.display == 'none');
              }
            }
          ]
        },
        {
          name: '<b:include hidden>',
          test: function(){
            var a = createTemplate('<span/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" hidden="true"/>');

            assert(text(b) === text('<span style="visibility: hidden"/>'));
          }
        },
        {
          name: '<b:include visible>',
          test: function(){
            var a = createTemplate('<span style="color: red"/>'); // add color since Firefox left `style=""` otherwise and test fails
            var b = createTemplate('<b:include src="#' + a.templateId + '" visible="{foo}"/>');

            assert(text(b) === text('<span style="color: red; visibility: hidden"/>'));
            assert(text(b, { foo: true }) === text('<span style="color: red"/>'));
          }
        },
        {
          name: '<b:include ref>',
          test: function(){
            var a = createTemplate('<span/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" ref="bar"/>');
            var instance = b.createInstance();

            assert(instance.element === instance.bar);
            assert(instance.bar.tagName === 'SPAN');
          }
        },
        {
          name: '<b:include role>',
          test: function(){
            var a = createTemplate('<span b:role><span b:role="sub"/></span>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" role="bar"/>');

            assert(text(b, { $role: 'test' }) === text('<span role-marker="test/bar"><span role-marker="test/bar/sub"/></span>'));
          }
        },
        {
          name: 'common',
          test: [
            {
              name: 'should warn on unknown attribute',
              test: function(){
                var a = createTemplate('<span/>');
                var b = createTemplate('<b:include foo="b" src="#' + a.templateId + '"/>', true);

                assert(b.decl_.warns.length === 1);
                assert(String(b.decl_.warns[0]) === 'Unknown attribute for <b:include>: foo');
                assert(b.decl_.warns[0].loc === ':1:12');
              }
            },
            {
              name: 'attributes should apply first',
              test: function(){
                var a = createTemplate('<span/>');
                var b = createTemplate(
                  '<b:include src="#' + a.templateId + '" id="attr" class="attr">' +
                    '<b:set-attr name="id" value="instruction"/>' +
                    '<b:class value="instruction"/>' +
                  '</b:include>'
                );

                assert(text(b) === text('<span class="attr instruction" id="instruction"/>'));
              }
            },
            {
              name: 'attribute should apply in source order',
              test: function(){
                var a = createTemplate('<span/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" show="{foo}" hide="true"/>');

                assert(text(b) === text('<span style="display: none"/>'));
                assert(text(b, { foo: true }) === text('<span style="display: none"/>'));
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Subtree mofication',
      test: [
        require('./b-include/b-replace.js'),
        require('./b-include/b-remove.js'),
        require('./b-include/b-before.js'),
        require('./b-include/b-after.js'),
        require('./b-include/b-prepend.js'),
        require('./b-include/b-append.js')
      ]
    },
    {
      name: 'Attribute modification',
      test: [
        require('./b-include/b-set-attr.js'),
        require('./b-include/b-append-attr.js'),
        require('./b-include/b-remove-attr.js'),
        require('./b-include/b-append-class.js'),
        require('./b-include/b-set-class.js'),
        require('./b-include/b-remove-class.js'),
        require('./b-include/b-show.js'),
        require('./b-include/b-hide.js'),
        require('./b-include/b-set-role.js'),
        require('./b-include/b-remove-role.js'),
        require('./b-include/b-add-ref.js'),
        require('./b-include/b-remove-ref.js')
      ]
    }
  ]
};
