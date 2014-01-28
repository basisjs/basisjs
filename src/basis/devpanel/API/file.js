basis.require('basis.template');


var transport = resource('transport.js').fetch();
var sendData = transport.sendData;

var IS_FILE_ALLOWED_REGEX = /\.(tmpl|css|l10n)$/;

function sendFile(file){
  var data = basis.object.slice(file.data);

  if (basis.path.extname(file.data.filename) == '.tmpl' && file.data.content)
  {
    data.declaration = basis.template.makeDeclaration(file.data.content, basis.path.dirname(basis.path.resolve(file.data.filename)) + '/', {}, file.data.filename);
    data.resources = data.declaration.resources;
    // delete deps as it can has resource and ResourceWrapper which can't be serialized
    data.declaration.deps = [];
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
}

if (basis.devtools)
{
  var files = basis.devtools.files;
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
    if (basis.devtools)
      sendData('filesChanged', {
        inserted: basis.devtools.files.getItems().map(function(file){
          return {
            filename: file.data.filename
          };
        })
      });
  },
  createFile: function(filename){
    basis.devtools.createFile(filename);
  },
  readFile: function(filename){
    var file = basis.devtools.getFile(filename, true);
    if (file.data.content)
      sendFile(file);
    else
      file.read();
  },
  saveFile: function(filename, content){
    var file = basis.devtools.getFile(filename);
    if (file)
      file.save(content);
  }
};
