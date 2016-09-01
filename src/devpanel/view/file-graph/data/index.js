var inspectBasis = require('devpanel').inspectBasis;

var Value = require('basis.data').Value;
var RuntimeFile = require('type').RuntimeFile;

var output = new Value();
var FILE_UPDATE_HANDLER = {
  update: function(){
    output.set(this.data);
  }
};
var listenFileChanges = function(file){
  file.addHandler(FILE_UPDATE_HANDLER);
};
var fileDataFromResource = function(resource){
  return {
    filename: resource.url,
    resolved: resource.isResolved()
  };
};

RuntimeFile.all.set(inspectBasis.resource.getFiles().map(function(url){
  return fileDataFromResource(inspectBasis.resource(url));
}));
RuntimeFile.all.getItems().forEach(listenFileChanges);
inspectBasis.resource.subscribe(function(event){
  RuntimeFile(fileDataFromResource(event.resource));
});

RuntimeFile.all.addHandler({
  itemsChanged: function(files, delta){
    if (delta.inserted)
      delta.inserted.forEach(function(file){
        output.set(file.data);
        listenFileChanges(file);
      });
  }
});

module.exports = {
  output: output,
  init: function(){
    return {
      type: 'init',
      files: RuntimeFile.all.getValues('data')
    };
  }
};
