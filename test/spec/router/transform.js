module.exports = {
  name: 'transform params to highlevel types',
  init: function(){
    var router = basis.require('basis.router');
    var type = basis.require('basis.type');

    var params = {
      custom: function(newValue, prevValue){
        if (newValue === 'secret' || newValue === 'correct')
          return 'correct';
        else
          return 'incorrect';
      },
      optional: function(value){
        return value || 42;
      },
      str: type.string,
      number: type.number.default(1)
    };
    var route = router.route(':custom/:str(/:number)(/)', {
      params: params
    });
  },
  test: [
    {
      name: 'simple case',
      test: function(){
        router.navigate('secret/some-str/52?optional=opt');

        assert(route.params.custom.value === 'correct');
        assert(route.params.str.value === 'some-str');
        assert(route.params.number.value === 52);
        assert(route.params.optional.value === 'opt');

        assert(route.value.custom === 'correct');
        assert(route.value.str === 'some-str');
        assert(route.value.number === 52);
        assert(route.value.optional === 'opt');
      }
    },
    {
      name: 'default value',
      test: function(){
        router.navigate('secret/some-str');

        assert(route.params.number.value === 1);
        assert(route.params.optional.value === 42);

        assert(route.value.number === 1);
        assert(route.value.optional === 42);
      }
    }
  ]
};
