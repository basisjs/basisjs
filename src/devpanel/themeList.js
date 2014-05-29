<<<<<<< HEAD:src/basis/devpanel/themeList.js
basis.require('basis.template');

var Menu = require('./component/menu.js');
=======
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var Menu = require('./module/menu/index.js');
>>>>>>> 1.3.0:src/devpanel/themeList.js

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
