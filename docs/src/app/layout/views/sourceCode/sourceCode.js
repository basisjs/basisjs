
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui.code');
  basis.require('app.ext.view');

  module.exports = new app.ext.view.View({
    title: 'Source code',
    viewHeader: 'Source code',

    template: resource('template/sourceCode.tmpl'),

    binding: {
      sourceCode: 'satellite:'
    },

    satellite: {
      sourceCode: basis.ui.code.SourceCode.subclass({
        autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
        lang: 'js',
        codeGetter: basis.getter('data.obj || ""', String)
      })
    }
  });