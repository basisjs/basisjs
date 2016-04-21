var inspectBasis = require('devpanel').inspectBasis;
var getDevInfo = inspectBasis.dev.getInfo;
var getColoredSource = inspectBasis.require('basis.utils.source').getColoredSource;
var getFnInfo = inspectBasis.require('basis.utils.info').fn;
var Value = require('basis.data').Value;
var Node = require('basis.ui').Node;
var Popup = require('basis.ui.popup').Popup;
var Flow = require('../../module/data-flow/index.js');
var fileAPI = require('../../api/file.js');

module.exports = new Popup({
  value: new Value(),

  dir: 'right center left center',
  template: resource('./template/data-flow-popup.tmpl'),
  binding: {
    flow: 'satellite:'
  },
  satellite: {
    flow: new Flow({
      fileAPI: fileAPI
    })
  },

  init: function(){
    Popup.prototype.init.call(this);
    this.value
      .as(function(value){
        return Flow.buildTree(value, {
          sandbox: inspectBasis,
          // getInfo: getDevInfo,
          // fnInfo: function(fn){
          //   if (typeof fn.getDevSource === 'function')
          //     fn = fn.getDevSource();

          //   return getFnInfo(fn);
          // },
          getColoredSource: getColoredSource
        });
      })
      .link(this.satellite.flow, this.satellite.flow.setChildNodes);
  },
  handler: {
    delegateChanged: function(){
      this.value = this.delegate.data.realValue;
    }
  },
  zIndex: 65000,
  setZIndex: function(){
    this.element.style.zIndex = this.zIndex;
  }
});
