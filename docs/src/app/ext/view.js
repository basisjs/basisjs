
  var namespace = module.path;

  var Node = require('basis.ui').Node;
  var templates = require('basis.template').define('app', {
    ViewOption: resource('./view/template/viewOption.tmpl'),
    ViewOptionList: resource('./view/template/viewOptionList.tmpl'),
  });

  //
  // classes
  //

  var View = Node.subclass({
    className: namespace + '.View',

    autoDelegate: true,
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

  var ViewOption = Node.subclass({
    className: namespace + '.ViewOption',

    template: templates.ViewOption,
    binding: {
      title: 'title'
    }
  });

  var ViewOptions = Node.subclass({
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
