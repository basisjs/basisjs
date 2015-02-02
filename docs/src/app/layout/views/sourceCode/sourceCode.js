var SourceCode = require('basis.ui.code').SourceCode;
var View = require('app.ext.view').View;

module.exports = new View({
  title: 'Source code',
  viewHeader: 'Source code',

  template: resource('./template/sourceCode.tmpl'),
  binding: {
    sourceCode: new SourceCode({
      autoDelegate: true,
      lang: 'js',
      codeGetter: basis.getter('data.obj || ""', String)
    })
  }
});
