module.exports = {
  name: 'decode',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    var params = {
      obj: type.object,
      plainArray: type.array,
      numArray: type.array,
      str: type.string
    };
  },
  afterEach: function(){
    route.destroy();
  },
  test: [
    {
      name: 'simple case',
      test: function(){
        var route = router.route(':str/:obj', {
          params: params,
          decode: function(config){
            config.obj = JSON.parse(config.obj);
            config.plainArray = config.plainArray.split(',');
            config.numArray = config.numArray.split(':').map(Number);
          }
        });
        // encoded - some-str/{"a":"b"}?plainArray=a,b,c&numArray=1:2:3
        router.navigate('some-str/%7B%22a%22%3A%22b%22%7D?plainArray=a%2Cb%2Cc&numArray=1%3A2%3A3');

        assert(route.params.str.value == 'some-str');
        assert({ a: 'b' }, route.params.obj.value);
        assert(['a', 'b', 'c'], route.params.plainArray.value);
        assert([1, 2, 3], route.params.numArray.value);
      }
    },
    {
      name: 'no extra params',
      test: function(){
        var route = router.route(':str/', {
          params: params,
          decode: function(config){
            assert(!('extra' in config));
          }
        });
        router.navigate('some-str/?extra=ext');
      }
    },
    {
      name: 'not a function',
      test: function(){
        var route;
        var warned = catchWarnings(function(){
          route = router.route(':str/', {
            params: {
              str: type.string,
              query: type.string
            },
            decode: 2
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
