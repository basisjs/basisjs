var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var sendData = require('devpanel.transport').sendData;
var File = require('../basisjs-tools-sync.js').File;

function sendFile(file){
  var data = {
    filename: file.data.filename,
    content: file.data.content
  };

  if (basis.path.extname(data.filename) == '.tmpl')
  {
    data.declaration = inspectBasisTemplate.makeDeclaration(
      data.content || '',
      basis.path.dirname(data.filename) + '/',
      null,
      data.filename
    );
    data.resources = data.declaration.resources;
    // delete deps as it can has resource and ResourceWrapper which can't be serialized
    data.declaration.deps = [];
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
FILE_LIST_HANDLER.itemsChanged(File.all, {
  inserted: File.all.getItems()
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
  getFileGraph: function(){
    var basisjsTools = global.basisjsToolsFileSync;

    if (basisjsTools)
      basisjsTools.getFileGraph(function(err, data){
        sendData('fileGraph', {
          data: data,
          err: err
        });
      });
  },
  createFile: function(filename){
    var basisjsTools = global.basisjsToolsFileSync;

    if (basisjsTools)
      basisjsTools.createFile(filename);
  },
  readFile: function(filename){
    var file = File.get(filename);

    if (file)
    {
      if (typeof file.data.content == 'string')
        sendFile(file);
      else
        file.read();
    }
  },
  saveFile: function(filename, content){
    var file = File.get(filename);

    if (file)
      file.save(content);
  }
};
