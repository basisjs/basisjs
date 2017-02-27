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
            bool: type.string
          }
        });

        assert(route.getPath({ str: 'some', num: 4, bool: true }) == 'foo/some/4?bool=true');
      }
    },
    // {
    //   name: 'transforms params',
    //   test: function() {

    //   }
    // },
    {
      name: 'drops defaults',
      test: function(){
        var route = router.route('page/(:num)(/)', {
          params: {
            str: type.string.default('def'),
            num: type.number.default(4),
            otherNum: type.number.default(0),
            yetAnotherNum: type.number.default(0)
          }
        });

        var expected = 'page/?yetAnotherNum=5';
        var actual = route.getPath({ str: 'def', num: 4, otherNum: 0, yetAnotherNum: 5 });

        assert(actual == expected);
      }
    },
    {
      name: 'custom encode',
      test: function(){
        var route = router.route('page/:obj', {
          params: {
            obj: type.object,
            arr: type.array,
            num: type.number
          },
          encode: function(params){
            params.arr = params.arr.join(',');

            params.obj = JSON.stringify(params.obj);
          }
        });

        var expected = 'page/%7B%22foo%22%3A%22bar%22%7D?arr=1%2C35&num=25';
        var actual = route.getPath({ obj: { foo: 'bar' }, arr: [1, 35], num: 25 });

        assert(actual == expected);
      }
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
