module.exports = {
  name: 'type.enum',
  init: function(){
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
  },
  test: [
    {
      name: 'accepts enumerated values',
      test: function(){
        var pluralEnum = type.enum(['first', 'second', 'third']);

        assert(pluralEnum('second') === 'second');
      }
    },
    {
      name: 'is first item by default',
      test: function(){
        var strangeEnum = type.enum([3, 4, 5, null]);
        assert(strangeEnum.DEFAULT_VALUE === 3);
      }
    },
    {
      name: 'ignores missing items',
      test: function(){
        var boolEnum = type.enum([true, false, 'any']);
        [
          'an',
          0,
          1,
          null
        ].forEach(function(missingValue){
          var warned = catchWarnings(function(){
            assert(boolEnum(missingValue, 'any') === 'any');
          });

          assert(warned);
        });
      }
    },
    {
      name: 'ignores previous value if can transform new value',
      test: function(){
        var boolEnum = type.enum([true, false, 'any']);
        [
          true,
          false
        ].forEach(function(correctValue){
          assert(boolEnum(correctValue, 'any') === boolEnum(correctValue));
        });
      }
    },
    {
      name: 'throws when empty array passed',
      test: function(){
        assert.exception(function(){
          type.enum([]);
        });
      }
    },
    {
      name: 'wraps non-array argument into array and warns',
      test: function(){
        var warned = catchWarnings(function(){
          var nonArray = {};
          var emptyEnum = type.enum(nonArray);

          assert(emptyEnum.DEFAULT_VALUE === nonArray);
        });

        assert(warned);
      }
    },
    {
      name: 'default',
      test: [
        {
          name: 'behaves like usual version',
          test: function(){
            var enumeration = type.enum([true, false, 'any']);
            var enumWithDefault = enumeration.default('any');

            catchWarnings(function(){
              [
                true,
                false,
                'any'
              ].forEach(function(value){
                assert(enumWithDefault(value, 'any') === enumeration(value, 'any'));
              });
            });
          }
        },
        {
          name: 'sets default value',
          test: function(){
            var enumeration = type.enum([true, false, 'any']);
            var enumWithDefault = enumeration.default('any');

            assert(enumWithDefault.DEFAULT_VALUE === 'any');
          }
        },
        {
          name: 'ignores default value if it is incorrect',
          test: function(){
            var enumeration = type.enum([true, false, 'any']);
            var enumWithIncorrectDefault;

            var warned = catchWarnings(function(){
              transform = enumeration.default({});
            });

            assert(warned);
            assert(transform.DEFAULT_VALUE === true);
          }
        }
      ]
    }
  ]
};
