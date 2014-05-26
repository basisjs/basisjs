module.exports = {
  name: 'basis.data.dataset',
  test: [
    require('./dataset/merge.js'),
    require('./dataset/subtract.js'),
    require('./dataset/sourcedataset.js'),
    require('./dataset/slice.js'),
    require('./dataset/extract.js')
  ]
};
