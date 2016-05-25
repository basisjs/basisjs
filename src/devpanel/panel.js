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
var l10nInspector = resource('./inspector/l10n.js');
var templateInspector = resource('./inspector/template.js');
var heatInspector = resource('./inspector/heatmap.js');
var gridInspector = resource('./inspector/grid.js');
var rolesInspector = resource('./inspector/roles.js');

var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');
//var fileInspector = resource('./module/fileInspector/fileInspector.js');

var inspectors = new Dataset();
var inspectMode = count(inspectors, 'update', 'data.mode').as(Boolean);
var currentInspector = new Value({
  handler: {
    change: function(sender, oldValue){
      if (oldValue)
        oldValue.stopInspect();
      if (this.value)
        this.value.startInspect();
    }
  }
});
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


//
// panel
//

var isOnline;
var permamentFiles = [];
var permamentFilesCount = new Value({ value: 0 });

if (typeof basisjsToolsFileSync != 'undefined')
{
  // new basisjs-tools
  isOnline = new basis.Token(basisjsToolsFileSync.isOnline.value);
  basisjsToolsFileSync.isOnline.attach(isOnline.set, isOnline);

  basisjsToolsFileSync.notifications.attach(function(eventName, filename, content){
    var ext = basis.path.extname(filename);

    if (typeof content == 'string' && basis.resource.isResolved(filename))
      basis.resource(filename).update(content);

    if (eventName == 'new' || ext in inspectBasis.resource.extensions == false)
      return;

    if (inspectBasis.resource.extensions[ext].permanent && inspectBasis.resource.isResolved(filename))
    {
      basis.setImmediate(function(){
        if (inspectBasis.resource(filename).hasChanges())
          basis.array.add(permamentFiles, filename);
        else
          basis.array.remove(permamentFiles, filename);

        permamentFilesCount.set(permamentFiles.length);
      });
    }
  });
}
else
{
  // old basisjs-tools
  isOnline = inspectBasis.devtools && Value.from(inspectBasis.devtools.serverState, 'update', 'data.isOnline');
}

function activateInspector(inspector, e){
  cultureList.setDelegate();
  themeList.setDelegate();
  e.die();
  inspectBasisDomEvent.captureEvent('click', function(){
    inspectBasisDomEvent.releaseEvent('click');
    currentInspector.set(inspector());
  });
}

var panel = new Node({
  container: document.body,

  activated: false,
  themeName: inspectBasisTemplate.currentTheme().name,

  template: resource('./template/panel.tmpl'),

  binding: {
    activated: 'activated',
    themeName: 'themeName',
    themeList: themeList,
    cultureName: inspectBasisL10n.culture,
    cultureList: cultureList,
    isOnline: isOnline,
    permanentFilesChangedCount: permamentFilesCount,
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
    // inspectFile: function(){
    //   fileInspector().toggle();
    // },
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

themeList.selection.addHandler({
  itemsChanged: function(){
    var theme = this.pick();
    panel.themeName = theme.value;
    panel.updateBind('themeName');
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
