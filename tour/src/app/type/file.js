basis.require('basis.entity');

var File = new basis.entity.EntityType({
  name: 'File',
  fields: {
    filename: basis.entity.StringId,
    name: basis.entity.calc('filename', function(filename){
      return basis.path.basename(filename);
    }),
    content: String,
    updatable: basis.entity.calc('filename', function(filename){
      var ext = basis.path.extname(filename);
      var cfg = basis.resource.extensions[ext];
      return (cfg && cfg.updatable) || ext == '.tmpl';
    })
  }
});

File.entityType.entityClass.extend({
  state: basis.data.STATE.UNDEFINED,
  syncAction: function(){
    var content = basis.resource('slide/' + this.data.filename).get(true);
    this.set('content', content);
  }
});

module.exports = File;