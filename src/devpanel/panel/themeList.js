var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var Value = require('basis.data').Value;
var Menu = require('./Menu.js');
var currentTheme = new Value();

inspectBasisTemplate.onThemeChange(currentTheme.set, currentTheme, true);

module.exports = new Menu({
  currentTheme: currentTheme,
  childClass: {
    binding: {
      title: 'value',
      selected: currentTheme.compute(function(node, value){
        return node.value == value;
      })
    },
    action: {
      select: function(){
        inspectBasisTemplate.setTheme(this.value);
      }
    }
  },

  childNodes: inspectBasisTemplate.getThemeList().map(function(themeName){
    return {
      value: themeName
    };
  })
});
