module.exports = {
  name: 'Helpers',
  test: [
    {
      name: 'is(value, type) for EntityType',
      test: function(){
        var typeName = basis.genUID();
        var Type = nsEntity.createType(typeName);
        var Type2 = nsEntity.createType();

        assert(nsEntity.is(Type({}), Type));
        assert(nsEntity.is(Type({}), typeName));
        assert(nsEntity.is(Type2({}), Type2));

        assert(nsEntity.is({}, Type) === false);
        assert(nsEntity.is({}, 'xxx') === false);
        assert(nsEntity.is(Type({}), Type2) === false);
        assert(nsEntity.is() === false);
      }
    },
    {
      name: 'is(value, type) for EntitySetType',
      test: function(){
        var typeName = basis.genUID();
        var Type = nsEntity.createSetType(typeName, Function);
        var Type2 = nsEntity.createSetType(Function);

        assert(nsEntity.is(Type([]), Type));
        assert(nsEntity.is(Type([]), typeName));
        assert(nsEntity.is(Type2([]), Type2));

        assert(nsEntity.is([], Type) === false);
        assert(nsEntity.is([], 'xxx') === false);
        assert(nsEntity.is(Type([]), Type2) === false);
        assert(nsEntity.is() === false);
      }
    }
  ]
};
