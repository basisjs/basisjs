require('basis.data');
require('basis.data.value');
require('basis.data.index');
require('basis.ui');
require('basis.dragdrop');

var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var inspectBasisTemplate = inspectBasis.require('basis.template');
var inspectBasisDomEvent = inspectBasis.require('basis.dom.event');

var l10nInspector = resource('./inspector/l10n.js');
var templateInspector = resource('./inspector/template.js');
var heatInspector = resource('./inspector/heatmap.js');
var typographyInspector = resource('./inspector/typography.js');

var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');
//var fileInspector = resource('./module/fileInspector/fileInspector.js');

var inspectors = new basis.data.Dataset();
var inspectMode = basis.data.index.count(inspectors, 'update', 'data.mode').as(Boolean);

[
  l10nInspector,
  templateInspector,
  heatInspector,
  typographyInspector
].forEach(function(inspectorRes){
  inspectorRes.ready(function(inspector){
    inspectors.add(inspector.inspectMode.link(new basis.data.Object, function(value){
      this.update({ mode: value });
    }));
  });
});


//
// panel
//

var isOnline;
var permamentFiles = [];
var permamentFilesCount = new basis.data.Value(0);

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
  isOnline = inspectBasis.devtools && basis.data.Value.from(inspectBasis.devtools.serverState, 'update', 'data.isOnline');
}

var panel = new basis.ui.Node({
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
    reloadRequired: 'satellite:',
    grid: function(){
      var config = inspectBasis.config.devpanel;
      return Number(config && config.grid) || 0;
    }
  },

  action: {
    inspectTemplate: function(e){
      cultureList.setDelegate();
      themeList.setDelegate();
      e.die();
      inspectBasisDomEvent.captureEvent('click', function(){
        inspectBasisDomEvent.releaseEvent('click');
        templateInspector().startInspect();
      });
    },
    showThemes: function(){
      themeList.setDelegate(this);
    },
    inspectl10n: function(e){
      cultureList.setDelegate();
      themeList.setDelegate();
      e.die();
      inspectBasisDomEvent.captureEvent('click', function(){
        inspectBasisDomEvent.releaseEvent('click');
        l10nInspector().startInspect();
      });
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectHeat: function(e){
      cultureList.setDelegate();
      themeList.setDelegate();
      e.die();
      inspectBasisDomEvent.captureEvent('click', function(){
        inspectBasisDomEvent.releaseEvent('click');
        heatInspector().startInspect();
      });
    },
    inspectTypography: function(e){
      cultureList.setDelegate();
      themeList.setDelegate();
      e.die();
      inspectBasisDomEvent.captureEvent('click', function(){
        inspectBasisDomEvent.releaseEvent('click');
        typographyInspector().startInspect();
      });
    },
    // inspectFile: function(){
    //   fileInspector().toggle();
    // },
    storePosition: function(){
      if (localStorage)
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
    }
  },

  satellite: {
    reloadRequired: {
      instance: new basis.ui.Node({
        template: resource('./template/reloadRequired.tmpl'),
        binding: {
          visible: permamentFilesCount.as(Boolean),
          count: permamentFilesCount
        },
        action: {
          reload: function(){
            global.location.reload();
          }
        }
      })
    }
  },

  init: function(){
    basis.ui.Node.prototype.init.call(this);

    this.dde = new basis.dragdrop.MoveableElement();
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
