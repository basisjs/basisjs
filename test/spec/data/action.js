module.exports = {
  name: 'basis.data.action',
  init: function(){
    var basis = window.basis.createSandbox();
    var DataObject = basis.require('basis.data').Object;
    var STATE = basis.require('basis.data').STATE;
    var createAction = basis.require('basis.data.action').create;
    var resolvedFn = function(){
      return Promise.resolve('success');
    };
    var rejectedFn = function(){
      return Promise.reject('fail');
    };
  },
  test: [
    {
      name: 'Action from promise',
      test: [
        {
          name: 'Should call every callback when fulfilled',
          test: function(done){
            createAction({
              fn: resolvedFn,
              start: function(){
                assert(this instanceof DataObject);
                visit('start');
              },
              success: function(data){
                assert(this instanceof DataObject);
                assert(String(this.state) == STATE.PROCESSING);
                assert(data == 'success');
                visit('success');
              },
              complete: function(){
                assert(this instanceof DataObject);
                assert(String(this.state) == STATE.READY);
                visit('complete');
              }
            }).call(new DataObject).then(function(data){
              assert(data == 'success');
              assert.visited(['start', 'success', 'complete']);
              done();
            });
          }
        },
        {
          name: 'Should call every callback when rejected',
          test: function(done){
            createAction({
              fn: rejectedFn,
              start: function(){
                assert(this instanceof DataObject);
                visit('start');
              },
              failure: function(error){
                assert(this instanceof DataObject);
                assert(String(this.state) == STATE.PROCESSING);
                assert(error == 'fail');
                visit('failure');
              },
              complete: function(){
                assert(this instanceof DataObject);
                assert(String(this.state) == STATE.ERROR);
                visit('complete');
              }
            }).call(new DataObject).catch(function(error){
              assert(error == 'fail');
              assert.visited(['start', 'failure', 'complete']);
              done();
            });
          }
        }
      ]
    }
  ]
};
