var Popup = require('basis.ui.popup').Popup;
var DataFlow = require('../../../view/data-flow/view/index.js');

module.exports = new Popup({
  template: resource('./main/data-flow-popup.tmpl'),
  binding: {
    flow: new DataFlow()
  },

  dir: 'right center left center',
  zIndex: 65000,
  setZIndex: function(){
    this.element.style.zIndex = this.zIndex;
  }
});
