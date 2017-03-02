module.exports = {
  name: 'basis.data.dataset.MapFilter',
  init: function(){
    var MapFilter = basis.require('basis.data.dataset').MapFilter;
    var Dataset = basis.require('basis.data').Dataset;
    var DataObject = basis.require('basis.data').Object;
    var devWrap = basis.require('basis.data').devWrap;
    var helpers = basis.require('./helpers/dataset.js');
    var range = helpers.range;

    function generateDataset(elements, map) {
      map = map || basis.fn.$self;

      return new Dataset({
        syncAction: function(){
          this.set(range(1, elements)
            .map(function(value){
              return map(new DataObject({ data: { value: value } }));
            }));
        }
      });
    }
  },
  test: [
    {
      name: 'fullfil source dataset on set source (bug issue)',
      test: function(){
        var idx = 1;

        function generateDataset() {
          return new Dataset({
            syncAction: function(){
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
      test: function(){
        var result = new MapFilter({
          active: true,
          map: function(obj){
            return obj.data.sub;
          }
        });

        result.setSource(generateDataset(5, function(value){
          return new DataObject({ data: { sub: value } });
        }));
        assert([1, 2, 3, 4, 5], result.getValues('data.value'));
      }
    },
    {
      name: 'filtering',
      test: function(){
        var result = new MapFilter({
          active: true,
          map: function(obj){
            return obj.data.sub;
          },
          filter: function(obj){
            return obj.data.value <= 2; // inverted logic - not like Array#filter
          }
        });

        result.setSource(generateDataset(5, function(value){
          return new DataObject({ data: { sub: value } });
        }));
        assert([3, 4, 5], result.getValues('data.value'));

        result.setFilter(function(obj){
          return obj.data.value <= 3; // inverted logic - not like Array#filter
        });
        assert([4, 5], result.getValues('data.value'));
      }
    },
    {
      name: 'filtering with objects update',
      test: function(){
        var result = new MapFilter({
          active: true,
          map: function(obj){
            return obj.data.sub;
          },
          filter: function(obj){
            return obj.data.value <= 2; // inverted logic - not like Array#filter
          }
        });

        result.setSource(generateDataset(5, function(value){
          return new DataObject({ data: { sub: value } });
        }));
        assert([3, 4, 5], result.getValues('data.value'));

        result.source.getItems()[2].data.sub.update({ value: 10 });
        assert([10, 4, 5], result.getValues('data.value'));
      }
    },
    {
      name: 'filtering proxy objects',
      test: function(){
        var elementToUpdate;
        var result = new MapFilter({
          active: true,
          map: function(obj){
            return obj.data.sub;
          },
          filter: function(obj){
            return obj.data.value <= 2; // inverted logic - not like Array#filter
          }
        });

        result.setSource(generateDataset(5, function(value){
          return new DataObject({ data: { sub: value } });
        }), true);
        assert([3, 4, 5], result.getValues('data.value'));

        elementToUpdate = result.source.getItems()[2];
        elementToUpdate.update({ sub: devWrap(elementToUpdate.data.sub) });
        assert([3, 4, 5], result.getValues('data.value'));
      }
    }
  ]
};
