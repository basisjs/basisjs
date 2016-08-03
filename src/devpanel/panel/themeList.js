var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var Menu = require('./Menu.js');

var view = new Menu({
  selection: {
    handler: {
      itemsChanged: function(){
        inspectBasisTemplate.setTheme(this.pick().value);
      }
    }
  },
  childClass: {
    binding: {
      title: 'value'
    }
  },
  childNodes: inspectBasisTemplate.getThemeList().map(function(themeName){
    return {
      value: themeName,
      selected: inspectBasisTemplate.currentTheme().name == themeName
    };
  })
});

inspectBasisTemplate.onThemeChange(function(themeName){
  var item = view.getChild(themeName, 'value');
  if (item)
    item.select();
}, null, true);

module.exports = view;
