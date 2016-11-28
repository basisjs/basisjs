var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var Expression = require('basis.data.value').Expression;
var Node = require('basis.ui').Node;
var MoveableElement = require('basis.dragdrop').MoveableElement;

var isOnline = require('../sync/sync-basisjs-tools.js').online;
var remoteInspectors = require('../remote.js').remoteInspectors;
var devtools = require('../remote.js').devtools;
var File = require('type').File;
var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');

var inspectMode = require('api').inspect;
var inspector = require('../inspector/index.js');
var currentInspectorName = inspector.currentName;

var KEY_ESC = 27;
var cancelInspectModeOnEsc = function(event){
  if (event.keyCode == KEY_ESC)
    inspectMode.set(false);
};

inspectMode.link(null, function(mode){
  if (mode)
    inspectBasisDomEvent.addGlobalHandler('keydown', cancelInspectModeOnEsc);
  else
    inspectBasisDomEvent.removeGlobalHandler('keydown', cancelInspectModeOnEsc);
});

//
// panel
//

function activateInspector(mode, e){
  cultureList.setDelegate();
  themeList.setDelegate();
  e.die();
  inspectBasisDomEvent.captureEvent('click', function(){
    inspectBasisDomEvent.releaseEvent('click');

    // set new mode or drop old one if mode is the same
    inspectMode.set(inspectMode.value !== mode ? mode : null);
  });
}

var panel = new Node({
  container: document.body,

  activated: false,

  template: resource('./template/panel.tmpl'),

  binding: {
    activated: 'activated',
    themeName: inspectBasisTemplate.theme,
    themeList: themeList,
    cultureName: inspectBasisL10n.culture,
    cultureList: cultureList,
    isOnline: isOnline,
    remote: new Expression(remoteInspectors, devtools, function(inspectors, devtool){
      if (inspectors && devtool)
        return 'remote-and-devtool';
      if (inspectors || devtool)
        return inspectors ? 'remote' : 'devtool';
    }),
    permanentFilesChangedCount: File.permanentChangedCount,
    inspectMode: inspectMode,
    inspector: currentInspectorName,
    grid: function(){
      var config = inspectBasis.config.devpanel;
      return Number(config && config.grid) || 0;
    }
  },

  action: {
    showThemes: function(){
      inspectMode.set();
      themeList.setDelegate(this);
    },
    showCultures: function(){
      inspectMode.set();
      cultureList.setDelegate(this);
    },
    inspectTemplate: function(e){
      activateInspector('template', e);
    },
    inspectl10n: function(e){
      activateInspector('l10n', e);
    },
    inspectHeat: function(e){
      activateInspector('heatmap', e);
    },
    inspectGrid: function(e){
      activateInspector('grid', e);
    },
    inspectPickRoles: function(e){
      activateInspector('pick-roles', e);
    },
    inspectRoles: function(e){
      activateInspector('roles', e);
    },
    storePosition: function(){
      if (localStorage)
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
    },
    cancelInspect: function(){
      inspectMode.set();
    },
    reload: function(){
      global.location.reload();
    }
  },

  init: function(){
    Node.prototype.init.call(this);

    this.dde = new MoveableElement();
  },
  templateSync: function(){
    Node.prototype.templateSync.call(this);

    this.dde.setElement(this.element, this.tmpl.dragElement);
  },
  destroy: function(){
    this.dde.destroy();
    this.dde = null;

    Node.prototype.destroy.call(this);
  }
});


//
// drag stuff
//
if (typeof localStorage != 'undefined')
{
  var position = (localStorage['basis-devpanel'] || '10;10').split(';');
  panel.element.style.left = position[0] + 'px';
  panel.element.style.top = position[1] + 'px';
}


//
// exports
//

module.exports = panel;
