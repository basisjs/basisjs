module.exports = require('api').define('data-flow', {
  setSourceFragment: function(){
    return require('../js-source/index.js').set;
  },
});
