module.exports = {
  name: 'l10n',

  sandbox: true,
  init: function(){
    basis = basis.createSandbox();

    var sandbox = basis.createSandbox('template-l10n-test');
    var api = basis.require('../helpers/template.js').createSandboxAPI(sandbox);
    var createTemplate = api.createTemplate;
    var text = api.text;

    var l10n = sandbox.require('basis.l10n');
    l10n.setCultureList('en-US ru-RU');
    l10n.enableMarkup = true;
  },

  test: [
    {
      name: 'basic',
      test: [
        {
          name: 'should change nothing when dictionary not found',
          test: function(){
            var template = createTemplate('{l10n:foo}');

            assert(text(template) === '{l10n:foo}');
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: 'should set token value to text node',
          test: function(){
            var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:foo}');

            assert(text(template) === 'foo text');
          }
        },
        {
          name: 'should set value to attribute',
          test: function(){
            var template = createTemplate('<b:l10n src="./test.l10n"/><span title="{l10n:foo}"/>');

            assert(text(template) === text('<span title="foo text"/>'));

          }
        },
        {
          name: 'should be used normal in attribute expressions',
          test: function(){
            var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:foo}"/>');

            assert(text(template, { foo: 'value' }) === text('<span title="test value/foo text"/>'));

          }
        },
        {
          name: 'should change on token change',
          test: function(){
            var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:foo}');
            var instance = template.createInstance();

            assert(text(instance) === 'foo text');

            l10n.setCulture('ru-RU');
            assert(text(instance) === 'foo текст');

            l10n.setCulture('en-US');
            assert(text(instance) === 'foo text');
          }
        },
        {
          name: 'should behave normal on template source change',
          test: function(){
            var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:foo}');
            var instance = template.createInstance(null, null, function(){
              instance = template.createInstance();
            });

            assert(text(instance) === 'foo text');

            template.setSource('<b:l10n src="./test.l10n"/>{l10n:foo} {l10n:foo}');
            assert(text(instance) === 'foo text foo text');
          }
        }
      ]
    },
    {
      name: 'computed',
      test: [
        {
          name: 'should change nothing when dictionary not found and warning',
          test: function(){
            var template = createTemplate('{l10n:enum.{foo}}');

            assert(text(template, { foo: 'foo' }) === '{l10n:enum.{foo}}');
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: 'enum',
          test: [
            {
              name: 'should set token value to text node',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:enum.{foo}}');

                assert(text(template) === '{element}');
                assert(text(template, { foo: 'baz' }) === '{element}');
                assert(text(template, { foo: 'foo' }) === 'foo text');
                assert(text(template, { foo: 'bar' }) === 'bar text');
              }
            },
            {
              name: 'should set value to attribute',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="{l10n:enum.{foo}}"/>');

                assert(text(template) === text('<span/>'));
                assert(text(template, { foo: 'foo' }) === text('<span title="foo text"/>'));
                assert(text(template, { foo: 'bar' }) === text('<span title="bar text"/>'));
                assert(text(template, { foo: 'baz' }) === text('<span/>'));
              }
            },
            {
              name: 'should be used normal in attribute expressions',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:enum.{foo}}"/>');

                assert(text(template) === text('<span/>'));
                assert(text(template, { foo: 'foo' }) === text('<span title="test foo/foo text"/>'));
                assert(text(template, { foo: 'bar' }) === text('<span title="test bar/bar text"/>'));
                assert(text(template, { foo: 'baz' }) === text('<span title="test baz/undefined"/>'));
              }
            },
            {
              name: 'should change on token change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:enum.{foo}}<span title="test {foo}/{l10n:enum.{foo}}"/>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 'foo' }) === text('foo text<span title="test foo/foo text"/>'));

                l10n.setCulture('ru-RU');
                assert(text(instance) === text('foo текст<span title="test foo/foo текст"/>'));

                l10n.setCulture('en-US');
                assert(text(instance) === text('foo text<span title="test foo/foo text"/>'));
              }
            },
            {
              name: 'should change on value change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:enum.{foo}}<span title="test {foo}/{l10n:enum.{foo}}"/>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 'bar' }) === text('bar text<span title="test bar/bar text"/>'));
                assert(text(instance, { foo: 'foo' }) === text('foo text<span title="test foo/foo text"/>'));
                assert(text(instance, { foo: 'baz' }) === text('undefined<span title="test baz/undefined"/>'));
              }
            }
          ]
        },
        {
          name: 'plural',
          test: [
            {
              name: 'should set token value to text node',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:plural.{foo}}');

                assert(text(template) === 'plural texts');
                assert(text(template, { foo: 'foo' }) === 'plural texts');
                assert(text(template, { foo: 1 }) === 'plural text');
                assert(text(template, { foo: 2 }) === 'plural texts');
              }
            },
            {
              name: 'should set value to attribute',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="{l10n:plural.{foo}}"/>');

                assert(text(template) === text('<span title="plural texts"/>'));
                assert(text(template, { foo: 'foo' }) === text('<span title="plural texts"/>'));
                assert(text(template, { foo: 1 }) === text('<span title="plural text"/>'));
                assert(text(template, { foo: 2 }) === text('<span title="plural texts"/>'));
              }
            },
            {
              name: 'should be used normal in attribute expressions',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:plural.{foo}}"/>');

                assert(text(template) === text('<span title="test undefined/plural texts"/>'));
                assert(text(template, { foo: 'foo' }) === text('<span title="test foo/plural texts"/>'));
                assert(text(template, { foo: 1 }) === text('<span title="test 1/plural text"/>'));
                assert(text(template, { foo: 2 }) === text('<span title="test 2/plural texts"/>'));
              }
            },
            {
              name: 'should change on token change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:plural.{foo}}<span title="test {foo}/{l10n:plural.{foo}}"/>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 2 }) === text('plural texts<span title="test 2/plural texts"/>'));

                l10n.setCulture('ru-RU');
                assert(text(instance) === text('plural текста<span title="test 2/plural текста"/>'));

                l10n.setCulture('en-US');
                assert(text(instance) === text('plural texts<span title="test 2/plural texts"/>'));
              }
            },
            {
              name: 'should change on value change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/>{l10n:plural.{foo}}<span title="test {foo}/{l10n:plural.{foo}}"/>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 1 }) === text('plural text<span title="test 1/plural text"/>'));
                assert(text(instance, { foo: 2 }) === text('plural texts<span title="test 2/plural texts"/>'));
              }
            }
          ]
        }
      ]
    },
    {
      name: 'markup',
      test: [
        {
          name: 'simple',
          test: [
            {
              name: 'should set token value to text node',
              test: function(){
                // assert(text('<b:l10n src="./test.l10n"/>{l10n:simpleMarkup}') ===
                //        text('<span>simple <b>markup</b> text</span>'));
                assert(text('<b:l10n src="./test.l10n"/><span>{l10n:simpleMarkup}</span>') ===
                       text('<span>simple <b>markup</b> text</span>'));
              }
            },
            {
              name: 'should set value to attribute',
              test: function(){
                assert(text('<b:l10n src="./test.l10n"/><span title="{l10n:simpleMarkup}"/>') ===
                       text('<span title="simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
              }
            },
            {
              name: 'should be used normal in attribute expressions',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:simpleMarkup}"/>');
                var instance = template.createInstance();

                assert(text(instance) === text('<span title="test undefined/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
              }
            },
            {
              name: 'should change on token change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:simpleMarkup}">{l10n:simpleMarkup}</span>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text">simple <b>markup</b> text</span>'));

                l10n.setCulture('ru-RU');
                assert(text(instance) === text('<span title="test foo/простой &lt;b&gt;markup&lt;/b&gt; текст">простой <b>markup</b> текст</span>'));

                l10n.setCulture('en-US');
                assert(text(instance) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text">simple <b>markup</b> text</span>'));
              }
            },
            {
              name: 'should behave normal on template source change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:simpleMarkup}</span>');

                assert(text(template) === '<span>simple <b>markup</b> text</span>');

                template.setSource('<b:l10n src="./test.l10n"/><div>markup: {l10n:simpleMarkup}</div>');
                assert(text(template) === '<div>markup: simple <b>markup</b> text</div>');
              }
            }
          ]
        },
        {
          name: 'with other l10n bindings',
          test: [
            {
              name: 'should set token value to text node',
              test: function(){
                // assert(text('<b:l10n src="./test.l10n"/><span>{l10n:markupWithBinding}</span>') ===
                //        text('<span>simple <b>markup</b> text</span>'));
                assert(text('<b:l10n src="./test.l10n"/><span>{l10n:markupWithBinding}</span>') ===
                       text('<span><b>markup</b> text {foo}</span>'));
              }
            },
            {
              name: 'should set value to attribute',
              test: function(){
                assert(text('<b:l10n src="./test.l10n"/><span title="{l10n:markupWithBinding}"/>') ===
                       text('<span title="simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
              }
            },
            {
              name: 'should be used normal in attribute expressions',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:markupWithBinding}"/>');
                var instance = template.createInstance();

                assert(text(instance) === text('<span title="test undefined/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
              }
            },
            {
              name: 'should change on token change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:markupWithBinding}">{l10n:markupWithBinding}</span>');
                var instance = template.createInstance();

                assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text">simple <b>markup</b> text</span>'));

                l10n.setCulture('ru-RU');
                assert(text(instance) === text('<span title="test foo/простой &lt;b&gt;markup&lt;/b&gt; текст">простой <b>markup</b> текст</span>'));

                l10n.setCulture('en-US');
                assert(text(instance) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text">simple <b>markup</b> text</span>'));
              }
            },
            {
              name: 'should behave normal on template source change',
              test: function(){
                var template = createTemplate('<b:l10n src="./test.l10n"/><span>{foo} {l10n:markupWithBinding}</span>');
                var bindings = {
                  bindingId: basis.genUID(),
                  foo: {
                    getter: function(){
                      return '[foo]';
                    }
                  }
                };
                var instance = template.createInstance(null, null, function onUpdate(){
                  instance = template.createInstance(null, null, onUpdate, bindings);
                }, bindings);

                assert(text(instance) === '<span>[foo] <b>markup</b> text [foo]</span>');

                template.setSource('<b:l10n src="./test.l10n"/><div>{foo} markup: {l10n:markupWithBinding}</div>');
                assert(text(instance) === '<div>[foo] markup: <b>markup</b> text [foo]</div>');
              }
            },
            {
              name: 'should not crash on markup token remove',
              test: function(){
                var dictionary = sandbox.require('basis.l10n').dictionary('./test.l10n');
                var bindings = {
                  bindingId: basis.genUID(),
                  foo: {
                    getter: function(){
                      return '[foo]';
                    }
                  }
                };

                var template = createTemplate('<span>{foo} {bar}</span>');
                var instance = template.createInstance(null, null, null, bindings);

                assert(text(instance) === '<span>[foo] {bar}</span>');
                assert(text(instance, { bar: dictionary.token('markupWithBinding') }) === '<span>[foo] <b>markup</b> text [foo]</span>');
                assert(text(instance, { bar: null }) === '<span>[foo] null</span>');
              }
            },
            {
              name: 'should not crash on recursion',
              test: function(){
                var dictionary = sandbox.require('basis.l10n').dictionary('./test.l10n');
                var template = createTemplate('<span>{foo}</span>');
                var instance = template.createInstance();

                assert(text(instance) === '<span>{foo}</span>');
                assert(text(instance, { foo: dictionary.token('markupWithBinding') }) === '<span><b>markup</b> text {foo}</span>');
                assert(text(instance, { foo: dictionary.token('l10nMarkup') }) === '<span><b>markup</b> text plural texts foo text <b>markup</b> text {foo}</span>');
              }
            },
            {
              name: 'should work correct on type change (markup -> normal)',
              test: function(){
                // jscs:disable validateQuoteMarks
                l10n.setCulture('en-US');
                var dictionary = l10n.dictionary({
                  _meta: { type: { test: 'markup' } },
                  "en-US": {
                    "test": "<b>markup</b>"
                  }
                });

                var template = createTemplate('<b:l10n src="./test.l10n"/><span>{foo}</span>');
                var instance = template.createInstance();

                assert(text(instance) === '<span>{foo}</span>');
                assert(text(instance, { foo: dictionary.token('test') }) === '<span><b>markup</b></span>');

                dictionary.update({
                  "en-US": {
                    "test": "<b>markup</b>"
                  }
                });
                assert(text(instance) === text('<span>&lt;b>markup&lt;/b></span>'));

                // jscs:enable
              }
            },
            {
              name: 'should work correct on type change (normal -> markup)',
              test: function(){
                // jscs:disable validateQuoteMarks
                l10n.setCulture('en-US');
                var dictionary = l10n.dictionary({
                  "en-US": {
                    "test": "<b>markup</b>"
                  }
                });

                var template = createTemplate('<b:l10n src="./test.l10n"/><span>{foo}</span>');
                var instance = template.createInstance();

                assert(text(instance) === '<span>{foo}</span>');
                assert(text(instance, { foo: dictionary.token('test') }) === text('<span>&lt;b>markup&lt;/b></span>'));

                dictionary.update({
                  _meta: { type: { test: 'markup' } },
                  "en-US": {
                    "test": "<b>markup</b>"
                  }
                });
                assert(text(instance) === text('<span><b>markup</b></span>'));

                // jscs:enable
              }
            }
          ]
        }
      ]
    },
    {
      name: 'mixed types',
      test: function(){
        assert(text('<b:l10n src="./test.l10n"/><span>{l10n:foo} {l10n:enum.{foo}} {l10n:simpleMarkup}</span>', { foo: 'foo' }) ===
               text('<span>foo text foo text simple <b>markup</b> text</span>'));

      }
    }
  ]
};
