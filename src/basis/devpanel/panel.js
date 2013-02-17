
basis.require('basis.ui');
basis.require('basis.ui.menu');
basis.require('basis.dragdrop');
basis.require('basis.l10n');

var l10nInspector = resource('l10nInspector.js').fetch();
var templateInspector = resource('templateInspector.js').fetch();

//
// menu
//
var menu = new basis.ui.menu.Menu({
  dir: 'right bottom right top',
  autorotate: [
    'right top right bottom', 
    'left bottom left top', 
    'left top left bottom'
  ],
  childNodes: [
    {
      groupId: 'general',
      caption: 'Pick template',
      click: function(){
        templateInspector.startInspect();
        menu.hide();
      }
    },
    {
    caption: 'Translate',
      groupId: 'general',
      click: function(){
        l10nInspector.startInspect();
        menu.hide();
      }
    },
    new basis.ui.menu.MenuItemSet({
      selection: {},
      childNodes: (basis.l10n.getCultureList() || []).map(function(culture){
        return {
          groupId: 'general',
          caption: culture,
          value: culture,
          selected: basis.l10n.getCulture() == culture
        }
      }),
      childClass: {
        click: function(){
          this.select();
          basis.l10n.setCulture(this.value);
          menu.hide();
        }
      }
    })
  ],
  handler: {
    show: function(){
      panel.active = true;
      panel.updateBind('active')
    },
    hide: function(){
      panel.active = false;
      panel.updateBind('active')
    }    
  }
});


//
// panel
//
var panel = new basis.ui.Node({
  container: document.body,
  template: resource('template/panel.tmpl'),
  binding: {
    active: 'active'
  },
  action: {
    showMenu: function(){
      menu.show(this.element);
    },
    storePosition: function(event){
      if (localStorage){
        localStorage['basis-devpanel'] = parseInt(this.element.style.left) + ';' + parseInt(this.element.style.top);
      }
    }
  }
});

if (localStorage){
  var position = (localStorage['basis-devpanel'] || '0;0').split(';');
  panel.element.style.left = position[0] + 'px';
  panel.element.style.top  = position[1] + 'px';  
}

new basis.dragdrop.MoveableElement({
  element: panel.element
});

//
// exports
//
module.exports = panel;