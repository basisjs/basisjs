var inspectBasis = require('devpanel').inspectBasis;
var entity = require('basis.entity');
var STATE = require('basis.data').STATE;

//
// defines
//
var isOnline = new basis.data.Value({ value: false });
var File = entity.createType('File', {
  filename: entity.StringId,
  content: function(value){
    return typeof value == 'string' ? value : null;
  }
}).extendClass(function(super_, current_){
  return {
    file: null,
    read: function(){
      if (!this.file)
      {
        basis.dev.warn('basis.devpanel: file can\'t be read, no basisjsToolsFileSync file associated');
        return;
      }

      this.setState(STATE.PROCESSING);
      this.file.read(function(data){
        this.setState(STATE.READY);
      }.bind(this));
    },
    save: function(content){
      if (!this.file)
      {
        basis.dev.warn('basis.devpanel: file can\'t be saved, no basisjsToolsFileSync file associated');
        return;
      }

      this.setState(STATE.PROCESSING);
      this.file.save(content, function(err){
        if (err)
          this.setState(STATE.ERROR, err);
        else
          this.setState(STATE.READY);
      }.bind(this));
    },
    emit_update: function(delta){
      current_.emit_update.call(this, delta);

      if (this.file && 'content' in delta)
        this.file.set(this.data.content);
    }
  };
});

var permamentFiles = [];
var permamentFilesCount = new basis.data.Value(0);


//
// init part
// run via basis.ready to ensure basisjsToolsFileSync is loaded
//
basis.ready(function(){
  var basisjsTools = global.basisjsToolsFileSync;

  if (!basisjsTools)
  {
    basis.dev.warn('basis.devpanel: basisjsToolsFileSync not found');
    return;
  }

  // sync files
  File.all.forEach(function(file){
    file.file = basisjsTools.getFile(file.data.filename, true);
  });
  File.all.sync(basisjsTools.getFiles().map(function(file){
    return {
      filename: file.filename,
      content: file.value
    };
  }));

  // subscribe to files change notifications
  basisjsTools.notifications.attach(function(action, filename, content){
    switch (action)
    {
      case 'new':
      case 'update':
        File({
          filename: filename,
          content: content
        }).file = basisjsTools.getFile(filename, true);
        break;

      case 'remove':
        File(filename).destroy();
        break;
    }

    // permanent files changes
    if (action == 'new')
      return;

    var ext = basis.path.extname(filename);

    if (ext in inspectBasis.resource.extensions == false)
      return;

    if (inspectBasis.resource.extensions[ext].permanent &&
        inspectBasis.resource.isResolved(filename))
    {
      basis.setImmediate(function(){
        if (inspectBasis.resource(filename).hasChanges())
          basis.array.add(permamentFiles, filename);
        else
          basis.array.remove(permamentFiles, filename);

        permamentFilesCount.set(permamentFiles.length);
      });
    }
  });

  // sync isOnline
  basisjsTools.isOnline.attach(isOnline.set, isOnline);
  isOnline.set(basisjsTools.isOnline.value);
});


//
// exports
//
module.exports = {
  isOnline: isOnline,
  permamentFilesCount: permamentFilesCount,
  File: File
};
