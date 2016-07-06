module.exports = function createCallback(selectedSlide){
  var updateResourceFn;
  var updatableFiles = [];
  var updatableHandler = {
    update: function(sender, delta){
      if ('content' in delta)
        updateResourceFn(this.data.name, this.data.content);
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
        result[file.data.name] = file.data.content;
        if (file.data.updatable)
        {
          updatableFiles.push(file);
          file.addHandler(updatableHandler);
        }
      });

    return result;
  };
};
