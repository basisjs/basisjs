module.exports = {
  name: 'basis.router',

  beforeEach: function(){
    var router = basis.createSandbox().require('basis.router');
  },
  afterEach: function(){
    router.stop();
    location.hash = '';
  },

  test: [
    {
      name: 'checkUrl',
      test: function(){
        var checker = 0;

        router.add('test', function(){
          checker++;
        });
        location.hash = 'test';
        router.checkUrl();

        assert(checker === 1);

        router.add('test', function(){
          checker++;
        });
        assert(checker === 1);

        router.checkUrl();
        assert(checker === 2);
      }
    },
    {
      name: 'navigate',
      test: function(){
        var checker = 0;

        router.add('test', function(){
          checker++;
        });
        router.navigate('test');

        assert(location.hash.substr(1) === 'test');
        assert(checker === 1);
      }
    },
    {
      name: 'callbacks',
      test: function(){
        router.stop();  // router starts by default
        var checker = 0;
        var log = [];

        router.add('foo', function(){
          log.push('foo');
        });
        router.add('bar', function(){
          log.push('bar');
        });
        assert([], log);

        router.navigate('foo');
        assert([], log);

        router.start();
        assert(['foo'], log);

        router.add('foo', function(){
          log.push('foo2');
        });
        assert(['foo'], log);

        router.checkUrl();
        assert(['foo', 'foo2'], log);

        router.navigate('bar');
        assert(['foo', 'foo2', 'bar'], log);
      }
    },
    {
      name: 'params',
      test: function(){
        var checker;

        router.add('param/:id', function(id){
          checker = Number(id);
        });
        router.navigate('param/5');
        assert(checker === 5);

        router.add('path/*path', function(path){
          checker = path;
        });
        router.navigate('path/some/stuff');
        assert(checker === 'some/stuff');
      }
    },
    {
      name: 'route',
      test: [
        {
          name: 'should be the same token for one path',
          test: function(){
            assert(router.route('foo') === router.route('foo'));
            assert(router.route(/foo/) === router.route(/foo/));
          }
        },
        {
          name: 'router.route(route) should route itself',
          test: function(){
            var route = router.route('foo');
            assert(router.route(route) === route);
          }
        },
        {
          name: 'should match the same values when router.add() invoke for route and route.path',
          test: function(){
            var matches = 0;
            var paramName = basis.genUID();
            var paramValue = basis.genUID();
            var route = router.route(':' + paramName);
            router.navigate(paramValue);

            router.add(route, function(param){
              matches++;
              assert(param === paramValue);
            });

            router.add(route.path, function(param){
              matches++;
              assert(param === paramValue);
            });

            assert(matches === 0);

            router.checkUrl();
            assert(matches === 2);
          }
        },
        {
          name: 'callback added via router.add() should invoke async or asap',
          test: function(done){
            function checkDone(){
              if (matches === 2)
                done();

              assert(matches === 1 || matches === 2);
            }

            var matches = 0;
            var paramName = basis.genUID();
            var paramValue = basis.genUID();

            router.navigate(paramValue);

            var route = router.route(':' + paramName).add(function(){
              assert(route.matched.value);
              matches++;
              checkDone();
            });

            router.add(route, function(){
              assert(route.matched.value);
              matches++;
              checkDone();
            });

            assert(matches === 0);
            assert(route.matched.value === true);
          }
        },
        {
          name: 'when handler removes leave callback should be invoked if route matched',
          test: function(){
            var matches = 0;

            router.navigate('123');

            var matchHandler = {
              leave: function(){
                matches++;
              }
            };

            var nonmatchHandler = {
              leave: function(){
                matches++;
              }
            };

            router.add('1:foo', matchHandler);
            router.add('2:foo', nonmatchHandler);

            assert(matches === 0);

            router.checkUrl();
            assert(matches === 0);

            router.navigate('222');
            assert(matches === 1);

            router.remove('1:foo', matchHandler);
            router.remove('2:foo', nonmatchHandler);

            assert(matches === 2);
          }
        }
      ]
    }
  ]
};
