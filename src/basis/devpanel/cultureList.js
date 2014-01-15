basis.require('basis.l10n');

var Menu = resource('module/menu/index.js').fetch();

var view = new Menu({
  selection: {
    handler: {
      itemsChanged: function(){
        basis.l10n.setCulture(this.pick().value);
      }
    }
  },

  childClass: {
    template: resource('template/cultureItem.tmpl'),
    binding: {
      title: 'title',
      spriteX: {
        events: 'update',
        getter: function(object){
          return object.country ? 16 * (object.country.charCodeAt(0) - 65) : 1000;
        }
      },
      spriteY: {
        events: 'update',
        getter: function(object){
          return object.country ? 11 * (object.country.charCodeAt(1) - 65) : 1000;
        }
      }
    },
    action: {
      select: function(){
        this.select();
      }
    }
  },
  childNodes: basis.l10n.getCultureList().map(function(culture){
    return {
      groupId: 'general',
      title: culture,
      value: culture,
      country: culture.split('-').pop(),
      selected: basis.l10n.getCulture() == culture
    }
  })
});

basis.l10n.onCultureChange(function(culture){
  var item = this.getChild(culture, 'value');
  if (item)
    item.select();
}, view, true);

module.exports = view;
