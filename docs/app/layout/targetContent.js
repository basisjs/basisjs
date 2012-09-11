
  basis.require('app.ext.view');

  var viewDescription = basis.resource('app/views/description/description.js');
  
  module.exports = new basis.ui.Node({
    id: 'ObjectView',
    childClass: app.ext.view.View,

    template: resource('template/targetContent.tmpl'),

    setDelegate: function(delegate){
      this.clear(true);

      basis.ui.Node.prototype.setDelegate.call(this, delegate);

      if (this.delegate)
      {
        this.setChildNodes([viewDescription()].concat(this.delegate.views || []).filter(function(view){
          return view.isAcceptableObject(this.data);
        }, this), true);

        this.scrollTo(this.firstChild.element, true);
      }
    },
    scrollTo: Function.$true
  });


  