module.exports = {
  name: 'new router',
  test: [
    {
      name: 'parse',
      init: function(){
        var router = basis.require('basis.router');
        var type = basis.require('basis.type');

        var params = {
          bar: type.string.nullable,
          baz: type.string.nullable,
          spam: type.string.nullable,
          end: type.string.nullable,
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
            location.hash = 'foo/1/2';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === null);
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'parsing encoded values',
          test: function(){
            location.hash = 'foo/1/basis%20js';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === 'basis js');
            assert(route.params.spam.value === null);
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'one optional value',
          test: function(){
            location.hash = 'foo/1/2/3';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'all optional values',
          test: function(){
            location.hash = 'foo/1/2/3/4';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === '4');
          }
        },
        {
          name: 'query values',
          test: function(){
            location.hash = 'foo/1/2/3/4?basis%20js=%7B%7D';
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
            location.hash = 'foo/1/2?spam=3&stuff=4';
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
            assert(route.params.stuff.value === '4');
          }
        },
        {
          name: 'optional param defined by query value',
          test: function(){
            location.hash = 'foo/1/2?spam=3&stuff=4';
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
            location.hash = 'foo/1/2/3?spam=4';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === null);
          }
        },
        {
          name: 'required param defined via query value',
          test: function(){
            location.hash = 'foo/1/2?bar=3';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
          }
        },
        {
          name: 'query params with brackets',
          test: function(){
            location.hash = 'foo/1/2?baz[3]=5';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params['baz[3]'].value === '5');
          }
        },
        {
          name: 'nontrivial symbols in values',
          test: function(){
            locaion.hash = 'foo/1/2?json={a:4}';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.json.value === '{a:4}');
          }
        },
        {
          name: 'query params: corner cases',
          test: function(){
            location.hash = 'foo/1/2?stuff&spam=3&end=';
            assert(route.params.bar.value === '1');
            assert(route.params.baz.value === '2');
            assert(route.params.spam.value === '3');
            assert(route.params.end.value === '');
          }
        }
      ]
    }
  ]
};
