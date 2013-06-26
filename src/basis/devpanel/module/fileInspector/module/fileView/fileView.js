basis.require('basis.ui');
basis.require('basis.format.highlight');

var FILE_EXT_CODE_MAP = {
  tmpl: 'text',
  js: 'js',
  css: 'css'
}

var codeNode = new basis.format.highlight.SourceCodeNode({
  autoDelegate: true,
  templateUpdate: function(){
    if (this.data.path && !this.data.isFolder)
    {
      var ext = basis.path.extname(this.data.path);
      this.lang = FILE_EXT_CODE_MAP[ext.slice(1)] || 'text';
    }
   
    basis.format.highlight.SourceCodeNode.prototype.templateUpdate.apply(this, arguments);
  }
});


module.exports = new basis.ui.Node({
  template: resource('template/fileView.tmpl'),
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