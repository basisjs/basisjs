var Dataset = require('basis.data').Dataset;
var Node = require('basis.ui').Node;
var createSandboxCallback = require('./sandboxCallback.js');

var UpdateSet = Dataset.subclass({
  view: null,
  listen: {
    item: {
      update: function(sender){
        if (!sender.data.updatable)
          this.view.prepareToRun();
      }
    }
  }
});

module.exports = Node.subclass({
  autoDelegate: true,
  reloaded: false,
  timer: null,

  template: resource('./template/view.tmpl'),
  binding: {
    reloaded: 'reloaded'
  },

  init: function(){
    this.sandboxCallback = basis.fn.publicCallback(createSandboxCallback(this), true);
    this.reloaded = new basis.Token(false);
    this.files = new UpdateSet({
      view: this
    });

    Node.prototype.init.call(this);

    this.syncFiles();
  },
  handler: {
    update: function(){
      this.syncFiles();
    }
  },
  syncFiles: function(){
    if (this.files.set(this.data.files ? this.data.files.getItems() : []))
      this.run();
  },
  prepareToRun: function(){
    if (this.timer)
      clearTimeout(this.timer);

    this.timer = setTimeout(this.run.bind(this), 500);
  },
  run: function(){
    this.timer = clearTimeout(this.timer);
    this.tmpl.sandbox.src = asset('./sandbox.html') + '?cb=' + this.sandboxCallback;

    var self = this;
    this.reloaded.set(true);
    basis.nextTick(function(){
      self.reloaded.set(false);
    });
  }
});
