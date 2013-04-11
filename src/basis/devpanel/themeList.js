basis.require('basis.template');

var Menu = resource('module/menu/index.js').fetch();

var view = new Menu({
  selection: {
    handler: {
      itemsChanged: function(){
        basis.template.setTheme(this.pick().value);
      }
    }
  },
  childClass: {
    binding: {
      title: 'value'
    }
  },
  childNodes: basis.template.getThemeList().map(function(themeName){
    return {
      value: themeName,
      selected: basis.template.currentTheme().name == themeName
    }
  })
});

basis.template.onThemeChange(function(themeName){
  var item = view.getChild(themeName, 'value');
  if (item)
    item.select();
}, null, true);

module.exports = view;
