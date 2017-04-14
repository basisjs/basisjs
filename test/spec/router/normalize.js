module.exports = {
  name: 'normalize',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
  },
  test: [
    {
      name: 'delta',
      test: [
        {
          name: 'setting url',
          test: function(){
            var lastDelta;
            var lastParams;
            var route = router.route('a/', {
              params: {
                str: type.string,
                num: type.number,
                numWithDefault: type.number.default(42)
              },
              normalize: function(params, delta){
                lastParams = params;
                lastDelta = delta;
              }
            });

            router.navigate('a/?str=4');

            router.navigate('a/?str=5&num=6');

            assert({ str: '5', num: 6, numWithDefault: 42 }, lastParams);
            assert({ str: '4', num: 0 }, lastDelta);

            route.destroy();
          }
        },
        {
          name: 'setting params',
          test: function(){
            var lastDelta;
            var route = router.route('b/', {
              params: {
                str: type.string,
                num: type.number,
                numWithDefault: type.number.default(42)
              },
              normalize: function(params, delta){
                lastDelta = delta;
              }
            });

            router.navigate('b/');

            route.params.num.set(1);
            route.params.numWithDefault.set(2);

            assert.async(function(){
              assert({ num: 0, numWithDefault: 42 }, lastDelta);

              route.destroy();
            });
          }
        },
        {
          name: 'setting params then url',
          test: function(){
            var lastDelta;
            var route = router.route('c/', {
              params: {
                str: type.string,
                num: type.number,
                numWithDefault: type.number.default(42)
              },
              normalize: function(params, delta){
                lastDelta = delta;
              }
            });

            router.navigate('c/');

            route.params.num.set(1);
            route.params.numWithDefault.set(2);

            router.navigate('c/?str=5&num=6');

            assert.async(function(){
              assert({ str: '', num: 0 }, lastDelta);

              route.destroy();
            });
          }
        }
      ]
    },
    {
      name: 'fill',
      test: [
        {
          name: 'sets params',
          test: function(){
            var route = router.route('d/', {
              params: {
                str: type.string,
                num: type.number,
                numWithDefault: type.number.default(42)
              },
              normalize: function(params, delta){
                params.num = 25;
              }
            });

            router.navigate('d/');

            assert(route.params.num.value === 25);

            assert(route.value.num === 25);

            route.destroy();
          }
        },
        {
          name: 'fill missing with defaults',
          test: function(){
            var route = router.route('e/', {
              params: {
                str: type.string,
                num: type.number,
                numWithDefault: type.number.default(42)
              },
              normalize: function(params, delta){
                delete params.numWithDefault;
              }
            });

            router.navigate('e/?str=foo&num=1&numWithDefault=2');

            assert(route.params.str.value === 'foo');
            assert(route.params.num.value === 1);
            assert(route.params.numWithDefault.value === 42);

            assert(route.value.str === 'foo');
            assert(route.value.num === 1);
            assert(route.value.numWithDefault === 42);

            route.destroy();
          }
        },
        {
          name: 'handle transform with previous value',
          test: function(){
            var route = router.route('f/', {
              params: {
                str: type.string,
                num: type.number
              },
              normalize: function(params, delta){
                if (params.num) {
                  params.str = true;
                }
              }
            });

            catchWarnings(function(){
              router.navigate('f/?str=prev');
              router.navigate('f/?str=next&num=1');
            });

            assert(route.params.str.value === 'prev');

            assert(route.value.str === 'prev');

            route.destroy();
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
                normalize: 2
              });
            });

            assert(warned);

            router.navigate('foo/?query=abc');

            assert(route.params.str.value === 'foo');
            assert(route.params.query.value === 'abc');
          }
        }
      ]
    }
  ]
};
