module.exports = {
  name: 'basis.data.dataset.SourceDataset',

  sandbox: true,
  init: function(){
    basis = basis.createSandbox();

    var Dataset = basis.require('basis.data').Dataset;
    var SourceDataset = basis.require('basis.data.dataset').SourceDataset;
  },

  test: [
    {
      name: 'source and active',
      test: function(){
        var warn = basis.dev.warn;
        var warning = false;
        var dataset = new Dataset();
        var sourceDataset = new SourceDataset({
          active: true,
          source: dataset
        });

        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          assert(dataset.debug_handlers().length === 1);
          assert(sourceDataset.debug_handlers().length === 1);

          sourceDataset.setSource();
          assert(dataset.debug_handlers().length === 0);
          assert(sourceDataset.debug_handlers().length === 1);

          sourceDataset.setSource(dataset);
          assert(dataset.debug_handlers().length === 1);
          assert(sourceDataset.debug_handlers().length === 1);

          sourceDataset.setActive(false);
          assert(dataset.debug_handlers().length === 1);
          assert(sourceDataset.debug_handlers().length === 0);
        } finally {
          basis.dev.warn = warn;
        }

        assert(warning === false);
      }
    }
  ]
};
