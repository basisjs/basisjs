var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var Value = require('basis.data').Value;
var Dataset = require('basis.data').Dataset;
var DataObject = require('basis.data').Object;
var Expression = require('basis.data.value').Expression;
var count = require('basis.data.index').count;
var Node = require('basis.ui').Node;
var MoveableElement = require('basis.dragdrop').MoveableElement;

var isOnline = require('../basisjs-tools-sync.js').isOnline;
var remoteInspectors = require('../basisjs-tools-sync.js').remoteInspectors;
var permanentFilesChangedCount = require('../basisjs-tools-sync.js').permanentFilesChangedCount;
var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');

var l10nInspector = resource('../inspector/l10n.js');
var templateInspector = resource('../inspector/template.js');
var heatInspector = resource('../inspector/heatmap.js');
var gridInspector = resource('../inspector/grid.js');
var rolesInspector = resource('../inspector/roles.js');
var inspectors = new Dataset();
var inspectMode = count(inspectors, 'update', 'data.mode').as(Boolean);
var currentInspector = new Value();
var currentInspectorName = currentInspector.as(function(inspector){
  return inspector ? inspector.name : '';
});

[
  l10nInspector,
  templateInspector,
  heatInspector,
  gridInspector,
  rolesInspector
].forEach(function(inspectorRes){
  inspectorRes.ready(function(inspector){
    inspectors.add(inspector.inspectMode.link(new DataObject, function(value){
      if (value)
        currentInspector.set(inspector);
      else
        if (currentInspector.value === inspector)
          currentInspector.set();

      this.update({ mode: value });
    }));
  });
});

currentInspector.link(null, function(newInspector, oldInspector){
  if (oldInspector)
    oldInspector.stopInspect();
  if (newInspector)
    newInspector.startInspect();
});


//
// panel
//

function activateInspector(inspector, e){
  cultureList.setDelegate();
  themeList.setDelegate();
  e.die();
  inspectBasisDomEvent.captureEvent('click', function(){
    inspectBasisDomEvent.releaseEvent('click');

    // set new inspector or drop old one if inspector is the same
    var newInspector = inspector();
    currentInspector.set(
      currentInspector.value !== newInspector ? newInspector : null
    );
  });
}

var panel = new Node({
  container: document.body,

  activated: false,
  themeName: inspectBasisTemplate.currentTheme().name,

  template: resource('./template/panel.tmpl'),

  binding: {
    activated: 'activated',
    themeName: themeList.currentTheme,
    themeList: themeList,
    cultureName: inspectBasisL10n.culture,
    cultureList: cultureList,
    isOnline: isOnline,
    hasRemoteInspectors: remoteInspectors.as(Boolean),
    permanentFilesChangedCount: permanentFilesChangedCount,
    inspectMode: inspectMode,
    inspector: currentInspectorName,
    inspectorId: new Expression(currentInspectorName, rolesInspector().pickMode, function(inspectorName, pickMode){
      inspectorName = inspectorName ? inspectorName.replace(/\s/g, '').toLowerCase() : '';

      if (inspectorName == 'roles')
        return pickMode ? 'pickRoles' : 'roles';

      return inspectorName;
    }),
    grid: function(){
      var config = inspectBasis.config.devpanel;
      return Number(config && config.grid) || 0;
    }
  },

  action: {
    showThemes: function(){
      themeList.setDelegate(this);
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectTemplate: function(e){
      activateInspector(templateInspector, e);
    },
    inspectl10n: function(e){
      activateInspector(l10nInspector, e);
    },
    inspectHeat: function(e){
      activateInspector(heatInspector, e);
    },
    inspectGrid: function(e){
      activateInspector(gridInspector, e);
    },
    inspectPickRoles: function(e){
      activateInspector(rolesInspector, e);
      rolesInspector().pickMode.set(true);
    },
    inspectRoles: function(e){
      activateInspector(rolesInspector, e);
      rolesInspector().pickMode.set(false);
    },
    storePosition: function(){
      if (localStorage)
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
    },
    cancelInspect: function(){
      currentInspector.set();
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
