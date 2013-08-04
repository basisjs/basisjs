
  basis.require('basis.dom.wrapper');
  basis.require('app.core');

  var namespace = module.path;

  var templates = basis.template.define('app', {
    ViewOption: resource('view/template/viewOption.tmpl'),
    ViewOptionList: resource('view/template/viewOptionList.tmpl'),
  });

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

    template: templates.ViewOption,

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

    template: templates.ViewOptionList,
    binding: {
      title: 'title'
    },

    childClass: ViewOption,

    selection: {
      handler: {
        itemsChanged: function(){
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
