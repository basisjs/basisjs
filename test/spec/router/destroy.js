module.exports = {
  name: 'destroy',
  test: [
    {
      name: 'basic case',
      test: function(){
        var router = basis.require('basis.router');
        var route = router.route('offers/', {
          params: {}
        });

        var match = 0;
        route.add(function(){
          match++;
        });

        router.navigate('offers/');

        route.destroy();

        router.navigate('offers/?q=2');

        assert(match === 1);
      }
    },
    {
      name: 'setting params before destroy',
      test: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');
        var route = router.route('a/', {
          params: {
            p: type.string
          }
        });

        router.navigate('a/');

        route.params.p.set('str');

        route.destroy();

        var thrown = false;

        try {
          basis.asap.process();
        } catch(e) {
          thrown = true;
        }

        assert(thrown === false);
      }
    }
  ]
};
