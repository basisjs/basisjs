module.exports = {
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
      name: 'should not be called if was not changed actually',
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
};
