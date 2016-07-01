module.exports = {
  name: 'basis.data.dataset.MapFilter',
  init: function(){
    var MapFilter = basis.require('basis.data.dataset').MapFilter;
    var Dataset = basis.require('basis.data').Dataset;
    var DataObject = basis.require('basis.data').Object;
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
    }
  ]
};
