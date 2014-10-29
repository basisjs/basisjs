
  var namespace = module.path;


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

    template: module.template('ViewOption'),
    binding: {
      title: 'title'
    }
  });

  var ViewOptions = Node.subclass({
    className: namespace + '.ViewOptions',

    template: module.template('ViewOptionList'),
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
