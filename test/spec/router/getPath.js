module.exports = {
  name: 'route.getPath',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
  },
  test: [
    {
      name: 'by default',
      test: function(){
        var route = router.route('foo(/:str)', {
          params: {
            str: type.string.nullable
          }
        });

        assert(route.getPath() == 'foo');
      }
    },
    {
      name: 'simple params case',
      test: function(){
        var route = router.route('foo/:str/:num', {
          params: {
            str: type.string,
            num: type.number,
            bool: type.bool
          }
        });

        assert(route.getPath({ str: 'some', num: 4, bool: true }) == 'foo/some/4?bool=true');
      }
    },
    {
      name: 'transforms params'
    },
    {
      name: 'drops defaults'
    },
    {
      name: 'custom encode'
    },
    {
      name: 'hard cases of stringify'
    }
    // {
    //   name: 'empty string',
    //   test: function() {
    //     var params = {
    //       custom: function(newValue, prevValue){
    //         if (newValue === 'secret') {
    //           return 'correct';
    //         }
    // else {
    //           return 'incorrect';
    //         }
    //       },
    //       optional: function(value){
    //         return value || 42;
    //       },
    //       str: type.string,
    //       number: type.number.default(1)
    //     };
    //     var route = router.route(':custom/:str(/:number)(/)', {
    //       params: params
    //     });
    //   }
    // }
  ]
};
