var MoveableElement = require('basis.dragdrop').MoveableElement;
var basisData = require('basis.data');
var DataObject = basisData.Object;
var Dataset = basisData.Dataset;
var count = require('basis.data.index').count;
var Node = require('basis.ui').Node;

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var l10nInspector = resource('../../inspector/l10n.js');
var templateInspector = resource('../../inspector/template.js');
var heatInspector = resource('../../inspector/heatmap.js');

var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');
var isOnline = require('../../basisjs-tools-sync.js').isOnline;
var permamentFilesCount = require('../../basisjs-tools-sync.js').permamentFilesCount;

var inspectors = new Dataset();
var inspectMode = count(inspectors, 'update', 'data.mode').as(Boolean);

[l10nInspector, templateInspector, heatInspector].forEach(function(inspectorRes){
  inspectorRes.ready(function(inspector){
    inspectors.add(inspector.inspectMode.link(new DataObject, function(value){
      this.update({ mode: value });
    }));
  });
});


function startInspector(inspector){
  // NOTE: use capture here, to avoid event processing by inspecting
  //       basis.js instance, it may close popups or something like that
  inspectBasisDomEvent.captureEvent('click', function(){
    inspectBasisDomEvent.releaseEvent('click');
    inspector().startInspect();
  });
}

//
// panel
//

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
    inspectMode: inspectMode,
    permamentFilesCount: permamentFilesCount
  },

  action: {
    inspectTemplate: function(){
      startInspector(templateInspector);
    },
    showThemes: function(){
      themeList.setDelegate(this);
    },
    inspectl10n: function(){
      startInspector(l10nInspector);
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectHeat: function(){
      startInspector(heatInspector);
    },
    reload: function(){
      global.location.reload();
    }
    // inspectFile: function(){
    //   fileInspector().toggle();
    // }
  },

  init: function(){
    Node.prototype.init.call(this);

    this.dde = new MoveableElement({
      handler: {
        drag: function(sender, data){
          localStorage['basis-devpanel'] =
            parseInt(data.axisX.value + data.deltaX) + ';' +
            parseInt(data.axisY.value + data.deltaY);
        }
      }
    });
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
  itemsChanged: function(object, delta){
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
