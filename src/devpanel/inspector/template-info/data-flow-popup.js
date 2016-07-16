var inspectBasis = require('devpanel').inspectBasis;
var Value = require('basis.data').Value;
var Popup = require('basis.ui.popup').Popup;
var Flow = require('../../module/data-flow/index.js');
var fileAPI = require('../../api/file.js');
var buildTree = Flow.createTreeBuilder({
  sandbox: inspectBasis
});

module.exports = new Popup({
  value: new Value(),

  template: resource('./template/data-flow-popup.tmpl'),
  binding: {
    flow: new Flow({
      fileAPI: fileAPI
    })
  },

  postInit: function(){
    Popup.prototype.postInit.call(this);
    this.value
      .as(buildTree)
      .link(this.satellite.flow, this.satellite.flow.setChildNodes);
  },
  handler: {
    hide: function(){
      this.value.set(null);
    }
  },

  dir: 'right center left center',
  zIndex: 65000,
  setZIndex: function(){
    this.element.style.zIndex = this.zIndex;
  }
});
