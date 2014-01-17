require('basis.app');
require('basis.ui');

var Test = require('./testCls.js');
var runner = require('./runner.js');

basis.app.create({
  title: 'Basis.js test environment',
  init: function(){
    return new basis.ui.Node({
      container: document.body,
      template: '<div><!--{tests}--><button event-click="run">run</button></div>',
      action: {
        run: function(){
          runner.run(this.satellite.tests.childNodes.map(function(item){
            return item.root;
          }));
        }
      },
      binding: {
        tests: new basis.ui.Node({
          childClass: {
            childClass: basis.Class.SELF,
            dataSource: basis.data.Value.factory('delegateChanged', function(node){
              return node.delegate && node.delegate.getChildNodesDataset();
            }),

            template: '<li>{name}: {state} ({stateData})<ul{childNodesElement}/></li>',
            binding: {
              name: 'data:name',
              state: ['stateChanged', 'state'],
              stateData: ['stateChanged', function(node){
                return node.state.data && node.state.data.data.error;
              }]
            }
          },
          childNodes: require('./test-index.js').map(function(item){
            return new Test({
              data: item
            });
          })
        })
      }
    });
  }
});
