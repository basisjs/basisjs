var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Task = require('../task');
var route = require('../route');

module.exports = new Node({
  template: resource('./footer.tmpl'),
  binding: {
    left: Value.query(Task.active, 'itemCount')
  },
  selection: true,
  childClass: {
    template: resource('./filter-item.tmpl'),
    binding: {
      label: 'label',
      url: 'url',
      selected: function(node){
        return route.as(function(id){
          return node.url === id;
        });
      }
    }
  },
  childNodes: [
    { label: 'All', url: '' },
    { label: 'Active', url: 'active' },
    { label: 'Completed', url: 'completed' }
  ],
  action: {
    clear: function(){
      Task.all.setAndDestroyRemoved(Task.active.getItems());
    }
  }
});
