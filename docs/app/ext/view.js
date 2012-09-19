
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
    isAcceptableObject: Function.$true,
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

  var ViewList = View.subclass({
    className: namespace + '.ViewList',
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var ViewOption = basis.ui.Node.subclass({
    className: namespace + '.ViewOption',

    template: resource('view/template/viewOption.tmpl'),

    binding: {
      title: 'title'
    },

    action: {
      select: function(event){
        this.select();
      }
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

          if (node && node.handler)
            node.handler();
        }
      }
    }
  });


  //
  // exports
  //
  module.exports = {
    View: View,
    ViewList: ViewList,
    ViewOptions: ViewOptions
  }
