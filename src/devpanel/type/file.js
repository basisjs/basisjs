var STATE = require('basis.data').STATE;
var Value = require('basis.data').Value;
var entity = require('basis.entity');

var File = entity.createType('File', {
  filename: entity.StringId,
  content: function(value){
    return typeof value == 'string' ? value : null;
  }
});
File.openFileSupported = new Value({ value: false });
File.open = function(){
  basis.dev.warn('[basis.devpanel] Open file in editor is not supported by server');
};
File.getAppProfile = function(){
  basis.dev.warn('[basis.devpanel] Can\'t fetch app profile since File.getAppProfile() is not inited yet');
};
File.extendClass(function(super_, current_){
  return {
    file: null,
    read: function(){
      if (!this.file)
      {
        basis.dev.warn('[basis.devpanel] File can\'t be read, no basisjsToolsFileSync file associated');
        return;
      }

      this.setState(STATE.PROCESSING);
      this.file.read(function(){
        this.setState(STATE.READY);
      }.bind(this));
    },
    save: function(content){
      if (!this.file)
      {
        basis.dev.warn('[basis.devpanel] file can\'t be saved, no basisjsToolsFileSync file associated');
        return;
      }

      this.setState(STATE.PROCESSING);
      this.file.save(content, function(err){
        if (err)
          this.setState(STATE.ERROR, err);
        else
          this.setState(STATE.READY);
      }.bind(this));
    },
    emit_update: function(delta){
      current_.emit_update.call(this, delta);

      if (this.file && 'content' in delta)
        this.file.set(this.data.content);
    }
  };
});

module.exports = File;
