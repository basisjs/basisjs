module.exports = {
  name: 'basis.net.action',
  init: function(){
    var basis = window.basis.createSandbox();
    var DataObject = basis.require('basis.data').Object;
    var STATE = basis.require('basis.data').STATE;
    var createAction = basis.require('basis.net.action').create;
  },
  test: [
    {
      name: 'set correct state on abort',
      test: function(done){
        createAction({
          url: 'fixture/foo.json',
          stateOnAbort: STATE.ERROR,
          handler: {
            readyStateChanged: function(transport, request){
              if (request.lastRequestUrl_)
                request.abort();
            }
          },
          complete: function(){
            assert(String(this.state) == STATE.ERROR);
            done();
          }
        }).call(new DataObject);
      }
    },
    {
      name: 'action as syncAction',
      test: function(done){
        var foo = new DataObject({
          syncAction: createAction({
            url: 'fixture/foo.json',
            success: function(data){
              this.update(data);
            },
            complete: function(){
              assert.async(function(){
                assert.visited(['processing', 'ready']);
                done();
              });
            }
          }),
          setState: function(newState){
            visit(String(newState));
            return DataObject.prototype.setState.apply(this, arguments);
          }
        });

        assert.visited([]);

        var bar = new DataObject({
          active: true,
          delegate: foo
        });

        assert.visited(['processing']);
      }
    }
  ]
};
