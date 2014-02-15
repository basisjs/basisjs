module.exports = {
  name: 'basis.patch',
  init: function(){

  },

  test: [
    {
      name: 'should not define a resource',
      test: function(){
        this.is(false, basis.resource.exists('./foo.js'));
        basis.patch('./foo.js', function(){});
        this.is(false, basis.resource.exists('./foo.js'));
      }
    },
    {
      name: 'should not define a namespace',
      test: function(){
        this.is(undefined, basis.date);
        basis.patch('basis.date', function(){});
        this.is(undefined, basis.date);
      }
    },
    {
      name: 'patch loaded namespace',
      test: function(){
        var VALUE = {};

        basis.require('basis.event');
        this.is(true, basis.event.test1 === undefined);

        basis.patch('basis.event', function(){
          basis.event.test1 = VALUE;
        });

        this.is(true, basis.event.test1 === VALUE);

        basis.patch('basis.event', function(){
          basis.event.test2 = VALUE;
        });

        this.is(true, basis.event.test2 === VALUE);
      }
    },
    {
      name: 'patch non-loaded namespace',
      test: function(){
        var VALUE = {};

        this.is(true, basis.data === undefined);

        basis.patch('basis.data', function(){
          basis.data.test1 = VALUE;
        });

        basis.patch('basis.data', function(){
          basis.data.test2 = VALUE;
        });

        basis.require('basis.data');
        this.is(true, basis.data !== undefined);
        this.is(true, basis.data.test1 === VALUE);
        this.is(true, basis.data.test2 === VALUE);
      }
    },
    {
      name: 'patch loaded resource',
      test: function(){
        var VALUE = {};
        var json = basis.require('./fixture/foo.json');

        this.is(true, json.id === 'foo');
        this.is(true, json.test1 === undefined);

        basis.patch('./fixture/foo.json', function(resourceJSON){
          resourceJSON.test1 = VALUE;
        });

        this.is(true, basis.require('./fixture/foo.json') === json);
        this.is(true, json.id === 'foo');
        this.is(true, json.test1 === VALUE);

        basis.patch('./fixture/foo.json', function(resourceJSON){
          resourceJSON.test2 = VALUE;
        });

        this.is(true, basis.require('./fixture/foo.json') === json);
        this.is(true, json.id === 'foo');
        this.is(true, json.test1 === VALUE);
        this.is(true, json.test2 === VALUE);
      }
    },
    {
      name: 'patch non-loaded resource',
      test: function(){
        var VALUE = {};

        this.is(false, basis.resource.exists('./fixture/bar.json'));

        basis.patch('./fixture/bar.json', function(resourceJSON){
          resourceJSON.test1 = VALUE;
        });
        basis.patch('./fixture/bar.json', function(resourceJSON){
          resourceJSON.test2 = VALUE;
        });

        var json = basis.require('./fixture/bar.json');
        this.is(true, json.test1 === VALUE);
        this.is(true, json.test2 === VALUE);
      }
    }
  ]
};
