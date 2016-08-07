var DatasetWrapper = require('basis.data').DatasetWrapper;
var Split = require('basis.data.dataset').Split;
var AppProfile = require('./app-profile.js');
var entity = require('basis.entity');

var File = entity.createType('AppFile', {
  filename: entity.StringId,
  isDir: Boolean,
  type: String,
  files: Object,
  parent: entity.calc('filename', function(filename){
    var result = filename.replace(/\/[^\/]*$/, '');
    return result != filename ? result : '';
  }),
  name: entity.calc('filename', function(filename){
    return (filename || '').split(/\//).pop();
  }),
  matched: Boolean
});

File.matched = new DatasetWrapper();
AppProfile.linkDataset('files', File.all, function(files){
  return files.reduce(function(files, file){
    var parts = file.name.split('/');
    var path = '';
    var name;
    var first = true;

    while (name = parts.shift())
    {
      path += (first ? '' : '/') + name;
      first = false;
      files.push({
        filename: path,
        type: file.type,
        isDir: !!parts.length
      });
    }

    return files;
  }, []);
});

var fileDirSplit = new Split({
  source: File.all,
  rule: 'data.isDir'
});
File.files = fileDirSplit.getSubset(false, true);
File.dirs = fileDirSplit.getSubset(true, true);

// var splitByParent = new Split({
//   source: File.all,
//   rule: 'data.parent'
// });

// var linkFrom = new Split({
//   source: FileLink.all,
//   rule: 'data.to'
// });

// var linkTo = new Split({
//   source: FileLink.all,
//   rule: 'data.from'
// });

module.exports = File;
