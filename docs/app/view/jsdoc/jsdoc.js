
  basis.require('app.view');
  basis.require('app.view.jsdoc.jsdocPanel');

  //
  // exports
  //
  module.exports = new app.view.View({
    title: 'Description',
    viewHeader: 'Description',
    template: resource('template/jsdocView.tmpl'),

    binding: {
      docsView: 'satellite:content'
    },

    satelliteConfig: {
      content: {
        existsIf: Function.getter('data.fullPath'),
        delegate: function(owner){
          return app.core.JsDocEntity.getSlot(owner.data.fullPath);
        },
        instanceOf: app.view.jsdoc.jsdocPanel.JsDocPanel
      }
    }
  });

