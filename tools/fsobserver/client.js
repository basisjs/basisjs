(function(){

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


  //
  // local vars
  //

  var socket;
  var isReady = new nsProperty.Property(false);
  var isOnline = new nsProperty.Property(false);
  var connectionState = new nsProperty.Property('offline', {
    change: function(state){
      console.log('connection state:', state);
    }
  });


  //
  // init part
  //

  basis.dom.ready(function(){
    // socket.io
    document.getElementsByTagName('head')[0].appendChild(
      basis.dom.createElement({
        description: 'script[src="//' + location.host + ':8222/socket.io/socket.io.js"]',
        load: initServerBackend,
        error: function(){
          //alert('too bad... but also good')
        }
      })
    );
  });

  function initServerBackend(){
    if (typeof io != 'undefined')
    {
      socket = io.connect(':8222');
      isReady.set(true);

      socket.on('connect', function(){
        connectionState.set('online');
        isOnline.set(true);
      });
      socket.on('disconnect', function(){
        connectionState.set('offline');
        isOnline.set(false);
      });
      socket.on('connecting', function(){
        connectionState.set('connecting');
      });


      socket.on('newFile', function (data) {
        console.log('new file', data);

        File(data);
      });
      socket.on('updateFile', function (data) {
        console.log('file updated', data);

        File(data);
      });
      socket.on('deleteFile', function (data) {
        console.log('file deleted', data);

        var file = File.get(data);
        if (file)
          file.destroy();
      });
      socket.on('fileSaved', function (data) {
        console.log('file saved', data);
      });
      socket.on('filelist', function (data) {
        console.log('filelist', data.length + ' files');
        File.all.sync(data);
      });
      socket.on('error', function (data) {
        console.log('error:', data.operation, data.message);
      });
    }
  }

  //
  // Main logic
  //

  var File = new nsEntity.EntityType({
    name: namespace + '.File',
    fields: {
      filename: basis.entity.StringId,
      type: String,
      lastUpdate: Date.fromISOString,
      content: String
    }
  });

  File.entityType.entityClass.extend({
    save: function(){
      if (this.modified)
        if (isOnline.value)
        {
          socket.emit('saveFile', this.data.filename, this.data.content);
        }
        else
        {
          alert('No connection with server :(');
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

  var files = new nsDataset.Subset({
    source: File.all,
    rule: function(object){
      return object.data.type == 'file';
    }
  });

  var filesByType = new nsDataset.Split({
    source: files,
    rule: function(object){
      return object.data.filename.split('.').pop();
    }
  });


  var templateUpdateHandler = {
    update: function(file, delta){
      if ('filename' in delta || 'content' in delta)
      {
        var tempalteFile = basis.template.filesMap[this.data.filename.replace('../templater/', '')];
        if (tempalteFile)
          tempalteFile.update(this.data.content);
      }
    }
  };

  filesByType.getSubset('tmpl', true).addHandler({
    datasetChanged: function(dataset, delta){
      var array;

      if (array = delta.inserted)
        for (var i = 0; i < array.length; i++)
          array[i].addHandler(templateUpdateHandler);

      if (array = delta.deleted)
        for (var i = 0; i < array.length; i++)
          array[i].removeHandler(templateUpdateHandler);
    }
  });

  var styleUpdateHandler = {
    update: function(file, delta){
      if ('filename' in delta || 'content' in delta)
      {
        var styleSheets = document.styleSheets;
        var filename = this.data.filename.replace('../templater/', '');
        var relBaseRx = new RegExp('^' + location.href.replace(/\/[^\/]+$/, '/').forRegExp());
        for (var i = 0; i < styleSheets.length; i++)
        {
          var styleUrl = (styleSheets[i].href || '').replace(relBaseRx, '').replace(/\?.+$/, '');
          console.log(styleUrl, filename);
          if (styleUrl == filename)
          {
            styleSheets[i].ownerNode.href = filename + '?' + Math.random();
            return;
          }
        }
      }
    }
  };

  filesByType.getSubset('css', true).addHandler({
    datasetChanged: function(dataset, delta){
      var array;

      if (array = delta.inserted)
        for (var i = 0; i < array.length; i++)
          array[i].addHandler(styleUpdateHandler);

      if (array = delta.deleted)
        for (var i = 0; i < array.length; i++)
          array[i].removeHandler(styleUpdateHandler);
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
    filesByType: filesByType
  });

})();