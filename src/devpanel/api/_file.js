var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var sendData = require('./transport.js').sendData;
var File = require('type').File;

function sendFile(file){
  var data = {
    filename: file.data.filename,
    content: file.data.content
  };

  if (basis.path.extname(data.filename) == '.tmpl')
  {
    data.declaration = inspectBasisTemplate.makeDeclaration(
      data.content,
      basis.path.dirname(basis.path.resolve(data.filename)) + '/',
      {},
      data.filename
    );
    data.resources = data.declaration.resources.map(function(resource){
      return resource.url;
    });
    // delete deps as it can has resource and ResourceWrapper which can't be serialized
    data.declaration.deps = [];
    data.declaration.includes = [];
  }

  sendData('updateFile', data);
}

var FILE_HANDLER = {
  update: function(object, delta){
    if ('content' in delta && this.data.content !== null)
      sendFile(this);
  }
};
var FILE_LIST_HANDLER = {
  itemsChanged: function(dataset, delta){
    var data = {};

    if (delta.inserted)
      data.inserted = delta.inserted.map(function(item){
        item.addHandler(FILE_HANDLER);
        return item.data.filename;
      });

    if (delta.deleted)
      data.deleted = delta.deleted.map(function(item){
        item.removeHandler(FILE_HANDLER);
        return item.data.filename;
      });

    if (data.inserted || data.deleted)
      sendData('filesChanged', data);
  }
};

File.all.addHandler(FILE_LIST_HANDLER);
File.all.forEach(function(file){
  file.addHandler(FILE_HANDLER);
});

//
// exports
//
module.exports = {
  getFileList: function(){
    sendData('filesChanged', {
      inserted: File.all.getValues('data.filename')
    });
  },
  createFile: function(filename){
    File({
      filename: filename,
      content: ''
    }).save();
  },
  readFile: function(filename){
    var file = File(filename, true);

    if (typeof file.data.content == 'string')
      sendFile(file);
    else
      file.read();
  },
  saveFile: function(filename, content){
    File({
      filename: filename,
      content: content
    }).save();
  },
  isOpenFileSupported: function(){
    return File.openFileSupported;
  },
  openFile: function(filename){
    File.open(basis.path.resolve(filename.replace(/(:\d+:\d+):\d+:\d+$/, '$1')));
  }
};
