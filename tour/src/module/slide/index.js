basis.require('basis.ui');

var prevCode = '';

module.exports = new basis.ui.Node({
  autoDelegate: true,
  active: true,
  handler: {
    update: function(sender, delta){
      if ('code' in delta)
      {
        this.tmpl.editor.value = this.data.code || '';
        this.tmpl.launcher.src = this.tmpl.launcher.src;
      }
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
  },
  action: {
    dropPage: function(){
      app.selectPage();
    },
    runCode: function(event){
      var value = event.sender.value;

      try {
        new Function(value);
      } catch(e) {
        return;
      }

      if (prevCode != value)
      {
        //prevCode = value;
        this.tmpl.launcher.src = this.tmpl.launcher.src;
      }
    }
  }  
});

global.launcherCallback = function(){
  var sourceCodeNode = document.getElementById('code-editor');
  return prevCode = sourceCodeNode ? sourceCodeNode.value : 'document.write("Source code not found")';
}