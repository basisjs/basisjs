
  basis.require('basis.ui');
  basis.require('basis.utils.highlight');


 /**
  * @namespace basis.ui.code
  */

  var namespace = this.path;
  var highlight = basis.utils.highlight.highlight;

 /**
  * @class
  */
  var SourceCode = basis.Class(basis.ui.Node, {
    className: namespace + '.SourceCode',

    template: resource('templates/highlight/SourceCode.tmpl'),

    binding: {
      code: 'codeHtml'
    },

    codeGetter: basis.getter('data.code'),
    codeHtml: '',

    normalize: true,
    lineNumber: true,
    lang: 'text',

    templateUpdate: function(){
      var code = this.codeGetter(this);
      if (code != this.code_)
      {
        this.code_ = code;
        this.codeHtml = highlight(code, this.lang, {
          keepFormat: !this.normalize,
          noLineNumber: !this.lineNumber
        });
        this.updateBind('code');
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    SourceCode: SourceCode
  };