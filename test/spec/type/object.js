module.exports = {
  name: 'type.object',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonObjects = [
      2,
      [], // We consider arrays as non-objects. For transforming arrays you should use type.array
      [{ foo: 'bar' }],
      '',
      'hello',
      NaN,
      Infinity,
      undefined
    ];
  },
  test: [
    {
      name: 'returns object as is',
      test: function(){
        var first = { foo: 'bar' };
        var second = {};

        assert(type.object(first) === first);
        assert(type.object(second) === second);
      }
    },
    {
      name: 'is empty object by default',
      test: function(){
        assert({}, type.object.DEFAULT_VALUE);
      }
    },
    {
      name: 'ignores incorrect objects (including arrays)',
      test: function(){
        var previous = { foo: '1' };

        nonObjects.forEach(function(incorrectValue){
          var warned = catchWarnings(function(){
            assert(type.object(incorrectValue, previous) === previous);
          });

          assert(warned);
        });

        catchWarnings(function(){
          assert(type.object(null, previous) === previous);
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        [
          {},
          { null: null, two: 2 }
        ].forEach(function(correctValue){
          assert(type.object(correctValue, { foo: 1 }) === type.object(correctValue));
        });
      }
    },
    {
      name: 'nullable',
      test: [
        {
          name: 'accepts objects',
          test: function(){
            [
              {},
              { u: undefined, n: 34 },
              { arr: [], obj: {} }
            ].forEach(function(correctValue){
              assert(type.object.nullable(correctValue, { prev: true }) === type.object(correctValue));
            });
          }
        },
        {
          name: 'accepts null',
          test: function(){
            assert(type.object.nullable(null, { prev: true }) === null);
          }
        },
        {
          name: 'is null by default',
          test: function(){
            assert(type.object.nullable.DEFAULT_VALUE === null);
          }
        },
        {
          name: 'ignores incorrect objects (including arrays)',
          test: function(){
            var previous = { prev: true };
            nonObjects.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.object.nullable(incorrectValue, previous) === previous);
              });

              assert(warned);
            });
          }
        },
        {
          name: 'default',
          test: [
            {
              name: 'behaves like nullable version',
              test: function(){
                var transform = type.object.nullable.default({});

                catchWarnings(function(){
                  var previous = { one: 1, two: 2, three: 3 };

                  nonObjects.concat([
                    null,
                    {},
                    { one: 1, obj: {} }
                  ]).forEach(function(value){
                    assert(transform(value, previous) === type.object.nullable(value, previous));
                  });
                });
              }
            },
            {
              name: 'sets default value',
              test: function(){
                var defValue = { any: 'any' };
                assert(type.object.nullable.default(defValue).DEFAULT_VALUE === defValue);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                var transform;
                var warned = catchWarnings(function(){
                  transform = type.object.nullable.default([]);
                });

                assert(warned);
                assert(transform.DEFAULT_VALUE === null);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'default',
      test: [
        {
          name: 'behaves like usual version',
          test: function(){
            var transform = type.object.default({ def: true });

            catchWarnings(function(){
              var previous = [];

              nonObjects.concat([
                null,
                {},
                { one: 1, obj: {} }
              ]).forEach(function(value){
                assert(transform(value, previous) === type.object(value, previous));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            var defValue = { one: 1 };

            assert(type.object.default(defValue).DEFAULT_VALUE === defValue);
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            nonObjects.forEach(function(incorrectValue){
              var transform;
              var warned = catchWarnings(function(){
                transform = type.object.default(incorrectValue);
              });

              assert(warned);
              assert(transform.DEFAULT_VALUE, {});
            });
          }
        }
      ]
    }
  ]
};
