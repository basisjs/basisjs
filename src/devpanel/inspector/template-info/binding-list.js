var Node = require('basis.ui').Node;
var fileAPI = require('../../api/file.js');
var hoveredBinding = require('./binding.js').hover;
var jsSourcePopup = require('../../module/js-source-popup/index.js');
var dataFlowPopup = require('./data-flow-popup.js');

module.exports = new Node({
  sorting: 'data.name',
  grouping: {
    rule: 'data.used',
    childClass: {
      template: resource('./template/bindings/group.tmpl'),
      binding: {
        name: function(node){
          return node.data.id ? 'used' : 'notUsed';
        }
      }
    },
    sorting: function(node){
      return Number(!node.data.id);
    }
  },
  childClass: {
    template: resource('./template/bindings/binding.tmpl'),
    binding: {
      name: 'data:',
      value: 'data:',
      used: 'data:',
      isReactive: 'data:',
      nestedView: 'data:',
      loc: 'data:',
      highlight: hoveredBinding.compute('update', function(node, value){
        return node.data.used && (!value || node.data.name === value);
      })
    },
    action: {
      enter: function(e){
        if (this.data.used)
          hoveredBinding.set(this.data.name);

        if (this.data.loc)
        {
          jsSourcePopup.loc.set(this.data.loc);
          jsSourcePopup.show(e.actionTarget);
        }
      },
      leave: function(){
        hoveredBinding.set();
        jsSourcePopup.hide();
      },
      showResolve: function(e){
        dataFlowPopup.value.set(this.data.realValue);
        dataFlowPopup.show(e.actionTarget);
      },
      pickValue: function(){
        if (this.data.loc)
          fileAPI.openFile(this.data.loc);
      }
    }
  }
});
