
  basis.require('app.core');
  basis.require('app.view');

  var classList = basis.cssom.classList;

  function htmlHeader(title){
    return '<h3 class="Content-Header" event-click="scrollTo">' +
             '<span>' + title + '</span>' +
           '</h3>';
  }

  var clsById = app.core.clsList.map(function(cls){
    return new basis.data.DataObject({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    })
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
    template:
      '<div class="ClassNode">' +
        '<div class="connector"/>' +
        '<div class="ClassNode-Wrapper">' +
          '<div{header} class="ClassNode-Header">' +
            '<div class="ClassNode-Header-Title"><a href{link}="#">{title}</a></div>' +
          '</div>' +
          '<div{container} class="ClassNode-SubClassList">' +
            '<div class="sub-connector"/>' +
            '<div{childNodesElement} class="ClassNode-SubClassList-Wrapper"/>' +
          '</div>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.title.nodeValue = this.data.className.split(/\./).pop();
      tmpl.header.title = this.data.className;
      tmpl.link.nodeValue = '#' + this.data.className;

      if (!eventName || 'clsId' in delta)
        this.setDataSource(clsSplitBySuper.getSubset(this.data.clsId));
    },
    event_childNodesModified: function(delta){
      basis.ui.Node.prototype.event_childNodesModified.call(this, delta);
      classList(this.tmpl.container).bool('has-subclasses', !!this.childNodes.length);
    }, 

    sorting: Function.getter('data.className')
  });

  ClsNode.prototype.childClass = ClsNode;

  var classMap = new basis.ui.scroller.ScrollPanel({
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
    dataSource: clsSplitBySuper.getSubset(0),
    childClass: ClsNode
  });

  var viewClassMap = new app.view.View({
    viewHeader: 'ClassMap',
    template:
      '<div class="view ClassMap">' +
        htmlHeader('ClassMap') +
        '<div{childNodesElement} class="content"/>' +
      '</div>',

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
          scrollTimeout = setTimeout(scrollToClassNode, 0);
      }
    }     
  });

  function searchClassNode(parent, className){
    var result = parent.childNodes.search(className, Function.getter('data.className'));
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
     var classNodeRect = new nsLayout.Box(classNode.tmpl.header, false, classMap.tmpl.scrollElement);

     var x = classNodeRect.left - (classMap.element.offsetWidth / 2) + (classNodeRect.width / 2);
     var y = classNodeRect.top - (classMap.element.offsetHeight / 2) + (classNodeRect.height / 2);

     classMap.scroller.setPosition(x, y);
  }

  //
  // exports
  //

  module.exports = viewClassMap;
