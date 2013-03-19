basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

var timer;

function updateLauncher(){
  view.tmpl.launcher.src = 'launcher.html';
}
function prepareToUpdate(){
  if (timer)
    clearTimeout(timer);

  timer = setTimeout(updateLauncher, 500);
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
      this.updateLauncher = !this.data.updatable;
      this.target.update({
        content: event.sender.value
      }, true);
      this.updateLauncher = false;
    }
  },
  handler: {
    update: function(sender, delta){
      if ('content' in delta && this.updateLauncher)
        prepareToUpdate();
    }
  }
});

var view = new basis.ui.Node({
  autoDelegate: true,
  handler: {
    targetChanged: function(){
      if (this.target)
        updateLauncher();
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
    title: 'data:',
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
