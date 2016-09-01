module.exports = {
  init: function(){
    return function(callback){
      callback(require('api').inspect.value);
    };
  },
  inspect: function(){
    return function(mode){
      require('api').inspect.set(mode);
    };
  }
};
