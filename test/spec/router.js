module.exports = {
  name: 'basis.router',

  init: function(){
    function getRouter(){
      return basis.createSandbox().require('basis.router');
    }
  },

  test: [
    {
      name: 'checkUrl',
      test: function(){
        var router = getRouter();
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

        router.stop();
        location.hash = '';
      }
    },
    {
      name: 'navigate',
      test: function(){
        var router = getRouter();
        var checker = 0;

        router.start();
        router.add('test', function(){
          checker++;
        });
        router.navigate('test');

        assert(location.hash.substr(1) === 'test');
        assert(checker === 1);

        router.stop();
        location.hash = '';
      }
    },
    {
      name: 'callbacks',
      test: function(){
        var router = getRouter();
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

        router.stop();
        location.hash = '';
      }
    },
    {
      name: 'params',
      test: function(){
        var router = getRouter();
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

        router.stop();
        location.hash = '';
      }
    }
  ]
};
