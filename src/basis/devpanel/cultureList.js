basis.require('basis.l10n');
basis.require('basis.data');

var Menu = require('./component/menu.js');

module.exports = new Menu({
  childClass: {
    template: resource('./template/cultureItem.tmpl'),
    binding: {
      title: 'value',
      selected: basis.data.Value.from(basis.l10n.culture).compute(function(node, value){
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
        basis.l10n.setCulture(this.value);
      }
    }
  },

  childNodes: basis.l10n.getCultureList().map(function(culture){
    return {
      value: culture,
      country: culture.split('-').pop()
    };
  })
});
