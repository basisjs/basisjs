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
}).extendClass({
  read: function(){
    this.setState(STATE.PROCESSING);
    this.file.read(function(data){
      this.setState(STATE.READY);
    }.bind(this));
  },
  save: function(content){
    this.setState(STATE.PROCESSING);
    this.file.save(content, function(err){
      if (err)
        this.setState(STATE.ERROR, err);
      else
        this.setState(STATE.READY);
    }.bind(this));
  },
  emit_update: function(delta){
    entity.BaseEntity.prototype.emit_update.call(this, delta);

    if ('content' in delta)
      this.file.set(this.data.content);
  }
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
        }).file = basisjsTools.getFile(filename);
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
