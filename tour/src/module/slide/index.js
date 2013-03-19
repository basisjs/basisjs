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

var view = new basis.ui.Node({
  autoDelegate: true,
  handler: {
    targetChanged: function(){
      if (this.target)
        this.run();
    }
  },  

  template: resource('template/view.tmpl'),
  binding: {
    title: 'data:',
    description: 'data:',

    num: 'data:',
    slideCount: basis.data.index.count(app.type.Slide.all),

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
  }
});

module.exports = view;
