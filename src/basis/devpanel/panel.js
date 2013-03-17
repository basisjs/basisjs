
basis.require('basis.ui');
basis.require('basis.ui.menu');
basis.require('basis.dragdrop');
basis.require('basis.l10n');

var l10nInspector = resource('inspector/l10n.js').fetch();
var templateInspector = resource('inspector/template.js').fetch();

var countryFlagBinding = {
  spriteX: {
    events: 'update',
    getter: function(object){
      return object.country ? 16 * (object.country.charCodeAt(0) - 65) : 1000;
    }
  },
  spriteY: {
    events: 'update',
    getter: function(object){
      return object.country ? 11 * (object.country.charCodeAt(1) - 65) : 1000;
    }
  }  
};

var themeMenu = new basis.ui.menu.Menu({
  dir: 'right bottom right top',  
  autorotate: true,

  selection: {
    handler: {
      datasetChanged: function(){
        basis.template.setTheme(this.pick().value);
      }
    }
  },  

  childClass: {
    click: function(){
      this.select();
      themeMenu.hide();
    }
  },
  childNodes: basis.template.getThemeList().map(function(themeName){
    return {
      caption: themeName,
      value: themeName,
      selected: basis.template.currentTheme().name == themeName
    }
  })
});

var cultureMenu = new basis.ui.menu.Menu({
  dir: 'right bottom right top',
  autorotate: true,

  selection: {
    handler: {
      datasetChanged: function(){
        basis.l10n.setCulture(this.pick().value);
      }
    }
  },  

  childClass: {
    template: resource('template/cultureItem.tmpl'),
    binding: countryFlagBinding,
    click: function(){
      this.select();
      cultureMenu.hide();
    }
  },
  childNodes: ['base'].concat(basis.l10n.getCultureList()).map(function(culture){
    return {
      groupId: 'general',
      caption: culture,
      value: culture,
      country: culture.split('-').pop(),
      selected: basis.l10n.getCulture() == culture
    }
  })
});


//
// panel
//
var panel = new basis.ui.Node({
  container: document.body,
  template: resource('template/panel.tmpl'),
  themeName: basis.template.currentTheme().name,
  binding: basis.object.extend({
    active: 'active',
    themeName: 'themeName'
  }, countryFlagBinding),
  action: {
    inspectTemplate: function(){
      templateInspector.startInspect();
    },
    showThemes: function(){
      themeMenu.show(this.tmpl.themeButton);
    },
    inspectl10n: function(){
      l10nInspector.startInspect();
    },
    showCultures: function(){
      cultureMenu.show(this.tmpl.cultureButton);
    },
    storePosition: function(event){
      if (localStorage){
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
      }
    }
  }
});

basis.template.onThemeChange(function(themeName){
  panel.themeName = themeName;
  panel.updateBind('themeName');
  themeMenu.getChild(themeName, 'value').select();
}, null, true);

basis.l10n.onCultureChange(function(culture){
  panel.country = culture.split('-').pop();
  panel.updateBind('spriteY');
  panel.updateBind('spriteX');
  var item = cultureMenu.getChild(culture, 'value');
  if (item)
    item.select();
}, null, true);


//
// drag stuff
//
if (localStorage){
  var position = (localStorage['basis-devpanel'] || '10;10').split(';');
  panel.element.style.left = position[0] + 'px';
  panel.element.style.top  = position[1] + 'px';  
}

new basis.dragdrop.MoveableElement({
  element: panel.element,
  trigger: panel.tmpl.dragElement
});

//
// exports
//
module.exports = panel;