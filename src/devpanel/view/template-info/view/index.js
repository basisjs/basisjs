var Node = require('basis.ui').Node;
var jsSourcePopup = resource('./js-source-popup.js');
var DomTree = require('./dom.js');
var BindingView = require('./bindings.js');
var SourceView = require('./source.js');
var api = require('api');
var fileApi = require('api').ns('file');
var templateApi = require('../api.js');

var templates = require('basis.template').define('devpanel.template-info', {
  main: resource('./main/window.tmpl')
});
require('basis.template').theme('standalone').define('devpanel.template-info', {
  main: resource('./main/standalone.tmpl')
});

module.exports = Node.subclass({
  disabled: api.connected.as(basis.bool.invert),

  satellite: {
    domTree: DomTree,
    bindings: BindingView,
    source: SourceView
  },

  template: templates.main,
  binding: {
    connected: api.connected,
    showSource: 'showSource',
    domTree: 'satellite:',
    bindings: 'satellite:',
    source: 'satellite:',
    remoteUrl: function(node){
      return node.getRemoteUrl ? node.getRemoteUrl() : null;
    },

    hasSubject: {
      events: 'update',
      getter: function(node){
        return Boolean(node.data.hasTarget);
      }
    },
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
    openRemote: function(){
      window.open(this.getRemoteUrl(), 'basisjs.remote.devtool', 'resizable,scrollbars,status');
    },
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
        templateApi.setSourceFragment(this.data.objectLocation);
        jsSourcePopup().show(e.actionTarget);
      }
    },
    leaveObjectLocation: function(){
      jsSourcePopup().hide();
    },
    toggleSource: function(){
      this.showSource.set(!this.showSource.value);
    },
    logInfo: function(){
      templateApi.logInfo();
    }
  },

  init: function(){
    Node.prototype.init.call(this);

    this.showSource = new basis.Token(false);
    templateApi.channel.link(this, this.update);
    api.connected.link(this, function(connected){
      if (connected)
        templateApi.init(this.update.bind(this));
    });
  },
  destroy: function(){
    this.showSource.destroy();
    this.showSource = null;
    Node.prototype.destroy.call(this);
  }
});
