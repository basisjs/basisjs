module.exports = {
  name: 'destroy',
  test: [
    {
      name: 'no warnings about handler remove on destroy',
      test: function(){
        var Type = nsEntity.createType();
        var subset = new Filter({ source: Type.all });
        var instance = Type({});

        assert(subset.itemCount == 1);
        assert(catchWarnings(function(){
          instance.destroy();
        }) == false);

        assert(subset.itemCount == 0);
      }
    },
    {
      name: 'no warnings on all.setAndDestroyRemoved([])',
      test: function(){
        var Type = nsEntity.createType();
        var subset = new Filter({ source: Type.all });
        var eventCount = 0;

        Type({});
        Type({});

        subset.addHandler({
          itemsChanged: function(){
            eventCount++;
          }
        });

        assert(subset.itemCount == 2);
        assert(catchWarnings(function(){
          Type.all.setAndDestroyRemoved([]);
        }) == false);

        assert(subset.itemCount == 0);
        assert(eventCount == 1);
      }
    },
    {
      name: 'no warnings on subset sync',
      test: function(){
        var Type = nsEntity.createType('TestType', {
          id: nsEntity.IntId,
          group: Number
        });

        var split = new nsEntity.Grouping({
          wrapper: Type,
          source: Type.all,
          rule: 'data.group'
        });

        var wrapper = split.getSubset(1, true);
        var subset = new Filter({
          source: wrapper
        });

        assert(catchWarnings(function(){
          wrapper.dataset.setAndDestroyRemoved([{ id: 1, group: 1 }]);
        }) == false);
        assert(wrapper.itemCount == 1);
        assert(subset.itemCount == 1);

        assert(catchWarnings(function(){
          wrapper.dataset.setAndDestroyRemoved([{ id: 2, group: 1 }]);
        }) == false);
        assert(wrapper.itemCount == 1);
        assert(subset.itemCount == 1);
      }
    }
  ]
};
