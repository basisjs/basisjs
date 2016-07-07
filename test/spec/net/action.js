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
      name: 'Set correct state on abort',
      test: function(done){
        createAction({
          url: 'data:text/plain,',
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
    }
  ]
};
