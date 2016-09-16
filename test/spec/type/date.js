module.exports = {
  name: 'type.date',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonDatesExceptNull = [
      '',
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
      name: 'accepts native dates',
      test: function(){
        var date = new Date();
        assert(type.date(date) === date);
      }
    },
    {
      name: 'accepts timestamps',
      test: function(){
        var timestamp = -777870000000;
        assert(type.date(timestamp).getTime() === timestamp);
      }
    },
    {
      name: 'accepts ISO strings',
      test: function(){
        var iso = '2012-05-30T21:00:00.000Z';
        assert(type.date(iso).toISOString() === iso);
      }
    },
    {
      name: 'accepts partial ISO string',
      test: function(){
        var partialIso = '2012-05-30';
        var date = type.date(partialIso);
        var actualIsoPart = date.toISOString().substr(0, 10);

        assert(actualIsoPart === partialIso);
      }
    },
    {
      name: 'warns about non ISO strings but try to parse',
      test: function(){
        [
          '123,45',
          'hello',
          '2012-05-30T21:00:00.000Z hello',
          'hi 2012-05-30T21:00:00.000Z'
        ].forEach(function(nonIsoString){
          var warned = catchWarnings(function(){
            assert(type.date(nonIsoString) instanceof Date);
          });

          assert(warned);
        });
      }
    },
    {
      name: 'do not warns about ISO strings',
      test: function(){
        [
          '2016-10-05T10:56:09+03:00',
          '2016-09-12T13:10:27Z',
          '2016-09-02 15:18:26.709375+03',
          '2016-03-01 18:42:33+03',
          '2016-03-01 18:42:33+03:00',
          '2016-03-01 18:42:33'
        ].forEach(function(isoString){
          var warned = catchWarnings(function(){
            type.date(isoString);
          });

          assert(!warned);
        });
      }
    },
    {
      name: 'is zero date by default',
      test: function(){
        assert(new Date(0), type.date.DEFAULT_VALUE);
      }
    },
    {
      name: 'ignores incorrect values',
      test: function(){
        var previous = new Date();

        nonDatesExceptNull.concat([null]).forEach(function(incorrectValue){
          var warned = catchWarnings(function(){
            assert(type.date(incorrectValue, previous) === previous);
          });

          assert(warned);
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        var previous = new Date();

        [
          new Date(),
          '2012-12-21',
          234
        ].forEach(function(correctValue){
          assert(type.date(correctValue, previous), type.date(correctValue));
        });
      }
    },
    {
      name: 'returns previous value if result is the same',
      test: function(){
        var date = new Date();
        // Old versions of Firefox during copying date via `new Date(date)`
        // sets milliseconds to 0 and therefore test fails
        date.setMilliseconds(0);

        [
          date.toISOString(),
          new Date(date),
          date.getTime()
        ].forEach(function(dateRepresentation){
          assert(type.date(dateRepresentation, date) === date);
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
              1234,
              '2012-05-30T21:00:00.000Z',
              '2012-12-21',
              new Date()
            ].forEach(function(correctValue){
              assert(type.date.nullable(correctValue, new Date()), type.date(correctValue));
            });
          }
        },
        {
          name: 'accepts null',
          test: function(){
            assert(type.date.nullable(null, new Date()) === null);
          }
        },
        {
          name: 'is null by default',
          test: function(){
            assert(type.date.nullable.DEFAULT_VALUE === null);
          }
        },
        {
          name: 'ignores incorrect values',
          test: function(){
            var previous = new Date();

            nonDatesExceptNull.forEach(function(incorrectValue){
              var warned = catchWarnings(function(){
                assert(type.date.nullable(incorrectValue, previous) === previous);
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
                var defaultDate = new Date(123);
                var previousDate = new Date(456);

                var transform = type.date.nullable.default(defaultDate);

                catchWarnings(function(){
                  nonDatesExceptNull.concat([
                    null,
                    1234,
                    '2012-05-30T21:00:00.000Z',
                    '2012-12-21',
                    '1234.5',
                    'whatever',
                    new Date()
                  ]).forEach(function(value){
                    assert(transform(value, previousDate), type.date.nullable(value, previousDate));
                  });
                });
              }
            },
            {
              name: 'sets default value',
              test: function(){
                var date = new Date();
                assert(type.date.nullable.default(date).DEFAULT_VALUE === date);
              }
            },
            {
              name: 'accepts timestamps defaults',
              test: function(){
                var timestamp = -777870000000;
                assert(type.date.nullable.default(timestamp).DEFAULT_VALUE.getTime() === timestamp);
              }
            },
            {
              name: 'accepts ISO strings defaults',
              test: function(){
                var iso = '2012-05-30T21:00:00.000Z';
                assert(type.date.nullable.default(iso).DEFAULT_VALUE.toISOString() === iso);
              }
            },
            {
              name: 'ignores default value if it is incorrect',
              test: function(){
                var transform;
                var warned = catchWarnings(function(){
                  transform = type.date.nullable.default({});
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
            var defDate = new Date(Math.random());
            var transform = type.date.default(defDate);
            var fallback = new Date();

            catchWarnings(function(){
              nonDatesExceptNull.concat([
                null,
                234,
                '2016-08-22T16:27:09.630Z',
                new Date()
              ]).forEach(function(value){
                assert(transform(value, fallback), type.date(value, fallback));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            var date = new Date();
            assert(type.date.default(date).DEFAULT_VALUE === date);
          }
        },
        {
          name: 'returns previous value if result is the same',
          test: function(){
            var transform = type.date.default(new Date(1, 1, 1));

            var date = new Date();
            // Old versions of Firefox during copying date via `new Date(date)`
            // sets milliseconds to 0 and therefore test fails
            date.setMilliseconds(0);
            [
              date.toISOString(),
              new Date(date),
              date.getTime()
            ].forEach(function(dateRepresentation){
              assert(transform(dateRepresentation, date) === date);
            });
          }
        },
        {
          name: 'accepts timestamps defaults',
          test: function(){
            var timestamp = -777870000000;
            assert(type.date.default(timestamp).DEFAULT_VALUE.getTime() === timestamp);
          }
        },
        {
          name: 'accepts ISO strings defaults',
          test: function(){
            var iso = '2012-05-30T21:00:00.000Z';
            assert(type.date.default(iso).DEFAULT_VALUE.toISOString() === iso);
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            var defaultDate = new Date(0);

            nonDatesExceptNull.forEach(function(incorrectValue){
              var transform;
              var warned = catchWarnings(function(){
                transform = type.date.default(incorrectValue);
              });

              assert(warned);
              assert(defaultDate, transform.DEFAULT_VALUE);
            });
          }
        }
      ]
    }
  ]
};
