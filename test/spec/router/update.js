module.exports = {
  name: 'update',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
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

        route.update({
          str: 'someother'
        });

        assert(location.hash === '#page/someother');

        route.destroy();
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


        var counter = 0;
        var handler = function(first, second, third){
          counter++;
        };
        route.add(handler);

        router.navigate('foo/bar/baz');

        assert(counter === 1);

        route.update({
          first: 'first',
          second: 'second',
          third: 'third'
        });

        assert(location.hash === '#first/second/third');

        route.destroy();
      }
    },
    {
      name: 'update when not matched - warning and ignore',
      test: function(){
        var route = router.route('page/:str', {
          params: {
            str: type.string
          }
        });

        router.navigate('something-different');

        assert(route.params.str.value === '');

        var warned = catchWarnings(function(){
          route.update({
            str: 'str'
          });
        });

        assert(warned);
        assert(route.params.str.value === '');
        assert(location.hash === '#something-different');

        route.destroy();
      }
    },
    {
      name: 'passing key not presented in params config - warning',
      test: function(){
        var route = router.route('base/:str', {
          params: {
            str: type.string
          }
        });

        router.navigate('base/a');

        var warned = catchWarnings(function(){
          route.update({
            str: 'b',
            missing: 'c'
          });
        });

        assert(warned);
        assert(route.params.str.value === 'b');
        assert(location.hash === '#base/b');

        route.destroy();
      }
    },
    {
      name: 'update on going route away',
      test: function(){
        var route = router.route('num/:num', {
          params: {
            num: type.number.nullable,
            str: type.string.nullable
          }
        });

        router.navigate('num/42');

        route.params.num.link(null, function(num){
          if (!num) {
            route.update({
              num: 2,
              str: '4'
            });
          }
        });

        catchWarnings(function(){
          router.navigate('different-route/');
        });

        assert.async(function(){
          assert(location.hash === '#different-route/');
        });
      }
    }
  ]
};
