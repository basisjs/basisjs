module.exports = {
  name: 'setting reactive param',
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

        route.params.str.set('some other');

        assert.async(function(){
          assert(location.hash === '#page/some%20other');

          route.destroy();
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

          route.destroy();
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

            route.destroy();
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

        catchWarnings(function(){
          route.params.str.set(true);
        });

        assert(route.params.str.value === 'some');
        assert(location.hash === '#page/some');

        route.destroy();
      }
    }
  ]
};
