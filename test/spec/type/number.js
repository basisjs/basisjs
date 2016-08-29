module.exports = {
  name: 'type.number',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonNumbersExceptNull = [
      '123,45',
      {},
      { foo: 'bar' },
      [],
      [1, 2],
      NaN,
      Infinity,
      undefined
    ];
  },
  test: [
    {
      name: 'accepts native and stringified numbers',
      test: function(){
        assert(type.number(2.718) === 2.718);
        assert(type.number('234.5') === 234.5);
      }
    },
    {
      name: 'is 0 by default',
      test: function(){
        assert(type.number.DEFAULT_VALUE === 0);
      }
    },
    {
      name: 'ignores incorrect objects',
      test: function(){
        nonNumbersExceptNull.forEach(function(incorrectValue){
          var warned = catchWarnings(function(){
            assert(type.number(incorrectValue, 42) === 42);
          });

          assert(warned);
        });

        catchWarnings(function(){
          assert(type.number(null, 42) === 42);
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        [
          2.3,
          '1234.56'
        ].forEach(function(correctValue){
          assert(type.number(correctValue, 42) === type.number(correctValue));
        });
      }
    },
    {
      name: 'nullable',
      test: [
        {
          name: 'accepts correct values',
          test: function(){
            [
              2.3,
              '1234.56'
            ].forEach(function(correctValue){
              assert(type.number.nullable(correctValue, 23) === type.number(correctValue));
            });
          }
        },
        {
          name: 'accepts null',
          test: function(){
            assert(type.number.nullable(null, 23) === null);
          }
        },
        {
          name: 'is null by default',
          test: function(){
            assert(type.number.nullable.DEFAULT_VALUE === null);
          }
        },
        {
          name: 'ignores incorrect values',
          test: function(){
            nonNumbersExceptNull.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.number.nullable(incorrectValue, 42) === 42);
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
                var transform = type.number.nullable.default(96);

                catchWarnings(function(){
                  nonNumbersExceptNull.concat([
                    null,
                    2.3,
                    '1234.56'
                  ]).forEach(function(value){
                    assert(transform(value, 23) === type.number.nullable(value, 23));
                  });
                });
              }
            },
            {
              name: 'sets default value',
              test: function(){
                assert(type.number.nullable.default(1).DEFAULT_VALUE === 1);
              }
            },
            {
              name: 'accepts stringified defaults',
              test: function(){
                assert(type.number.nullable.default('777').DEFAULT_VALUE === 777);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                var transform;
                var warned = catchWarnings(function(){
                  transform = type.number.nullable.default({});
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
            var transform = type.number.default(96);

            catchWarnings(function(){
              nonNumbersExceptNull.concat([
                null,
                2.3,
                '1234.56'
              ]).forEach(function(value){
                assert(transform(value, 23) === type.number(value, 23));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            assert(type.number.default(1).DEFAULT_VALUE === 1);
          }
        },
        {
          name: 'accepts stringified defaults',
          test: function(){
            assert(type.number.default('123').DEFAULT_VALUE === 123);
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            nonNumbersExceptNull.concat([null]).forEach(function(incorrectValue){
              var transform;
              var warned = catchWarnings(function(){
                transform = type.number.default(incorrectValue);
              });

              assert(warned);
              assert(transform.DEFAULT_VALUE === 0);
            });
          }
        }
      ]
    }
  ]
};
