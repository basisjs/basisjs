var Value = require('basis.data').Value;
var Filter = require('basis.data.dataset').Filter;
var TabControl = require('basis.ui.tabs').TabControl;

var changedFiles = new Filter({
  ruleEvents: 'rollbackUpdate',
  rule: function(item){
    return item.modified;
  }
});

var view = new TabControl({
  autoDelegate: true,
  dataSource: Value.query('data.files'),

  template: resource('./template/list.tmpl'),
  binding: {
    hasChanges: Value.query(changedFiles, 'itemCount')
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

changedFiles.setSource(Value.query(view, 'data.files'));

module.exports = view;
