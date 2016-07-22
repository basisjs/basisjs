var Value = require('basis.data').Value;
var Window = require('basis.ui.window').Window;
var jsSourcePopup = require('../../module/js-source-popup/index.js');
var domTree = require('./view-dom.js');
var bindingView = require('./view-bindings.js');
var sourceView = require('./view-source.js');
var fileAPI = require('../../api/file.js');

module.exports = new Window({
  modal: true,
  visible: Value.query('data.hasTarget').as(Boolean),
  showSource: new basis.Token(false),

  template: resource('./template/window.tmpl'),
  binding: {
    showSource: 'showSource',

    hasParent: 'data:',
    hasOwner: 'data:',
    hasGroup: 'data:',
    objectClassName: 'data:',
    objectId: 'data:',
    objectLocation: 'data:',
    warningCount: 'data:',
    sourceTitle: {
      events: 'update',
      getter: function(node){
        return node.data.url || '[inline]';
      }
    },
    isFile: {
      events: 'update',
      getter: function(node){
        return Boolean(node.data.url);
      }
    },

    bindings: bindingView,
    domTree: domTree,
    source: sourceView
  },
  action: {
    upParent: function(){
      this.api.upParent();
    },
    upOwner: function(){
      this.api.upOwner();
    },
    upGroup: function(){
      this.api.upGroup();
    },
    close: function(){
      this.api.dropTarget();
    },
    openSource: function(){
      if (this.data.url)
        fileAPI.openFile(this.data.url);
    },
    openObjectLocation: function(){
      if (this.data.objectLocation)
        fileAPI.openFile(this.data.objectLocation);
    },
    enterObjectLocation: function(e){
      if (this.data.objectLocation)
      {
        jsSourcePopup.loc.set(this.data.objectLocation);
        jsSourcePopup.show(e.actionTarget);
      }
    },
    leaveObjectLocation: function(){
      jsSourcePopup.hide();
    },
    toggleSource: function(){
      this.showSource.set(!this.showSource.value);
    },
    logInfo: function(){
      this.api.logInfo();
    }
  },

  realign: function(){},
  setZIndex: function(){},
  init: function(){
    Window.prototype.init.call(this);
    this.dde.fixLeft = false;
    this.dde.fixTop = false;
  },
  set: function(data){
    this.update(JSON.parse(data));
  }
});
