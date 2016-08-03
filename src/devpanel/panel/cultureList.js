var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var Value = require('basis.data').Value;
var Menu = require('./Menu.js');

module.exports = new Menu({
  childClass: {
    binding: {
      title: 'value',
      selected: Value
        .from(inspectBasisL10n.culture)
        .compute(function(node, value){
          return node.value == value;
        })
    },
    action: {
      select: function(){
        inspectBasisL10n.setCulture(this.value);
      }
    }
  },

  childNodes: inspectBasisL10n.getCultureList().map(function(culture){
    return {
      value: culture,
      country: culture.split('-').pop()
    };
  })
});
