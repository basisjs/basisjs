module.exports = {
  name: 'Field types',
  test: [
    {
      name: 'entity wrapper',
      test: [
        {
          name: 'entity type by name',
          test: [
            {
              name: 'use name after type declared',
              test: function(){
                var Type1 = nsEntity.createType('fieldTypeTest-declaredTypeName', { value: Number });
                var Type2 = nsEntity.createType(null, { nested: 'fieldTypeTest-declaredTypeName' });
                var instance = Type2({ nested: { value: 123 } });

                assert(typeof instance.data.nested != 'undefined');
                assert(instance.data.nested.data.value == 123);
              }
            },
            {
              name: 'use name before type declared',
              test: function(){
                var Type1;
                assert(catchWarnings(function(){
                  Type1 = nsEntity.createType(null, { nested: 'fieldTypeTest-nonDeclaredTypeName' });
                }) === false);

                var Type2 = nsEntity.createType('fieldTypeTest-nonDeclaredTypeName', { value: Number });
                var instance = Type1({ nested: { value: 123 } });

                assert(typeof instance.data.nested != 'undefined');
                assert(instance.data.nested.data.value == 123);
              }
            },
            {
              name: 'create type instance with null/undefined value for non-declared type field should not produce warnings',
              test: function(){
                var Type1 = nsEntity.createType(null, { nested: 'fieldTypeTest-nonDeclaredTypeName-noWarnings' });;

                assert(catchWarnings(function(){
                  Type1({});
                }) === false);
              }
            }
          ]
        },
        {
          name: 'entity set type by name',
          test: [
            {
              name: 'use name after type declared',
              test: function(){
                var Type1 = nsEntity.createType(null, { value: Number });
                var SetType1 = nsEntity.createSetType('fieldSetTypeTest-declaredTypeName', Type1);
                var Type2 = nsEntity.createType(null, { items: 'fieldSetTypeTest-declaredTypeName' });
                var instance = Type2({ items: [{ value: 123 }] });

                assert(typeof instance.data.items != 'undefined');
                assert(instance.data.items.itemCount == 1);
                assert(instance.data.items.pick().data.value == 123);
              }
            },
            {
              name: 'use name before type declared',
              test: function(){
                var Type1 = nsEntity.createType(null, { value: Number });
                var Type2 = nsEntity.createType(null, { items: 'fieldSetTypeTest-nonDeclaredTypeName' });
                var SetType1 = nsEntity.createSetType('fieldSetTypeTest-nonDeclaredTypeName', Type1);
                var instance = Type2({ items: [{ value: 123 }] });

                assert(typeof instance.data.items != 'undefined');
                assert(instance.data.items.itemCount == 1);
                assert(instance.data.items.pick().data.value == 123);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Array',
      test: [
        {
          name: 'undefined by default',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({});

            assert(obj.data.array === null);
          }
        },
        {
          name: 'set array',
          test: function(){
            var a = [1, 2, 3];
            var b = [1, 2, 3];
            var c = [4, 5, 6];

            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({ array: a });

            assert(obj.data.array === a);

            assert(obj.set('array', a) === false);
            assert(obj.data.array === a);

            assert(obj.set('array', b) === false);
            assert(obj.data.array === a);

            assert(typeof obj.set('array', c) === 'object');
            assert(obj.data.array === c);

            assert(typeof obj.set('array', b) === 'object');
            assert(obj.data.array === b);

            assert(obj.set('array', a) === false);
            assert(obj.data.array === b);

            assert(typeof obj.set('array', null) === 'object');
            assert(obj.data.array === null);

            assert(typeof obj.set('array', a) === 'object');
            assert(obj.data.array === a);
          }
        },
        {
          name: 'set null',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({ array: [1, 2, 3] });
            obj.set('array', null);

            assert(obj.data.array === null);
          }
        },
        {
          name: 'everything non-array just be ignored',
          test: function(){
            var a = [1, 2, 3];

            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({ array: a });

            assert(catchWarnings(function(){
              obj.set('array', undefined);
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', true);
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', 'whatever');
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', 123);
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', {});
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', function(){});
            }));
            assert(obj.data.array === a);

            assert(catchWarnings(function(){
              obj.set('array', 'whatever');
            }));
            assert(obj.data.array === a);
          }
        },
        {
          name: 'update with rollback',
          test: function(){
            var a = [1, 2, 3];
            var b = [1, 2, 3];
            var c = [4, 5, 6];

            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({ array: a });

            assert(obj.data.array === a);

            assert(obj.set('array', b, true) === false);
            assert(obj.modified === null);

            assert(typeof obj.set('array', c, true) === 'object');
            assert({ array: a }, obj.modified);
            assert((obj.modified && obj.modified.array) === a);

            assert(typeof obj.set('array', b, true) === 'object');
            assert(obj.modified === null);
            assert(obj.data.array === a);
          }
        },
        {
          name: 'update to null with rollback',
          test: function(){
            var a = [1, 2, 3];
            var b = [1, 2, 3];

            var T = nsEntity.createType({
              fields: {
                array: Array
              }
            });
            var obj = T({ array: a });

            assert(typeof obj.set('array', null, true) === 'object');
            assert({ array: a }, obj.modified);
            assert((obj.modified && obj.modified.array) === a);
            assert(obj.data.array === null);

            assert(typeof obj.set('array', b, true) === 'object');
            assert(obj.modified === null);
            assert(obj.data.array === a);
          }
        }
      ]
    },
    {
      name: 'enum',
      test: [
        {
          name: 'default value',
          test: [
            {
              name: 'if no defValue get first variant as default',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: ['a', 'b']
                  }
                });

                assert(T({}).data.enum === 'a');
                assert(T({ enum: 'b' }).data.enum === 'b');
              }
            },
            {
              name: 'take in account defValue as default value',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: {
                      type: ['a', 'b'],
                      defValue: 'b'
                    }
                  }
                });

                assert(T({}).data.enum === 'b');
                assert(T({ enum: 'a' }).data.enum === 'a');
              }
            },
            {
              name: 'ignore defValue if value not in the list',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: {
                      type: ['a', 'b'],
                      defValue: 'c'
                    }
                  }
                });

                assert(T({}).data.enum === 'a');
                assert(T({ enum: 'b' }).data.enum === 'b');

                var T2 = nsEntity.createType({
                  fields: {
                    enum: {
                      type: ['1', '2'],
                      defValue: 2
                    }
                  }
                });
                assert(T2({}).data.enum === '1');
                assert(T2({ enum: '2' }).data.enum === '2');
              }
            }
          ]
        },
        {
          name: 'set',
          test: [
            {
              name: 'only value from list can be set',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: ['a', 'b']
                  }
                });

                assert(T({ enum: 'b' }).data.enum === 'b');
                assert(T({ enum: 'c' }).data.enum === 'a');

                var obj = T({ enum: 'b' });
                assert(obj.set('enum', 'c') === false);
                assert(obj.set('enum', 'a') !== false);
                assert(obj.data.enum === 'a');
              }
            },
            {
              name: 'should not coerce values',
              test: function(){
                var T = nsEntity.createType({
                  fields: {
                    enum: ['1', '2']
                  }
                });

                assert(T({ enum: 2 }).data.enum === '1');
                assert(T({ enum: '2' }).data.enum === '2');

                var obj = T({ enum: '1' });
                assert(obj.set('enum', 2) === false);
                assert(obj.set('enum', '2') !== false);
                assert(obj.data.enum === '2');
              }
            },
            {
              name: 'changes of source array should not affect values list',
              test: function(){
                var variants = ['a', 'b'];
                var T = nsEntity.createType({
                  fields: {
                    enum: variants
                  }
                });

                variants.push('c');
                assert(['a', 'b', 'c'], variants);

                assert(T({ }).data.enum === 'a');
                assert(T({ enum: 'c' }).data.enum === 'a');

                variants.length = 0;
                assert([], variants);

                var obj = T({});
                assert(T({}).data.enum === 'a');
                assert(obj.set('enum', 'c') === false);
                assert(obj.set('enum', 'b') !== false);
                assert(obj.data.enum === 'b');
              }
            }
          ]
        },
        {
          name: 'one value treats as constant',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                enum: ['value']
              }
            });
            var obj = T({});

            assert(obj.data.enum === 'value');
            assert(obj.set('enum', 123) === false);
            assert(obj.data.enum === 'value');
          }
        }
      ]
    },
    {
      name: 'Date',
      test: [
        {
          name: 'set correct values on init',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                date: Date
              }
            });

            var date = new Date;
            assert(T({ date: null }).data.date === null);
            assert(T({ date: date }).data.date === date);
            assert(T({ date: dateUtils.toISOString(date) }).data.date - date === 0);
            assert(T({ date: Number(date) }).data.date - date === 0);
          }
        },
        {
          name: 'set correct values on update',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                date: Date
              }
            });

            var date = new Date;
            var date2 = new Date(2014, 10, 15);

            // null
            var instance = T({ date: date });
            instance.set('date', null);
            assert(instance.data.date === null);

            instance = T({ date: null });
            assert(instance.set('date', null) === false);
            assert(instance.data.date === null);

            // string (the same value)
            var value = dateUtils.toISOString(date);
            var instance = T({ date: date });
            assert(instance.set('date', value) === false);
            assert(instance.data.date !== value);
            assert(instance.data.date === date);

            // another value
            var value = dateUtils.toISOString(date2);
            var instance = T({ date: date });
            assert(instance.set('date', value) !== false);
            assert(instance.data.date !== value);
            assert(instance.data.date !== date);
            assert(instance.data.date - date2 === 0);

            instance = T({ date: null });
            assert(instance.set('date', value) !== false);
            assert(instance.data.date !== value);
            assert(instance.data.date !== date2);
            assert(instance.data.date - date2 === 0);

            // number (the same value)
            var value = Number(date);
            var instance = T({ date: date });
            assert(instance.set('date', value) === false);
            assert(instance.data.date !== value);
            assert(instance.data.date === date);

            // another value
            var value = Number(date2);
            var instance = T({ date: date });
            assert(instance.set('date', value) !== false);
            assert(instance.data.date !== value);
            assert(instance.data.date !== date);
            assert(instance.data.date - date2 === 0);

            instance = T({ date: null });
            assert(instance.set('date', value) !== false);
            assert(instance.data.date !== value);
            assert(instance.data.date !== date);
            assert(instance.data.date - date2 === 0);

            // date
            var instance = T({ date: date });
            assert(instance.set('date', date) === false);
            assert(instance.data.date === date);

            var instance = T({ date: date });
            assert(instance.set('date', date2) !== false);
            assert(instance.data.date === date2);

            var instance = T({ date: null });
            assert(instance.set('date', date) !== false);
            assert(instance.data.date === date);
          }
        },
        {
          name: 'set wrong values on init',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                date: Date
              }
            });

            assert(T({ date: {} }).data.date === null);
            assert(T({ date: [] }).data.date === null);
            assert(T({ date: function(){} }).data.date === null);
            assert(T({ date: '' }).data.date === null);
            assert(T({ date: NaN }).data.date === null);
            assert(T({ date: true }).data.date === null);
            assert(T({ date: false }).data.date === null);
          }
        },
        {
          name: 'set wrong values',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                date: Date
              }
            });

            var date = new Date();
            assert(T({ date: date }).set('date', {}) === false);
            assert(T({ date: date }).set('date', []) === false);
            assert(T({ date: date }).set('date', function(){}) === false);
            assert(T({ date: date }).set('date', '') === false);
            assert(T({ date: date }).set('date', NaN) === false);
            assert(T({ date: date }).set('date', true) === false);
            assert(T({ date: date }).set('date', false) === false);
          }
        }
      ]
    },
    {
      name: 'custom basis.type-like transform',
      beforeEach: function(){
        var boolOrNull = function(newValue, oldValue){
          switch (newValue) {
            case true:
            case false:
            case null:
              return newValue;
            default:
              return oldValue;
          }
        };

        var defValue = {};
        defValue.circularReference = defValue;

        boolOrNull.DEFAULT_VALUE = defValue;

        var T = nsEntity.createType({
          fields: {
            value: boolOrNull
          }
        });
      },
      test: [
        {
          name: 'set correct values on init',
          test: function(){
            assert(T({ value: null }).data.value === null);
            assert(T({ value: false }).data.value === false);
            assert(T({ value: true }).data.value === true);
          }
        },
        {
          name: 'set correct values on update',
          test: function(){
            // null
            var instance = T({ value: false });
            instance.set('value', true);
            assert(instance.data.value === true);
            instance.set('value', null);
            assert(instance.data.value === null);
          }
        },
        {
          name: 'set wrong values on init',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                value: boolOrNull
              }
            });

            assert(T({ value: {} }).data.value === defValue);
            assert(T({ value: [] }).data.value === defValue);
            assert(T({ value: function(){} }).data.value === defValue);
            assert(T({ value: '' }).data.value === defValue);
            assert(T({ value: NaN }).data.value === defValue);
          }
        },
        {
          name: 'set wrong values on init - specification via type config with default value',
          test: function(){
            var T = nsEntity.createType({
              fields: {
                value: {
                  type: boolOrNull
                }
              }
            });

            assert(T({ value: {} }).data.value === defValue);
          }
        },
        {
          name: 'set wrong values on init - specification via type config without default value',
          test: function(){
            var customDefault = {};

            var T = nsEntity.createType({
              fields: {
                value: {
                  type: boolOrNull,
                  defValue: customDefault
                }
              }
            });

            assert(T({ value: [] }).data.value === customDefault);
          }
        },
        {
          name: 'set wrong values',
          test: function(){
            assert(T({ value: true }).set('value', {}) === false);
            assert(T({ value: true }).set('value', []) === false);
            assert(T({ value: true }).set('value', function(){}) === false);
            assert(T({ value: true }).set('value', '') === false);
            assert(T({ value: true }).set('value', NaN) === false);
          }
        }
      ]
    }
  ]
},
{
  name: 'destroy',
  test: [
    {
      name: 'no warnings about handler remove on destroy',
      test: function(){
        var Type = nsEntity.createType();
        var subset = new Filter({ source: Type.all });
        var instance = Type({});

        assert(subset.itemCount == 1);
        assert(catchWarnings(function(){
          instance.destroy();
        }) == false);

        assert(subset.itemCount == 0);
      }
    },
    {
      name: 'no warnings on all.setAndDestroyRemoved([])',
      test: function(){
        var Type = nsEntity.createType();
        var subset = new Filter({ source: Type.all });
        var eventCount = 0;

        Type({});
        Type({});

        subset.addHandler({
          itemsChanged: function(){
            eventCount++;
          }
        });

        assert(subset.itemCount == 2);
        assert(catchWarnings(function(){
          Type.all.setAndDestroyRemoved([]);
        }) == false);

        assert(subset.itemCount == 0);
        assert(eventCount == 1);
      }
    },
    {
      name: 'no warnings on subset sync',
      test: function(){
        var Type = nsEntity.createType('TestType', {
          id: nsEntity.IntId,
          group: Number
        });

        var split = new nsEntity.Grouping({
          wrapper: Type,
          source: Type.all,
          rule: 'data.group'
        });

        var wrapper = split.getSubset(1, true);
        var subset = new Filter({
          source: wrapper
        });

        assert(catchWarnings(function(){
          wrapper.dataset.setAndDestroyRemoved([{ id: 1, group: 1 }]);
        }) == false);
        assert(wrapper.itemCount == 1);
        assert(subset.itemCount == 1);

        assert(catchWarnings(function(){
          wrapper.dataset.setAndDestroyRemoved([{ id: 2, group: 1 }]);
        }) == false);
        assert(wrapper.itemCount == 1);
        assert(subset.itemCount == 1);
      }
    }
  ]
};
