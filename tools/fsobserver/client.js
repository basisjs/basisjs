(function(global){

  basis.require('basis.date');
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
      console.log('connection state:', state);
    }
  });

  var console = global.console;
  if (typeof console == 'undefined')
    console = { log: Function(), warn: Function() };

  /*var settingsPath = 'basis.devtools.observer_' + location.pathname.replace(/\/[^\/\.]+?(\.[^\/\.]+)$/, '/').replace(/[^a-z0-9]/g, '_');
  var listenDirs = typeof localStorage != 'undefined' ? JSON.parse(localStorage[settingsPath]) : {};*/
  //var listenDirs = {};

  var documentHead = document.getElementsByTagName('head')[0];

  //
  // init part
  //

  basis.ready(function(){
    // socket.io
    document.getElementsByTagName('head')[0].appendChild(
      basis.dom.createElement({
        description: 'script[src="/socket.io/socket.io.js"]',
        error: function(){
          console.warn('Error on loading ' + this.src);
          //alert('too bad... but also good')
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
                //filelist.map(File);
                /*var path = ListenPath.get(rel)

                console.log('listen for ' + rel + ' (ready ' + filelist.length + ' files)');

                if (path)
                  path.files.set(filelist.map(File));

                observeCount--;
                if (!observeCount)
                {
                  connectionState.set('online');
                  isOnline.set(isOnline_ = true);
                }*/
              },

              //
              // file events
              //
              newFile: function(data){
                console.log('new file', data);

                File(data);
              },
              updateFile: function(data){
                console.log('file updated', data);

                var file = File(data.filename);
                file.setState(STATE.READY);
                file.commit(data);
              },
              deleteFile: function(data){
                console.log('file deleted', data);

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
  // Main logic
  //

  /*var ListenPath = new nsEntity.EntityType({
    name: namespace + '.ListenPath',
    fields: {
      rel: basis.entity.StringId,
      fspath: String
    }
  });

  var fileDatasets = {};
  var allFiles = new basis.data.dataset.Merge();
  window.allFiles = allFiles;

  ListenPath.all.addHandler({
    datasetChanged: function(dataset, delta){
      var array;

      if (array = delta.inserted)
        for (var i = 0, path; path = array[i]; i++)
        {
          path.files = new basis.data.Dataset({
            data: {
              path: path.rel,
              fspath: path.fspath
            }
          });
          allFiles.addSource(path.files);
        }

      if (array = delta.deleted)
        for (var i = 0; i < array.length; i++)
        {
          array[i].files.destroy();
          delete array[i].files;
        }
    }
  });

  window.ListenPath = ListenPath;
  for (var path in listenDirs)
  {
    ListenPath({
      rel: path,
      fspath: listenDirs[path]
    });
  }*/


  //
  // File
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

  var FileClass = File.entityType.entityClass;

  FileClass.extend({
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
            console.log('file save error: ', err);
          }
          else
          {
            self.setState(STATE.READY);
            console.log('file saved', self.data.filename);
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
        /*var templateFile = basis.template.filesMap[this.data.filename];
        if (templateFile)
          templateFile.update(this.data.content);*/

        basis.resource(this.data.filename).update(this.data.content);
      }
    }
  };

  //filesByType.getSubset('tmpl', true)
  files.addHandler({
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


  var linkEl = document.createElement('A');
  document.body.appendChild(linkEl);

  var baseEl = basis.dom.createElement('base');

  function setBase(path){
    linkEl.href = path;                         // Opera and IE doesn't resolve pathes correctly, if base href is not an absolute path
    baseEl.setAttribute('href', linkEl.href);

    basis.dom.insert(documentHead, baseEl, 0); // even if there is more than one <base> elements, only first has effect
  }
  function restoreBase(){
    baseEl.setAttribute('href', location);      // Opera left document base as <base> element specified,
                                                // even if this element is removed from document
    basis.dom.remove(baseEl);    
  }

  function deleteImports(imports){
    if (!imports || !imports.length)
      return;

    for (var i = 0; i < imports.length; i++)
    {
      deleteImports(imports[i].imports);
      styleSheetFileMap[imports[i].url].remove(imports[i]);
      basis.dom.remove(imports[i].styleEl);
    }
  }

  var styleUpdateHandler = {
    update: function(file, delta){
      if ('filename' in delta || 'content' in delta)
      {
        var url = this.data.filename;
        var fileInfo = styleSheetFileMap[url];

        if (fileInfo)
        {
          styleSheetFileMap[url] = [];
          for (var i = 0, elem; elem = fileInfo[i]; i++)
          {
            deleteImports(elem.imports);
            linearStyleSheet(elem.styleEl, null, elem.cssFileStack, url);
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

  var styleSheetFileMap = {};
  window.styleSheetFileMap = styleSheetFileMap; // TODO: remove

  function abs2rel(path, base){
    if (base)
    {
      setBase(base);
      linkEl.href = path;
      path = linkEl.href;
      restoreBase();
    }
    else
    {
      linkEl.href = path;
      path = linkEl.href;
    }

    var abs = path.split(/\//);
    var loc = location.href.replace(/\/[^\/]*$/, '').split(/\//);
    //var res = [];
    var i = 0;

    while (abs[i] == loc[i] && typeof loc[i] == 'string')
      i++;

    //while (i < loc.length)
    //  res.push('..');

    //return res.concat(abs.slice(i)).join('/');

    return '../'.repeat(loc.length - i) + abs.slice(i).join('/');
  }

  var revisitQueue = [];
  function processRevisitQueue(){
    for (var i = revisitQueue.length; i --> 0;)
    {
      var params = revisitQueue[i];
      var rule = params.rule;
      if (rule.styleSheet)
      {
        console.log('revisit rule styleSheet success', rule.href);
        revisitQueue.splice(i, 1);
        var importSheet = linearStyleSheet(rule.styleSheet, params.insertPoint, params.cssFileStack);
        if (importSheet)
          params.imports.push(importSheet);
      }
      else
      {
        if (params.attempts++ > 10)
        {
          console.log('delete revisit rule, because too many attempts', rule.href);
          revisitQueue.splice(i, 1);
        }
      }  
    }

    if (revisitQueue.length)
      setTimeout(processRevisitQueue, 5);
  }
  function addToRevisitQueue(rule, imports, insertPoint, cssFileStack){
    console.log('add rule to revisit queue', rule.href);

    if (!revisitQueue.search(rule, 'rule'))
    {
      revisitQueue.push({
        attempts: 0,
        rule: rule,
        imports: imports,
        insertPoint: insertPoint,
        cssFileStack: cssFileStack
      });

      if (revisitQueue.length == 1)
        setTimeout(processRevisitQueue, 5);
    }
  }

  var nonObservableFilesCache = {};
  var styleSeed = 0;
  var insertHelper = document.createComment('');

  function linearStyleSheet(styleEl, insertPoint, cssFileStack, url){
    var sheetUrl = url || abs2rel(styleEl.sheet.href);
    var imports = [];
    var content = [];

    if (!cssFileStack)
      cssFileStack = [];
    else
    {
      if (cssFileStack.has(sheetUrl))  // prevent for recursion
      {
        console.warn('prevent recursion for', sheetUrl, cssFileStack);
        return;
      }
    }

    //cssFileStack.push(sheetUrl);

    //
    // fetch style content
    //
    var cssText;
    var cssFile = File.get(sheetUrl);
    if (cssFile)
    {
      cssText = cssFile.data.content;
    }
    else
    {
      cssText = nonObservableFilesCache[sheetUrl];
      if (typeof cssText != 'string')
      {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', sheetUrl, false);
        xhr.send(null);
        
        if (xhr.status >= 200 && xhr.status < 400)
        {
          cssText = xhr.responseText;
          nonObservableFilesCache[sheetUrl] = cssText;
        }
        else
        {
          console.warn('fail to load css content', sheetUrl);
          return;
        }
      }
    }

    //
    // parse content
    //
    setBase(sheetUrl);

    var tmpStyleEl = basis.dom.createElement(
      'style[type="text/css"][seed="' + (styleSeed++) + '"][sourceFile="' + sheetUrl + '"]',// + (styleSheet.media && styleSheet.media.mediaText ? '[media="' + styleSheet.media.mediaText + '"]' : ''),
      cssText
    );

    documentHead.insertBefore(tmpStyleEl, insertPoint || styleEl);
    if (!styleEl || styleEl.tagName == 'LINK')
    {
      var newStyleEl = tmpStyleEl.cloneNode(false);
      documentHead.insertBefore(newStyleEl, insertPoint || styleEl);

      if (styleEl)
        basis.dom.remove(styleEl);

      styleEl = newStyleEl;
    }

    //if (styleEl)
    //  basis.dom.remove(styleEl);
    //styleEl = tmpStyleEl;

    restoreBase();

    //
    // process rules
    //
    var styleSheet = tmpStyleEl.sheet;
    var rules = styleSheet.cssRules || styleSheet.rules;
    for (var i = rules.length, rule; i --> 0;)
    {
      var rule = rules[i];
      if (rule.type == 3)
      {
        var importSheet = linearStyleSheet(null, tmpStyleEl, cssFileStack.concat(sheetUrl), abs2rel(rule.href, sheetUrl));
        if (importSheet)
          imports.push(importSheet);

        styleSheet.deleteRule(i);
      }
      else
      {
        content.push(rule.cssText);
      }
    }

    setBase(sheetUrl);
    styleEl.innerHTML = content.join('\n');
    restoreBase();

    basis.dom.remove(tmpStyleEl);

    //
    // build sheet info
    //

    var sheetInfo = {
      url: sheetUrl,
      styleEl: styleEl,
      imports: imports,
      cssFileStack: cssFileStack
    };

    if (!styleSheetFileMap[sheetUrl])
      styleSheetFileMap[sheetUrl] = [sheetInfo];
    else
      styleSheetFileMap[sheetUrl].push(sheetInfo);


    //
    // return result
    //

    return sheetInfo;
  }


  /*isOnline.addLink(null, function(value){
    if (value)
      Array.from(document.styleSheets).forEach(function(styleSheet){
        if (styleSheet.ownerNode)
          if (styleSheet.ownerNode.tagName == 'LINK')
            linearStyleSheet(styleSheet.ownerNode);
      });
  });*/

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
    abs2rel: abs2rel
  });

})(this);