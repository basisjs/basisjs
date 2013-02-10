
  basis.require('basis.app');
  basis.require('basis.ui');


  var view;
  module.exports = basis.app({
    init: function(){
      view = new basis.ui.Node({
        template: resource('app/template/layout.tmpl'),

        selection: true,
        childClass: {
          template: resource('app/template/page.tmpl'),
          event_select: function(){
            basis.ui.Node.prototype.event_select.call(this);

            if (this.lazyChildNodes)
            {
              this.setChildNodes(this.lazyChildNodes());
              this.lazyChildNodes = null;
            }
          }
        },

        handler: {
          delegateChanged: function(){
            if (this.delegate)
              this.lastChild.select();
            else
              this.firstChild.select();
          }
        },

        childNodes: [
          {
            selected: true,
            lazyChildNodes: resource('module/toc/index.js')
          },
          {
            autoDelegate: true,
            lazyChildNodes: resource('module/slide/index.js')
          }
        ]
      });
      return view.element;
    }
  });

  module.exports.selectPage = function(page){
    view.setDelegate(page);
  }
