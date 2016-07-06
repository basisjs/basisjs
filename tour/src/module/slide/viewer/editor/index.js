var extname = basis.path.extname;
var Node = require('basis.ui').Node;
var MODE = {
  '.js': 'javascript',
  '.css': 'css',
  '.json': 'application/json',
  '.l10n': 'application/json',
  '.tmpl': 'xml'
};

module.exports = Node.subclass({
  editor: null,
  editorEl: null,
  documents: null,

  template: resource('./template/editor.tmpl'),
  binding: {
    content: 'data:',
    editor: 'editorEl'
  },
  templateSync: function(){
    Node.prototype.templateSync.call(this);
    basis.asap(this.editor.refresh, this.editor);
  },

  init: function(){
    var self = this;

    this.documents = {};
    this.editor = CodeMirror(function(el){
      self.editorEl = el;
    }, {
      theme: 'material',
      lineNumbers: true
    });
    this.editor.on('change', function(editor){
      if (self.target)
        self.target.set('content', editor.getValue(), true); // update with rollback
    });

    Node.prototype.init.call(this);
  },
  getFileDocument: function(file){
    var filename = file.data.filename;
    var doc = this.documents[filename];

    if (!doc)
      doc = this.documents[filename] = new CodeMirror.Doc(
        file.data.content,
        MODE[extname(filename)]
      );

    return doc;
  },

  handler: {
    targetChanged: function(){
      if (this.target)
        this.editor.swapDoc(this.getFileDocument(this.target));
    },
    update: function(sender, delta){
      if ('content' in delta)
      {
        var doc = this.editor.getDoc();
        if (doc.getValue() != this.data.content)
          doc.setValue(this.data.content || '');
      }
    }
  }
});
