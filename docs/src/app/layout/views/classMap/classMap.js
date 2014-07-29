
  var getBoundingRect = require('basis.layout').getBoundingRect;
  var classList = require('basis.cssom').classList;
  var basisData = require('basis.data');
  var Split = require('basis.data.dataset').Split;
  var ScrollPanel = require('basis.ui.scroller').ScrollPanel;
  var View = require('app.ext.view').View;
  var appCore = require('app.core');

  var clsById = appCore.clsList.map(function(cls){
    return new basisData.Object({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    });
  });

  var clsSplitBySuper = new Split({
    source: new basisData.Dataset({
      items: clsById
    }),
    rule: function(object){
      return object.data.superClsId;
    }
  });

  var classMap = new ScrollPanel({
    autoDelegate: true,
    dataSource: clsSplitBySuper.getSubset(0),
    childClass: {
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

      dataSource: basisData.Value.factory('update', function(node){
        return clsSplitBySuper.getSubset(this.data.clsId);
      }),

      sorting: basis.getter('data.className'),
      childClass: Class.SELF
    }
  });

  var viewClassMap = new View({
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
     var classNodeRect = getBoundingRect(classNode.tmpl.header, classMap.tmpl.scrollElement);

     var x = classNodeRect.left - (classMap.element.offsetWidth / 2) + (classNodeRect.width / 2);
     var y = classNodeRect.top - (classMap.element.offsetHeight / 2) + (classNodeRect.height / 2);

     classMap.scroller.setPosition(x, y);
  }

  //
  // exports
  //

  module.exports = viewClassMap;
