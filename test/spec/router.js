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

        router.start();
        router.add('test', function(){
          checker++;
        });
        location.hash = 'test';
        router.checkUrl();

        assert(checker === 1);

        router.add('test', function(){
          checker++;
        });

        assert(checker === 2);
      }
    },
    {
      name: 'navigate',
      test: function(){
        var checker = 0;

        router.start();
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
        assert(['foo', 'foo2'], log);

        router.navigate('bar');
        assert(['foo', 'foo2', 'bar'], log);
      }
    },
    {
      name: 'params',
      test: function(){
        var checker;

        router.start();

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
    }
  ]
};
