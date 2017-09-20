
 /**
  * @namespace basis.ui.code
  */

  var namespace = 'basis.ui.code';
  var highlight = require('../utils/highlight.js').highlight;
  var Node = require('../ui.js').Node;

 /**
  * @class
  */
  var SourceCode = basis.Class(Node, {
    className: namespace + '.SourceCode',

    template: resource('./templates/highlight/SourceCode.tmpl'),

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
