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
    description: String,
    code: String,
    files: new basis.entity.EntitySetType(File)
  }
});
Slide.addField('prev', Slide);
Slide.addField('next', Slide);

// Slide.entityType.entityClass.extend({
//   state: basis.data.STATE.UNDEFINED,
//   syncAction: function(){
//     var content = basis.resource('slide/' + this.data.filename).fetch();
//     this.set('html', content);
//   }
// });

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
      files: ['index.js'].concat(item.files || []).map(function(filename){
        return item.id + '/' + filename;
      })
    });
    prev = item;
  }

  this.sync(data);
});


//
// export names
//

module.exports = Slide;
