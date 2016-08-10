var STATE = require('basis.data').STATE;
var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var appProfile = require('type').AppProfile();

module.exports = new Node({
  active: true,
  delegate: appProfile,
  disabled: Value.query('state').as(function(state){
    return state == STATE.PROCESSING;
  }),
  template: resource('./template/app-profile-button.tmpl'),
  binding: {
    error: {
      events: 'stateChanged',
      getter: function(node){
        if (node.state == STATE.ERROR)
          return node.state.data;
      }
    }
  },
  action: {
    update: function(){
      this.deprecate();
    }
  }
});
