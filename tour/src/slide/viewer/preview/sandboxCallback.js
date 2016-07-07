var basename = basis.path.basename;

module.exports = function createCallback(selectedSlide){
  var updateResourceFn;
  var updatableFiles = [];
  var updatableHandler = {
    update: function(sender, delta){
      if ('content' in delta)
        updateResourceFn(basename(this.data.filename), this.data.content);
    }
  };

  return function(fn){
    updateResourceFn = fn;
    updatableFiles.splice(0).forEach(function(file){
      file.removeHandler(updatableHandler);
    });

    var result = {};
    var slide = selectedSlide.root;
    var files = slide ? slide.data.files : null;

    if (files)
      files.getItems().forEach(function(file){
        result[basename(file.data.filename)] = file.data.content;
        if (file.data.updatable)
        {
          updatableFiles.push(file);
          file.addHandler(updatableHandler);
        }
      });

    return result;
  };
};
