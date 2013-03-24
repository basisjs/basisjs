var Menu = resource('module/menu/index.js').fetch();

module.exports = new Menu({
  selection: {
    handler: {
      datasetChanged: function(){
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
  module.exports.getChild(themeName, 'value').select();
}, null, true);