var Popup = require('basis.ui.popup').Popup;
var api = require('../api.js');

module.exports = Popup.subclass({
  dir: 'top left bottom left',
  autorotate: true,
  template: resource('./template/popup.tmpl'),
  binding: {
    loc: 'data:filename',
    source: 'data:source'
  },

  init: function(){
    Popup.prototype.init.call(this);

    api.channel.link(this, this.update);
  },

  zIndex: 65000,
  setZIndex: function(){
    this.element.style.zIndex = this.zIndex;
  }
});
