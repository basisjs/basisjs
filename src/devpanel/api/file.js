var transport = require('./transport.js');
var sendData = transport.sendData;
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');

var IS_FILE_ALLOWED_REGEX = /\.(tmpl|css|l10n)$/;

function sendFile(file){
  var data = basis.object.slice(file.data);

  if (basis.path.extname(file.data.filename) == '.tmpl' && file.data.content)
  {
    data.declaration = inspectBasisTemplate.makeDeclaration(file.data.content, basis.path.dirname(basis.path.resolve(file.data.filename)) + '/', {}, file.data.filename);
    data.resources = data.declaration.resources.map(function(resource) {
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
      sendFile(object);
  }
};
var FILE_LIST_HANDLER = {
  itemsChanged: function(dataset, delta){
    var data = {};
    if (delta.inserted)
    {
      data.inserted = [];
      var fileData;
      for (var i = 0, object; object = delta.inserted[i]; i++)
      {
        if (IS_FILE_ALLOWED_REGEX.test(object.data.filename))
        {
          fileData = basis.object.slice(object.data);
          delete fileData.content;

          data.inserted.push(fileData);
          object.addHandler(FILE_HANDLER);
        }
      }
    }

    if (delta.deleted)
    {
      data.deleted = [];

      for (var i = 0, object; object = delta.deleted[i]; i++)
      {
        if (IS_FILE_ALLOWED_REGEX.test(object.data.filename))
        {
          data.deleted.push(object.data.filename);
          object.removeHandler(FILE_HANDLER);
        }
      }
    }

    if ((data.inserted && data.inserted.length) || (data.deleted && data.deleted.length))
      sendData('filesChanged', data);
  }
};

if (inspectBasis.devtools)
{
  var files = inspectBasis.devtools.files;
  files.addHandler(FILE_LIST_HANDLER);
  FILE_LIST_HANDLER.itemsChanged.call(files, files, {
    inserted: files.getItems()
  });
}

//
// exports
//
module.exports = {
  getFileList: function(){
    var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

    if (basisjsTools)
      sendData('filesChanged', {
        inserted: !inspectBasis.devtools
          // new basisjs-tools
          ? basisjsTools.getFiles().map(function(file){
              return {
                filename: file.filename
              };
            })
          // old basisjs-tools
          : basisjsTools.files.getItems().map(function(file){
              return {
                filename: file.data.filename
              };
            })
      });
  },
  createFile: function(filename){
    var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

    if (basisjsTools)
      basisjsTools.createFile(filename);
  },
  readFile: function(filename){
    var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

    if (basisjsTools)
    {
      var file = basisjsTools.getFile(filename, true);
      if (typeof file.data.content == 'string')
        sendFile(file);
      else
        file.read();
    }
  },
  saveFile: function(filename, content){
    var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

    if (basisjsTools)
    {
      var file = basisjsTools.getFile(filename);
      if (file)
        file.save(content);
    }
  },
  openFile: function(filename){
    var basisjsTools = typeof basisjsToolsFileSync != 'undefined' ? basisjsToolsFileSync : inspectBasis.devtools;

    if (basisjsTools && typeof basisjsTools.openFile == 'function')
    {
      basisjsTools.openFile(basis.path.resolve(filename.replace(/(:\d+:\d+):\d+:\d+$/, '$1')));
    }
  }
};
