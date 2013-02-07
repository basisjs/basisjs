
  basis.require('app.core');

  // import names
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var VerticalPanelStack = basis.layout.VerticalPanelStack;

  //
  // main part
  //
  var prototypeMapPopup = basis.resource('app/layout/prototypeMapPopup.js');

  var targetHeader = basis.resource('app/layout/targetHeader.js')();
  var targetContent = basis.resource('app/layout/targetContent.js')();

  targetHeader.setDelegate(targetContent);
  targetHeader.setDataSource(targetContent.getChildNodesDataset());

  var navTree = basis.resource('app/layout/navTree.js')();
  var searchTree = basis.resource('app/layout/searchTree.js')();

  navTree.selection.addHandler({
    datasetChanged: function(){
      targetContent.setDelegate(this.pick());
    }
  });

  searchTree.selection.addHandler({
    datasetChanged: function(){
      var item = this.pick();
      if (item)
        navTree.open(item.data.fullPath);
    }
  });

  var sidebarPages = new basis.ui.tabs.PageControl({
    childNodes: [
      {
        name: 'tree',
        childNodes: navTree
      },
      {
        name: 'search',
        childNodes: searchTree
      }
    ]
  });

  //
  // search input
  //
  var searchInput = basis.resource('app/layout/searchInput.js')();
  searchInput.matchFilter.node = searchTree;
  searchInput.matchFilter.addHandler({
    change: function(sender, value, oldValue){
      if (value)
      {
        if (!oldValue)
        {
          searchCloud.setSource(app.core.searchIndex);
          sidebarPages.item('search').select();
        }

        searchTree.setDataSource(searchCloud.getSubset(value.charAt(0).toUpperCase()));
      }
      else
      {
        sidebarPages.item('tree').select();
        var selected = navTree.selection.pick();
        if (selected)
          selected.element.scrollIntoView(true);
      }
    }
  });

  var searchCloud = new basis.data.dataset.Cloud({
    ruleEvents: false,
    rule: function(obj){
      return obj.data.title
        .replace(/(?:^|[\.\_])?([A-Z])(?:[A-Z]+|[a-z]+)|(?:^|[\.\_])(?:([a-z])[a-z]+|([A-Z])[A-Z]+)|[^a-zA-Z]/g, '$1$2$3')
        .toUpperCase()
        .split('')
        .sort()
        .join('')
        .replace(/([A-Z])\1+/g, '$1')
        .split('');
    }
  });

  //
  // Layout
  //

  new VerticalPanelStack({
    container: basis.dom.get('Layout'),
    id: 'Sidebar',
    childNodes: [
      {
        id: 'Toolbar',
        childNodes: searchInput
      },
      {
        id: 'SidebarContent',
        flex: 1,
        childNodes: sidebarPages
      }
    ]
  });

  var contentLayout = new VerticalPanelStack({
    container: basis.dom.get('Layout'),
    id: 'Content',
    childNodes: [
      {
        id: 'ContentHeader',
        content: targetHeader.element
      },
      { 
        flex: 1,
        content: targetContent.element
      }
    ]
  });

  //
  // scrolling
  //
  targetContent.scrollTo = smoothScroll(contentLayout.lastChild.element);

  function smoothScroll(element){
    var thread = new basis.animation.Thread({
      duration: 350,
      interval: 15
    });
    var modificator = new basis.animation.Modificator(thread, function(value){
      element.scrollTop = parseInt(value);
    }, 0, 0, true);

    modificator.timeFunction = function(value){
      return Math.sin(Math.acos(1 - value));
    };

    return function(relElement, jump){
      var curScrollTop = element.scrollTop;
      modificator.setRange(curScrollTop, curScrollTop);
      thread.stop();
      if (jump)
        element.scrollTop = relElement.offsetTop;
      else
      {
        modificator.setRange(curScrollTop, relElement.offsetTop);
        thread.start();
      }
    };
  }

  //
  // Global events
  //
  Event.addGlobalHandler('click', function(e){
    if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      return;
    
    var sender = Event.sender(e);

    if (sender.tagName != 'A')
      sender = DOM.findAncestor(sender, function(node){ return node.tagName == 'A'; });

    if (sender && sender.pathname == location.pathname && sender.hash != '')
      navTree.open(sender.hash, DOM.parentOf(navTree.element, sender));
  });

  Event.addGlobalHandler('keydown', function(e){
    var event = Event(e);
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || prototypeMapPopup().visible)
      return;

    DOM.focus(searchInput.tmpl.field, !searchInput.focused);
  });

  DOM.focus(searchInput.tmpl.field, true);
