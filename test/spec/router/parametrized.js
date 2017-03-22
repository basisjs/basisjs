module.exports = {
  name: 'parametrized route',
  sandbox: true,
  test: [
    {
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');
      },
      name: 'cases of routes reusage/creation',
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
      name: 'default values when not matched',
      test: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var route = router.route('a/', {
          params: {
            num: type.number.default(42)
          }
        });

        router.navigate('b/');

        assert(route.matched.value === false);
        assert(route.params.num.value === 42);

        router.navigate('a/?num=5');

        assert(route.matched.value === true);
        assert(route.params.num.value === 5);

        router.navigate('c/');

        assert(route.matched.value === false);
        assert(route.params.num.value === 42);
      }
    },
    {
      name: 'warns when transform is not a function',
      test: function(){
        var router = basis.require('basis.router');
        var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

        var warned = catchWarnings(function(){
          var route = router.route('a/', {
            params: {
              nonFn: true
            }
          });

          router.navigate('a/?nonFn=str');

          assert(route.params.nonFn.value === 'str');
        });

        assert(warned);
      }
    },
    require('./destroy.js'),
    require('./transform.js'),
    require('./decode.js'),
    require('./paramSet.js'),
    require('./paramsChanged.js'),
    require('./parse.js'),
    require('./getPath.js'),
    require('./ast.js')
  ]
};
