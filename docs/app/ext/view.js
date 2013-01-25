
  basis.require('basis.dom.wrapper');
  basis.require('app.core');

  //
  // functions
  //
  var namespace = module.path;

  //
  // classes
  //

  var View = basis.ui.Node.subclass({
    className: namespace + '.View',
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
    isAcceptableObject: basis.fn.$true,
    binding: {
      title: 'title',
      viewOptions: 'satellite:'
    },
    action: {
      scrollTo: function(){
        if (this.parentNode)
          this.parentNode.scrollTo(this.element);
      }
    }
  });

  var ViewOption = basis.ui.Node.subclass({
    className: namespace + '.ViewOption',

    template: resource('view/template/viewOption.tmpl'),

    binding: {
      title: 'title'
    },

    action: {
      select: function(){
        this.select();
      }
    },
    init: function(){
      basis.ui.Node.prototype.init.call(this);
    }
  });

  var ViewOptions = basis.ui.Node.subclass({
    className: namespace + '.ViewOptions',

    childClass: ViewOption,

    template: resource('view/template/viewOptionList.tmpl'),

    binding: {
      title: 'title'
    },

    selection: {
      handler: {
        datasetChanged: function(){
          var node = this.pick();

          if (node && typeof node.onselect == 'function')
            node.onselect();
        }
      }
    }
  });


  //
  // exports
  //
  module.exports = {
    View: View,
    ViewOptions: ViewOptions
  };
