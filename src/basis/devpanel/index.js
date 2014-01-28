basis.require('basis.ui');
basis.require('basis.dragdrop');
basis.require('basis.l10n');

var l10nInspector = resource('inspector/l10n.js').fetch();
var templateInspector = resource('inspector/template.js').fetch();
var heatInspector = resource('inspector/heatmap.js').fetch();

var themeList = resource('themeList.js').fetch();
var cultureList = resource('cultureList.js').fetch();
//var fileInspector = resource('module/fileInspector/fileInspector.js');


//
// panel
//
var panel = new basis.ui.Node({
  container: document.body,

  activated: false,
  themeName: basis.template.currentTheme().name,
  culture: basis.l10n.getCulture(),

  template: resource('template/panel.tmpl'),

  binding: {
    themeList: themeList,
    cultureList: cultureList,
    activated: 'activated',
    themeName: 'themeName',
    cultureName: 'culture'
  },

  action: {
    inspectTemplate: function(){
      basis.dom.event.captureEvent('click', function(){
        basis.dom.event.releaseEvent('click');
        templateInspector.startInspect();
      });
    },
    showThemes: function(){
      themeList.setDelegate(this);
    },
    inspectl10n: function(){
      basis.dom.event.captureEvent('click', function(){
        basis.dom.event.releaseEvent('click');
        l10nInspector.startInspect();
      });
    },
    showCultures: function(){
      cultureList.setDelegate(this);
    },
    inspectHeat: function(){
      basis.dom.event.captureEvent('click', function(){
        basis.dom.event.releaseEvent('click');
        heatInspector.startInspect();
      });
    },
    // inspectFile: function(){
    //   fileInspector().toggle();
    // },
    storePosition: function(event){
      if (localStorage){
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
      }
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

cultureList.selection.addHandler({
  itemsChanged: function(object, delta){
    panel.culture = this.pick().value;
    panel.updateBind('cultureName');
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
