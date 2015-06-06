module.exports = {
  name: 'l10n',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox('template-l10n-test');

    var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
    var getTemplateCount = basis.require('basis.template').getTemplateCount;
    var createTemplate = api.createTemplate;
    var text = api.text;

    var l10n = basis.require('basis.l10n');
    l10n.setCultureList('en-US ru-RU');
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
            var template = createTemplate('<b:l10n src="./test.l10n"/><span title="{{l10n:foo}}"/>{l10n:foo}');
            var instance = template.createInstance();

            assert(text(instance) === '<span title="{foo text}"></span>foo text');

            l10n.setCulture('ru-RU');
            assert(text(instance) === '<span title="{foo текст}"></span>foo текст');

            l10n.setCulture('en-US');
            assert(text(instance) === '<span title="{foo text}"></span>foo text');
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

            template.setSource('<b:l10n src="./test.l10n"/><span title="{{l10n:foo}}"/>{l10n:foo} {l10n:foo}');
            assert(text(instance) === '<span title="{foo text}"></span>foo text foo text');
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
          name: 'text nodes',
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
                    assert(text('<b:l10n src="./test.l10n"/><span>{l10n:enumMarkup.foo}</span>') ===
                           text('<span><b>foo markup</b></span>'));
                  }
                },
                {
                  name: '`enum-markup` and `plural-markup` should not treats as markup',
                  test: function(){
                    assert(text('<b:l10n src="./test.l10n"/><span>{l10n:enumMarkup}</span>') ===
                           text('<span>[object Object]</span>'));
                    assert(text('<b:l10n src="./test.l10n"/><span>{l10n:pluralMarkup}</span>') ===
                           text('<span>&lt;b&gt;1 markup&lt;/b&gt;,&lt;b&gt;2 markup&lt;/b&gt;</span>'));
                  }
                },
                {
                  name: 'should change on token change',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:simpleMarkup}</span>');
                    var instance = template.createInstance();

                    assert(text(instance, { foo: 'foo' }) === text('<span>simple <b>markup</b> text</span>'));

                    l10n.setCulture('ru-RU');
                    assert(text(instance) === text('<span>простой <b>markup</b> текст</span>'));

                    l10n.setCulture('en-US');
                    assert(text(instance) === text('<span>simple <b>markup</b> text</span>'));
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
                  name: 'should change on token change',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:markupWithBinding}</span>');
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

                    assert(text(instance) === text('<span><b>markup</b> text [foo]</span>'));

                    l10n.setCulture('ru-RU');
                    assert(text(instance) === text('<span><b>markup</b> текст [foo]</span>'));

                    l10n.setCulture('en-US');
                    assert(text(instance) === text('<span><b>markup</b> text [foo]</span>'));
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
                    var dictionary = l10n.dictionary('./test.l10n');
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
                    var dictionary = l10n.dictionary('./test.l10n');
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
                    l10n.setCulture('en-US');
                    var dictionary = l10n.dictionary({
                      _meta: { type: { test: 'markup' } },
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });

                    var template = createTemplate('<span>{foo}</span>');
                    var instance = template.createInstance();

                    assert(text(instance) === '<span>{foo}</span>');
                    assert(text(instance, { foo: dictionary.token('test') }) === '<span><b>markup</b></span>');

                    dictionary.update({
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });
                    assert(text(instance) === text('<span>&lt;b>markup&lt;/b></span>'));

                    dictionary.update({
                      'en-US': {
                        test: '<b>markup!!!</b>'
                      }
                    });
                    assert(text(instance) === text('<span>&lt;b>markup!!!&lt;/b></span>'));

                    dictionary.update({
                      _meta: { type: { test: 'markup' } },
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });
                    assert(text(instance) === text('<span><b>markup</b></span>'));
                  }
                },
                {
                  name: 'should work correct on type change (normal -> markup)',
                  test: function(){
                    l10n.setCulture('en-US');
                    var dictionary = l10n.dictionary({
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });

                    var template = createTemplate('<span>{foo}</span>');
                    var instance = template.createInstance();

                    assert(text(instance) === '<span>{foo}</span>');
                    assert(text(instance, { foo: dictionary.token('test') }) === text('<span>&lt;b>markup&lt;/b></span>'));

                    dictionary.update({
                      _meta: { type: { test: 'markup' } },
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });
                    assert(text(instance) === text('<span><b>markup</b></span>'));

                    dictionary.update({
                      _meta: { type: { test: 'markup' } },
                      'en-US': {
                        test: '<b>markup!!!</b>'
                      }
                    });
                    assert(text(instance) === text('<span><b>markup!!!</b></span>'));

                    dictionary.update({
                      'en-US': {
                        test: '<b>markup</b>'
                      }
                    });
                    assert(text(instance) === text('<span>&lt;b>markup&lt;/b></span>'));
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'in attributes',
          test: [
            {
              name: 'simple',
              test: [
                {
                  pending: true,
                  name: 'should set value to attribute',
                  test: function(){
                    assert(text('<b:l10n src="./test.l10n"/><span title="{l10n:simpleMarkup}"/>') ===
                           text('<span title="simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                  }
                },
                {
                  pending: true,
                  name: 'should be used normal in attribute expressions',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:simpleMarkup}"/>');
                    var instance = template.createInstance();

                    assert(text(instance) === text('<span title="test undefined/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                    assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                  }
                },
                {
                  pending: true,
                  name: 'should change on token change',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:simpleMarkup}"/>');
                    var instance = template.createInstance();

                    assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"></span>'));

                    l10n.setCulture('ru-RU');
                    assert(text(instance) === text('<span title="test foo/простой &lt;b&gt;markup&lt;/b&gt; текст"></span>'));

                    l10n.setCulture('en-US');
                    assert(text(instance) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"></span>'));
                  }
                }
              ]
            },
            {
              name: 'with other l10n bindings',
              test: [
                {
                  pending: true,
                  name: 'should set value to attribute',
                  test: function(){
                    assert(text('<b:l10n src="./test.l10n"/><span title="{l10n:markupWithBinding}"/>') ===
                           text('<span title="simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                  }
                },
                {
                  pending: true,
                  name: 'should be used normal in attribute expressions',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:markupWithBinding}"/>');
                    var instance = template.createInstance();

                    assert(text(instance) === text('<span title="test undefined/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                    assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"/>'));
                  }
                },
                {
                  pending: true,
                  name: 'should change on token change',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span title="test {foo}/{l10n:markupWithBinding}"></span>');
                    var instance = template.createInstance();

                    assert(text(instance, { foo: 'foo' }) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"></span>'));

                    l10n.setCulture('ru-RU');
                    assert(text(instance) === text('<span title="test foo/простой &lt;b&gt;markup&lt;/b&gt; текст"></span>'));

                    l10n.setCulture('en-US');
                    assert(text(instance) === text('<span title="test foo/simple &lt;b&gt;markup&lt;/b&gt; text"></span>'));
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'nested',
          test: [
            {
              name: 'markup in enum',
              test: [
                {
                  name: 'template binding',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:enumWithMarkup.{value}}</span>');
                    var instance = template.createInstance();

                    assert(text(instance, { value: 'foo' }) === '<span><b>foo markup</b></span>');
                    assert(text(instance, { value: 'bar' }) === '<span><b>bar markup</b></span>');
                    assert(text(instance, { value: 'baz' }) === '<span>&lt;b&gt;baz markup&lt;/b&gt;</span>');
                    assert(text(instance, { value: 'foo' }) === '<span><b>foo markup</b></span>');
                  }
                },
                {
                  name: 'token from binding',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: {
                        type: {
                          'enum.foo': 'markup',
                          'enum.bar': 'markup'
                        }
                      },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup</b>',
                          bar: '<b>bar markup</b>',
                          baz: '<b>baz markup</b>'
                        }
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('enum').computeToken('foo');

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>foo markup</b></span>');

                    token.set('bar');
                    assert(text(instance) === '<span><b>bar markup</b></span>');

                    token.set('baz');
                    assert(text(instance) === '<span>&lt;b&gt;baz markup&lt;/b&gt;</span>');

                    token.set('foo');
                    assert(text(instance) === '<span><b>foo markup</b></span>');
                  }
                },
                {
                  name: 'token from binding and type changes',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: { type: { 'enum.foo': 'markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup</b>'
                        }
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('enum').computeToken('foo');

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>foo markup</b></span>');

                    dictionary.update({
                      _meta: { type: { 'enum.foo': 'markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === '<span><b>foo markup!!!</b></span>');

                    dictionary.update({
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === text('<span>&lt;b>foo markup!!!&lt;/b></span>'));

                    dictionary.update({
                      _meta: { type: { 'enum.foo': 'markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === text('<span><b>foo markup!!!</b></span>'));
                  }
                }
              ]
            },
            {
              name: 'enum-markup',
              test: [
                {
                  name: 'template binding',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:enumMarkup.{value}}</span>');
                    var instance = template.createInstance();

                    assert(text(instance, { value: 'foo' }) === '<span><b>foo markup</b></span>');
                    assert(text(instance, { value: 'bar' }) === '<span><b>bar markup</b></span>');
                  }
                },
                {
                  name: 'token from binding',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: {
                        type: {
                          'enum': 'enum-markup'
                        }
                      },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup</b>',
                          bar: '<b>bar markup</b>'
                        }
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('enum').computeToken('foo');

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>foo markup</b></span>');

                    token.set('bar');
                    assert(text(instance) === '<span><b>bar markup</b></span>');
                  }
                },
                {
                  name: 'token from binding and type changes',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: { type: { 'enum': 'enum-markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup</b>'
                        }
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('enum').computeToken('foo');

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>foo markup</b></span>');

                    dictionary.update({
                      _meta: { type: { 'enum': 'enum-markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === '<span><b>foo markup!!!</b></span>');

                    dictionary.update({
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === text('<span>&lt;b>foo markup!!!&lt;/b></span>'));

                    dictionary.update({
                      _meta: { type: { 'enum': 'enum-markup' } },
                      'en-US': {
                        enum: {
                          foo: '<b>foo markup!!!</b>'
                        }
                      }
                    });
                    assert(text(instance) === text('<span><b>foo markup!!!</b></span>'));
                  }
                }
              ]
            },
            {
              name: 'markup in plural',
              test: [
                {
                  name: 'template binding',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:pluralWithMarkup.{value}}</span>');
                    var instance = template.createInstance();

                    assert(text(instance, { value: 1 }) === '<span><b>1 markup</b></span>');
                    assert(text(instance, { value: 2 }) === '<span>&lt;b&gt;2 markup&lt;/b&gt;</span>');
                    assert(text(instance, { value: 1 }) === '<span><b>1 markup</b></span>');
                  }
                },
                {
                  name: 'token from binding',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: {
                        type: {
                          'plural': 'plural',
                          'plural.0': 'markup'
                        }
                      },
                      'en-US': {
                        plural: [
                          '<b>1 markup</b>',
                          '<b>2 markup</b>'
                        ]
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('plural').computeToken(1);

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>1 markup</b></span>');

                    token.set(2);
                    assert(text(instance) === '<span>&lt;b&gt;2 markup&lt;/b&gt;</span>');

                    token.set(1);
                    assert(text(instance) === '<span><b>1 markup</b></span>');
                  }
                }
              ]
            },
            {
              name: 'plural-markup',
              test: [
                {
                  name: 'template binding',
                  test: function(){
                    var template = createTemplate('<b:l10n src="./test.l10n"/><span>{l10n:pluralMarkup.{value}}</span>');
                    var instance = template.createInstance();

                    assert(text(instance, { value: 1 }) === '<span><b>1 markup</b></span>');
                    assert(text(instance, { value: 2 }) === '<span><b>2 markup</b></span>');
                  }
                },
                {
                  name: 'token from binding',
                  test: function(){
                    var dictionary = l10n.dictionary({
                      _meta: {
                        type: {
                          'plural': 'plural-markup'
                        }
                      },
                      'en-US': {
                        plural: [
                          '<b>1 markup</b>',
                          '<b>2 markup</b>'
                        ]
                      }
                    });

                    var template = createTemplate('<span>{token}</span>');
                    var instance = template.createInstance();
                    var token = dictionary.token('plural').computeToken(1);

                    instance.set('token', token);
                    assert(text(instance) === '<span><b>1 markup</b></span>');

                    token.set(2);
                    assert(text(instance) === '<span><b>2 markup</b></span>');

                    token.set(1);
                    assert(text(instance) === '<span><b>1 markup</b></span>');
                  }
                }
              ]
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
    },
    {
      name: 'special cases',
      test: [
        {
          name: 'computed l10n tokens should not produce new templates',
          test: function(){
            var template = createTemplate(
              '<b:l10n src="../fixture/dict-markup.l10n"/>' +
              '<span>{l10n:enum.{foo}}</span>'
            );

            var a = template.createInstance();
            a.set('foo', 'a');
            a.set('foo', 'b');

            var count = getTemplateCount();

            var b = template.createInstance();
            b.set('foo', 'b');
            assert(getTemplateCount() == count);

            var c = template.createInstance();
            c.set('foo', 'a');
            assert(getTemplateCount() == count);
          }
        },
        {
          name: 'l10n compute tokens should be destroy on template destroy',
          test: function(){
            var template = createTemplate(
              '<b:l10n src="../fixture/dict-markup.l10n"/>' +
              '<span>{l10n:enum.{foo}}</span>'
            );

            var token = l10n.dictionary('../fixture/dict-markup.l10n').token('enum');
            var computeCount = Object.keys(token.computeTokens).length;

            var instance = template.createInstance();
            assert(Object.keys(token.computeTokens).length === computeCount + 1);

            template.clearInstance(instance);
            assert(Object.keys(token.computeTokens).length === computeCount);
          }
        }
      ]
    }
  ]
};
