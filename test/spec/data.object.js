module.exports = {
  name: 'basis.data.object',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var moduleEntity = basis.require('basis.entity');
    var Value = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var Merge = basis.require('basis.data.object').Merge;

    function catchWarnings(fn){
      var warn = basis.dev.warn;
      var warnings = [];

      try {
        basis.dev.warn = function(message){
          warnings.push(message);
        };

        fn();
      } finally {
        basis.dev.warn = warn;
      }

      return warnings.length ? warnings : false;
    }
  },

  test: [
    {
      name: 'Merge',
      test: [
        {
          name: 'create',
          test: [
            {
              name: 'empty',
              test: function(){
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: 'a',
                    '*': 'b'
                  }
                });
                var instance = new MyMerge();

                assert({}, instance.data);
              }
            },
            {
              name: '1 source',
              test: function(){
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  }
                });
                var source = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });

                var instance = new MyMerge({
                  sources: {
                    a: source
                  }
                });
                assert({ foo: 'a', bar: 'a' }, instance.data);

                var instance = new MyMerge({
                  sources: {
                    b: source
                  }
                });
                assert({ baz: 'a' }, instance.data);
              }
            },
            {
              name: '2 sources',
              test: function(){
                var a = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var b = new DataObject({
                  data: {
                    foo: 'b',
                    bar: 'b',
                    baz: 'b'
                  }
                });

                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);
              }
            },
            {
              name: 'no sources, no fields',
              test: function(){
                var instance = new Merge({
                  data: {
                    foo: 1,
                    bar: 2
                  }
                });

                assert({ foo: 1, bar: 2 }, instance.data);

                var instance = new Merge({
                  fields: {
                    '*': '-'
                  },
                  data: {
                    foo: 1,
                    bar: 2
                  }
                });

                assert({ foo: 1, bar: 2 }, instance.data);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'no sources, own properties',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: '-',
                    bar: '-'
                  },
                  data: {
                    foo: 1,
                    bar: 2,
                    baz: 3
                  }
                });

                assert({ foo: 1, bar: 2 }, instance.data);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'source and own properties',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: '-',
                    bar: 'a'
                  },
                  data: {
                    foo: 1,
                    bar: 2,
                    baz: 3
                  },
                  sources: {
                    a: new DataObject({
                      data: {
                        foo: 'a',
                        bar: 'a',
                        baz: 'a'
                      }
                    })
                  }
                });

                assert({ foo: 1, bar: 'a' }, instance.data);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'set unspecified sources',
              test: function(){
                var MyMerge = new Merge.subclass({
                  fields: {
                    foo: 'a',
                    '*': 'b'
                  }
                });
                var instance;

                assert(catchWarnings(function(){
                  instance = new MyMerge({
                    sources: {
                      a: new DataObject({
                        data: {
                          foo: 'a'
                        }
                      }),
                      c: new DataObject({
                        data: {
                          foo: 'c'
                        }
                      })
                    }
                  });
                }));

                assert({ foo: 'a' }, instance.data);
                assert('a' in instance.sources == true);
                assert('c' in instance.sources == false);
              }
            },
            {
              name: 'bad field definitions',
              test: [
                {
                  name: 'superfluous definition for `*`',
                  test: function(){
                    var instance;

                    assert(catchWarnings(function(){
                      instance = new Merge({
                        fields: {
                          '*': 'a',
                          x: 'a'
                        }
                      });
                    }));

                    assert({ }, instance.fields.fieldSource);
                  }
                },
                {
                  name: 'custom field with `-` is prohibited',
                  test: function(){
                    var instance;

                    assert(catchWarnings(function(){
                      instance = new Merge({
                        fields: {
                          x: '-:name'
                        }
                      });
                    }));

                    assert({ }, instance.fields.fieldSource);
                  }
                }
              ]
            },
            {
              name: 'custom field name in source',
              test: function(){
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: 'a:baz',
                    bar: 'a',
                    '*': '-'
                  }
                });
                var source = new DataObject({
                  data: {
                    foo: 'a-foo',
                    bar: 'a-bar',
                    baz: 'a-baz'
                  }
                });

                var instance = new MyMerge({
                  sources: {
                    a: source
                  }
                });
                assert({ foo: 'a-baz', bar: 'a-bar' }, instance.data);
              }
            },
            {
              name: 'values from default source should not overload defined fields',
              test: function(){
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: '-',
                    bar: 'a',
                    '*': 'b'
                  }
                });

                var instance = new MyMerge({
                  data: {
                    foo: 'own-foo',
                    bar: 'own-bar',
                    baz: 'own-baz'
                  },
                  sources: {
                    a: new DataObject({
                      data: {
                        foo: 'a-foo',
                        bar: 'a-bar',
                        baz: 'a-baz'
                      }
                    }),
                    b: new DataObject({
                      data: {
                        foo: 'b-foo',
                        bar: 'b-bar',
                        baz: 'b-baz'
                      }
                    })
                  }
                });
                assert({ foo: 'own-foo', bar: 'a-bar', baz: 'b-baz' }, instance.data);
              }
            },
            {
              name: 'sources defined in subclass should be applied on init',
              test: function(){
                var map = [
                  new DataObject({ data: { bar: 'bar1' } }),
                  new DataObject({ data: { bar: 'bar2' } })
                ];
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: 'a',
                    bar: 'b'
                  },
                  sources: {
                    a: new DataObject({ data: { foo: 1 } }),
                    b: Value.factory('update', function(self){
                      return map[self.data.foo - 1];
                    })
                  }
                });

                var instance = new MyMerge();
                assert({ foo: 1, bar: 'bar1' }, instance.data);
                instance.update({ foo: 2 });
                assert({ foo: 2, bar: 'bar2' }, instance.data);
              }
            },
            {
              name: 'should ignore data if no own properties',
              test: function(){
                var instance = new Merge({
                  data: {
                    foo: 1,
                    bar: 2
                  },
                  fields: {
                    foo: 'a'
                  }
                });

                assert({}, instance.data);
              }
            },
            {
              name: 'should get only own properties from data',
              test: function(){
                var instance = new Merge({
                  data: {
                    foo: 1,
                    bar: 2,
                    baz: 3
                  },
                  fields: {
                    foo: 'a',
                    bar: '-'
                  }
                });

                assert({ bar: 2 }, instance.data);
              }
            },
            {
              name: 'should get any properties from data but not other sources properties',
              test: function(){
                var instance = new Merge({
                  data: {
                    foo: 1,
                    bar: 2,
                    baz: 3
                  },
                  fields: {
                    foo: 'a',
                    '*': '-'
                  }
                });

                assert({ bar: 2, baz: 3 }, instance.data);
              }
            }
          ]
        },
        {
          name: 'change sources',
          test: [
            {
              name: 'set for empty merge and reset',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  }
                });

                instance.setSources({
                  a: new DataObject({
                    data: {
                      foo: 'a',
                      bar: 'a',
                      baz: 'a'
                    }
                  }),
                  b: new DataObject({
                    data: {
                      foo: 'b',
                      bar: 'b',
                      baz: 'b'
                    }
                  })
                });
                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

                instance.setSources();
                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);
                assert(instance.sources.a == null);
                assert(instance.sources.b == null);
              }
            },
            {
              name: 'swap sources',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  }
                });
                var a = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var b = new DataObject({
                  data: {
                    foo: 'b',
                    bar: 'b',
                    baz: 'b'
                  }
                });

                instance.setSources({ a: a, b: b });
                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

                instance.setSources({ a: b, b: a });
                assert({ foo: 'b', bar: 'b', baz: 'a' }, instance.data);
              }
            },
            {
              name: 'source destroy',
              test: function(){
                var source = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a'
                  },
                  sources: {
                    a: source
                  }
                });

                assert({ foo: 'a', bar: 'a' }, instance.data);
                assert(instance.sources.a === source);

                source.destroy();
                assert({ foo: 'a', bar: 'a' }, instance.data);
                assert(instance.sources.a === null);
              }
            },
            {
              name: 'source and own properties',
              test: function(){
                var source = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: '-'
                  },
                  sources: {
                    a: source
                  }
                });

                assert({ foo: 'a' }, instance.data);
                assert('-' in instance.sources == false);

                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: '-'
                  }
                });

                assert({ }, instance.data);

                instance.setSource('a', source);
                assert({ foo: 'a' }, instance.data);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'set unspecified sources via setSources',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: '-'
                  }
                });

                assert(catchWarnings(function(){
                  instance.setSources({
                    a: new DataObject(),
                    b: new DataObject()
                  });
                }));

                assert('a' in instance.sources == true);
                assert('b' in instance.sources == false);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'set unspecified sources via setSource',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: '-'
                  }
                });

                assert(catchWarnings(function(){
                  instance.setSource('b', new DataObject());
                }));
                assert('b' in instance.sources == false);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'custom field name in source',
              test: function(){
                var source = new DataObject({
                  data: {
                    foo: 'a-foo',
                    bar: 'a-bar',
                    baz: 'a-baz'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a:baz',
                    bar: '-'
                  },
                  sources: {
                    a: source
                  }
                });

                assert({ foo: 'a-baz' }, instance.data);
                assert('-' in instance.sources == false);

                var instance = new Merge({
                  fields: {
                    foo: 'a:baz',
                    bar: '-'
                  }
                });

                assert({ }, instance.data);

                instance.setSource('a', source);
                assert({ foo: 'a-baz' }, instance.data);
                assert('-' in instance.sources == false);
              }
            },
            {
              name: 'values from default source should not override other fields',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: '-',
                    bar: 'a',
                    '*': 'b'
                  },
                  data: {
                    foo: 'own-foo',
                    bar: 'own-bar',
                    baz: 'own-baz'
                  }
                });

                assert({ foo: 'own-foo' }, instance.data);

                instance.setSources({
                  a: new DataObject({
                    data: {
                      foo: 'a-foo',
                      bar: 'a-bar',
                      baz: 'a-baz'
                    }
                  }),
                  b: new DataObject({
                    data: {
                      foo: 'b-foo',
                      bar: 'b-bar',
                      baz: 'b-baz'
                    }
                  })
                });

                assert({ foo: 'own-foo', bar: 'a-bar', baz: 'b-baz' }, instance.data);
              }
            },
            {
              name: 'should reset',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    qux: 'a',
                    '*': 'b'
                  },
                  sources: {
                    a: new DataObject({
                      data: {
                        foo: 'a-foo',
                        bar: 'a-bar',
                        qux: 'a-qux'
                      }
                    }),
                    b: new DataObject({
                      data: {
                        foo: 'b-foo',
                        bar: 'b-bar',
                        baz: 'b-baz'
                      }
                    })
                  }
                });

                assert({ foo: 'a-foo', bar: 'b-bar', baz: 'b-baz', qux: 'a-qux' }, instance.data);

                // test strict field set
                instance.setSource('a', new DataObject({
                  data: {
                    foo: 'd-foo',
                    bar: 'd-bar'
                  }
                }));

                assert({ foo: 'd-foo', bar: 'b-bar', baz: 'b-baz', qux: undefined }, instance.data);

                // test wildcard field set
                instance.setSource('b', new DataObject({
                  data: {
                    foo: 'c-foo',
                    bar: 'c-bar'
                  }
                }));

                assert({ foo: 'd-foo', bar: 'c-bar', baz: undefined, qux: undefined }, instance.data);
              }
            }
          ]
        },
        {
          name: 'updates',
          test: [
            {
              name: 'source -> merge',
              test: function(){
                var a = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var b = new DataObject({
                  data: {
                    foo: 'b',
                    bar: 'b',
                    baz: 'b'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

                a.update({
                  foo: 'c',
                  bar: 'c',
                  baz: 'c'
                });
                assert({ foo: 'c', bar: 'c', baz: 'b' }, instance.data);

                a.update({
                  baz: 'd'
                });
                assert({ foo: 'c', bar: 'c', baz: 'b' }, instance.data);

                b.update({
                  foo: 'e',
                  bar: 'e',
                  baz: 'e',
                  asd: 'e'
                });
                assert({ foo: 'c', bar: 'c', baz: 'e', asd: 'e' }, instance.data);
              }
            },
            {
              name: 'merge -> sources',
              test: function(){
                var a = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var b = new DataObject({
                  data: {
                    foo: 'b',
                    bar: 'b',
                    baz: 'b'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a',
                    '*': 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert({ foo: 'a', bar: 'a', baz: 'b' }, instance.data);

                // change foo, should change a.data.foo
                assert({ foo: 'a' }, instance.update({ foo: 1 }));
                assert({ foo: 1, bar: 'a', baz: 'b' }, instance.data);
                assert({ foo: 1, bar: 'a', baz: 'a' }, a.data);
                assert({ foo: 'b', bar: 'b', baz: 'b' }, b.data);

                // set foo the same value, should nothing change
                assert(instance.update({ foo: 1 }) == false);

                // change baz, should change b.data.baz
                assert({ baz: 'b' }, instance.update({ baz: 2 }));
                assert({ foo: 1, bar: 'a', baz: 2 }, instance.data);
                assert({ foo: 1, bar: 'a', baz: 'a' }, a.data);
                assert({ foo: 'b', bar: 'b', baz: 2 }, b.data);

                // change all fields, should change a.data & b.data
                assert({ foo: 1, bar: 'a', baz: 2 }, instance.update({ foo: 3, bar: 3, baz: 3 }));
                assert({ foo: 3, bar: 3, baz: 3 }, instance.data);
                assert({ foo: 3, bar: 3, baz: 'a' }, a.data);
                assert({ foo: 'b', bar: 'b', baz: 3 }, b.data);

                // change unknown field, should change b.data
                assert({ asd: undefined }, instance.update({ asd: 4 }));
                assert({ foo: 3, bar: 3, baz: 3, asd: 4 }, instance.data);
                assert({ foo: 3, bar: 3, baz: 'a' }, a.data);
                assert({ foo: 'b', bar: 'b', baz: 3, asd: 4 }, b.data);
              },
            },
            {
              name: 'non-existent fields',
              test: function(){
                var a = new DataObject({
                  data: {
                    foo: 1
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: 'a'
                  },
                  sources: {
                    a: a
                  }
                });

                assert(instance.data.foo === 1);
                assert(instance.data.bar === undefined);
                assert('bar' in instance.data == false);
                assert(a.data.bar === undefined);
                assert('bar' in a.data == false);

                // should warn about non-existent fields
                assert(catchWarnings(function(){
                  assert(instance.update({ baz: 123 }) === false);
                }));
                assert('baz' in instance.data === false);
                assert('baz' in a.data === false);
              }
            },
            {
              name: 'change field of not set source',
              test: function(){
                var instance = new Merge({
                  fields: {
                    foo: 'a'
                  }
                });

                assert('foo' in instance.data == false);

                assert(instance.update({ foo: 123 }) === false);
                assert('foo' in instance.data === false);
              }
            },
            {
              name: 'source & own properties',
              test: function(){
                var source = new DataObject({
                  data: {
                    foo: 'a',
                    bar: 'a',
                    baz: 'a'
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a',
                    bar: '-'
                  },
                  sources: {
                    a: source
                  },
                  data: {
                    foo: 'own',
                    bar: 'own',
                    baz: 'own'
                  }
                });

                assert({ foo: 'a', bar: 'own' }, instance.data);
                assert('a' in instance.sources == true);
                assert('-' in instance.sources == false);

                assert({ bar: 'own' }, instance.update({ bar: 123 }));
                assert({ foo: 'a', bar: 123 }, instance.data);

                source.update({ foo: 2, bar: 2, baz: 2 });
                assert({ foo: 2, bar: 123 }, instance.data);
              }
            },
            {
              name: 'merge & entity',
              test: function(){
                var Type = moduleEntity.createType(null, {
                  str: String,
                  enum: [1, 2, 3]
                });

                var entity = Type({});
                var instance = new Merge({
                  fields: {
                    '*': 'a'
                  },
                  sources: {
                    a: entity
                  }
                });

                assert(entity.data, instance.data);
                assert(entity.data !== instance.data);

                // set correct value for enum field, should change
                assert({ str: '' }, instance.update({ str: '1' }));
                assert(instance.data.str === '1');
                assert(entity.data, instance.data);

                // should coerse to string, and no changes
                assert(false, instance.update({ str: 1 }));
                assert(instance.data.str === '1');
                assert(entity.data, instance.data);

                // set correct value for enum field, should change
                assert({ enum: 1 }, instance.update({ enum: 2 }));
                assert(instance.data.enum === 2);
                assert(entity.data, instance.data);

                // set wrong value for enum field, should not change
                catchWarnings(function(){
                  assert(false, instance.update({ enum: 4 }));
                });
                assert(instance.data.enum === 2);
                assert(entity.data, instance.data);

                // set non-exists key in source, should not change
                catchWarnings(function(){
                  assert(false, instance.update({ nonexists: 123 }));
                });
                assert('nonexists' in instance.data === false);
                assert(entity.data, instance.data);
              }
            },
            {
              name: 'merge & entity id',
              test: function(){
                var Type = moduleEntity.createType(null, {
                  id: moduleEntity.IntId
                });

                var lockIdEntity = Type({ id: 1 });
                var entity = Type({});
                var instance = new Merge({
                  fields: {
                    '*': 'a'
                  },
                  sources: {
                    a: entity
                  }
                });

                assert(entity.data, instance.data);
                assert(entity.data !== instance.data);

                // id is used by another entity, should no changes
                catchWarnings(function(){
                  assert(false, instance.update({ id: 1 }));
                });
                assert(instance.data.id === null);
                assert(entity.data, instance.data);

                // should coerce value, the same case, no changes
                catchWarnings(function(){
                  assert(false, instance.update({ id: '1' }));
                });
                assert(instance.data.id === null);
                assert(entity.data, instance.data);
              }
            },
            {
              name: 'merge & entity and calc',
              test: function(){
                var Type = moduleEntity.createType(null, {
                  id: moduleEntity.IntId,
                  calc: moduleEntity.calc('id', basis.fn.$self)
                });

                var entity = Type({ id: 1 });
                var instance = new Merge({
                  fields: {
                    '*': 'a'
                  },
                  sources: {
                    a: entity
                  }
                });

                assert(entity.data, instance.data);
                assert(entity.data !== instance.data);

                // calc fields is read only and shouldn't be changed
                catchWarnings(function(){
                  assert(false, instance.update({ calc: 123 }));
                });
                assert(instance.data.calc === 1);
                assert(entity.data, instance.data);

                // delta should contains calc fields as well
                assert({ id: 1, calc: 1 }, instance.update({ id: 2 }));
                assert(instance.data.calc === 2);
                assert(entity.data, instance.data);
              }
            },
            {
              name: 'custom field name',
              test: function(){
                var source = new DataObject({
                  data: {
                    foo: 1,
                    bar: 2,
                    baz: 3
                  }
                });
                var instance = new Merge({
                  fields: {
                    foo: 'a:baz',
                    bar: 'a'
                  },
                  sources: {
                    a: source
                  }
                });

                assert({ foo: 3, bar: 2 }, instance.data);
                assert(source.data !== instance.data);

                // merge -> source
                var delta = instance.update({ foo: 4, bar: 5 });
                assert({ foo: 3, bar: 2 }, delta);
                assert({ foo: 4, bar: 5 }, instance.data);
                assert({ foo: 1, bar: 5, baz: 4 }, source.data);

                // source -> merge
                var delta = source.update({ foo: 'foo', bar: 'bar', baz: 'baz' });
                assert({ foo: 1, bar: 5, baz: 4 }, delta);
                assert({ foo: 'baz', bar: 'bar' }, instance.data);
                assert({ foo: 'foo', bar: 'bar', baz: 'baz' }, source.data);
              }
            },
            {
              name: 'values from default source should not override other fields',
              test: function(){
                var MyMerge = Merge.subclass({
                  fields: {
                    foo: '-',
                    bar: 'a',
                    '*': 'b'
                  }
                });

                var instance = new MyMerge({
                  data: {
                    foo: 'own-foo',
                    bar: 'own-bar',
                    baz: 'own-baz'
                  },
                  sources: {
                    a: new DataObject({
                      data: {
                        foo: 'a-foo',
                        bar: 'a-bar',
                        baz: 'a-baz'
                      }
                    }),
                    b: new DataObject({
                      data: {
                        foo: 'b-foo',
                        bar: 'b-bar',
                        baz: 'b-baz'
                      }
                    })
                  }
                });

                instance.update({
                  foo: 1,
                  bar: 1,
                  baz: 1
                });
                assert({ foo: 1, bar: 1, baz: 1 }, instance.data);
                assert({ foo: 'a-foo', bar: 1, baz: 'a-baz' }, instance.sources.a.data);
                assert({ foo: 'b-foo', bar: 'b-bar', baz: 1 }, instance.sources.b.data);

                instance.sources.a.update({
                  foo: 2,
                  bar: 2,
                  baz: 2
                });
                assert({ foo: 1, bar: 2, baz: 1 }, instance.data);
                assert({ foo: 2, bar: 2, baz: 2 }, instance.sources.a.data);
                assert({ foo: 'b-foo', bar: 'b-bar', baz: 1 }, instance.sources.b.data);

                instance.sources.b.update({
                  foo: 3,
                  bar: 3,
                  baz: 3
                });
                assert({ foo: 1, bar: 2, baz: 3 }, instance.data);
                assert({ foo: 2, bar: 2, baz: 2 }, instance.sources.a.data);
                assert({ foo: 3, bar: 3, baz: 3 }, instance.sources.b.data);
              }
            }
          ]
        },
        {
          name: 'resolveObject source from various values',
          beforeEach: function(){
            var merge = new Merge({
              fields: {
                foo: 'a',
                bar: 'a'
              }
            });
            var object1 = new DataObject({
              data: {
                foo: 1,
                bar: 2,
                baz: 3
              }
            });
            var object2 = new DataObject({
              data: {
                foo: 'a',
                bar: 'b',
                baz: 'c'
              }
            });
          },
          test: [
            {
              name: 'should resolve object from bb-value',
              test: function(){
                var token = new basis.Token(object1);

                merge.setSource('a', token);
                assert(merge.sources.a === object1);
                assert({ foo: 1, bar: 2 }, merge.data);
                assert(merge.sourcesContext_.a.adapter !== null);

                token.set();
                assert(merge.sources.a === null);
                assert({ foo: 1, bar: 2 }, merge.data);

                token.set(object2);
                assert(merge.sources.a === object2);
                assert({ foo: 'a', bar: 'b' }, merge.data);

                token.destroy();
                object2.update({ foo: 1 });
                assert(merge.sources.a === null);
                assert(merge.sourcesContext_.a.adapter === null);
                assert({ foo: 'a', bar: 'b' }, merge.data);
              }
            },
            {
              name: 'should unlink from bb-value',
              test: function(){
                var token = new basis.Token(object1);

                merge.setSource('a', token);
                assert(merge.sources.a === object1);
                assert({ foo: 1, bar: 2 }, merge.data);

                merge.setSource('a', null);
                object1.update({ foo: 'a', bar: 'b' });
                assert({ foo: 1, bar: 2 }, merge.data);

                merge.setSource('a', token);
                assert({ foo: 'a', bar: 'b' }, merge.data);
                assert(token.handler !== null);

                merge.destroy();
                assert(token.handler === null);
              }
            },
            {
              name: 'should allow use proxy',
              test: function(){
                merge.object_ = object2;
                merge.setSource('a', Value.factory('someEvent', function(self){
                  return self.object_;
                }));
                assert(merge.sources.a === object2);
                assert({ foo: 'a', bar: 'b' }, merge.data);
              }
            }
          ]
        },
        {
          name: 'active',
          test: [
            {
              name: 'should add subscription for sources on init',
              test: function(){
                var a = new DataObject();
                var b = new DataObject();
                var instance = new Merge({
                  active: true,
                  fields: {
                    foo: 'a',
                    bar: 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert(a.subscriberCount === 1);
                assert(b.subscriberCount === 1);

                instance.setActive(false);

                assert(a.subscriberCount === 0);
                assert(b.subscriberCount === 0);

                instance.setActive(true);

                assert(a.subscriberCount === 1);
                assert(b.subscriberCount === 1);
              }
            },
            {
              name: 'should add subscription on source set',
              test: function(){
                var a = new DataObject();
                var b = new DataObject();
                var instance = new Merge({
                  active: true,
                  fields: {
                    foo: 'a',
                    bar: 'b'
                  }
                });

                assert(a.subscriberCount === 0);
                assert(b.subscriberCount === 0);

                instance.setSource('a', a);
                instance.setSource('b', b);

                assert(a.subscriberCount === 1);
                assert(b.subscriberCount === 1);
              }
            },
            {
              name: 'should remove subscription on remove',
              test: function(){
                var a = new DataObject();
                var b = new DataObject();
                var instance = new Merge({
                  active: true,
                  fields: {
                    foo: 'a',
                    bar: 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert(a.subscriberCount === 1);
                assert(b.subscriberCount === 1);

                instance.setSource('a', null);
                instance.setSource('b', null);

                assert(a.subscriberCount === 0);
                assert(b.subscriberCount === 0);
              }
            },
            {
              name: 'should remove subscription on self destroy',
              test: function(){
                var a = new DataObject();
                var b = new DataObject();
                var instance = new Merge({
                  active: true,
                  fields: {
                    foo: 'a',
                    bar: 'b'
                  },
                  sources: {
                    a: a,
                    b: b
                  }
                });

                assert(a.subscriberCount === 1);
                assert(b.subscriberCount === 1);

                instance.destroy();

                assert(a.subscriberCount === 0);
                assert(b.subscriberCount === 0);
              }
            }
          ]
        }
      ]
    }
  ]
};
