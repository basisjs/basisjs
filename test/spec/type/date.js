module.exports = {
  name: 'type.date',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var nonDatesExceptNull = [
      '123,45',
      'hello',
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
      name: 'accepts null',
      test: function(){
        assert(type.date(null) === null);
      }
    },
    {
      name: 'is null by default',
      test: function(){
        assert(type.date.DEFAULT_VALUE === null);
      }
    },
    {
      name: 'ignores incorrect values',
      test: function(){
        var previous = new Date();

        nonDatesExceptNull.forEach(function(incorrectValue){
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
          null,
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
            nonDatesExceptNull.forEach(function(incorrectValue){
              var transform;
              var warned = catchWarnings(function(){
                transform = type.date.default(incorrectValue);
              });

              assert(warned);
              assert(transform.DEFAULT_VALUE === null);
            });
          }
        }
      ]
    }
  ]
};
