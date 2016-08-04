var inspectBasis = require('devpanel').inspectBasis;
var entity = require('basis.entity');
var basisData = require('basis.data');
var STATE = basisData.STATE;
var Value = basisData.Value;

var isOnline = new Value({ value: false });
var remoteInspectors = new Value({ value: 0 });
var permanentFilesChangedCount = new Value({ value: 0 });
var permanentFiles = [];
var notificationsQueue = [];

var File = entity.createType('File', {
  filename: entity.StringId,
  content: function(value){
    return typeof value == 'string' ? value : null;
  }
});
File.openFileSupported = false;
File.open = function(){
  basis.dev.warn('basis.devpanel: open file in editor is not supported by server');
};
File.extendClass(function(super_, current_){
  return {
    file: null,
    read: function(){
      if (!this.file)
      {
        basis.dev.warn('basis.devpanel: file can\'t be read, no basisjsToolsFileSync file associated');
        return;
      }

      this.setState(STATE.PROCESSING);
      this.file.read(function(){
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

function processNotificationQueue(){
  // aggregate files changes
  basisData.Dataset.setAccumulateState(true);

  notificationsQueue.splice(0).forEach(function(notification){
    var action = notification.action;
    var filename = notification.filename;
    var content = notification.content;

    switch (action)
    {
      case 'new':
      case 'update':
        File({
          filename: filename,
          content: content
        });
        break;

      case 'remove':
        File(filename).destroy();
        break;
    }

    // permanent files changes
    if (action == 'new')
      return;

    // trace only update and delete
    var ext = basis.path.extname(filename);

    if (ext in inspectBasis.resource.extensions &&
        inspectBasis.resource.extensions[ext].permanent &&
        inspectBasis.resource.isResolved(filename) &&
        inspectBasis.resource(filename).hasChanges())
      basis.array.add(permanentFiles, filename);
    else
      basis.array.remove(permanentFiles, filename);
  });

  // set new count
  permanentFilesChangedCount.set(permanentFiles.length);

  basisData.Dataset.setAccumulateState(false);
}


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
  File.extendClass(function(super_, current_){
    return {
      init: function(){
        current_.init.apply(this, arguments);
        this.file = basisjsTools.getFile(this.data.filename, true);
      }
    };
  });
  File.all.set(basisjsTools.getFiles());

  // subscribe to files change notifications
  basisjsTools.notifications.attach(function(action, filename, content){
    if (!notificationsQueue.length)
      basis.nextTick(processNotificationQueue);

    notificationsQueue.push({
      action: action,
      filename: filename,
      file: basisjsTools.getFile(filename, true),
      content: content
    });
  });

  // sync open file
  File.openFileSupported = true;  // TODO: get support state from basisjsTools
  File.open = basisjsTools.openFile;

  // sync isOnline
  basisjsTools.isOnline.attach(isOnline.set, isOnline);
  isOnline.set(basisjsTools.isOnline.value);

  // sync remoteInspectors
  basisjsTools.remoteInspectors.attach(remoteInspectors.set, remoteInspectors);
  remoteInspectors.set(basisjsTools.remoteInspectors.value);

  // initDevtool
  if (typeof basisjsTools.initDevtool === 'function')
    basisjsTools.initDevtool({
      getInspectorUI: function(dev, callback){
        basisjsTools.getBundle(dev ? asset('./standalone.html') : {
          build: asset('../../dist/devtool.js'),
          filename: asset('./standalone.html')
        }, callback);
      }
    });
});

module.exports = {
  isOnline: isOnline,
  remoteInspectors: remoteInspectors,
  permanentFilesChangedCount: permanentFilesChangedCount,
  File: File
};
