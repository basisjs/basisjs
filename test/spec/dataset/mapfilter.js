module.exports = {
  name: 'basis.data.dataset.MapFilter',
  init: function(){
    var MapFilter = basis.require('basis.data.dataset').MapFilter;
    var Dataset = basis.require('basis.data').Dataset;
    var DataObject = basis.require('basis.data').Object;
    var entity = basis.require('basis.entity');
    var GroupEntity = entity.createType('GroupEntity', {
      name: entity.StringId
    });
    var UserEntity = entity.createType('UserEntity', {
      name: entity.StringId,
      fullName: String,
      group: GroupEntity,
      friend: function(friend) {
        return friend ? UserEntity(friend) : null;
      }
    });

    function createUser(name, group, friend) {
      return UserEntity({ name: name, group: group, friend: friend });
    }

    function createGroup(name) {
      return GroupEntity({ name: name });
    }
  },
  test: [
    {
      name: 'fullfil source dataset on set source (bug issue)',
      test: function(){
        var idx = 1;

        function generateDataset() {
          return new Dataset({
            syncAction: function(data){
              this.set([
                new DataObject({ data: { views: idx++ } })
              ]);
            }
          });
        }

        var result = new MapFilter({
          active: true
        });

        result.setSource(generateDataset());

        assert([1], result.getValues('data.views'));

        result.setSource(generateDataset());

        assert([2], result.getValues('data.views'));
      }
    },
    {
      name: 'mapping',
      test: function() {
        var result = new MapFilter({
          source: UserEntity.all,
          map: function(obj) {
            return obj.data.group;
          }
        });

        createGroup('group1');
        createGroup('group2');
        createUser('user1', 'group1', 'user2');
        createUser('user2', 'group2', 'user1');

        assert(GroupEntity.all.getValues(), result.getValues());

        result.setMap(function(obj) {
          return obj.data.friend;
        });
        assert(UserEntity.all.getValues('data.friend'), result.getValues());
      }
    },
    {
      name: 'filtering',
      test: function() {
        var result = new MapFilter({
          source: UserEntity.all,
          map: function(obj) {
            return obj.data.group;
          },
          filter: function(obj) {
            return obj.data.name == 'group2'; // inverted logic - not like Array#filter
          }
        });

        assert(['group1'], result.getValues('data.name'));

        result.setFilter(function(obj) {
          return obj.data.name == 'group1';
        });
        assert(['group2'], result.getValues('data.name'));
      }
    },
    {
      name: 'filtering with objects update',
      test: function() {
        var result = new MapFilter({
          source: UserEntity.all,
          map: function(obj) {
            return obj.data.group;
          },
          filter: function(obj) {
            return obj.data.name == 'group2'; // inverted logic - not like Array#filter
          }
        });

        assert(['group1'], result.getValues('data.name'));

        GroupEntity('group1').update({ name: 'group3' });
        assert(['group3'], result.getValues('data.name'));

        GroupEntity('group3').update({ name: 'group1' });
        assert(['group1'], result.getValues('data.name'));
      }
    },
    {
      name: 'mapping with set update',
      test: function() {
        UserEntity.all.setAndDestroyRemoved([
          { name: 'user1', group: 'group1' },
          { name: 'user2', group: 'group2' },
          { name: 'user3', group: 'group2' }
        ]);

        var result = new MapFilter({
          source: UserEntity.all,
          map: function(obj) {
            return obj.data.group;
          }
        });

        UserEntity.all.setAndDestroyRemoved([
          { name: 'user1', group: 'group1' },
          { name: 'user2', group: 'group2' }
        ]);
        assert(['group1', 'group2'], result.getValues('data.name'));
      }
    },
    {
      name: 'mapping with set update (buggy case with wrapped objects)',
      test: function() {
        UserEntity.all.setAndDestroyRemoved([
          { name: 'user1', group: { name: 'group1' } },
          { name: 'user2', group: { name: 'group2' } },
          { name: 'user3', group: { name: 'group2' } }
        ]);

        var result = new MapFilter({
          source: UserEntity.all,
          map: function(obj) {
            return obj.data.group;
          }
        });

        UserEntity.all.setAndDestroyRemoved([
          { name: 'user1', group: { name: 'group1' } },
          { name: 'user2', group: { name: 'group2' } }
        ]);
        assert(['group1', 'group2'], result.getValues('data.name'));
      }
    }
  ]
};
