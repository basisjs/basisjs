require('basis.data.dataset');
require('basis.ui');

var MONTH = 'January February March April May June July August September October November December'.split(' ');
var blog = require('blog');
var postByMonth = new basis.data.dataset.Split({
  source: blog.allPosts,
  rule: 'data.pubDate.substr(0, 7)'
});

module.exports = new basis.ui.Node({
  template: resource('./template/archive.tmpl'),
  
  dataSource: postByMonth,
  sorting: 'data.id',
  sortingDesc: true,
  grouping: {
    rule: 'data.id.substr(0, 4)',
    sorting: 'data.id',
    sortingDesc: true,
    childClass: {
      collapsed: true,
      template: resource('./template/archiveYear.tmpl'),
      binding: {
        collapsed: function(node){
          return node.collapsed ? 'collapsed' : '';
        }
      },
      action: {
        toggle: function(){
          this.collapsed = !this.collapsed;
          this.updateBind('collapsed');
        }
      }
    },
    handler: {
      childNodesModified: basis.fn.runOnce(function(){
        this.firstChild.collapsed = false;
        this.firstChild.updateBind('collapsed');
      })
    }
  },

  childClass: {
    template: resource('./template/archiveMonth.tmpl'),
    binding: {
      count: 'delegate.itemCount',
      title: function(node){
        return MONTH[node.data.id.substr(5) - 1];
      }
    },
    action: {
      choose: function(){
        blog.postThread.setSource(this.delegate);
      }
    },

    listen: {
      delegate: {
        itemsChanged: function(){
          this.updateBind('count');
        }
      }
    }
  }
});
