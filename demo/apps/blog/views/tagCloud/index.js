require('basis.data.dataset');
require('basis.data.index');
require('basis.ui');

var blog = require('blog');

var cloudCalcs = new basis.data.index.IndexMap({
  source: blog.postByTag,
  calcs: {
    percentOfRange: basis.data.index.percentOfRange('itemsChanged', 'itemCount'),
    title: function(data){
      return data.title;
    },
    source: function(data, indexes, sourceObject){
      return sourceObject;
    }
  }
});

module.exports = new basis.ui.Node({
  template: resource('./template/tagCloud.tmpl'),

  dataSource: cloudCalcs,
  sorting: function(node){
    return String(node.data.title).toLowerCase();
  },
  childClass: {
    active: true,
    template: resource('./template/tagCloudTag.tmpl'),
    binding: {
      title: 'data:',
      fontSize: {
        events: 'update',
        getter: function(node){
          return (80 + 120 * node.data.percentOfRange).toFixed(2) + '%';
        }
      }
    },
    action: {
      pick: function(){
        blog.postThread.setSource(this.data.source);
      }
    }
  }
});
