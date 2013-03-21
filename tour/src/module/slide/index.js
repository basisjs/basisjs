basis.require('basis.data');
basis.require('basis.data.dataset');
basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.router');
basis.require('basis.data.index');
basis.require('app.type');

var timer;
var fileList = resource('module/fileList/index.js').fetch();
var editor = resource('module/editor/index.js').fetch();

fileList.selection.addHandler({
  datasetChanged: function(){
    editor.setDelegate(this.pick());
  }
});

var updateSet = new basis.data.Dataset({
  listen: {
    item: {
      update: function(sender){
        if (!sender.data.updatable)
          view.prepareToRun();
      }
    }
  }
});
var changedFiles = new basis.data.dataset.Subset({
  source: updateSet,
  ruleEvents: {
    rollbackUpdate: true
  },
  rule: function(item){
    return item.modified;
  }
});

var view = new basis.ui.Node({
  autoDelegate: true,
  handler: {
    update: function(){
      updateSet.set(this.data.files ? this.data.files.getItems() : []);
    },
    targetChanged: function(){
      if (this.target)
        this.run();
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
    title: 'data:',
    description: {
      events: 'update',
      getter: function(node){
        return node.data.id ? basis.resource('slide/' + node.data.id + '/index.html') : null;
      }
    },

    num: 'data:',
    slideCount: basis.data.index.count(app.type.Slide.all),
    hasChanges: basis.data.index.count(changedFiles),

    files: fileList,
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
    },
    resetSlide: function(){
      this.data.files.getItems().forEach(function(file){
        file.rollback();
      });
    }
  },

  prepareToRun: function(){
    if (this.timer)
      clearTimeout(this.timer);

    this.timer = setTimeout(this.run.bind(this), 500);
  },
  run: function (){
    this.timer = clearTimeout(this.timer);
    this.tmpl.launcher.src = 'launcher.html';

    this.tmpl.set('reloaded', true);
    var self = this;
    setTimeout(function(){
      self.tmpl.set('reloaded', false);
    }, 0);
  }
});

module.exports = view;
