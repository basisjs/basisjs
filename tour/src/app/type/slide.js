basis.require('basis.entity');

//
// main part
//

var Slide = basis.entity.createType('Slide', {
  id: basis.entity.StringId,
  num: Number,
  title: String,
  files: new basis.entity.EntitySetType('File'),
  prev: 'Slide',
  next: 'Slide'
});


//
// sync data
//

var slideIndex = basis.resource('slide/index.json');
slideIndex.ready(function(data){
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

  this.sync(data);
}, Slide.all);

Slide.all.setSyncAction(function(){
  slideIndex.fetch();  
});


//
// export
//

module.exports = Slide;
