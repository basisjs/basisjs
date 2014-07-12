
  basis.require('basis.cssom');
  basis.require('basis.data')
  basis.require('basis.data.dataset')
  basis.require('basis.ui')
  basis.require('app.core');
  basis.require('app.ext.view');

  var classList = basis.cssom.classList;

  var clsById = app.core.clsList.map(function(cls){
    return new basis.data.Object({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    });
  });

  var clsSplitBySuper = new basis.data.dataset.Split({
    source: new basis.data.Dataset({
      items: clsById
    }),
    rule: function(object){
      return object.data.superClsId;
    }
  });

  var ClsNode = basis.ui.Node.subclass({
    template: resource('./template/classMapNode.tmpl'),
    binding: {
      path: 'data:',
      className: {
        events: 'update',
        getter: function(node){
          return node.data.className.split(/\./).pop();
        }
      },
      hasSubclasses: {
        events: 'childNodesModified',
        getter: function(node){
          return node.firstChild ? 'has-subclasses' : '';
        }
      }
    },

    dataSource: basis.data.Value.factory('update', function(node){
      return clsSplitBySuper.getSubset(this.data.clsId);
    }),

    sorting: basis.getter('data.className'),
    childClass: Class.SELF
  });

  var classMap = new basis.ui.scroller.ScrollPanel({
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
    dataSource: clsSplitBySuper.getSubset(0),
    childClass: ClsNode
  });

  var viewClassMap = new app.ext.view.View({
    viewHeader: 'ClassMap',
    template: resource('./template/classMap.tmpl'),

    childNodes: classMap
  });


  // scroll to class
  var scrollTimeout;
  var classNode;

  classMap.addHandler({
    update: function(object, delta){
      if ('fullPath' in delta && this.data.fullPath)
      {
        clearTimeout(scrollTimeout);
        classNode = searchClassNode(this, this.delegate.data.obj.className);
        if (classNode)
          scrollTimeout = basis.nextTick(scrollToClassNode);
      }
    }     
  });

  function searchClassNode(parent, className){
    var result = basis.array.search(parent.childNodes, className, basis.getter('data.className'));
    if (!result)
    {
      for (var i = 0, node; node = parent.childNodes[i]; i++)
      {
        result = searchClassNode(node, className);
        if (result)
          break;
      }
    }
    return result;
  }

  function scrollToClassNode(){
     var classNodeRect = basis.layout.getBoundingRect(classNode.tmpl.header, classMap.tmpl.scrollElement);

     var x = classNodeRect.left - (classMap.element.offsetWidth / 2) + (classNodeRect.width / 2);
     var y = classNodeRect.top - (classMap.element.offsetHeight / 2) + (classNodeRect.height / 2);

     classMap.scroller.setPosition(x, y);
  }

  //
  // exports
  //

  module.exports = viewClassMap;
