module.exports = {
  name: 'Resolver subsystem',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Token = basis.Token;
    var SimpleClass = basis.Class();
    var createResolveFunction = basis.require('basis.data').createResolveFunction;
  },

  test: [
    {
      name: 'resolve class instance',
      test: [
        {
          name: 'from token',
          test: function(){
            var token = new Token(new SimpleClass());
            var resolve = createResolveFunction(SimpleClass);
            var value = resolve({}, basis.fn.$self, token, 'RA_');

            assert(value instanceof SimpleClass);
          }
        },
        {
          name: 'from token wrapped by another token',
          test: function(){
            var token = new Token(new Token(new SimpleClass()));
            var resolve = createResolveFunction(SimpleClass);
            var value = resolve({}, basis.fn.$self, token, 'RA_');

            assert(value instanceof SimpleClass);
          }
        },
        {
          name: 'from resource',
          test: function(){
            var resource = basis.resource.virtual('js', function(exports, module){
              module.exports = new SimpleClass();
            });
            var resolve = createResolveFunction(SimpleClass);
            var value = resolve({}, basis.fn.$self, resource, 'RA_');

            assert(value instanceof SimpleClass);
          }
        },
        {
          name: 'from resource of transpiled es6 module',
          test: function(){
            var resource = basis.resource.virtual('js', function(exports, module){
              Object.defineProperty(module.exports, '__esModule', { value: true });
              module.exports.default = new SimpleClass();
            });
            var resolve = createResolveFunction(SimpleClass);
            var value = resolve({}, basis.fn.$self, resource, 'RA_');

            assert(value instanceof SimpleClass);
          }
        }
      ]
    }
  ]
};
