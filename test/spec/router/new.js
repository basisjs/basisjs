module.exports = {
  name: 'new router',
  sandbox: true,
  test: [
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
    require('./transform.js'),
    require('./decode.js'),
    require('./paramSet.js'),
    require('./paramsChanged.js'),
    require('./parse.js'),
    require('./getPath.js'),
    require('./ast.js')
  ]
};
