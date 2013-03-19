basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

var prevCode = '';
var timer;

function updateLauncher(){
  view.tmpl.launcher.src = 'launcher.html';
}

var filesView = new basis.ui.tabs.TabControl({
  autoDelegate: true,
  handler: {
    update: function(sender, delta){
      if ('files' in delta)
        this.setChildNodes(this.data.files ? this.data.files.getItems() : []);
    }
  },
  childClass: {
    active: true,
    binding: {
      title: 'data:name'
    },
    handler: {
      select: function(){
        editor.setDelegate(this);
      }
    }
  }
});

var editor = new basis.ui.Node({
  template: resource('template/editor.tmpl'),
  binding: {
    content: 'data:'
  },
  action: {
    update: function(event){
      this.target.update({
        content: event.sender.value
      }, true);
    }
  },
  handler: {
    update: function(sender, delta){
      if ('filename' in delta)
        return updateLauncher();

      if ('content' in delta)
      {
        if (timer)
          clearTimeout(timer);

        timer = setTimeout(updateLauncher, 500);
      }
    }
  }
});

var view = new basis.ui.Node({
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
    //code: 'data:',
    description: 'data:',
    num: 'data:',
    slideCount: basis.data.index.count(app.type.Slide.all),

    files: filesView,
    editor: editor
  },
  action: {
    toc: function(){
      basis.router.navigate('');
    },
    prev: function(){
      var prev = this.data.prev;
      basis.router.navigate(prev ? prev.data.id : '');
    },
    next: function(){
      var next = this.data.next;
      basis.router.navigate(next ? next.data.id : '');
    }
  }  
});

module.exports = view;

global.launcherCallback = function(){
  var res = {};
  var files = view.data.files ? view.data.files.getItems() : [];
  files.forEach(function(file){
    res[file.data.name] = file.data.content;
  });
  return res;
}
