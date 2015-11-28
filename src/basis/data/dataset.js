
 /**
  * Namespace overview:
  * - Classes:
  *   {basis.data.dataset.Merge},
  *   {basis.data.dataset.Subtract},
  *   {basis.data.dataset.SourceDataset},
  *   {basis.data.dataset.MapFilter},
  *   {basis.data.dataset.Filter},
  *   {basis.data.dataset.Split},
  *   {basis.data.dataset.Slice}
  *   {basis.data.dataset.Cloud},
  *   {basis.data.dataset.Extract}
  *
  * @see ./demo/defile/dataset.html
  *
  * @namespace basis.data.dataset
  */

  module.exports = {
    getDelta: require('./dataset/getDelta.js'),
    createRuleEvents: require('./dataset/createRuleEvents.js'),

    // base source dataset
    SourceDataset: require('./dataset/SourceDataset.js'),

    // operable datasets
    Merge: require('./dataset/Merge.js'),
    Subtract: require('./dataset/Subtract.js'),

    // transform datasets
    MapFilter: require('./dataset/MapFilter.js'),
    Split: require('./dataset/Split.js'),
    Cloud: require('./dataset/Cloud.js'),
    Extract: require('./dataset/Extract.js'),

    // subsets
    Filter: require('./dataset/Filter.js'),
    Slice: require('./dataset/Slice.js')
  };
