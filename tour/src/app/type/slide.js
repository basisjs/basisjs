basis.require('basis.entity');

var calc = basis.entity.CalculateField;
var File = resource('file.js').fetch();

//
// main part
//

var Slide = new basis.entity.EntityType({
  name: 'Slide',
  fields: {
    id: basis.entity.StringId,
    num: Number,
    title: String,
    code: String,
    files: new basis.entity.EntitySetType(File)
  }
});
Slide.addField('prev', Slide);
Slide.addField('next', Slide);


//
// sync data
//

Slide.all.setSyncAction(function(){
  var data = basis.resource('slide/index.json').fetch();
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
});


//
// export
//

module.exports = Slide;
