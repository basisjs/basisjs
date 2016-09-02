var Value = require('basis.data').Value;
var MapFilter = require('basis.data.dataset').MapFilter;
var Filter = require('basis.data.dataset').Filter;
var Split = require('basis.data.dataset').Split;
var count = require('basis.data.index').count;
var Node = require('basis.ui').Node;
var AppFile = require('type').AppFile;
var RuntimeFile = require('type').RuntimeFile;

var activatedFilesSlots = new MapFilter({
  source: new Filter({
    source: RuntimeFile.all,
    rule: 'data.resolved'
  }),
  map: function(runtimeFile){
    return AppFile.getSlot(runtimeFile.data.filename);
  }
});
var activatedFiles = new MapFilter({
  source: activatedFilesSlots,
  ruleEvents: 'targetChanged',
  map: function(slot){
    return slot.target;
  }
});
var fileByType = new Split({
  source: AppFile.files,
  rule: 'data.type'
});

var Item = Node.subclass({
  selected: Value.query(AppFile.matched, 'dataset').compute(function(node, dataset){
    return (node.dataset || node.delegate) === dataset;
  }),

  template: resource('./template/type.tmpl'),
  binding: {
    type: function(node){
      return node.caption || node.data.id;
    },
    count: function(node){
      return count(node.dataset || node.delegate);
    }
  },
  action: {
    select: function(){
      AppFile.matched.setDataset(this.dataset || this.delegate);
    }
  }
});

module.exports = new Node({
  template: resource('./template/file-stat.tmpl'),
  binding: {
    activatedFiles: 'satellite:',
    allFiles: 'satellite:'
  },

  dataSource: fileByType,
  childClass: Item,
  satellite: {
    activatedFiles: new Item({
      dataset: activatedFiles,
      caption: 'activated files'
    }),
    allFiles: new Item({
      dataset: AppFile.files,
      caption: 'all files'
    })
  }
});
