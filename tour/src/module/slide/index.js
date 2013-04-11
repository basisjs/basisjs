basis.require('basis.data');
basis.require('basis.data.dataset');
basis.require('basis.data.index');
basis.require('basis.layout');
basis.require('basis.ui');
basis.require('basis.ui.tabs');
basis.require('basis.ui.resizer');
basis.require('basis.router');
basis.require('app.type');

var timer;
var fileList = resource('module/fileList/index.js').fetch();
var editor = resource('module/editor/index.js').fetch();

fileList.selection.addHandler({
  itemsChanged: function(){
    editor.setDelegate(this.pick());
  }
});

var updateSet = new basis.data.Dataset({
  listen: {
    item: {
      update: function(sender){
        if (!sender.data.updatable)
          panels.lastChild.prepareToRun();
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

var panels = new basis.layout.VerticalPanelStack({
  template: resource('template/main-part.tmpl'),
  autoDelegate: true,
  childClass: {
    autoDelegate: true
  },
  childNodes: [
    {
      template: resource('template/header.tmpl'),
      binding: {
        hasChanges: basis.data.index.count(changedFiles)
      },
      action: {
        resetSlide: function(){
          this.data.files.getItems().forEach(function(file){
            file.rollback();
          });
        }
      }
    },
    {
      template: resource('template/files.tmpl'),
      childNodes: fileList
    },
    {
      flex: 1,
      template: resource('template/code.tmpl'),
      childNodes: editor
    },
    {
      template: resource('template/preview.tmpl'),
      handler: {
        update: function(){
          updateSet.set(this.data.files ? this.data.files.getItems() : []);
        },
        targetChanged: function(){
          if (this.target)
            this.run();
        }
      },
      prepareToRun: function(){
        if (timer)
          clearTimeout(timer);

        timer = setTimeout(this.run.bind(this), 500);
      },
      run: function (){
        timer = clearTimeout(timer);
        this.tmpl.launcher.src = 'launcher.html';

        this.tmpl.set('reloaded', true);
        var self = this;
        setTimeout(function(){
          self.tmpl.set('reloaded', false);
        }, 0);
      },

      init: function(){
        basis.ui.Node.prototype.init.call(this);
        this.resizer = new basis.ui.resizer.Resizer({
          property: 'height',
          factor: -1
        });
      },
      templateSync: function(noRecreate){
        basis.ui.Node.prototype.templateSync.call(this, noRecreate);
        this.resizer.setElement(this.element);
      },
      destroy: function(){
        basis.ui.Node.prototype.destroy.call(this);
        this.resizer = this.resizer.destroy();
      }
    }
  ]
});

var view = new basis.ui.Node({
  autoDelegate: true,

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

    panels: panels
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
  },

  init: function(){
    basis.ui.Node.prototype.init.call(this);
    this.resizer = new basis.ui.resizer.Resizer();
  },
  templateSync: function(noRecreate){
    basis.ui.Node.prototype.templateSync.call(this, noRecreate);
    this.resizer.setElement(this.tmpl.sidebar);
  },
  destroy: function(){
    basis.ui.Node.prototype.destroy.call(this);
    this.resizer = this.resizer.destroy();
  }
});

module.exports = view;
