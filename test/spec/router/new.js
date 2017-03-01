module.exports = {
  name: 'new router',
  sandbox: true,
  test: [
    {
      name: 'transform params to highlevel types',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var params = {
          custom: function(newValue, prevValue){
            if (newValue === 'secret')
              return 'correct';
            else
              return 'incorrect';
          },
          optional: function(value){
            return value || 42;
          },
          str: type.string,
          number: type.number.default(1)
        };
        var route = router.route(':custom/:str(/:number)(/)', {
          params: params
        });
      },
      test: [
        {
          name: 'simple case',
          test: function(){
            router.navigate('secret/some-str/52?optional=opt');

            assert(route.params.custom.value === 'correct');
            assert(route.params.str.value === 'some-str');
            assert(route.params.number.value === 52);
            assert(route.params.optional.value === 'opt');
          }
        },
        {
          name: 'default value',
          test: function(){
            router.navigate('secret/some-str');

            assert(route.params.number.value === 1);
            assert(route.params.optional.value === 42);
          }
        }
      ]
    },
    {
      name: 'decode',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var params = {
          obj: type.object,
          plainArray: type.array,
          numArray: type.array,
          str: type.string
        };
      },
      beforeEach: function(){
        router.navigate('');
      },
      afterEach: function(){
        route.remove();
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
        }
      ]
    },
    {
      name: 'cases of routes reusage/creation',
      beforeEach: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');
      },
      test: [
        {
          name: 'parametrized route with the same path creates different object',
          test: function(){
            var route = router.route('some/path', {
              params: {
                str: type.string
              }
            });
            var differentRoute = router.route('some/path', {
              params: {
                num: type.number
              }
            });

            assert(route !== differentRoute);

            route.destroy();
            differentRoute.destroy();
          }
        },
        {
          name: 'creating plain route after parametrized route with the same path creates different object',
          test: function(){
            var router = basis.require('basis.router');
            var type = basis.require('basis.type');

            var route = router.route('another/path', {
              params: {
                str: type.string
              }
            });
            var differentRoute = router.route('another/path');

            assert(route !== differentRoute);
          }
        }
      ]
    },
    require('./parse.js'),
    require('./getPath.js'),
    require('./ast.js')
  ]
};
