basis.require('basis.ui');
basis.require('basis.ui.code');

var FILE_EXT_CODE_MAP = {
  '.tmpl': 'text',
  '.js': 'js',
  '.css': 'css'
};

var codeNode = new basis.ui.code.SourceCode({
  autoDelegate: true,
  emit_update: function(delta){
    if (this.data.path && !this.data.isFolder)
      this.lang = FILE_EXT_CODE_MAP[basis.path.extname(this.data.path)] || 'text';

    basis.ui.code.SourceCode.prototype.emit_update.call(this, delta);
  }
});


module.exports = new basis.ui.Node({
  template: resource('./template/fileView.tmpl'),
  binding: {
    code: codeNode,
    hasCode: {
      events: 'update',
      getter: function(object){
        return !!object.data.code;
      }
    }
  }
});
