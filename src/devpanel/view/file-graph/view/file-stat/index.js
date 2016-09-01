var Split = require('basis.data.dataset').Split;
var count = require('basis.data.index').count;
var Node = require('basis.ui').Node;
var File = require('type').AppFile;

var fileByType = new Split({
  source: File.files,
  rule: 'data.type'
});

module.exports = new Node({
  dataSource: fileByType,

  template: resource('./template/file-stat.tmpl'),
  binding: {
    totalCount: count(File.files),
    noSelected: function(node){
      return count(node.selection).as(basis.bool.invert);
    }
  },
  action: {
    resetSelection: function(){
      this.selection.clear();
    }
  },

  listen: {
    selection: {
      itemsChanged: function(selection){
        var selected = selection.pick();
        File.matched.setDataset(selected ? selected.delegate : null);
      }
    }
  },

  selection: true,
  childClass: {
    template: resource('./template/type.tmpl'),
    binding: {
      type: 'data:title',
      count: {
        events: 'delegateChanged',
        getter: function(node){
          return count(node.delegate);
        }
      }
    }
  }
});
