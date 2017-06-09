module.exports = {
  name: 'decode',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
  },
  afterEach: function(){
    route.destroy();
  },
  test: [
    {
      name: 'decodes param which has deserialize property',
      test: function(){
        var customNumber = function(value){
          return Number(value);
        };
        customNumber.deserialize = function(value){
          switch (value) {
            case 'one':
              return '1';
            case 'two':
              return '2';
            default:
              return '0';
          }
        };

        var route = router.route(':str/:prop', {
          params: {
            str: type.string,
            prop: customNumber
          }
        });

        router.navigate('str/one');

        assert(route.params.str.value == 'str');
        assert(route.params.prop.value == 1);
      }
    },
    {
      name: 'decodes objects, arrays and dates',
      test: function(){
        var params = {
          obj: type.object,
          plainArray: type.array,
          numArray: type.array,
          str: type.string
        };

        var route = router.route(':str/:obj', {
          params: params
        });
        // encoded - some-str/{"a":"b"}?plainArray=["a","b","c"]&numArray=[1,2,3]
        router.navigate('some-str/%7B%22a%22%3A%22b%22%7D?plainArray=%5B%22a%22%2C%22b%22%2C%22c%22%5D&numArray=%5B1%2C2%2C3%5D');

        assert(route.params.str.value == 'some-str');
        assert({ a: 'b' }, route.params.obj.value);
        assert(['a', 'b', 'c'], route.params.plainArray.value);
        assert([1, 2, 3], route.params.numArray.value);
      }
    },
    {
      name: 'deserialize is not a function',
      test: function(){
        function customString(v) {
          return String(v);
        }
        customString.deserialize = 2;

        var route;
        var warned = catchWarnings(function(){
          route = router.route(':str/', {
            params: {
              str: type.string,
              query: customString
            }
          });
        });

        assert(warned);

        router.navigate('foo/?query=abc');

        assert(route.params.str.value === 'foo');
        assert(route.params.query.value === 'abc');
      }
    }
  ]
};
