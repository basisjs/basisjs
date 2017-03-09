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
    {
      name: 'setting reactive param',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');
      },
      afterEach: function(){
        route.remove();
      },
      test: [
        {
          name: 'simple case',
          test: function(){
            var route = router.route('page(/:str)', {
              params: {
                str: type.string
              }
            });

            router.navigate('page');

            route.params.str.set('some other');

            assert.async(function(){
              assert(location.hash === '#page/some%20other');
            });
          }
        },
        {
          name: 'setting already modified route',
          test: function(){
            var route = router.route(':first(/:second)(/:third)', {
              params: {
                first: type.string,
                second: type.string,
                third: type.string
              }
            });

            router.navigate('foo/bar/baz');

            route.params.first.set('spam');

            assert.async(function(){
              assert(location.hash === '#spam/bar/baz');
            });
          }
        },
        {
          name: 'it should fire only one location change on multiple params update',
          test: function(){
            var route = router.route(':first(/:second)(/:third)', {
              params: {
                first: type.string,
                second: type.string,
                third: type.string
              }
            });

            router.navigate('foo/bar/baz');

            var counter = 0;
            var handler = function(first, second, third){
              counter++;
            };
            route.add(handler);

            assert.async(function(){
              assert(counter === 1);

              route.params.first.set('first');
              route.params.second.set('second');
              route.params.third.set('third');

              assert.async(function(){
                assert(location.hash === '#first/second/third');

                route.remove(handler);
              });
            });
          }
        },
        {
          name: 'transforms params passing previous value',
          test: function(){
            var route = router.route('page/:str', {
              params: {
                str: type.string
              }
            });

            router.navigate('page/some');

            route.params.str.set(true);

            assert(route.params.str.value === 'some');
            assert(location.hash === '#page/some');
          }
        }
      ]
    },
    {
      name: 'paramsChanged event',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');
      },
      test: [
        {
          name: 'simple case',
          test: function(done){
            var lastDelta;
            var route = router.route('offers/', {
              params: {
                page: type.int.default(1),
                query: type.string
              }
            });

            var CONTEXT = {};
            var HANDLER = {
              paramsChanged: function(delta){
                assert(this === CONTEXT);
                lastDelta = delta;
              }
            };
            route.add(HANDLER, CONTEXT);

            router.navigate('offers/?page=4');

            route.params.query.set('some');

            assert.async(function(){
              assert({ query: '' }, lastDelta);

              route.remove(HANDLER);

              done();
            });
          }
        },
        {
          name: 'should be called with delta',
          test: function(done){
            var lastDelta;
            var route = router.route('offers/', {
              params: {
                first: type.number,
                second: type.number,
                third: type.number
              }
            });

            var HANDLER = {
              paramsChanged: function(delta){
                lastDelta = delta;
              }
            };
            route.add(HANDLER);

            router.navigate('offers/?first=1&second=2');

            route.params.first.set(10);
            route.params.third.set(24);
            route.params.second.set(5);
            route.params.second.set(2);

            assert.async(function(){
              assert({ first: 1, third: 0 }, lastDelta);

              route.params.first.set(1);

              assert.async(function(){
                assert({ first: 10 }, lastDelta);

                route.remove(HANDLER);

                done();
              });
            });
          }
        },
        {
          name: 'should not be called if was not changed really',
          test: function(done){
            var called = false;
            var route = router.route('offers/', {
              params: {
                par: type.number
              }
            });

            var HANDLER = {
              paramsChanged: function(delta){
                called = true;
              }
            };
            route.add(HANDLER);

            router.navigate('offers/');

            route.params.par.set(1);
            route.params.par.set(0);

            assert.async(function(){
              assert(called === false);

              route.remove(HANDLER);

              done();
            });
          }
        }
      ]
    },
    require('./parse.js'),
    require('./getPath.js'),
    require('./ast.js')
  ]
};
