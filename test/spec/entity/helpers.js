module.exports = {
  name: 'Helpers',
  test: [
    {
      name: 'is(value, type)',
      test: function(){
        var Type = nsEntity.createType('helpers-is');
        var Type2 = nsEntity.createType();

        assert(nsEntity.is(Type({}), Type));
        assert(nsEntity.is(Type({}), 'helpers-is'));
        assert(nsEntity.is(Type2({}), Type2));

        assert(nsEntity.is({}, Type) === false);
        assert(nsEntity.is({}, 'xxx') === false);
        assert(nsEntity.is(Type({}), Type2) === false);
        assert(nsEntity.is() === false);
      }
    }
  ]
};
