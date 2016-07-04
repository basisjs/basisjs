var entity = require('basis.entity');

//
// main part
//

var Slide = entity.createType('Slide', {
  id: entity.StringId,
  num: Number,
  title: String,
  files: entity.createSetType('File'),
  prev: 'Slide',
  next: 'Slide'
});


//
// sync data
//

basis.resource('./slide/index.json').ready(function(data){
  var prev = null;
  var next = null;

  for (var i = 0, item; item = data[i]; i++)
  {
    next = data[i + 1];
    basis.object.extend(item, {
      num: i + 1,
      prev: prev && prev.id,
      next: next && next.id,
      files: ['main.js'].concat(item.files || []).map(function(filename){
        return item.id + '/' + filename;
      })
    });
    prev = item;
  }

  this.setAndDestroyRemoved(data.map(Slide));
}, Slide.all).fetch();


//
// export
//

module.exports = Slide;
