
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
      code: {
        events: 'update',
        getter: function(node){
          var code = node.codeGetter(node);

          if (code != node.code_)
          {
            node.code_ = code;
            node.codeHtml_ = highlight(code, node.lang, {
              keepFormat: !node.normalize,
              noLineNumber: !node.lineNumber
            });
          }

          return node.codeHtml_;
        }
      }
    },

    codeGetter: basis.getter('data.code'),
    codeHtml_: '',
    code_: '',

    normalize: true,
    lineNumber: true,
    lang: 'text'
  });


  //
  // export names
  //

  module.exports = {
    SourceCode: SourceCode
  };
