var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;

module.exports = Node.subclass({
  template: resource('./template/viewer.tmpl'),
  binding: {
    files: 'satellite:',
    editor: 'satellite:',
    preview: 'satellite:'
  },
  satellite: {
    preview: resource('./preview/index.js'),
    files: resource('./fileList/index.js'),
    editor: {
      delegate: Value.query('satellite.files.selection.pick()'),
      instance: resource('./editor/index.js')
    }
  }
});
