var View = require('app.ext.view').View;
var JsDocPanel = require('app.ext.jsdoc').JsDocPanel;
var JsDocEntity = require('app.core').JsDocEntity;

//
// exports
//
module.exports = new View({
  title: 'Description',
  viewHeader: 'Description',

  template: resource('./template/jsdocView.tmpl'),
  binding: {
    docsView: 'satellite:content'
  },

  satellite: {
    content: {
      satelliteClass: JsDocPanel,
      existsIf: 'data.fullPath',
      delegate: function(owner){
        return JsDocEntity.getSlot(owner.data.fullPath);
      }
    }
  }
});
