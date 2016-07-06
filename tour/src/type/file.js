var STATE = require('basis.data').STATE;
var entity = require('basis.entity');
var getSource = require('basis.utils.source').getSource;

function getOriginalJsSource(content, url){
  return getSource(url);
}

var File = entity.createType('File', {
  filename: entity.StringId,
  content: String,
  updatable: entity.calc('filename', function(filename){
    var ext = basis.path.extname(filename);
    var cfg = basis.resource.extensions[ext];
    return (cfg && cfg.updatable) || ext == '.tmpl' || ext == '.css';
  })
});

File.extendClass({
  syncAction: function(){
    var fileResource = basis.resource('./slide/' + this.data.filename);
    var getter = fileResource.type === '.js' ? getOriginalJsSource : basis.fn.$self;

    fileResource.ready(function(content, url){
      this.set('content', getter(content, url));
    }, this);

    this.set('content', getter(fileResource.get(true), fileResource.url));
    this.setState(STATE.READY);

    // prevent more than one resource attachment
    this.setSyncAction();
  }
});

module.exports = File;
