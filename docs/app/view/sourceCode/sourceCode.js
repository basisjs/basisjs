
  basis.require('basis.dom.wrapper');
  basis.require('basis.format.highlight');
  basis.require('app.view');

  module.exports = new app.view.View({
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
        codeGetter: Function.getter('data.obj || ""', String)
      })
    }
  });