var Value = require('basis.data').Value;
var Window = require('basis.ui.window').Window;
var templateSwitcher = require('basis.template').switcher;
var jsSourcePopup = require('../../../module/js-source-popup/index.js');
var DomTree = require('./dom.js');
var BindingView = require('./bindings.js');
var SourceView = require('./source.js');
var fileApi = require('api').ns('file');
var templateApi = require('../api.js');

module.exports = Window.subclass({
  target: true,
  modal: true,
  visible: Value.query('data.hasTarget').as(Boolean),
  showSource: new basis.Token(false),
  mode: 'default',

  satellite: {
    domTree: DomTree,
    bindings: BindingView,
    source: SourceView
  },

  template: templateSwitcher(function(node){
    return node.mode === 'standalone'
      ? resource('./template/standalone.tmpl')
      : resource('./template/window.tmpl');
  }),
  binding: {
    mode: 'mode',
    showSource: 'showSource',
    domTree: 'satellite:',
    bindings: 'satellite:',
    source: 'satellite:',

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
    }
  },
  action: {
    upParent: function(){
      templateApi.upParent();
    },
    upOwner: function(){
      templateApi.upOwner();
    },
    upGroup: function(){
      templateApi.upGroup();
    },
    close: function(){
      templateApi.dropTarget();
    },
    openSource: function(){
      if (this.data.url)
        fileApi.open(this.data.url);
    },
    openObjectLocation: function(){
      if (this.data.objectLocation)
        fileApi.open(this.data.objectLocation);
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
      templateApi.logInfo();
    }
  },

  realign: function(){},
  setZIndex: function(){},
  init: function(){
    Window.prototype.init.call(this);
    this.dde.fixLeft = false;
    this.dde.fixTop = false;

    templateApi.channel.link(this, this.set);
    templateApi.init();
  },
  set: function(data){
    this.update(data);
  }
});
