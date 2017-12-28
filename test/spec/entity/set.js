module.exports = {
  name: 'set',
  test: [
    {
      name: 'properly handles setting NaN',
      test: function(){
        var T = nsEntity.createType({
          fields: {
            custom: basis.fn.$self
          }
        });

        var instance = T({ custom: null });

        assert(instance.set('custom', NaN) !== false);
        assert(instance.data.custom !== instance.data.custom);

        assert(instance.set('custom', NaN) === false);
        assert(instance.data.custom !== instance.data.custom);
      }
    }
  ]
};
