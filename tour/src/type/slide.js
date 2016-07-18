var entity = require('basis.entity');
var File = require('./file.js');

//
// main part
//

var Slide = entity.createType('Slide', {
  id: entity.StringId,
  num: Number,
  title: String,
  files: entity.createSetType(File),
  prev: 'Slide',
  next: 'Slide'
});

//
// sync data
//

Slide.linkWithResource = function(resource){
  resource.ready(function(data){
    var prev = null;
    var next = null;

    for (var i = 0, item; item = data[i]; i++)
    {
      next = data[i + 1];
      basis.object.extend(item, {
        num: i + 1,
        prev: prev && prev.id,
        next: next && next.id,
        files: ['app.js'].concat(item.files || []).map(function(filename){
          return item.id + '/' + filename;
        })
      });
      prev = item;
    }

    Slide.all.set(data);
  }).fetch();
};


//
// export
//

module.exports = Slide;
