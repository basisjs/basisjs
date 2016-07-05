var STATE = require('basis.data').STATE;
var entity = require('basis.entity');

var File = entity.createType('File', {
  filename: entity.StringId,
  name: entity.calc('filename', function(filename){
    return basis.path.basename(filename);
  }),
  content: String,
  updatable: entity.calc('filename', function(filename){
    var ext = basis.path.extname(filename);
    var cfg = basis.resource.extensions[ext];
    return (cfg && cfg.updatable) || ext == '.tmpl' || ext == '.css';
  })
});

File.extendClass({
  syncAction: function(){
    var res = basis
      .resource('./slide/' + this.data.filename)
      .ready(function(content){
        this.set('content', content);
      }, this);

    this.set('content', res.get(true));
    this.setState(STATE.READY);

    // prevent more than one resource attachment
    this.setSyncAction();
  }
});

module.exports = File;
