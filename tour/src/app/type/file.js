basis.require('basis.entity');

var File = basis.entity.createType('File', {
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
});

File.extend({
  syncAction: function(){
    var res = basis.resource('slide/' + this.data.filename);
    res.ready(this.set_content, this);
    this.set('content', res.get(true));

    // prevent more than one resource attachment
    this.setSyncAction();
  }
});

module.exports = File;
