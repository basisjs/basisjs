(function(global){

  basis.require('basis.dom');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.entity');

 /**
  * @namespace
  */
  var namespace = 'basis.devtools';


  //
  // import names
  //

  var nsDataset = basis.data.dataset;
  var nsProperty = basis.data.property;
  var nsEntity = basis.entity;

  var STATE = basis.data.STATE;

  //
  // local vars
  //

  var sendToServer = function(){ console.warn('Server backend is not allowed'); };

  var isReady_ = false;
  var isOnline_ = false;

  var isReady = new nsProperty.Property(isReady_);
  var isOnline = new nsProperty.Property(isOnline_);
  var connectionState = new nsProperty.Property('offline', {
    change: function(state){
      console.log('Socket.io state:', state.value);
    }
  });

  var console = global.console;
  if (typeof console == 'undefined')
    console = { log: Function(), warn: Function() };

  //
  // Date parse
  //

  var reIsoStringSplit = /\D/;
  function fastDateParse(y, m, d, h, i, s, ms){
    return new Date(y, m - 1, d, h || 0, i || 0, s || 0, ms || 0);
  }
  Date.fromISOString = function(isoString){
    return isoString ? fastDateParse.apply(null, String(isoString).split(reIsoStringSplit)) : null;
  }


  //
  // init part
  //

  basis.ready(function(){
    // socket.io
    basis.dom.appendHead(
      basis.dom.createElement({
        description: 'script[src="/socket.io/socket.io.js"]',
        error: function(){
          console.warn('Error on loading ' + this.src);
        },
        load: function(){
          if (typeof io != 'undefined')
          {
            console.log('Connecting to server via socket.io');

            var observeCount = 0;
            var socket = io.connect('/');
            isReady.set(isReady_ = true);

            function sendToServerOffline(){
              console.warn('No connection with server :( Trying to send:', arguments);
            };
            function sendToServerOnline(){
              console.log('Send to server: ', arguments[0], arguments[1]);
              socket.emit.apply(socket, arguments);
            };

            //
            // add callbacks on events
            //
            Object.iterate({
              //
              // connection events
              //
              connect: function(){
                socket.emit('observe');

                sendToServer = sendToServerOnline;

                connectionState.set('connected');
                isOnline.set(isOnline_ = true);
              },
              disconnect: function(){
                sendToServer = sendToServerOffline;

                connectionState.set('offline');
                isOnline.set(isOnline_ = false);
              },
              connecting: function(){
                connectionState.set('connecting');
              },
              observeReady: function(filelist){
                File.all.sync(filelist);
              },

              //
              // file events
              //
              newFile: function(data){
                console.log('New file', data);

                File(data);
              },
              updateFile: function(data){
                console.log('File updated', data);

                var file = File(data.filename);
                file.setState(STATE.READY);
                file.commit(data);
              },
              deleteFile: function(data){
                console.log('File deleted', data);

                var file = File.get(data);
                if (file)
                  file.destroy();
              },

              //
              // common events
              //
              error: function(data){
                console.log('error:', data.operation, data.message);
              }
            }, socket.on, socket);
          }
        }
      })
    );
  });


  //
  // Main
  //


  //
  // File
  //

  var File = new nsEntity.EntityType({
    name: namespace + '.File',
    fields: {
      filename: basis.entity.StringId,
      type: String,
      lastUpdate: Date.fromISOString,
      content: function(value){
        if (value == null)
          return null;
        else
          return String(value);
      }
    }
  });

  File.entityType.entityClass.extend({
    read: function(){
      //this.setState(STATE.PROCESSING);
      sendToServer('readFile', this.data.filename);
    },
    save: function(){
      if (this.modified)
      {
        //this.setState(STATE.PROCESSING);
        var self = this;
        sendToServer('saveFile', this.data.filename, this.data.content, function(err){
          if (err)
          {
            self.setState(STATE.ERROR, err);
            console.log('File `' + self.data.filename + '` saving error: ', err);
          }
          else
          {
            self.setState(STATE.READY);
            console.log('File `' + self.data.filename + '` successfuly saved');
          }
        });
      }
    }
  });

  var filesByFolder = new nsDataset.Split({
    source: File.all,
    rule: function(object){
      var path = object.data.filename.split("/");
      path.pop();
      return path.join('/');
    }
  });

  var FILE_UPDATE_HANDLER = {
    update: function(file, delta){
      if ('filename' in delta || 'content' in delta)
        basis.resource(this.data.filename).update(this.data.content);
    }
  };

  var files = new nsDataset.Subset({
    source: File.all,
    rule: function(object){
      return object.data.type == 'file';
    },
    handler: {
      datasetChanged: function(dataset, delta){
        var array;

        if (array = delta.inserted)
          for (var i = 0; i < array.length; i++)
            array[i].addHandler(FILE_UPDATE_HANDLER);

        if (array = delta.deleted)
          for (var i = 0; i < array.length; i++)
            array[i].removeHandler(FILE_UPDATE_HANDLER);
      }
    }
  });

  var filesByType = new nsDataset.Split({
    source: files,
    rule: function(object){
      return object.data.filename.split('.').pop();
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    isReady: isReady,
    isOnline: isOnline,
    connectionState: connectionState,

    File: File,
    filesByFolder: filesByFolder,
    filesByType: filesByType,

    createFile: function(filename){
      sendToServer('createFile', filename);
    },
    abs2rel: function(path, base){
      return basis.path.relative(path, base);
    }
  });

})(this);