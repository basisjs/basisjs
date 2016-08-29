module.exports = {
  name: 'type.string',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonStringsExceptNull = [
      2,
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
      name: 'accepts string',
      test: function(){
        assert(type.string('hello') === 'hello');
        assert(type.string('') === '');
      }
    },
    {
      name: 'is empty string by default',
      test: function(){
        assert(type.string.DEFAULT_VALUE === '');
      }
    },
    {
      name: 'ignores incorrect objects',
      test: function(){
        nonStringsExceptNull.forEach(function(incorrectValue){
          var warned = catchWarnings(function(){
            assert(type.string(incorrectValue, 'previous') === 'previous');
          });

          assert(warned);
        });

        catchWarnings(function(){
          assert(type.string(null, 'previous') === 'previous');
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        [
          '',
          'basis'
        ].forEach(function(correctValue){
          assert(type.string(correctValue, 'previous') === type.string(correctValue));
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
              '',
              'test'
            ].forEach(function(correctValue){
              assert(type.string.nullable(correctValue, 'prev') === type.string(correctValue));
            });
          }
        },
        {
          name: 'accepts null',
          test: function(){
            assert(type.string.nullable(null, 'prev') === null);
          }
        },
        {
          name: 'is null by default',
          test: function(){
            assert(type.string.nullable.DEFAULT_VALUE === null);
          }
        },
        {
          name: 'ignores incorrect values',
          test: function(){
            nonStringsExceptNull.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.string.nullable(incorrectValue, 'previous') === 'previous');
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
                var transform = type.string.nullable.default('def');

                catchWarnings(function(){
                  nonStringsExceptNull.concat([
                    null,
                    '',
                    'basis'
                  ]).forEach(function(value){
                    assert(transform(value, 'prev') === type.string.nullable(value, 'prev'));
                  });
                });
              }
            },
            {
              name: 'sets default value',
              test: function(){
                assert(type.string.nullable.default('defValue').DEFAULT_VALUE === 'defValue');
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                var transform;
                var warned = catchWarnings(function(){
                  transform = type.string.nullable.default({});
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
            var transform = type.string.default('def');

            catchWarnings(function(){
              nonStringsExceptNull.concat([
                null,
                '',
                'basis',
              ]).forEach(function(value){
                assert(transform(value, 'prev') === type.string(value, 'prev'));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            assert(type.string.default('defValue').DEFAULT_VALUE === 'defValue');
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            var transform;
            var warned = catchWarnings(function(){
              transform = type.string.default(3);
            });

            assert(warned);
            assert(transform.DEFAULT_VALUE === '');
          }
        }
      ]
    }
  ]
};
