
  basis.require('basis.utils.highlight');
  basis.require('basis.ui.code');

  ;;;basis.dev.warn('namespace basis.format.highlight is deprecated, use basis.utils.highlight or basis.ui.code instead');

  //
  // export names
  //

  module.setWrapper(function(){
    ;;;basis.dev.warn('using basis.format.highlight as function is deprecated now, use basis.format.highlight.highlight instead');
    return highlight.apply(this, arguments);
  });

  module.exports = {
    // functions
    highlight: function(){
      basis.utils.highlight.useStyle();
      return basis.utils.highlight.highlight.apply(this, arguments);
    },

    // classes
    SourceCodeNode: basis.ui.code.SourceCode
  };
