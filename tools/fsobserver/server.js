var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var url = require('url');
var path = require('path');

var fs_debug = false;
var is_dev = true;
var port = process.argv[2];
if (isNaN(port))
  port = 8123;

app.listen(port);
console.log('Server is online, listen for port ' + port);

function quote(value){
  return "'" +
    String(value)
      .replace(/[\r\n]/g, '')
      .replace(/'/g, '\\\'')
      .replace(/\\/g, '/')
   + "'";
}

var staticFileCache = {};
function returnFile(res, filename, processData){
  var absPath = __dirname + '/' + filename;
  var data = staticFileCache[absPath];

  if (!is_dev && data)
  {
    res.writeHead(200);
    res.end(data);
  }
  else
  {
    fs.readFile(absPath, function(err, data){
      if (err)
      {
        res.writeHead(500);
        res.end('Error loading ' + filename);
      }
      else
      {
        if (processData)
          data = processData(data);

        staticFileCache[absPath] = data;
        res.writeHead(200, {
          'Content-Type': filename.match(/\.js$/) ? 'text/javascript' : 'text/html'
        });
        res.end(data);
      }
    });
  }
}

function handler(req, res){
  var location = url.parse(req.url, true, true);
  var host = req.headers.host;

  switch (location.pathname)
  {
    case '/':
      returnFile(res, 'client.js', function(data){
        return String(data).replace(/\{location\}/g, host);
      })
      break;

    case '/resolve':
      returnFile(res, 'client.html')
      break;

    default:
      res.writeHead(500);
      res.end('Wrong url: ' + req.path);
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

var createCallback = function(filename, fileType, lastUpdate){
  for (var k in io.sockets.sockets)
  {
    var socket = io.sockets.sockets[k];
    if (socket && socket.pathes)
    {
      for (var i = 0, p; i < socket.pathes.length; i++)
      {
        p = socket.pathes[i];
        if (filename.substr(0, p.length) == p && filename != p)
        {
          if (filename.length != p.length)
            socket.emit('newFile', { filename: filename.substr(p.length), type: fileType, lastUpdate: lastUpdate });
          break;
        }
      }
    }
  }
}
var updateCallback = function(fileInfo){
  //io.sockets.emit('updateFile', fileInfo);
  var filename = fileInfo.filename;
  for (var k in io.sockets.sockets)
  {
    var socket = io.sockets.sockets[k];
    if (socket && socket.pathes)
    {
      for (var i = 0, p; i < socket.pathes.length; i++)
      {
        p = socket.pathes[i];
        if (filename.substr(0, p.length) == p)
        {
          fileInfo.filename = filename.substr(p.length);
          if (filename.length != p.length)
            socket.emit('updateFile', fileInfo);
          break;
        }
      }
    }
  }
}

var deleteCallback = function(filename){
  //io.sockets.emit('deleteFile', { filename: filename });
  for (var k in io.sockets.sockets)
  {
    var socket = io.sockets.sockets[k];
    if (socket && socket.pathes)
    {
      for (var i = 0, p; i < socket.pathes.length; i++)
      {
        p = socket.pathes[i];
        if (filename.substr(0, p.length) == p && filename != p)
        {
          if (filename.length != p.length)
            socket.emit('deleteFile', filename.substr(p.length));
          break;
        }
      }
    }
  }
}

var fsWatcher = (function(){
  var fileMap = {};
  var dirMap = {};

  function readFile(filename){
    if (path.extname(filename) == '.css' || path.extname(filename) == '.tmpl' || path.extname(filename) == '.txt')
    {
      fs.readFile(filename, 'utf8', function(err, data){
        if (!err)
        {
          var fileInfo = fileMap[filename];
          var newContent = String(data).replace(/\r\n?|\n\r?/g, '\n');

          var newFileInfo = {
            filename: filename,
            lastUpdate: fileInfo.mtime
          };

          if (newContent !== fileInfo.content)
          {
            fileInfo.content = newContent;
            newFileInfo.content = newContent;
          }

          updateCallback(newFileInfo);
        }
        else
          console.log('   \033[31merror of file read (' + filename + '): ' + err + ' \033[39m');
      });
    }
  }

  function updateStat(dir, filename){
    fs.stat(filename, function(err, stats){
      if (err)
      {
        console.log('updateStat error:', err);
      }
      else
      {
        var fileInfo = fileMap[filename];

        if (!fileMap[filename])
        {
          var fileType = stats.isDirectory() ? 'dir' : 'file';

          fileMap[filename] = {
            mtime: stats.mtime,
            type: fileType,
            listeners: [],
            content: null
          };

          // event!! new file
          createCallback(filename, fileType, stats.mtime);
          if (fs_debug) console.log(filename + ' - found');

          if (fileType == 'dir')
            lookup(filename);
          else
            readFile(filename);
        }
        else
        {
          if (fileMap[filename].type == 'file' && stats.mtime - fileMap[filename].mtime)
          {
            fileInfo.mtime = stats.mtime;

            // event!! file modified
            //updateCallback(filename, stats.mtime);
            if (fs_debug) console.log(filename + ' - changed'); // file changed

            readFile(filename);
          }
        }

        //console.log(filename + ' updated stat');
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

        updateStat('', path);

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
            updateStat(dirInfo, filename);
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
    getFiles: function(p){
      var result = [];
      for (var filename in fileMap)
        if (filename.substr(0, p.length) == p && filename.length != p.length)
          result.push({
            filename: filename.substr(p.length),
            type: fileMap[filename].type,
            lastUpdate: fileMap[filename].mtime,
            content: fileMap[filename].content
          });

      return result;
    },
    isObserveFile: function(filename){
      return !!fileMap[filename];
    }
  }

})();

//fsWatcher.watch('../templater/templates');

io.sockets.on('connection', function(socket){
  socket.on('saveFile', function(filename, content){
    console.log('save file', arguments);

    filename = socket.pathes[0] + filename;

    if (fsWatcher.isObserveFile(filename))
    {
      fs.writeFile(filename, content, function (err) {
        if (err)
        {
          socket.emit('error', {
            operation: 'save file',
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
        operation: 'save file',
        message: 'bad filename'
      });
  });

  socket.on('createFile', function(filename, content){
    console.log('create file', arguments);

    filename = socket.pathes[0] + filename;

    if (!path.existsSync(filename) && path.existsSync(path.dirname(filename)))
    {
      fs.writeFile(filename, '', function (err) {
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

  socket.on('observe', function(rel, fspath){
    var relListenPath = path.relative(__dirname, fspath).replace(/\\/, '/');
    socket.pathes.push(relListenPath + '/');
    fsWatcher.watch(relListenPath);
    socket.emit('observeReady', rel, fsWatcher.getFiles(relListenPath + '/'));
  });

  socket.pathes = [];

  /*socket.on('watchFileContent', function(filename){
    if (fsWatcher.addContentObserver(filename, socket))
      arrayAdd(socket.files, filename);
  });
  socket.on('unwatchFileContent', function(filename){
    if (fsWatcher.removeContentObserver(filename, socket))
    {
      arrayRemove(socket.files, filename);
      //socket.emit('updateFile', { filename: filename, content: null });
    }
  });
  socket.files = [];*/

  //
  // all initial work done, send to client init data
  //
  /*var initSessionData = {
    filelist: fsWatcher.getFiles()
  };

  socket.emit('initSession', initSessionData);*/
});

io.sockets.on('disconnect', function(socket){
  //socket.files.forEach(fsWatcher.removeContentObserver);
  delete socket.pathes;
});

