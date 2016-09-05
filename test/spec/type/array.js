module.exports = {
  name: 'type.array',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonArraysExceptNull = [
      2,
      {},
      { foo: 'bar' },
      '',
      'hello',
      NaN,
      Infinity,
      undefined
    ];
  },
  test: [
    {
      name: 'returns array as is',
      test: function(){
        var first = [1, 2, 3];
        var second = [];

        assert(type.array(first) === first);
        assert(type.array(second) === second);
      }
    },
    {
      name: 'is empty array by default',
      test: function(){
        assert([], type.array.DEFAULT_VALUE);
      }
    },
    {
      name: 'ignores incorrect objects',
      test: function(){
        var previous = [1];

        nonArraysExceptNull.forEach(function(incorrectValue){
          var warned = catchWarnings(function(){
            assert(type.array(incorrectValue, previous) === previous);
          });

          assert(warned);
        });

        catchWarnings(function(){
          assert(type.array(null, previous) === previous);
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        [
          [],
          [null, 2]
        ].forEach(function(correctValue){
          assert(type.array(correctValue, [1]) === type.array(correctValue));
        });
      }
    },
    {
      name: 'returns previous value if it is array with the same contents',
      test: function(){
        var previous = [null, undefined, 2, 'str'];
        var targetAr = [null, undefined, 2, 'str'];

        assert(type.array(targetAr, previous) === previous);
      }
    },
    {
      name: 'nullable',
      test: [
        {
          name: 'accepts arrays',
          test: function(){
            [
              [],
              [undefined, 34],
              [[]]
            ].forEach(function(correctValue){
              assert(type.array.nullable(correctValue, [33]) === type.array(correctValue));
            });
          }
        },
        {
          name: 'accepts null',
          test: function(){
            assert(type.array.nullable(null, [23]) === null);
          }
        },
        {
          name: 'is null by default',
          test: function(){
            assert(type.array.nullable.DEFAULT_VALUE === null);
          }
        },
        {
          name: 'ignores incorrect values',
          test: function(){
            var previous = [1, 2];
            nonArraysExceptNull.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.array.nullable(incorrectValue, previous) === previous);
              });

              assert(warned);
            });
          }
        },
        {
          name: 'returns previous value if it is array with the same contents',
          test: function(){
            var previous = [null, undefined, 2, 'str'];
            var targetAr = [null, undefined, 2, 'str'];

            assert(type.array.nullable(targetAr, previous) === previous);
          }
        },
        {
          name: 'default',
          test: [
            {
              name: 'behaves like nullable version',
              test: function(){
                var transform = type.array.nullable.default(['def']);

                catchWarnings(function(){
                  var previous = [1, 2, 3];

                  nonArraysExceptNull.concat([
                    null,
                    [],
                    [23, 24]
                  ]).forEach(function(value){
                    assert(transform(value, previous) === type.array.nullable(value, previous));
                  });
                });
              }
            },
            {
              name: 'sets default value',
              test: function(){
                var defValue = ['any'];
                assert(type.array.nullable.default(defValue).DEFAULT_VALUE === defValue);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                var transform;
                var warned = catchWarnings(function(){
                  transform = type.array.nullable.default({});
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
            var transform = type.array.default(['def']);

            catchWarnings(function(){
              var previous = [];

              nonArraysExceptNull.concat([
                null,
                [],
                [23, 24]
              ]).forEach(function(value){
                assert(transform(value, previous) === type.array(value, previous));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            var defValue = [1];

            assert(type.array.default(defValue).DEFAULT_VALUE === defValue);
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            var transform;
            var warned = catchWarnings(function(){
              transform = type.array.default(3);
            });

            assert(warned);
            assert(transform.DEFAULT_VALUE, []);
          }
        }
      ]
    }
  ]
};
