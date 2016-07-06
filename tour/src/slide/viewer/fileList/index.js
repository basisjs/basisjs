var Value = require('basis.data').Value;
var count = require('basis.data.index').count;
var TabControl = require('basis.ui.tabs').TabControl;

module.exports = TabControl.subclass({
  autoDelegate: true,
  dataSource: Value.query('data.files'),

  template: resource('./template/list.tmpl'),
  binding: {
    hasChanges: count(Value.query('data.files'), 'rollbackUpdate', 'modified')
  },
  action: {
    resetSlides: function(){
      this.data.files.forEach(function(file){
        file.rollback();
      });
    }
  },

  childClass: {
    active: true,
    template: resource('./template/item.tmpl'),
    binding: {
      name: 'data:',
      modified: Value.query('target.modified').as(Boolean)
    }
  }
});
