var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisTemplate = inspectBasis.require('basis.template');
var Value = require('basis.data').Value;
var Menu = require('./Menu.js');

module.exports = new Menu({
  childClass: {
    binding: {
      title: 'value',
      selected: Value
        .from(inspectBasisTemplate.theme)
        .compute(function(node, value){
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
