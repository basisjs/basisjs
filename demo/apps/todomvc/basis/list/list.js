var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var Expression = require('basis.data.value').Expression;
var setAccumulateState = require('basis.data').Dataset.setAccumulateState;
var Task = require('../task');
var Item = require('../item/item');
var route = require('../route');

module.exports = new Node({
  template: resource('./list.tmpl'),
  dataSource: route.as(function(mode){
    if (mode === 'active') {
      return Task.active;
    }
    else if (mode === 'completed') {
      return Task.completed;
    }

    return Task.all;
  }),
  sorting: 'data.created',
  childClass: Item,
  action: {
    toggle: function(){
      setAccumulateState(true);
      if (Task.all.itemCount === Task.completed.itemCount) {
        Task.all.forEach(function(item){
          item.set('completed', false);
        });
      }
      else {
        Task.active.forEach(function(item){
          item.set('completed', true);
        });
      }
      setAccumulateState(false);
    }
  },
  binding: {
    allCompleted: new Expression(
      Value.query(Task.all, 'itemCount'),
      Value.query(Task.completed, 'itemCount'),
      function(all, completed){
        return all && all === completed;
      }
    )
  }
});
