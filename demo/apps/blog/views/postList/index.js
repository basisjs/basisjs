require('basis.date');
require('basis.ui');

var blog = require('blog');

module.exports = new basis.ui.Node({
  template: resource('./template/blog-thread.tmpl'),

  dataSource: blog.postThread,
  sorting: 'data.pubDate',
  sortingDesc: true,

  childClass: {
    template: resource('./template/post.tmpl'),
    binding: {
      id: 'data:',
      title: 'data:',
      content: 'data:',
      category: 'data:',
      pubDate: {
        events: 'update',
        getter: function(node){
          return basis.date.format(basis.date.fromISOString(node.data.pubDate), '%D/%M/%Y %H:%I:%S');
        }
      },
      tagList: 'satellite:'
    },
    action: {
      filterByCategory: function(){
        blog.postThread.setSource(blog.postByCategory.getSubset(this.data.category));
      }
    },

    satellite: {
      tagList: {
        existsIf: function(owner){
          return owner.data.tags && owner.data.tags.length;
        },
        delegate: basis.fn.$self,
        instanceOf: basis.ui.Node.subclass({
          template: resource('./template/tagList.tmpl'),

          init: function(){
            basis.ui.Node.prototype.init.call(this);
            basis.data.Value.from(this, 'update', 'data.tags').link(this, function(tags){
              this.setChildNodes(tags.map(function(tag){
                return { title: tag };
              }));
            });
          },

          childClass: {
            template: resource('./template/tag.tmpl'),
            binding: {
              title: 'title'
            },
            action: {
              pick: function(){
                blog.postThread.setSource(blog.postByTag.getSubset(this.title));
              }
            }
          }
        })
      }
    }
  }
});
