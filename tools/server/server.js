
  var http = require('http');
  var socket_io = require('socket.io');
  var fs = require('fs');
  var url = require('url');
  var path = require('path');
  var mime = require('mime');

  var fs_debug = false;

  var BASE_PATH = path.normalize(process.argv[2]);
  var port = process.argv[3];

  // settings
  var readExtensions = ['.css', '.tmpl', '.txt', '.json', '.js'];
  var notifyExtensions = ['.css', '.tmpl', '.txt', '.json'];
  var hotStartExtensions = ['.css', '.tmpl', '.json', '.js'];
  var ignorePathes = ['.svn', '.git'];
  var rewriteRules = [];

  // check base path
  if (!path.existsSync(BASE_PATH))
  {
    console.warn('Base path `' + BASE_PATH + '` not found');
    process.exit();
  }

  // process config
  var configFilename = path.resolve(BASE_PATH, 'server.config');
  if (path.existsSync(configFilename))
  {
    console.log('Config found:', configFilename);
    try {
      var data = fs.readFileSync(configFilename);
      var config = JSON.parse(String(data));

      if ('port' in config)
      {
        port = Number(config.port);
        console.log('  Set server port:', port);
      }

      if (Array.isArray(config.ignore))
      {
        ignorePathes = config.ignore;
        console.log('  Ignore pathes: ' + ignorePathes);
      }

      if (config.rewrite)
      {
        try {
          httpProxy = require('http-proxy');
          console.log('\n  Rewrite rules:');
          for (var key in config.rewrite)
          {
            console.log('    /' + key + '/ -> ' + config.rewrite[key]);
            rewriteRules.push({
              re: new RegExp(key),
              replace: config.rewrite[key]
            });
          }
        } catch(e) {
          console.warn('  Proxy is not supported (requires http-proxy). Rewrite rules ignored.');
        }
      }
      console.log('\nConfig parse done.\n');

    } catch(e) {  
      console.warn(e + '\n');
    }
  }

  //
  // port
  //
  if (isNaN(port))
    port = 0;

  //
  // ignore pathes
  //
  ignorePathes = ignorePathes.map(function(p){
    return path.resolve(BASE_PATH, p);
  });

  //create server
  console.log('Start server');

  var hotStartCache = (function(){
    var cache = {};
    var content = '{}';
    var timer_;

    function rebuild(){
      timer_ = 0;
      content = JSON.stringify(cache, null, 2);
      console.log('[CACHE] rebuild');
      //fs.writeFile('server/cache.tmp', content, 'utf-8');
    }

    return {
      isRequire: function(fnKey){
        return fnKey in cache;
      },
      add: function(fnKey, content){
        if (cache[fnKey] !== content)
        {
          console.log('[CACHE] ' + (fnKey in cache ? 'update ' : 'add ') + fnKey);
          cache[fnKey] = content;

          if (!timer_)
            timer_ = setTimeout(rebuild, 100);
        }
      },
      remove: function(fnKey){
        if (fnKey in cache)
        {
          console.log('[CACHE] remove ' + fnKey);
          delete cache[fnKey];

          if (!timer_)
            timer_ = setTimeout(rebuild, 100);
        }
      },
      get: function(){
        return content;
      }
    }
  })();


  var proxy;
  var app = http.createServer(function(req, res){
    var location = url.parse(req.url, true, true);
    var pathname = location.pathname.slice(1);

    //proxy request if nececcary
    for (var i = 0, rule; rule = rewriteRules[i]; i++)
    {
      if (rule.re.test(pathname))
      {
        if (!proxy)
        {
          proxy = new httpProxy.HttpProxy({
            target: {
              host: 'localhost',
              port: 80
            }
          });
        }

        //console.log(re);
        proxy.proxyRequest(req, res);
        return;
      }
    }

    //
    var filename = path.normalize(BASE_PATH + location.pathname);
    var fnKey = normPath(filename);
    console.log('[CLIENT] request', fnKey);

    if (fnKey == '/FDF31FF4-1532-421C-A865-99D0E77ADE04.js')
    {
      res.writeHead(200, {
        'Content-Type': 'text/javascript'
      });
      res.end('window.__resources__ = ' + hotStartCache.get());
      return;
    }

    if (fnKey == '/favicon.ico')
    {
      if (!path.existsSync(filename))
        filename = __dirname + '/favicon.ico';
    }

    if (!path.existsSync(filename))
    {
      res.writeHead(404);
      res.end('File ' + filename + ' not found');
    }
    else
    {
      if (fs.statSync(filename).isDirectory())
      {
        if (!/\/$/.test(location.pathname))
        {
          res.writeHead(301, {
            Location: location.pathname + '/'
          });
          res.end();
          return;
        }

        if (path.existsSync(filename + '/index.html'))
          filename += '/index.html';
        else
          if (path.existsSync(filename + '/index.htm'))
            filename += '/index.htm';
          else
          {
            res.writeHead(404);
            res.end('Path ' + filename + ' is not file');
          }
      }

      function processFile(err, data){
        if (err)
        {
          res.writeHead(500);
          res.end('Can\'t read file ' + filename + ', error: ' + err);
        }
        else
        {
          res.writeHead(200, {
            'Content-Type': mime.lookup(filename, 'text/plain') //MIME_TYPE[ext.slice(1)] || 'text/plain'
          });

          var ext = path.extname(filename);

          if (hotStartExtensions.indexOf(ext) != -1 && ignorePathes.indexOf(path.normalize(filename)) == -1)
            hotStartCache.add(fnKey, String(data));

          if (ext == '.html' || ext == '.htm')
          {
            var fileContent = String(data)
              .replace(/<head>/i, '<head><script src="/FDF31FF4-1532-421C-A865-99D0E77ADE04.js"></script>');

            fs.readFile(__dirname + '/client.js', 'utf-8', function(err, clientFileData){
              if (!err)
                res.end(fileContent.replace(/<\/body>/i, '<script>' + clientFileData + '</script></body>'));
            });
          }
          else
          {
            res.end(data);
          }
        }
      }

      if (fileMap[fnKey] && fileMap[fnKey].content != null)
        processFile(null, fileMap[fnKey].content)
      else
        fs.readFile(filename, processFile);
    }
  });

  app.listen(port, function(){
    var port = app.address().port;
    console.log([
      'Server is online, listen for http://localhost:' + port,
      'Watching changes for path: ' + BASE_PATH,
      'Ignore pathes:\n  ' + ignorePathes.join('\n  ')
    ].join('\n') + '\n------------');
  });

  //
  // Messaging
  //

  var io = socket_io.listen(app);
  io.disable('log');

  io.sockets.on('connection', function(socket){
    socket.on('saveFile', function(filename, content, callback){
      console.log('Save file', arguments);

      var fname = path.normalize(BASE_PATH + '/' + filename);

      if (!fsWatcher.isObserveFile(fname))
        callback('file not observable');
      else
        fs.writeFile(fname, content, function(err){
          callback(err);
        });
    });

    socket.on('createFile', function(filename, content, callback){
      console.log('create file', arguments);

      if (typeof callback != 'function')
        callback = Function();

      var fname = BASE_PATH + '/' + filename;
       
      if (path.existsSync(fname) || !path.existsSync(path.dirname(fname)))
        callback('bad filename');
      else
        fs.writeFile(fname, '', function(err){
          callback(err);
        });
    });

    socket.on('readFile', function(filename, content){
      console.log('read file', arguments);
      fsWatcher.readFile(BASE_PATH + '/' + filename);
    });

    socket.on('observe', function(rel, fspath){
      socket.emit('observeReady', fsWatcher.getFiles(BASE_PATH + '/'));
    });
  });

  var createCallback = function(fileInfo){
    console.log('[SOCKET] broadcast newFile');
    io.sockets.emit('newFile', fileInfo);
  }
  var updateCallback = function(fileInfo){
    console.log('[SOCKET] broadcast updateFile');
    io.sockets.emit('updateFile', fileInfo);
  }
  var deleteCallback = function(filename){
    console.log('[SOCKET] broadcast deleteFile');
    io.sockets.emit('deleteFile', normPath(filename));
  }

  function normPath(filename){
    return '/' + path.relative(BASE_PATH, path.resolve(BASE_PATH, filename)).replace(/\\/g, '/')
  }

  //
  // File System Watcher
  //

  var fileMap = {};
  var fsWatcher = (function(){
    var dirMap = {};
    function readFile(filename){
      if (readExtensions.indexOf(path.extname(filename)) != -1)
      {
        fs.readFile(filename, 'utf8', function(err, data){
          if (!err)
          {
            console.log('[FS] file read ' + filename);
            var fnKey = normPath(filename);
            var fileInfo = fileMap[fnKey];
            var newContent = String(data).replace(/\r\n?|\n\r?/g, '\n');

            var newFileInfo = {
              filename: normPath(filename),
              lastUpdate: fileInfo.mtime
            };

            if (newContent !== fileInfo.content)
              fileInfo.content = newContent;

            newFileInfo.content = newContent;

            if (fileInfo.notify)
              updateCallback(newFileInfo);

            if (fileInfo.hotStart && hotStartCache.isRequire(fnKey))
              hotStartCache.add(fnKey, newContent);
          }
          else
            console.log('[FS] Error: Can\'t read file ' + filename + ': ' + err);
        });
      }
    }

    function updateStat(filename){
      filename = path.normalize(filename);

      fs.stat(filename, function(err, stats){
        var fnKey = normPath(filename);

        if (err)
        {
          console.log('updateStat error:', err);
        }
        else
        {
          var fileInfo = fileMap[fnKey];

          if (!fileMap[fnKey])
          {
            var fileType = stats.isDirectory() ? 'dir' : 'file';
            var ext = path.extname(filename);

            fileMap[fnKey] = {
              mtime: stats.mtime,
              type: fileType,
              hotStart: hotStartExtensions.indexOf(ext) != -1,
              notify: notifyExtensions.indexOf(ext) != -1,
              content: null
            };

            // event!! new file
            if (filename != BASE_PATH)
            {
              console.log('[FS] new -> ' + filename);

              createCallback({
                filename: normPath(filename),
                type: fileType,
                lastUpdate: stats.mtime
              });
            }

            if (fileType == 'dir')
            {
              //console.log(filename, path.normalize(filename));
              if (ignorePathes.indexOf(path.normalize(filename)) == -1)
                lookup(filename);
            }
            else
            {
              readFile(filename);
            }
          }
          else
          {
            if (fileMap[fnKey].type == 'file' && stats.mtime - fileMap[fnKey].mtime)
            {
              console.log('[FS] update -> ' + filename);
              fileInfo.mtime = stats.mtime;
              readFile(filename);
            }
          }
        }
      });
    }

    function lookup(dirname){
      path.exists(dirname, function(exists){
        if (exists)
          fs.readdir(dirname, function(err, files){
            if (err)
              console.log('lookup error:', dirname, err);
            else
            {
              var filename;
              var dirInfo = dirMap[dirname];

              updateStat(dirname);

              if (dirInfo)
              {
                var dirFiles = dirInfo.files;
                for (var i = 0, file; file = dirFiles[i++];)
                {
                  if (files.indexOf(file) == -1)
                  {
                    var filename = path.normalize(dirname + '/' + file);
                    var fnKey = normPath(filename);
                    var fileInfo = fileMap[fnKey];
                    delete fileMap[fnKey];

                    hotStartCache.remove(fnKey);

                    // event!!
                    deleteCallback(filename);
                    console.log('[FS] delete -> ' + filename); // file lost
                  }
                }
              }
              else
              {
                dirInfo = dirMap[dirname] = {};

                // start watching
                fs.watch(dirname, function(event, filename){
                  lookup(dirname);
                });
              }

              dirInfo.files = files;

              for (var file, i = 0; file = files[i++];)
                updateStat(dirname + '/' + file);
            }
          });
      });
    }

    lookup(BASE_PATH);

    return {
      readFile: readFile,
      getFiles: function(path){
        var result = [];

        for (var filename in fileMap)
        {
          if (filename != '/')
          {
            result.push({
              filename: filename,
              type: fileMap[filename].type,
              lastUpdate: fileMap[filename].mtime/*,
              content: null//fileMap[filename].content*/
            });
          }
        }

        return result;
      },
      isObserveFile: function(filename){
        return !!fileMap[normPath(filename)];
      }
    }

  })();

