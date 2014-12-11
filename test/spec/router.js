module.exports = {
  name: 'basis.router',

  init: function(){
    basis.require('basis.router');
    var router = basis.router;
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

        this.is(1, checker);

        router.stop();
        location.hash = '';
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

        this.is('test', location.hash.substr(1));
        this.is(1, checker);

        router.stop();
        location.hash = '';
      }
    },
    {
      name: 'callbacks',
      test: function(){
        var checker = 0;

        location.hash = '';
        router.add('callback', function(){
          checker++;
        });
        router.add('callback2', function(){
          checker++;
        });
        this.is(0, checker);

        router.navigate('callback');
        this.is(0, checker);

        router.start();
        this.is(1, checker);

        router.add('callback', function(){
          checker++;
        });
        this.is(2, checker);

        checker = 0;
        router.navigate('callback2');
        this.is(1, checker);

        router.stop();
        location.hash = '';
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
        this.is(5, checker);

        router.add('path/*path', function(path){
          checker = path;
        });
        router.navigate('path/some/stuff');
        this.is('some/stuff', checker);

        router.stop();
        location.hash = '';
      }
    },
    {
      name: 'checkHtml5Url',
      test: function(){
        var checker = 0;

        router.start({html5history: true});

        router.add('test', function(){
          checker++;
        });
        router.navigate('test');
        router.checkUrl();

        this.is(1, checker);

        router.stop();
        history.back();
      }
    },
    {
      name: 'navigateHtml5',
      test: function(){
        var checker = 0;

        router.start({html5history: true});

        router.add('test', function(){
          checker++;
        });
        router.navigate('test');

        this.is('test', router.getPath());
        this.is(1, checker);

        router.stop();
        history.back();
      }
    },
    {
      name: 'callbacksHtml5',
      test: function(){
        var checker = 0;

        router.add('callback', function(){
          checker++;
        });
        router.add('callback2', function(){
          checker++;
        });
        this.is(0, checker);

        router.navigate('callback');
        this.is(0, checker);

        router.start({html5history: true});
        this.is(1, checker);

        router.add('callback', function(){
          checker++;
        });
        this.is(2, checker);

        checker = 0;
        router.navigate('callback2');
        this.is(1, checker);

        router.stop();
        history.go(-2);
      }
    },
    {
      name: 'paramsHtml5',
      test: function(){
        var checker;

        router.start({html5history: true});

        router.add('param/:id', function(id){
          checker = Number(id);
        });
        router.navigate('param/5');
        this.is(5, checker);

        router.add('path/*path', function(path){
          checker = path;
        });
        router.navigate('path/some/stuff');
        this.is('some/stuff', checker);

        router.stop();
        history.go(-2);
      }
    }
  ]
};
