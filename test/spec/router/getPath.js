module.exports = {
  name: 'route.getPath',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');
    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
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
            bool: basis.fn.$self
          }
        });

        assert(route.getPath({ str: 'some', num: 4, bool: true }) == 'foo/some/4?bool=true');
      }
    },

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
      name: 'encodes param which has serialize property',
      test: function(){
        function customTransform(v){
          return v && v.toLowerCase();
        }
        customTransform.serialize = function(v){
          return '-' + v;
        };

        var route = router.route('page/:custom', {
          params: {
            str: type.string,
            custom: customTransform
          }
        });

        var expected = 'page/-custom?str=a';
        var actual = route.getPath({ str: 'a', custom: 'CUSTOM' });

        assert(actual == expected);
      }
    },
    {
      name: 'encodes objects and arrays',
      test: function(){
        var route = router.route('page/:obj', {
          params: {
            obj: type.object,
            arr: type.array,
            num: type.number
          }
        });

        // 'page/{"foo":"bar"}?arr=[1,35]&num=25'
        var expected = 'page/%7B%22foo%22%3A%22bar%22%7D?arr=%5B1%2C35%5D&num=25';
        var actual = route.getPath({ obj: { foo: 'bar' }, arr: [1, 35], num: 25 });

        assert(actual == expected);
      }
    },
    {
      name: 'serialize is not a function',
      test: function(){
        function customTransform(v){
          return v;
        }
        customTransform.serialize = 2;

        var warned = catchWarnings(function(){
          route = router.route(':str/', {
            params: {
              str: customTransform,
              query: type.string
            }
          });
        });

        assert(warned);

        var expected = 'foo/?query=abc';
        var actual = route.getPath({ str: 'foo', query: 'abc' });

        assert(actual == expected);
      }
    },
    {
      name: 'fills defaults if needed',
      test: function(){
        var route = router.route('coffee/:num', {
          params: {
            num: type.number
          }
        });

        var expected = 'coffee/0';
        var actual = route.getPath();

        assert(actual == expected);
      }
    },
    {
      name: 'fills defaults if needed - custom transform',
      test: function(){
        var route = router.route('coffee/:custom', {
          params: {
            custom: function(value){
              if (value === 'secret')
              {
                return 'correct';
              }
              else
              {
                return 'incorrect';
              }
            }
          }
        });

        var expected = 'coffee/incorrect';
        var actual = route.getPath();

        assert(actual == expected);
      }
    },
    {
      name: 'params not stated in params',
      test: function(){
        var route = router.route('coffee/', {
          params: {
            uno: type.number
          }
        });

        var expected = 'coffee/';
        var warned = catchWarnings(function(){
          var actual = route.getPath({ different: 25 });

          assert(actual == expected);
        });

        assert(warned);
      }
    },
    {
      name: 'incorrect value for param',
      test: function(){
        var route = router.route('something/:real', {
          params: {
            real: type.number
          }
        });

        router.navigate('something/3');

        var expected = 'something/0';
        catchWarnings(function(){
          var actual = route.getPath({ real: new Date() });

          assert(actual == expected);
        });
      }
    }
  ]
};
