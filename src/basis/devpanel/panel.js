
basis.require('basis.ui');
basis.require('basis.ui.menu');
basis.require('basis.dragdrop');
basis.require('basis.l10n');

var l10nInspector = resource('l10nInspector.js').fetch();
var templateInspector = resource('templateInspector.js').fetch();

var currentCulture = new basis.data.property.Property(basis.l10n.getCulture(), {
  change: function(value){
    basis.l10n.setCulture(this.value);
  }
});

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
}

var themeMenu = new basis.ui.menu.Menu({
  selection: {
    handler: {
      datasetChanged: function(){
        basis.template.setTheme(this.pick().value);
      }
    }
  },  
  dir: 'right bottom right top',  
  childNodes: basis.template.getThemeList().map(function(themeName){
    return {
      caption: themeName,
      value: themeName,
      selected: basis.template.currentTheme().name == themeName
    }
  }),
  childClass: {
    click: function(){
      this.select();
      themeMenu.hide();
    }
  }
});

var cultureMenu = new basis.ui.menu.Menu({
  selection: {
    handler: {
      datasetChanged: function(){
        currentCulture.set(this.pick().value);
      }
    }
  },  
  dir: 'right bottom right top',  
  childNodes: (basis.l10n.getCultureList() || []).map(function(culture){
    return {
      groupId: 'general',
      caption: culture,
      value: culture,
      country: culture.split('-').pop(),
      selected: basis.l10n.getCulture() == culture
    }
  }),
  childClass: {
    template: resource('template/cultureItem.tmpl'),
    binding: countryFlagBinding,
    click: function(){
      this.select();
      cultureMenu.hide();
    }
  }
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

currentCulture.addLink(panel, function(value){
  this.country = value.split('-').pop();
  this.updateBind('spriteY');
  this.updateBind('spriteX');
});

//
// drag stuff
//
if (localStorage){
  var position = (localStorage['basis-devpanel'] || '0;0').split(';');
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