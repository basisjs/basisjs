require('basis.data');
require('basis.data.value');
require('basis.data.index');
require('basis.ui');
require('basis.dragdrop');

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisEvent = inspectBasis.require('basis.dom.event');

var l10nInspector = resource('../../inspector/l10n.js');
var templateInspector = resource('../../inspector/template.js');
var heatInspector = resource('../../inspector/heatmap.js');

var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');
var isOnline = require('../../basisjs-tools-sync.js').isOnline;
var permamentFilesCount = require('../../basisjs-tools-sync.js').permamentFilesCount;

var inspectors = new basis.data.Dataset();
var inspectMode = basis.data.index.count(inspectors, 'update', 'data.mode').as(Boolean);

[l10nInspector, templateInspector, heatInspector].forEach(function(inspectorRes){
  inspectorRes.ready(function(inspector){
    inspectors.add(inspector.inspectMode.link(new basis.data.Object, function(value){
      this.update({ mode: value });
    }));
  });
});


//
// panel
//

var panel = new basis.ui.Node({
  container: document.body,

  activated: false,
  themeName: inspectBasis.template.currentTheme().name,

  template: resource('./template/panel.tmpl'),

  binding: {
    activated: 'activated',
    themeName: 'themeName',
    themeList: themeList,
    cultureName: inspectBasis.l10n.culture,
    cultureList: cultureList,
    isOnline: isOnline,
    inspectMode: inspectMode,
    permamentFilesCount: permamentFilesCount
  },

  action: {
    inspectTemplate: function(){
      cultureList.setDelegate();
      themeList.setDelegate();
      inspectBasis.dom.event.captureEvent('click', function(){
        inspectBasis.dom.event.releaseEvent('click');
        templateInspector().startInspect();
      });
    },
    showThemes: function(){
      themeList.setDelegate(this);
    },
    inspectl10n: function(){
      l10nInspector().startInspect();
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectHeat: function(){
      heatInspector().startInspect();
    },
    reload: function(){
      global.location.reload();
    }
    // inspectFile: function(){
    //   fileInspector().toggle();
    // }
  },

  init: function(){
    basis.ui.Node.prototype.init.call(this);

    this.dde = new basis.dragdrop.MoveableElement({
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
    basis.ui.Node.prototype.templateSync.call(this);

    this.dde.setElement(this.element, this.tmpl.dragElement);
  },
  destroy: function(){
    this.dde.destroy();
    this.dde = null;

    basis.ui.Node.prototype.destroy.call(this);
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
