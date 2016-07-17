module.exports = {
  name: 'basis.data',
  test: [
    require('./data/state.js'),
    require('./data/active.js'),
    require('./data/sync.js'),
    require('./data/subscription.js'),
    require('./data/value.js'),
    require('./data/object.js'),
    require('./data/dataset.js'),
    require('./data/action.js')
  ]
};
