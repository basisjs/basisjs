
  basis.require('basis.app');
  basis.require('basis.ui');


  module.exports = basis.app({
    init: function(){
      return new basis.ui.Node({
        template: resource('app/template/layout.tmpl'),
        binding: {
          toc: resource('module/toc/index.js').fetch()
        }
      }).element;
    }
  });
