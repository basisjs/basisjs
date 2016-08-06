module.exports = require('api').define('data-flow', {
  setSourceFragment: function(){
    return basis.resource.buildCloak(__dirname + '/../js-source/index.js').fetch().set;
  },
});
