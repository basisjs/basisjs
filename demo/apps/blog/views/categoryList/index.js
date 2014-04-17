require('basis.data.dataset');
require('basis.ui');

var blog = require('blog');

module.exports = new basis.ui.Node({
  template: resource('./template/categoryList.tmpl'),

  dataSource: blog.postByCategory,
  childClass: {
    template: resource('./template/category.tmpl'),
    binding: {
      title: 'data:'
    },
    action: {
      choose: function(){
        blog.postThread.setSource(this.delegate);
      }
    }
  }
});