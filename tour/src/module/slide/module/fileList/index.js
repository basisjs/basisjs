var Value = require('basis.data').Value;
var TabControl = require('basis.ui.tabs').TabControl;

module.exports = new TabControl({
  autoDelegate: true,
  dataSource: Value.factory('update', 'data.files'),

  template: resource('./template/list.tmpl'),

  childClass: {
    active: true,

    template: resource('./template/item.tmpl'),
    binding: {
      title: 'data:name',
      modified: Value
        .factory('targetChanged', 'target')
        .pipe('rollbackUpdate', function(target){
          return Boolean(target && target.modified);
        })
    }
  }
});
