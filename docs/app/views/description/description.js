
  basis.require('app.ext.view');
  basis.require('app.ext.jsdoc');

  //
  // exports
  //
  module.exports = new app.ext.view.View({
    title: 'Description',
    viewHeader: 'Description',
    template: resource('template/jsdocView.tmpl'),

    binding: {
      docsView: 'satellite:content'
    },

    satelliteConfig: {
      content: {
        existsIf: basis.getter('data.fullPath'),
        delegate: function(owner){
          return app.core.JsDocEntity.getSlot(owner.data.fullPath);
        },
        instanceOf: app.ext.jsdoc.JsDocPanel
      }
    }
  });

