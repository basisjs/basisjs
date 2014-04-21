basis.require('basis.ui');
basis.require('basis.dragdrop');

var inspectBasis = require('devpanel').inspectBasis;
inspectBasis.require('basis.l10n');
inspectBasis.require('basis.template');
inspectBasis.require('basis.dom.event');

var l10nInspector = resource('./inspector/l10n.js');
var templateInspector = resource('./inspector/template.js');
var heatInspector = resource('./inspector/heatmap.js');

var themeList = require('./themeList.js');
var cultureList = require('./cultureList.js');
//var fileInspector = resource('./module/fileInspector/fileInspector.js');


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

  basisjsToolsFileSync.notifications.attach(function(eventName, filename){
    var ext = basis.path.extname(filename);

    if (eventName == 'new' || ext in basis.resource.extensions == false)
      return;

    if (basis.resource.extensions[ext].permanent && basis.resource.isResolved(filename))
    {
      basis.setImmediate(function(){
        if (basis.resource(filename).hasChanges())
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
  themeName: inspectBasis.template.currentTheme().name,

  template: resource('./template/panel.tmpl'),

  binding: {
    activated: 'activated',
    themeName: 'themeName',
    themeList: themeList,
    cultureName: inspectBasis.l10n.culture,
    cultureList: cultureList,
    isOnline: isOnline,
    reloadRequired: 'satellite:'
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
      cultureList.setDelegate();
      themeList.setDelegate();
      inspectBasis.dom.event.captureEvent('click', function(){
        inspectBasis.dom.event.releaseEvent('click');
        l10nInspector().startInspect();
      });
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectHeat: function(){
      cultureList.setDelegate();
      themeList.setDelegate();
      inspectBasis.dom.event.captureEvent('click', function(){
        inspectBasis.dom.event.releaseEvent('click');
        heatInspector().startInspect();
      });
    },
    // inspectFile: function(){
    //   fileInspector().toggle();
    // },
    storePosition: function(event){
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
