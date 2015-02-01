module.exports = {
  name: 'basis.patch',

  sandbox: true,
  init: function(){
    basis = basis.createSandbox();
  },

  test: [
    {
      name: 'should not define a resource',
      test: function(){
        assert(basis.resource.exists('./foo.js') === false);
        basis.patch('./foo.js', function(){});
        assert(basis.resource.exists('./foo.js') === false);
      }
    },
    {
      name: 'should not define a namespace',
      test: function(){
        assert(basis.date === undefined);
        basis.patch('basis.date', function(){});
        assert(basis.date === undefined);
      }
    },
    {
      name: 'patch loaded namespace',
      test: function(){
        var VALUE = {};
        var basisEvent = basis.require('basis.event');

        assert(basisEvent.test1 === undefined);

        basis.patch('basis.event', function(exports){
          exports.test1 = VALUE;
        });

        assert(basisEvent.test1 === VALUE);

        basis.patch('basis.event', function(exports){
          exports.test2 = VALUE;
        });

        assert(basisEvent.test2 === VALUE);
      }
    },
    {
      name: 'patch non-loaded namespace',
      test: function(){
        var VALUE = {};

        assert('data' in basis === false);

        basis.patch('basis.data', function(exports){
          exports.test1 = VALUE;
        });

        basis.patch('basis.data', function(exports){
          exports.test2 = VALUE;
        });

        var basisData = basis.require('basis.data');
        assert(basisData !== undefined);
        assert(basisData.test1 === VALUE);
        assert(basisData.test2 === VALUE);
      }
    },
    {
      name: 'patch loaded resource',
      test: function(){
        var VALUE = {};
        var json = basis.require('./fixture/foo.json');

        assert(json.id === 'foo');
        assert(json.test1 === undefined);

        basis.patch('./fixture/foo.json', function(resourceJSON){
          resourceJSON.test1 = VALUE;
        });

        assert(basis.require('./fixture/foo.json') === json);
        assert(json.id === 'foo');
        assert(json.test1 === VALUE);

        basis.patch('./fixture/foo.json', function(resourceJSON){
          resourceJSON.test2 = VALUE;
        });

        assert(basis.require('./fixture/foo.json') === json);
        assert(json.id === 'foo');
        assert(json.test1 === VALUE);
        assert(json.test2 === VALUE);
      }
    },
    {
      name: 'patch non-loaded resource',
      test: function(){
        var VALUE = {};

        assert(basis.resource.exists('./fixture/bar.json') === false);

        basis.patch('./fixture/bar.json', function(resourceJSON){
          resourceJSON.test1 = VALUE;
        });
        basis.patch('./fixture/bar.json', function(resourceJSON){
          resourceJSON.test2 = VALUE;
        });

        var json = basis.require('./fixture/bar.json');
        assert(json.test1 === VALUE);
        assert(json.test2 === VALUE);
      }
    }
  ]
};
