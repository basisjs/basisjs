basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.router');

var prevCode = '';

var filesView = new basis.ui.tabs.TabControl({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      if ('files' in delta)
        this.setChildNodes(this.data.files);
    }
  },
  childClass: {
    binding: {
      title: 'data:filename'
    }
  },
  childNodes: [
    { title: 'test' },
    { title: 'test2' }
  ]
});

module.exports = new basis.ui.Node({
  autoDelegate: true,
  active: true,
  handler: {
    update: function(sender, delta){
      if ('code' in delta)
      {
        console.log('1');
        this.tmpl.launcher.src = this.tmpl.launcher.src;
      }
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
    code: 'data:',
    description: 'data:',
    files: filesView
  },
  action: {
    dropPage: function(){
      basis.router.navigate('');
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
        prevCode = value;
        this.tmpl.launcher.src = this.tmpl.launcher.src;
      }
    }
  }  
});

global.launcherCallback = function(){
  var sourceCodeNode = document.getElementById('code-editor');
  return prevCode = sourceCodeNode ? sourceCodeNode.value : 'document.write("Source code not found")';
}
