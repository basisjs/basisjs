module.exports = {
  name: 'basis.type',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
    var DEFAULT_VALUE = type.DEFAULT_VALUE;

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

    var nonNumbersExceptNull = [
      '123,45',
      {},
      { foo: 'bar' },
      [],
      [1, 2],
      NaN,
      Infinity,
      undefined
    ]
  },
  test: [
    {
      name: 'type.string',
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
            assert(type.string(DEFAULT_VALUE) === '');
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

            assert(type.string(null, 'previous') === 'previous');
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
                assert(type.string.nullable(DEFAULT_VALUE) === null);
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

                    nonStringsExceptNull.concat([
                      null,
                      '',
                      'basis'
                    ]).forEach(function(value){
                      assert(transform(value, 'prev') === type.string.nullable(value, 'prev'));
                    });
                  }
                },
                {
                  name: 'returns default value',
                  test: function(){
                    assert(type.string.nullable.default('defValue')(DEFAULT_VALUE) === 'defValue');
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
                    assert(transform(DEFAULT_VALUE) === null);
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

                nonStringsExceptNull.concat([
                  null,
                  '',
                  'basis',
                ]).forEach(function(value){
                  assert(transform(value, 'prev') === type.string(value, 'prev'));
                });
              }
            },
            {
              name: 'returns default value',
              test: function(){
                assert(type.string.default('defValue')(DEFAULT_VALUE) === 'defValue');
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
                assert(transform(DEFAULT_VALUE) === '');
              }
            }
          ]
        }
      ]
    },
    {
      name: 'type.number',
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
            assert(type.number(DEFAULT_VALUE) === 0);
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

            assert(type.number(null, 42) === 42);
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
                assert(type.number.nullable(DEFAULT_VALUE) === null);
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
                    var transform = type.number.nullable.default('def');

                    nonNumbersExceptNull.concat([
                      null,
                      2.3,
                      '1234.56'
                    ]).forEach(function(value){
                      assert(transform(value, 23) === type.number.nullable(value, 23));
                    });
                  }
                },
                {
                  name: 'returns default value',
                  test: function(){
                    assert(type.number.nullable.default(1)(DEFAULT_VALUE) === 1);
                  }
                },
                {
                  name: 'accepts stringified defaults',
                  test: function(){
                    assert(type.number.nullable.default('777')(DEFAULT_VALUE) === 777);
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
                    assert(transform(DEFAULT_VALUE) === null);
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
                var transform = type.number.default('def');

                nonNumbersExceptNull.concat([
                  null,
                  2.3,
                  '1234.56'
                ]).forEach(function(value){
                  assert(transform(value, 23) === type.number(value, 23));
                });
              }
            },
            {
              name: 'returns default value',
              test: function(){
                assert(type.number.default(1)(DEFAULT_VALUE) === 1);
              }
            },
            {
              name: 'accepts stringified defaults',
              test: function(){
                assert(type.number.default('123')(DEFAULT_VALUE) === 123);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                nonNumbersExceptNull.concat([null]).forEach(function(incorrectValue) {
                  var transform;
                  var warned = catchWarnings(function(){
                    transform = type.number.default(incorrectValue);
                  });

                  assert(warned);
                  assert(transform(DEFAULT_VALUE) === 0);
                });
              }
            }
          ]
        }
      ]
    },
    {
      name: 'type.int',
      test: [
        {
          name: 'accepts native and stringified ints',
          test: function(){
            assert(type.int(2.718) === 2);
            assert(type.int('-234.5') === -234);
          }
        },
        {
          name: 'is 0 by default',
          test: function(){
            assert(type.int(DEFAULT_VALUE) === 0);
          }
        },
        {
          name: 'ignores incorrect objects',
          test: function(){
            nonNumbersExceptNull.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.int(incorrectValue, 42) === 42);
              });

              assert(warned);
            });

            assert(type.int(null, 42) === 42);
          }
        },
        {
          name: 'ignores previous value if can transform new value',
          test: function(){
            [
              2.3,
              '-1234.56'
            ].forEach(function(correctValue){
              assert(type.int(correctValue, 42) === type.int(correctValue));
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
                  assert(type.int.nullable(correctValue, 23) === type.int(correctValue));
                });
              }
            },
            {
              name: 'accepts null',
              test: function(){
                assert(type.int.nullable(null, 23) === null);
              }
            },
            {
              name: 'is null by default',
              test: function(){
                assert(type.int.nullable(DEFAULT_VALUE) === null);
              }
            },
            {
              name: 'ignores incorrect values',
              test: function(){
                nonNumbersExceptNull.forEach(function(incorrectValue){
                  var warned = catchWarnings(function(){
                    assert(type.int.nullable(incorrectValue, 42) === 42);
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
                    var transform = type.int.nullable.default('def');

                    nonNumbersExceptNull.concat([
                      null,
                      2.3,
                      '-1234.56'
                    ]).forEach(function(value){
                      assert(transform(value, 23) === type.int.nullable(value, 23));
                    });
                  }
                },
                {
                  name: 'returns default value',
                  test: function(){
                    assert(type.int.nullable.default(1.5)(DEFAULT_VALUE) === 1);
                  }
                },
                {
                  name: 'accepts stringified defaults',
                  test: function(){
                    assert(type.int.nullable.default('777')(DEFAULT_VALUE) === 777);
                  }
                },
                {
                  name: 'ignores default value if it is incorrect',
                  test: function(){
                    var transform;
                    var warned = catchWarnings(function(){
                      transform = type.int.nullable.default({});
                    });

                    assert(warned);
                    assert(transform(DEFAULT_VALUE) === null);
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
                var transform = type.int.default(2.3);

                nonNumbersExceptNull.concat([
                  null,
                  2.3,
                  '1234.56'
                ]).forEach(function(value){
                  assert(transform(value, 23) === type.int(value, 23));
                });
              }
            },
            {
              name: 'returns default value',
              test: function(){
                assert(type.int.default(1)(DEFAULT_VALUE) === 1);
              }
            },
            {
              name: 'accepts stringified defaults',
              test: function(){
                assert(type.int.default('-123')(DEFAULT_VALUE) === -123);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                nonNumbersExceptNull.concat([null]).forEach(function(incorrectValue) {
                  var transform;
                  var warned = catchWarnings(function(){
                    transform = type.int.default(incorrectValue);
                  });

                  assert(warned);
                  assert(transform(DEFAULT_VALUE) === 0);
                });
              }
            }
          ]
        }
      ]
    }
  ]
};
