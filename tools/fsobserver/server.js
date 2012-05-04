
  var http = require('http');
  var socket_io = require('socket.io');
  var fs = require('fs');
  var url = require('url');
  var path = require('path');
  var mime = require('mime');


  var fs_debug = false;
  var is_dev = true;

  var BASE_PATH = process.argv[2];
  var port = process.argv[3];
  var configFilename = path.resolve(BASE_PATH, 'server.config');

  //load proxy pathes
  var config = {};
  var rewriteRules = [];
  if (path.existsSync(configFilename))
  {
    console.log('Config found:', configFilename);
    try {
      var data = fs.readFileSync(configFilename);
      config = JSON.parse(String(data));

      if ('port' in config)
      {
        port = Number(config.port);
        console.log('  Set server port:', port);
      }

      if (Array.isArray(config.ignore))
      {
        config.ignore = config.ignore.reduce(function(result, p){
          result[path.resolve(BASE_PATH, p)] = true;
          return result;
        }, {});
        console.log('\n  Ignore pathes:\n    ' + Object.keys(config.ignore).join('\n    '));
      }
      else
        delete config.ignore;

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

  if (isNaN(port))
    port = 0;

  //proxy

  console.log('Start server');
  //create server
  var proxy;
  var app = http.createServer(function(req, res){
  
    var location = url.parse(req.url, true, true);
    var host = req.headers.host;

    //proxy request if nececcary
    var pathname = location.pathname.slice(1);
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

    var filename = path.normalize(BASE_PATH + location.pathname);

    if (!path.existsSync(filename))
    {
      res.writeHead(404);
      res.end('File ' + filename + ' not found');
    }
    else
    {
      if (fs.statSync(filename).isDirectory())
      {
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

      var ext = path.extname(filename);

      fs.readFile(filename, function(err, data){
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

          if (ext == '.html' || ext == '.htm')
          {
            fs.readFile(__dirname + '/client.js', function(err, clientFileData){
              if (!err)
              {
                data = String(data).replace(/<\/body>/, '<script>' + clientFileData + '</script></body>');
                res.end(data);
              }
            });
          }
          else
          {
            res.end(data);
          }
        }
      });
    }
  });

  app.listen(port, function(){
    var port = app.address().port;
    console.log('Server is online, listen for http://localhost:' + port + '\nWatching changes for path: ' + BASE_PATH);
  });
  var io = socket_io.listen(app);

  //
  // Messaging
  //

  io.sockets.on('connection', function(socket){
    socket.on('saveFile', function(filename, content){
      console.log('save file', arguments);

      var fname = path.normalize(BASE_PATH + '/' + filename);
      var fnKey = normPath(fname);

      if (fsWatcher.isObserveFile(fnKey))
      {
        fs.writeFile(fname, content, function (err) {
          if (err)
          {
            socket.emit('fileSaveError', {
              filename: filename,
              message: err
            });
          }
          else
          {
            socket.emit('fileSaved', fnKey);
          }
        });
      }
      else
        socket.emit('fileSaveError', {
          filename: filename,
          message: 'file not observable'
        });
    });

    socket.on('createFile', function(filename, content){
      console.log('create file', arguments);

      var fname = BASE_PATH + '/' + filename;
       
      if (!path.existsSync(fname) && path.existsSync(path.dirname(fname)))
      {
        fs.writeFile(fname, '', function (err) {
          if (err)
          {
            socket.emit('error', {
              operation: 'create file',
              message: err
            });
          }
          else
          {
            socket.emit('fileSaved', filename);
          }
        });
      }
      else
        socket.emit('error', {
          operation: 'create file',
          message: 'bad filename'
        });
    });

    socket.on('readFile', function(filename, content){
      console.log('read file', arguments);

      fsWatcher.readFile(BASE_PATH + '/' + filename);
    });


    socket.on('observe', function(rel, fspath){
      fsWatcher.watch(BASE_PATH);
      socket.emit('observeReady', fsWatcher.getFiles(BASE_PATH + '/'));
    });
  });

  io.sockets.on('disconnect', function(socket){
    //socket.files.forEach(fsWatcher.removeContentObserver);
    delete socket.pathes;
  });

  function normPath(filename){
    return '/' + path.relative(BASE_PATH, path.resolve(BASE_PATH, filename)).replace(/\\/g, '/')
  }

  //
  // File System Watcher
  //

  var fsWatcher = (function(){
    var fileMap = {};
    var dirMap = {};

    function readFile(filename){
      if (path.extname(filename) == '.css' || path.extname(filename) == '.tmpl' || path.extname(filename) == '.txt' || path.extname(filename) == '.json')
      {
        fs.readFile(filename, 'utf8', function(err, data){
          console.log('READ FILE:', filename);
          if (!err)
          {
            console.log('key', path.relative(BASE_PATH, filename).replace(/\\/g, '/'));

            var fileInfo = fileMap[normPath(filename)];
            var newContent = String(data).replace(/\r\n?|\n\r?/g, '\n');

            var newFileInfo = {
              filename: filename,
              lastUpdate: fileInfo.mtime
            };

            if (newContent !== fileInfo.content)
            {
              fileInfo.content = newContent;
            }

            newFileInfo.content = newContent;

            updateCallback(newFileInfo);
          }
          else
            console.log('   \033[31merror of file read (' + filename + '): ' + err + ' \033[39m');
        });
      }
    }

    function updateStat(filename){
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

            fileMap[fnKey] = {
              mtime: stats.mtime,
              type: fileType,
              listeners: [],
              content: null
            };

            // event!! new file
            if (filename != BASE_PATH)
            {
              createCallback(filename, fileType, stats.mtime);
              console.log(filename + ' - found');
            }

            if (fileType == 'dir')
            {
              console.log(filename, path.normalize(filename));
              if (!config.ignore || !config.ignore[path.normalize(filename)])
                lookup(filename);
            }
          }
          else
          {
            if (fileMap[fnKey].type == 'file' && stats.mtime - fileMap[fnKey].mtime)
            {
              fileInfo.mtime = stats.mtime;

              readFile(filename);
            }
          }
        }
      });
    }

    function lookup(path){
      fs.readdir(path, function(err, files){
        if (err)
          console.log('lookup error:', path, err);
        else
        {
          var filename;
          var dirInfo = dirMap[path];

          updateStat(path);

          if (dirInfo)
          {
            var dirFiles = dirInfo.files;
            for (var i = 0, file; file = dirFiles[i++];)
            {
              if (files.indexOf(file) == -1)
              {
                var filename = path + '/' + file;
                delete dirFiles[filename];
                delete fileMap[filename];

                // event!!
                deleteCallback(filename);
                if (fs_debug) console.log(filename + ' - missed'); // file lost
              }
            }
          }
          else
          {
            dirInfo = dirMap[path] = {
              path: path,
              watcher: fs.watch(path, function(event, filename){
                lookup(path);
              })
            };
          }

          dirInfo.files = files;

          if (files.length)
          {
            for (var file, i = 0; file = files[i++];)
            {
              var filename = path + '/' + file;
              //console.log(path + '/' + file);
              updateStat(filename);
            }
          }

        }
      });
    }

    function stopWatch(path){
      console.log('stopWatch ', path);
      var difInfo = dirMap[path];
      var dirFiles = difInfo.files;

      for (var i = 0, filename; filename = dirFiles[i]; i++)
      {
        var fullPath = path + '/' + filename;

        if (dirMap[fullPath])
          stopWatch(fullPath);

        delete fileMap[fullPath];
      }

      difInfo.watcher.close();

      delete dirMap[path];
    }

    return {
      watch: function(path){
        try {
          var stat = fs.statSync(path);
        } catch(e) {
          console.warn('Error on read path `' + path + '`:' + e);
          return;
        }

        if (!stat.isDirectory())
        {
          console.warn('Error path `' + path + '` is not a folder');
          return;
        }

        if (!dirMap[path])
        {
          lookup(path);
          console.info('Folder `' + path + '` is observing now');
        }
        else
          console.warn('Folder `' + path + '` is already observing');
      },
      unwatch: function(path){
        if (dirMap[path])
        {
          stopWatch(path);
          console.info('Folder `' + path + '` is NOT observing now');
        }
        else
          console.warn('Folder `' + path + '` isn\'t observing yet');
      },
      getFiles: function(path){
        var result = [];

        for (var filename in fileMap)
        {
          if (filename != '/')
          {
            result.push({
              filename: filename,
              type: fileMap[filename].type,
              lastUpdate: fileMap[filename].mtime,
              content: null//fileMap[filename].content
            });
          }
        }

        return result;
      },
      isObserveFile: function(filename){
        return !!fileMap[filename];
      },
      readFile: readFile
    }

  })();


  var createCallback = function(filename, fileType, lastUpdate){
    var fileInfo = {
      filename: normPath(filename),
      type: fileType,
      lastUpdate: lastUpdate
    };

    for (var k in io.sockets.sockets)
    {
      var socket = io.sockets.sockets[k];
      if (socket)
      {
        socket.emit('newFile', fileInfo);
      }
    }
  }
  var updateCallback = function(fileInfo){
    fileInfo.filename = normPath(fileInfo.filename);

    for (var k in io.sockets.sockets)
    {
      var socket = io.sockets.sockets[k];
      if (socket)
      {
        socket.emit('updateFile', fileInfo);
      }
    }
  }

  var deleteCallback = function(filename){
    filename = normPath(filename);

    for (var k in io.sockets.sockets)
    {
      var socket = io.sockets.sockets[k];
      if (socket)
      {
        socket.emit('deleteFile', filename.substr(BASE_PATH.length + 1));
      }
    }
  }


  function arrayAdd(array, item){
    var pos = array.indexOf(item);
    if (pos == -1)
    {
      array.push(item);
      return true;
    }
  }

  function arrayRemove(array, item){
    var pos = array.indexOf(item);
    if (pos != -1)
    {
      array.splice(pos, 1);
      return true;
    }
  }
