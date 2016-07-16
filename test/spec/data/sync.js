module.exports = {
  name: 'Sync subsystem',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var STATE = basis.require('basis.data').STATE;
    var Value = basis.require('basis.data').Value;
    var AbstractData = basis.require('basis.data').AbstractData;
    var DataObject = basis.require('basis.data').Object;
    var resolveValue = basis.require('basis.data').resolveValue;
  },

  test: [
    {
      name: 'should set on init',
      test: function(){
        var fn = function(){};
        var data = new AbstractData({
          syncAction: fn
        });

        assert(data.syncAction === fn);
      }
    },
    {
      name: 'should set via syncAction',
      test: function(){
        var fn = function(){};
        var data = new AbstractData();

        assert(data.syncAction === null);

        data.setSyncAction(fn);
        assert(data.syncAction === fn);

        data.setSyncAction();
        assert(data.syncAction === null);
      }
    }
  ]
};
