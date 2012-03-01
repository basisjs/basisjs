var app = require('http').createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');

app.listen(8222);

/*function handler(req, res){
  fs.readFile(__dirname + '/fileviewer.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}*/

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

var debug = true;
var createCallback = function(filename, fileType, lastUpdate){
  io.sockets.emit('newFile', { filename: filename, type: fileType, lastUpdate: lastUpdate });
}
var updateCallback = function(fileInfo){
  io.sockets.emit('updateFile', fileInfo);
}
var deleteCallback = function(filename){
  io.sockets.emit('deleteFile', { filename: filename });
}

var fsWatcher = (function(){
  var fileMap = {};
  var dirMap = {};

  function readFile(filename){
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
          if (debug) console.log(filename + ' - found');

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
            if (debug) console.log(filename + ' - changed'); // file changed

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
              if (debug) console.log(filename + ' - missed'); // file lost
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

      if (stat.isDirectory())
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
        stopWatch(path)
        console.info('Folder `' + path + '` is NOT observing now');
      }
      else
        console.warn('Folder `' + path + '` is not observing yet');
    },
    getFiles: function(){
      var result = [];
      for (var filename in fileMap)
        result.push({
          filename: filename,
          type: fileMap[filename].type,
          lastUpdate: fileMap[filename].mtime,
          content: fileMap[filename].content
        });

      return result;
    },
    isObserveFile: function(filename){
      return !!fileMap[filename];
    },
    addContentObserver: function(filename, listener){
      var fileInfo = fileMap[filename];
      if (fileInfo)
      {
        if (arrayAdd(fileInfo.listeners, listener))
        {
          listener.emit('updateFile', {
            filename: filename,
            lastUpdate: fileInfo.mtime,
            content: fileInfo.content
          });

          return true;
        }
      }
    },
    removeContentObserver: function(filename, listener){
      var fileInfo = fileMap[filename];

      if (fileInfo)
        if (arrayRemove(fileInfo.listeners, listener))
          return true;
    }
  }

})();

fsWatcher.watch('../templater/templates');

io.sockets.on('connection', function(socket){
  socket.emit('filelist', fsWatcher.getFiles());
  socket.on('saveFile', function(filename, content){
    console.log('save file', arguments);
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
  socket.on('watchFileContent', function(filename){
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
  socket.files = [];
});

io.sockets.on('disconnect', function(socket){
  socket.files.forEach(fsWatcher.removeContentObserver);
  delete socket.files;
});

