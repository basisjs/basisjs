basis.require('basis.ui');

var editorEl;
var lockEditor = false;
var editor = CodeMirror(function(el){
  editorEl = el;
}, {
  theme: 'monokai',
  lineNumbers: true
});
editor.on('change', function(editor){
  if (editorView.target && !lockEditor)
    editorView.target.update({
      content: editor.getValue()
    }, true); // update with rollback
});

var modeByExt = {
  '.js': 'javascript',
  '.css': 'css',
  '.json': 'application/json',
  '.l10n': 'application/json',
  '.tmpl': 'xml'
};
var fileDocuments = {};
function getFileDocument(filename, content, type){
  var doc = fileDocuments[filename];

  if (!doc)
    doc = fileDocuments[filename] = new CodeMirror.Doc(content, modeByExt[basis.path.extname(filename)]);

  return doc;
}

function sdf(){
  return;
}

var editorView = new basis.ui.Node({
  template: resource('template/editor.tmpl'),
  binding: {
    content: 'data:',
    editor: function(){
      return editorEl;
    }
  },
  action: {
    update: function(event){
      this.target.update({
        content: event.sender.value
      }, true); // update with rollback
    }
  },
  templateSync: function(){
    basis.ui.Node.prototype.templateSync.call(this);
    basis.setImmediate(function(){
      editor.refresh();
    });
  },

  handler: {
    targetChanged: function(){
      if (this.target)
      {
        editor.swapDoc(getFileDocument(this.data.filename, this.data.content));
        basis.setImmediate(function(){
          editor.refresh();
        });
      }
    },
    update: function(sender, delta){
      if ('content' in delta)
      {
        var doc = getFileDocument(this.data.filename, this.data.content);
        if (doc.getValue() != this.data.content)
          doc.setValue(this.data.content || '');
      }
    }
  }
});

module.exports = editorView;
