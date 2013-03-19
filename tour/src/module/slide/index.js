basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

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
        this.tmpl.launcher.src = this.tmpl.launcher.src;
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
    code: 'data:',
    description: 'data:',
    files: filesView,
    num: 'data:',
    pageCount: basis.data.index.count(app.type.Page.all)
  },
  action: {
    toc: function(){
      basis.router.navigate('');
    },
    prev: function(){
      var prev = this.data.prev;
      basis.router.navigate(prev ? prev.data.hash : '');
    },
    next: function(){
      var next = this.data.next;
      basis.router.navigate(next ? next.data.hash : '');
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
