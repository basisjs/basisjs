module.exports = {
  name: 'parse',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');

    var params = {
      bar: type.string.nullable,
      baz: type.string.nullable,
      spam: type.string.nullable,
      stuff: type.string.nullable,
      json: type.string.nullable,
      end: type.string.nullable,
      'baz[3]': type.string.nullable,
      'basis js': type.string.nullable
    };
    var route = router.route('foo/:bar/:baz(/:spam)(/:end)(/)', {
      params: params
    });
  },
  test: [
    {
      name: 'without optional args',
      test: function(){
        router.navigate('foo/1/2');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === null);
        assert(route.params.end.value === null);
      }
    },
    {
      name: 'parsing encoded values',
      test: function(){
        router.navigate('foo/1%20and%202/basis%20js');
        assert(route.matched.value);
        assert(route.params.bar.value === '1 and 2');
        assert(route.params.baz.value === 'basis js');
        assert(route.params.spam.value === null);
        assert(route.params.end.value === null);
      }
    },
    {
      name: 'one optional value',
      test: function(){
        router.navigate('foo/1/2/3');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === null);
      }
    },
    {
      name: 'all optional values',
      test: function(){
        router.navigate('foo/1/2/3/4');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === '4');
      }
    },
    {
      name: 'query values',
      test: function(){
        router.navigate('foo/1/2/3/4?basis%20js=%7B%7D');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === '4');
        assert(route.params['basis js'].value === '{}');
      }
    },
    {
      name: 'optional param defined by query value',
      test: function(){
        router.navigate('foo/1/2?spam=3&stuff=4');
        assert(route.matched.value);
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === null);
        assert(route.params.stuff.value === '4');
      }
    },
    {
      name: 'optional param defined by query value',
      test: function(){
        router.navigate('foo/1/2?spam=3&stuff=4');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === null);
        assert(route.params.stuff.value === '4');
      }
    },
    {
      name: 'optional param defined by usual and via query value',
      test: function(){
        router.navigate('foo/1/2/3?spam=4');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === null);
      }
    },
    {
      name: 'required param defined via query value',
      test: function(){
        router.navigate('foo/1/2?bar=3');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
      }
    },
    {
      name: 'query params with brackets',
      test: function(){
        router.navigate('foo/1/2?baz[3]=5');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params['baz[3]'].value === '5');
      }
    },
    {
      name: 'nontrivial symbols in values',
      test: function(){
        router.navigate('foo/1/2?json={a:4}');
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.json.value === '{a:4}');
      }
    },
    {
      name: 'query params: corner cases',
      test: function(){
        router.navigate('foo/1/2?stuff&spam=3&end=');
        assert(route.matched.value);
        assert(route.params.bar.value === '1');
        assert(route.params.baz.value === '2');
        assert(route.params.spam.value === '3');
        assert(route.params.end.value === '');
      }
    },
    {
      name: 'parsing on start',
      test: function(){
        location.hash = 'foo/one?baz=two';

        router.checkUrl();

        var simpleRoute = router.route('foo/:bar', {
          params: {
            bar: type.string.nullable,
            baz: type.string.nullable
          }
        });

        assert(simpleRoute.params.bar.value === 'one');
        assert(simpleRoute.params.baz.value === 'two');
      }
    },
    {
      name: 'fallback to prev value in case of incorrect parsing',
      test: function(){
        var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
        var simpleRoute = router.route('my/:num', {
          params: {
            num: type.number
          }
        });

        catchWarnings(function(){
          router.navigate('my/stuff');
        });

        assert(simpleRoute.params.num.value === 0);

        router.navigate('my/3');

        assert(simpleRoute.params.num.value === 3);

        catchWarnings(function(){
          router.navigate('my/NaN');
        });

        assert(simpleRoute.params.num.value === 3);
      }
    }
  ]
};
