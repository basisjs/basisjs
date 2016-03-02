module.exports = {
  name: 'basis.l10n',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
    var getTokenValues = basis.require('./helpers/l10n.js').getTokenValues;
    var Dictionary = basis.require('basis.l10n').Dictionary;
    var Culture = basis.require('basis.l10n').Culture;
    var getDictionary = basis.require('basis.l10n').dictionary;
    var setCultureList = basis.require('basis.l10n').setCultureList;
    var setCulture = basis.require('basis.l10n').setCulture;
    var currentCulture = basis.require('basis.l10n').culture;
    var getCulture = basis.require('basis.l10n').getCulture;
  },

  test: [
    {
      name: 'fallback',
      test: [
        {
          name: 'basic',
          test: function(){
            var res = {
              'en-US': {
                'value': 'base'
              }
            };
            var dict = getDictionary(basis.resource.virtual('l10n', res));
            setCulture('en-US');
            assert(dict.token('value').value === 'base');

            setCultureList('en-US a/b b/c c');

            setCulture('c');
            assert(dict.token('value').value === 'base');
            setCulture('b');
            assert(dict.token('value').value === 'base');
            setCulture('a');
            assert(dict.token('value').value === 'base');

            res.c = { value: 'c' };
            dict.resource.update(JSON.stringify(res));
            setCulture('c');
            assert(dict.token('value').value === 'c');

            setCulture('b');
            assert(dict.token('value').value === 'c');
            setCulture('a');
            assert(dict.token('value').value === 'c');

            res.b = { value: 'b' };
            dict.resource.update(JSON.stringify(res));
            assert(dict.token('value').value === 'b');
            setCulture('b');
            assert(dict.token('value').value === 'b');
            setCulture('c');
            assert(dict.token('value').value === 'c');

            res.a = { value: 'a' };
            dict.resource.update(JSON.stringify(res));
            setCulture('a');
            assert(dict.token('value').value === 'a');
            setCulture('b');
            assert(dict.token('value').value === 'b');
            setCulture('c');
            assert(dict.token('value').value === 'c');
          }
        }
      ]
    },
    {
      name: 'computeToken',
      test: [
        {
          name: 'base',
          sandbox: true,
          init: function(){
            var basis = window.basis.createSandbox();

            var getDictionary = basis.require('basis.l10n').dictionary;
            var setCultureList = basis.require('basis.l10n').setCultureList;
            var setCulture = basis.require('basis.l10n').setCulture;
            var currentCulture = basis.require('basis.l10n').culture;

            setCultureList('a');
            setCulture('a');
          },
          test: [
            {
              name: 'simple',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  a: {
                    token: {
                      foo: 'foo',
                      bar: 'bar'
                    }
                  }
                }));
                var token = dict.token('token').computeToken();
                var tokenCount = Object.keys(dict.tokens).length;

                // should not produce extra tokens in dictionary
                assert(token.get() === undefined);
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('foo');
                assert(token.get() === 'foo');
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('bar');
                assert(token.get() === 'bar');
                assert(Object.keys(dict.tokens).length == tokenCount);

                token.set('baz');
                assert(token.get() === undefined);
                assert(Object.keys(dict.tokens).length == tokenCount);
              }
            },
            {
              name: 'update on dictionary changes',
              test: function(){
                var data = {
                  a: {
                    token: {
                      foo: 'foo',
                      bar: 'bar'
                    }
                  }
                };
                var dict = getDictionary(basis.resource.virtual('l10n', data));
                var computeToken = dict.token('token').computeToken();

                assert(computeToken.get() === undefined);

                computeToken.set('foo');
                assert(computeToken.get() === 'foo');

                dict.resource.update({
                  a: {
                    token: {
                      foo: 'foo-2',
                      bar: 'bar-2'
                    }
                  }
                });
                assert(computeToken.get() === 'foo-2');

                computeToken.set('bar');
                assert(computeToken.get() === 'bar-2');

                dict.resource.update({
                  a: {
                    token: {}
                  }
                });
                assert(computeToken.get() === undefined);

                dict.resource.update({});
                assert(computeToken.get() === undefined);

                dict.resource.update({
                  a: {
                    token: {
                      bar: 'bar-3'
                    }
                  }
                });
                assert(computeToken.get() === 'bar-3');
              }
            }
          ]
        },
        {
          name: 'fallback',
          test: function(){
            setCultureList('a/b b');

            var dict = getDictionary(basis.resource.virtual('l10n', {
              a: {
                token: {
                  key1: 'a'
                }
              },
              b: {
                token: {
                  key1: 'b1',
                  key2: 'b2'
                }
              }
            }));
            var checkToken = dict.token('token').computeToken();

            // base culture A
            checkToken.set('key1');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture B
            setCulture('b');
            assert(getCulture() === 'b');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'b1');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture A
            setCulture('a');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');
          }
        },
        {
          name: 'fallback on dictionary update',
          test: function(){
            setCultureList('a/b b');

            var data = {
              a: {
                token: {
                  key1: 'a'
                }
              },
              b: {
                token: {
                  key1: 'b1',
                  key2: 'b2'
                }
              }
            };
            var dict = getDictionary(basis.resource.virtual('l10n', data));
            var checkToken = dict.token('token').computeToken();

            // base culture A
            checkToken.set('key1');
            assert(getCulture() === 'a');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // update dict content
            dict.resource.update(basis.object.complete({
              b: {
                token: {
                  key1: 'b1-2',
                  key2: 'b2-2'
                }
              }
            }, data));

            assert(checkToken.get() === 'b2-2');

            checkToken.set('key1');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2-2');
          }
        }
      ]
    },
    {
      name: 'get dictionary via require',
      test: function(){
        var dict;

        // using require for dictionary should not produce warnings
        assert(catchWarnings(function(){
          dict = basis.require('./fixture/dict.l10n');
        }) === false);

        assert(dict instanceof Dictionary);
        assert(dict === getDictionary('./fixture/dict.l10n'));
      }
    },
    {
      name: 'dictionary',
      test: function(){
        assert(getDictionary('./fixture/dict.l10n') instanceof Dictionary);
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict.l10n'));
        assert(getDictionary(basis.resource('./fixture/dict.l10n')) === getDictionary('./fixture/dict.l10n'));

        // path should be normalized
        assert(getDictionary('./foo/../fixture/dict.l10n') === getDictionary('./fixture/dict.l10n'));
        // file extension should be replaced for `.l10n`
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict.whatever'));
        // if no extension, then `.l10n` should be appended
        assert(getDictionary('./fixture/dict.l10n') === getDictionary('./fixture/dict'));
      }
    },
    {
      name: 'dictionary from static data (experimental, under consideration)',
      test: function(){
        var staticdata = { 'ru-RU': { test: 'Test' } };
        var dict = getDictionary(staticdata);
        assert(dict instanceof Dictionary);

        // static data should produce the same dictionary (under consideration)
        assert(getDictionary(staticdata) !== getDictionary(staticdata));

        // check dictionary
        setCultureList('en-US ru-RU');

        setCulture('en-US');
        assert(dict.token('test').value === undefined);

        setCulture('ru-RU');
        assert(dict.token('test').value === 'Test');
      }
    },
    {
      name: 'culture/Culture',
      test: function(){
        setCultureList('en-US ru-RU');

        setCulture('en-US');
        assert(getCulture() === 'en-US');
        assert(currentCulture.value === 'en-US');
        assert(currentCulture.get() === 'en-US');
        assert(currentCulture().name === 'en-US');

        setCulture('ru-RU');
        assert(getCulture() === 'ru-RU');
        assert(currentCulture.value === 'ru-RU');
        assert(currentCulture.get() === 'ru-RU');
        assert(currentCulture().name === 'ru-RU');

        currentCulture.set('en-US');
        assert(getCulture() === 'en-US');
        assert(currentCulture.value === 'en-US');
        assert(currentCulture.get() === 'en-US');
        assert(currentCulture().name === 'en-US');

        // create culture
        assert((new Culture('en-US')).name === 'en-US');
        assert((new Culture('en-US')) !== (new Culture('en-US')));

        // culture helper
        assert(currentCulture('ru-RU') === currentCulture('ru-RU'));
        assert(currentCulture() === currentCulture(getCulture()));
        assert(currentCulture() instanceof Culture);
      }
    },
    {
      name: 'types',
      sandbox: true,
      init: function(){
        var basis = window.basis.createSandbox();
        var l10n = basis.require('basis.l10n');
        var getDictionary = l10n.dictionary;
        var isMarkupToken = l10n.isMarkupToken;

        l10n.setCultureList('en-US');
      },
      test: [
        {
          name: 'getType()',
          test: [
            {
              name: 'should be default if type is not defined',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  'en-US': {
                    foo: 'test'
                  }
                }));

                assert(dict.token('foo').getType() === 'default');
              }
            },
            {
              name: 'should ignore wrong types',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      'foo': 'foo',
                      'bar': 'enum-markup',
                      'bar.foo': 'foo'
                    }
                  },
                  'en-US': {
                    foo: 'test',
                    bar: {
                      foo: 'test'
                    }
                  }
                }));

                assert(dict.token('foo').getType() === 'default');
                assert(dict.token('bar.foo').getType() === 'markup');
              }
            },
            {
              name: 'should be same type as defined',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      'default': 'default',
                      'plural': 'plural',
                      'markup': 'markup',
                      'plural-markup': 'plural-markup',
                      'enum-markup': 'enum-markup'
                    }
                  },
                  'en-US': {
                    'default': 'default',
                    'plural': 'plural',
                    'markup': 'markup',
                    'plural-markup': 'plural-markup',
                    'enum-markup': 'enum-markup'
                  }
                }));

                assert(dict.token('default').getType() === 'default');
                assert(dict.token('plural').getType() === 'plural');
                assert(dict.token('markup').getType() === 'markup');
                assert(dict.token('plural-markup').getType() === 'plural-markup');
                assert(dict.token('enum-markup').getType() === 'enum-markup');
              }
            },
            {
              name: 'should be markup when parent is `enum-markup` or `plural-markup`',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      foo: 'markup',
                      bar: 'plural-markup',
                      baz: 'enum-markup'
                    }
                  },
                  'en-US': {
                    foo: 'markup',
                    bar: [
                      'bar',
                      'bars'
                    ],
                    baz: {
                      qux: 'quz'
                    }
                  }
                }));

                assert(dict.token('bar').token(1).getType() === 'markup');
                assert(dict.token('baz.qux').getType() === 'markup');
              }
            },
            {
              name: 'implicit type definition should be `enum-markup`',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      enum: 'enum-markup',
                      'enum.bar': 'default',
                      'enum.baz': 'plural',
                      'enum.qux': 'wrong-type'
                    }
                  },
                  'en-US': {
                    enum: {
                      foo: 'foo',
                      bar: 'bar',
                      baz: ['plural', 'plurals'],
                      qux: 'qux'
                    }
                  }
                }));

                assert(dict.token('enum.foo').getType() === 'markup');
                assert(dict.token('enum.bar').getType() === 'default');
                assert(dict.token('enum.baz').getType() === 'plural');
                assert(dict.token('enum.qux').getType() === 'markup');
              }
            },
            {
              name: 'dinamic type change',
              test: function(){
                var data = {
                  _meta: {
                    type: {
                      markup: 'markup',
                      plural: 'plural'
                    }
                  },
                  'en-US': {
                    markup: 'markup',
                    plural: ['plural', 'plurals']
                  }
                };
                var resource = basis.resource.virtual('l10n', data);
                var dict = getDictionary(resource);

                assert(dict.token('markup').getType() === 'markup');
                assert(dict.token('plural').getType() === 'plural');

                resource.update({
                  'en-US': data['en-US']
                });

                assert(dict.token('markup').getType() === 'default');
                assert(dict.token('plural').getType() === 'default');

                resource.update(data);

                assert(dict.token('markup').getType() === 'markup');
                assert(dict.token('plural').getType() === 'plural');
              }
            }
          ]
        },
        {
          name: 'isMarkupToken',
          test: function(){
            var dict = getDictionary(basis.resource.virtual('l10n', {
              _meta: {
                type: {
                  'default': 'default',
                  'plural': 'plural',
                  'markup': 'markup',
                  'plural-markup': 'plural-markup',
                  'enum-markup': 'enum-markup'
                }
              },
              'en-US': {
                'default': 'default',
                'plural': 'plural',
                'markup': 'markup',
                'plural-markup': ['one', 'many'],
                'enum-markup': {
                  foo: 'foo'
                }
              }
            }));

            assert(isMarkupToken(dict.token('default')) === false);
            assert(isMarkupToken(dict.token('plural')) === false);
            assert(isMarkupToken(dict.token('plural-markup')) === false);
            assert(isMarkupToken(dict.token('enum-markup')) === false);
            assert(isMarkupToken(dict.token('markup')) === true);
            assert(isMarkupToken(dict.token('plural-markup').token(1)) === true);
            assert(isMarkupToken(dict.token('enum-markup.foo')) === true);
          }
        },
        {
          name: 'plural',
          test: [
            {
              name: 'simple',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      'plural': 'plural',
                      'plural-markup': 'plural-markup'
                    }
                  },
                  'en-US': {
                    'plural': [
                      'test',
                      'tests'
                    ],
                    'plural-markup': [
                      'test',
                      'tests'
                    ]
                  }
                }));

                assert(dict.token('plural').token(1).get() == 'test');
                assert(dict.token('plural').token(2).get() == 'tests');
                assert(dict.token('plural').computeToken(1).get() == 'test');
                assert(dict.token('plural').computeToken(2).get() == 'tests');
                assert(dict.token('plural-markup').token(1).get() == 'test');
                assert(dict.token('plural-markup').token(2).get() == 'tests');
                assert(dict.token('plural-markup').computeToken(1).get() == 'test');
                assert(dict.token('plural-markup').computeToken(2).get() == 'tests');
              }
            },
            {
              name: 'should use placeholder',
              test: function(){
                var dict = getDictionary(basis.resource.virtual('l10n', {
                  _meta: {
                    type: {
                      'plural': 'plural',
                      'plural-markup': 'plural-markup'
                    }
                  },
                  'en-US': {
                    'plural': [
                      '{#} test {#}',
                      '{#} tests {#}'
                    ],
                    'plural-markup': [
                      '{#} test {#}',
                      '{#} tests {#}'
                    ]
                  }
                }));

                assert(dict.token('plural').token(1).get() == '1 test 1');
                assert(dict.token('plural').token(2).get() == '2 tests 2');
                assert(dict.token('plural').computeToken(1).get() == '1 test 1');
                assert(dict.token('plural').computeToken(2).get() == '2 tests 2');
                assert(dict.token('plural-markup').token(1).get() == '1 test 1');
                assert(dict.token('plural-markup').token(2).get() == '2 tests 2');
                assert(dict.token('plural-markup').computeToken(1).get() == '1 test 1');
                assert(dict.token('plural-markup').computeToken(2).get() == '2 tests 2');
              }
            }
          ]
        }
      ]
    },
    {
      name: 'dictionary patching',
      test: [
        {
          name: 'patch in config',
          beforeEach: function(){
            var basis = window.basis.createSandbox({
              l10n: {
                patch: {
                  './fixture/l10n/dest.l10n': './fixture/l10n/patch.l10n'
                }
              }
            });

            var getDictionary = basis.require('basis.l10n').dictionary;
            var originalResource = basis.resource('./fixture/l10n/dest.l10n');
            var patchResource = basis.resource('./fixture/l10n/patch.l10n');

            var originalValues = getDictionary(JSON.parse(originalResource.get(true)));
            var patchValues = getDictionary(JSON.parse(patchResource.get(true)));

            var actual = getDictionary(originalResource);
            var patch = getDictionary(patchResource);
            var merged = getDictionary('./fixture/l10n/merge.l10n');
          },
          test: [
            {
              name: 'should merge original with patch',
              test: function(){
                assert.deep(getTokenValues(merged), getTokenValues(actual));
                assert.deep(getTokenValues(patchValues), getTokenValues(patch));
              }
            },
            {
              name: 'should update original on patch update',
              test: function(){
                // reset patch - actual should be equal to original
                patchResource.update({});

                assert.deep(getTokenValues(originalValues), getTokenValues(actual));
                assert.deep({}, getTokenValues(patch));
              }
            },
            {
              name: 'should update original on original source update',
              test: function(){
                // reset original - actual should be equal to patch
                originalResource.update({});

                assert.deep(getTokenValues(actual), getTokenValues(patchValues));
                assert.deep(getTokenValues(patch), getTokenValues(patchValues));
              }
            }
          ]
        },
        {
          name: 'reference to patch file in config',
          beforeEach: function(){
            var basis = window.basis.createSandbox({
              l10n: {
                patch: './fixture/l10n/patch-in-file.json'
              }
            });

            var getDictionary = basis.require('basis.l10n').dictionary;
            var originalResource = basis.resource('./fixture/l10n/dest.l10n');
            var patchResource = basis.resource('./fixture/l10n/patch.l10n');

            var originalValues = getDictionary(JSON.parse(originalResource.get(true)));
            var patchValues = getDictionary(JSON.parse(patchResource.get(true)));

            var actual = getDictionary(originalResource);
            var patch = getDictionary(patchResource);
            var merged = getDictionary('./fixture/l10n/merge.l10n');
          },
          test: [
            {
              name: 'should merge original with patch',
              test: function(){
                assert.deep(getTokenValues(merged), getTokenValues(actual));
                assert.deep(getTokenValues(patchValues), getTokenValues(patch));
              }
            },
            {
              name: 'should update original on patch update',
              test: function(){
                // reset patch - actual should be equal to original
                patchResource.update({});

                assert.deep(getTokenValues(originalValues), getTokenValues(actual));
                assert.deep({}, getTokenValues(patch));
              }
            },
            {
              name: 'should update original on original source update',
              test: function(){
                // reset original - actual should be equal to patch
                originalResource.update({});

                assert.deep(getTokenValues(actual), getTokenValues(patchValues));
                assert.deep(getTokenValues(patch), getTokenValues(patchValues));
              }
            }
          ]
        },
        {
          name: 'empty patch',
          test: function(){
            var basis = window.basis.createSandbox({
              l10n: {
                patch: {
                  './fixture/l10n/dest.l10n': './fixture/l10n/empty-patch.l10n'
                }
              }
            });

            var getDictionary = basis.require('basis.l10n').dictionary;
            var originalResource = basis.resource('./fixture/l10n/dest.l10n');
            var patchResource = basis.resource('./fixture/l10n/empty-patch.l10n');

            var originalValues = getDictionary(JSON.parse(originalResource.get(true)));
            var patchValues = getDictionary({});

            var actual = getDictionary(originalResource);
            var patch = getDictionary(patchResource);

            assert.deep(getTokenValues(originalValues), getTokenValues(actual));
            assert.deep(getTokenValues(patchValues), getTokenValues(patch));
          }
        }
      ]
    }
  ]
};
