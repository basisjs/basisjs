
  basis.require('basis.dom.wrapper');
  basis.require('basis.format.highlight');
  basis.require('app.ext.view');

  module.exports = new app.ext.view.View({
    title: 'Source code',
    viewHeader: 'Source code',

    template: resource('template/sourceCode.tmpl'),

    binding: {
      sourceCode: 'satellite:'
    },

    satelliteConfig: {
      sourceCode: basis.format.highlight.SourceCodeNode.subclass({
        autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
        lang: 'js',
        codeGetter: basis.getter('data.obj || ""', String)
      })
    }
  });