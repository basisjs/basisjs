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

  var isReady_ = false;
  var isOnline_ = false;

  var isReady = new nsProperty.Property(isReady_);
  var isOnline = new nsProperty.Property(isOnline_);
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
      isReady.set(isReady_ = true);

      socket.on('connect', function(){
        connectionState.set('online');
        isOnline.set(isOnline_ = true);
      });
      socket.on('disconnect', function(){
        connectionState.set('offline');
        isOnline.set(isOnline_ = false);
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
        if (isOnline_)
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


  var linkQueue = [];
  var linkQueueTimer;
  function processLinkQueue(){
    linkQueueTimer = clearTimeout(linkQueueTimer);

    for (var i = linkQueue.length; i --> 0;)
    {
      var linkEl = linkQueue[i];
      if (linkEl)
      {
        linkQueue.splice(i, 1);
        linkEl.parentNode.removeChild(linkEl);
      }
    }

    if (linkQueue.length)
      linkQueueTimer = setTimeout(processLinkQueue, 1000/60);
  }
  function addUrlToQueue(url){
    var linkEl = evalFrameDoc.createElement('link');
    linkEl.rel = "stylesheet";
    linkEl.type = "text/css";
    linkEl.href = url + (url.indexOf('?') == -1 ? '?' : '&') + Math.random();
    evalFrameDoc.head.appendChild(linkEl);
    linkQueue.push(url);
    if (!linkQueueTimer)
      linkQueueTimer = setTimeout(processLinkQueue, 1000/60);
  }

  var styleUpdateHandler = {
    update: function(file, delta){
      if ('filename' in delta || 'content' in delta)
      {
        var url = this.data.filename.replace('../templater/', '');
        var fileInfo = styleSheetFileMap[url];

        if (fileInfo)
        {
          var res = resolver.resolveCss(url, this.data.content);

          for (var i = 0, elem; elem = fileInfo.elems[i]; i++)
          {
            //elem.styleEl.innerHTML = res.content.join('\n');
            var replaceStyleEl = elem.styleEl.cloneNode(false);
            replaceStyleEl.appendChild(document.createTextNode(res.content.join('\n')))
            basis.dom.replace(elem.styleEl, replaceStyleEl);
            elem.styleEl = replaceStyleEl;
          }

          /*
          var rules = fileInfo.rules;
          for (var i = 0; i < rules.length; i++)
          {
            var rule = rules[i];
            var styleSheet = rule.styleSheet;
            var res = resolver.resolveCss(url, this.data.content);

            var count = styleSheet.rules.length;
            while (count --> 0)
              styleSheet.removeRule(0);

            for (var j = 0; j < res.rules.length; j++)
            {
              console.log(res.rules[j].cssText);
              styleSheet.insertRule(res.rules[j].cssText, j);
            }
          }*/

          //document.body.className = document.body.className;
        }

        /*var styleInfo = cssFileMap[url];

        if (styleInfo)
        {
          var res = resolver.resolveCss(url, this.data.content);
          var styleEl = styleInfo.styleEl;
          var newStyleEl = styleEl.cloneNode(false);

          newStyleEl.appendChild(document.createTextNode(res.content.join('\n')));

          cssFileMap[url].styleEl = newStyleEl;
          basis.dom.replace(styleEl, newStyleEl);
        }*/
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




  var cssFileMap = {};
  var styleSheetFileMap = {};
  window.styleSheetFileMap = styleSheetFileMap;
  var pathResolvers = {};
  var relBaseRx = new RegExp('^' + location.href.replace(/\/[^\/]+$/, '/').forRegExp());

  window.absToRel = function(path){
    var abs = path.split(/\//);
    var loc = location.href.replace(/\/[^\/]*$/, '').split(/\//);
    var i = 0;

    while (abs[i] == loc[i] && typeof loc[i] == 'string')
      i++;

    return '../'.repeat(loc.length - i) + abs.slice(i).join('/');
  }

  function linearStyleSheet(styleSheet, insertPoint){
    var rules = styleSheet.cssRules || styleSheet.rules;
    var imports = [];
    var content = [];

    var sheetUrl = absToRel(styleSheet.href)

    for (var i = rules.length, rule; i --> 0;)
    {
      var rule = rules[i];
      console.log(sheetUrl, rule.cssText);
      if (rule.type == 3)
      {
        //var url = rule.styleSheet.href.replace(relBaseRx, '');
        if (rule.styleSheet)
        {
        var url = absToRel(rule.styleSheet.href);

        /*if (!styleSheetFileMap[url])
          styleSheetFileMap[url] = {
            imports: []
          };

        if (!cssFileMap[url])
        {
        }*/

        /*var res;
        var importStyleEl = basis.dom.createElement(
          'style[type="text/css"][sourceFile="' + url + '"]' + (rule.media.mediaText ? '[media="' + rule.media.mediaText + '"]' : '')
        );*/

        // insert into body
        res = linearStyleSheet(rule.styleSheet, insertPoint);
        imports.push(res.sheetInfo);
        }
        /*importStyleEl.appendChild(document.createTextNode(res.content));
        insertPoint.parentNode.insertBefore(importStyleEl, insertPoint);

        styleSheetFileMap[sheetUrl].elems.push({
          url: sheetUrl,
          styleEl: importStyleEl,
          imports: res.imports
        });

        imports.push({
          url: url,
          styleEl: importStyleEl,
          imports: res.imports
        });*/

        styleSheet.deleteRule(i);
      }
      else
      {
        content.unshift(rules[i].cssText);
      }
    }

    //
    // insert new <style> element
    //
    var styleEl = basis.dom.createElement(
      'style[type="text/css"][sourceFile="' + sheetUrl + '"]' + (styleSheet.media && styleSheet.media.mediaText ? '[media="' + styleSheet.media.mediaText + '"]' : ''),
      content.join('\n')
    );
    var sheetInfo = {
      url: sheetUrl,
      styleEl: styleEl,
      imports: imports
    };

    if (!styleSheetFileMap[sheetUrl])
      styleSheetFileMap[sheetUrl] = {
        elems: []
      };

    styleSheetFileMap[sheetUrl].elems.push(sheetInfo);

    if (styleSheet.ownerNode)
      basis.dom.replace(styleSheet.ownerNode, styleEl);
    else
      insertPoint.parentNode.insertBefore(styleEl, insertPoint);

    //
    // return result
    //

    return {
      sheetInfo: sheetInfo,
      imports: imports,
      content: content.join('\n')
    };
  }


  var evalFrameDoc;
  //var resolver;
  basis.dom.ready(function(){
    document.body.appendChild(basis.dom.createElement({
      description: 'iframe[src="resolver.html"][style="position:absolute;top:-100px;left:-100px;visibility:hidden;width:10px;height:10px;"]',
      load: function(){
        var doc = this.contentDocument;

        var baseEl = doc.createElement('base');
        doc.head.appendChild(baseEl);

        var styleEl = doc.createElement('style');
        doc.head.appendChild(styleEl);

        var linkEl = doc.createElement('a');
        doc.body.appendChild(linkEl);

        window.resolver = {
          resolvePath: function(base, path){
            baseEl.href = base;
            linkEl.href = path;

            return linkEl.href;
          },
          resolveCss: function(path, cssText){
            baseEl.href = path;
            styleEl.innerHTML = cssText;

            var rules = styleEl.sheet.cssRules || styleEl.sheet.rules;
            var imports = [];
            var content = [];
            for (var i = 0; rule = rules[i]; i++)
            {
              if (rule.type == 3)  // @import rules
              {
                linkEl.href = rule.href;
                imports.push(linkEl.href);
                rule.absUrl = linkEl.href;
              }
              else
                content.push(rule.cssText);
            }

            return {
              rules: rules,
              imports: imports,
              content: content
            }
          }
        };

        Array.from(document.styleSheets).forEach(function(styleSheet){
          if (styleSheet.ownerNode.tagName == 'LINK')
            linearStyleSheet(styleSheet, styleSheet.ownerNode);
        });
      }
    }));
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