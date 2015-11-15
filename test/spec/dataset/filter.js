module.exports = {
  name: 'basis.data.dataset.Filter',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Dataset = basis.require('basis.data').Dataset;
    var Value = basis.require('basis.data').Value;
    var wrap = basis.require('basis.data').wrap;
    var Filter = basis.require('basis.data.dataset').Filter;
  },

  test: [
    {
      name: 'basic usage',
      test: [
        {
          name: 'change objects',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              rule: function(item){
                return item.data.value > 5;
              }
            });

            assert(filter.itemCount === 2);

            dataset.getItems().forEach(function(item, idx){
              item.update({
                value: idx + 4
              });
            });
            assert(filter.itemCount === 3);

            dataset.getItems().forEach(function(item, idx){
              item.update({
                value: idx + 10
              });
            });
            assert(filter.itemCount === 5);
          }
        },
        {
          name: 'change rule',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              rule: function(item){
                return item.data.value > 5;
              }
            });

            assert(filter.itemCount === 2);

            filter.setRule(function(item){
              return item.data.value <= 5;
            });
            assert(filter.itemCount === 3);

            filter.setRule(function(item){
              return true;
            });
            assert(filter.itemCount === 5);

            filter.setRule(function(item){
              return false;
            });
            assert(filter.itemCount === 0);
          }
        },
        {
          name: 'change source',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              rule: function(item){
                return item.data.value > 5;
              }
            });

            assert(filter.itemCount === 2);

            dataset.forEach(function(item){
              if (item.data.value !== 7)
                item.destroy();
            });
            assert(filter.itemCount === 1);

            dataset.add(wrap([1, 2, 3, 8, 9], true));
            assert(filter.itemCount === 3);

            dataset.clear();
            assert(filter.itemCount === 0);
          }
        }
      ]
    },
    {
      name: 'resolve',
      test: [
        {
          name: 'change objects',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              ruleEvents: null,
              rule: Value.query('data.value').as(function(value){
                return value > 5;
              })
            });

            assert(filter.itemCount === 2);

            dataset.getItems().forEach(function(item, idx){
              item.update({
                value: idx + 4
              });
            });
            assert(filter.itemCount === 3);

            dataset.getItems().forEach(function(item, idx){
              item.update({
                value: idx + 10
              });
            });
            assert(filter.itemCount === 5);
          }
        },
        {
          name: 'change rule',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              ruleEvents: null,
              rule: Value.query('data.value').as(function(value){
                return value > 5;
              })
            });

            assert(filter.itemCount === 2);

            // NOTE: use basis.getter as test runner wraps all function and `as` method
            // accepts functions with the same body and produce the same branches
            filter.setRule(Value.query('data.value').as(basis.getter(function(value){
              return value <= 5;
            })));
            assert(filter.itemCount === 3);

            filter.setRule(function(item){
              return true;
            });
            assert(filter.itemCount === 5);

            filter.setRule(Value.query('data.value').as(basis.getter(function(value){
              return value === 123;
            })));
            assert(filter.itemCount === 0);
          }
        },
        {
          name: 'change source',
          test: function(){
            var dataset = new Dataset({
              items: wrap([1, 3, 5, 7, 9], true)
            });
            var filter = new Filter({
              source: dataset,
              rule: Value.query('data.value').as(function(value){
                return value > 5;
              })
            });

            assert(filter.itemCount === 2);

            dataset.forEach(function(item){
              if (item.data.value !== 7)
                item.destroy();
            });
            assert(filter.itemCount === 1);

            dataset.add(wrap([1, 2, 3, 8, 9], true));
            assert(filter.itemCount === 3);

            dataset.clear();
            assert(filter.itemCount === 0);
          }
        }
      ]
    }
  ]
};
