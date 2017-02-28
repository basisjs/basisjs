module.exports = {
  name: 'new router',
  sandbox: true,
  test: [
    {
      name: 'parse',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var params = {
          bar: type.string.nullable,
          baz: type.string.nullable,
          spam: type.string.nullable,
          end: type.string.nullable,
          stuff: type.string.nullable,
          json: type.string.nullable,
          end: type.string.nullable,
          'baz[3]': type.string.nullable,
          'basis js': type.string.nullable
        };
        var route = router.route('foo/:bar/:baz(/:spam)(/:end)(/)', {
          params: params
        });
      },
      test: [
        {
          name: 'without optional args',
          test: function(){
            router.navigate('foo/1/2');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === null);
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'parsing encoded values',
          test: function(){
            router.navigate('foo/1%20and%202/basis%20js');
            assert(route.matched.value);
            assert(route.params.bar.value === '1 and 2');
            assert(route.params.baz.value === 'basis js');
            assert(route.params.spam.value === null);
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'one optional value',
          test: function(){
            router.navigate('foo/1/2/3');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'all optional values',
          test: function(){
            router.navigate('foo/1/2/3/4');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === '4');
          }
        },
        {
          name: 'query values',
          test: function(){
            router.navigate('foo/1/2/3/4?basis%20js=%7B%7D');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === '4');
            assert(route.params['basis js'].value === '{}');
          }
        },
        {
          name: 'optional param defined by query value',
          test: function(){
            router.navigate('foo/1/2?spam=3&stuff=4');
            assert(route.matched.value);
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
            assert(route.params.stuff.value === '4');
          }
        },
        {
          name: 'optional param defined by query value',
          test: function(){
            router.navigate('foo/1/2?spam=3&stuff=4');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
            assert(route.params.stuff.value === '4');
          }
        },
        {
          name: 'optional param defined by usual and via query value',
          test: function(){
            router.navigate('foo/1/2/3?spam=4');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'required param defined via query value',
          test: function(){
            router.navigate('foo/1/2?bar=3');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
          }
        },
        {
          name: 'query params with brackets',
          test: function(){
            router.navigate('foo/1/2?baz[3]=5');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params['baz[3]'].value === '5');
          }
        },
        {
          name: 'nontrivial symbols in values',
          test: function(){
            router.navigate('foo/1/2?json={a:4}');
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.json.value === '{a:4}');
          }
        },
        {
          name: 'query params: corner cases',
          test: function(){
            router.navigate('foo/1/2?stuff&spam=3&end=');
            assert(route.matched.value);
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === '');
          }
        },
        {
          name: 'parsing on start',
          test: function(){
            location.hash = 'foo/one?baz=two';

            router.checkUrl();

            var simpleRoute = router.route('foo/:bar', {
              params: {
                bar: type.string.nullable,
                baz: type.string.nullable
              }
            });

            assert(simpleRoute.params.bar.value === 'one');
            assert(simpleRoute.params.baz.value === 'two');
          }
        }
      ]
    },
    {
      name: 'transform params to highlevel types',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var params = {
          custom: function(newValue, prevValue){
            if (newValue === 'secret') {
              return 'correct';
            }
 else {
              return 'incorrect';
            }
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
            var route = router.route(':str/:obj', {
              params: params,
              decode: function(config){
                assert(!('extra' in config));
              }
            });
            router.navigate('some-str/stuff?extra=ext');
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
    require('./getPath.js'),
    require('./ast.js')
  ]
};
