require('basis.data');

<<<<<<< HEAD:src/basis/devpanel/cultureList.js
var Menu = require('./component/menu.js');
=======
var inspectBasis = require('devpanel').inspectBasis;
var inspectBasisL10n = inspectBasis.require('basis.l10n');
var Menu = require('./module/menu/index.js');
>>>>>>> 1.3.0:src/devpanel/cultureList.js

module.exports = new Menu({
  childClass: {
    template: resource('./template/cultureItem.tmpl'),
    binding: {
      title: 'value',
      selected: basis.data.Value.from(inspectBasisL10n.culture).compute(function(node, value){
        return node.value == value;
      }),
      spriteX: {
        events: 'update',
        getter: function(node){
          return node.country ? 16 * (node.country.charCodeAt(0) - 65) : 1000;
        }
      },
      spriteY: {
        events: 'update',
        getter: function(node){
          return node.country ? 11 * (node.country.charCodeAt(1) - 65) : 1000;
        }
      }
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
