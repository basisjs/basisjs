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
    },
    {
      name: 'calling syncAction',
      test: [
        {
          name: 'should call syncAction state is undefined and has an active customer',
          test: function(){
            var foo = new DataObject({
              syncAction: function(){
                visit('syncActionCalled');
              }
            });
            var bar = new DataObject({
              active: true,
              delegate: foo
            });

            assert(foo.state == STATE.UNDEFINED);
            assert.visited(['syncActionCalled']);
          }
        },
        {
          name: 'Promise as result',
          test: [
            {
              name: 'resolve treats as READY',
              test: function(done){
                var foo = new DataObject({
                  syncAction: function(){
                    return new Promise(function(resolve){
                      setTimeout(resolve, 5);
                    });
                  }
                });
                var bar = new DataObject({
                  active: true,
                  delegate: foo
                });

                assert(foo.state == STATE.PROCESSING);
                setTimeout(function(){
                  assert(foo.state == STATE.READY);
                  done();
                }, 10);
              }
            },
            {
              name: 'reject treats as ERROR',
              test: function(done){
                var error = new Error('test');
                var foo = new DataObject({
                  syncAction: function(){
                    return new Promise(function(resolve, reject){
                      setTimeout(function(){
                        reject(error);
                      }, 5);
                    });
                  }
                });
                var bar = new DataObject({
                  active: true,
                  delegate: foo
                });

                assert(foo.state == STATE.PROCESSING);
                setTimeout(function(){
                  assert(foo.state == STATE.ERROR);
                  assert(foo.state.data == error);
                  done();
                }, 10);
              }
            }
          ]
        }
      ]
    }
  ]
};
