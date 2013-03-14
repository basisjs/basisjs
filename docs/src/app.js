resource('app/basis_modules.js').fetch();

basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.layout');
basis.require('app.core');

basis.ready(function(){
  // import names
  var Event = basis.dom.event;
  var VerticalPanelStack = basis.layout.VerticalPanelStack;

  //
  // main part
  //
  var prototypeMapPopup = resource('app/layout/prototypeMapPopup.js');

  var targetHeader = resource('app/layout/targetHeader.js')();
  var targetContent = resource('app/layout/targetContent.js')();

  targetHeader.setDelegate(targetContent);
  targetHeader.setDataSource(targetContent.getChildNodesDataset());

  var navTree = resource('app/layout/navTree.js')();
  var searchTree = resource('app/layout/searchTree.js')();

  navTree.selection.addHandler({
    datasetChanged: function(){
      var selected = this.pick();
      targetContent.setDelegate(selected);
      document.title = 'Basis API' + (selected ? ': ' + selected.data.title + (selected.data.path ? ' @ ' + selected.data.path : '') : '');
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
  var searchInput = resource('app/layout/searchInput.js')();
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
  basis.dom.event.addGlobalHandler('click', function(e){
    if (!basis.dom.event.mouseButton(e, basis.dom.event.MOUSE_LEFT))
      return;
    
    var sender = basis.dom.event.sender(e);

    if (sender.tagName != 'A')
      sender = basis.dom.findAncestor(sender, function(node){ return node.tagName == 'A'; });

    if (sender && sender.pathname == location.pathname && sender.hash != '')
      navTree.open(sender.hash, basis.dom.parentOf(navTree.element, sender));
  });

  basis.dom.event.addGlobalHandler('keydown', function(e){
    var event = basis.dom.event(e);
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || prototypeMapPopup().visible)
      return;

    basis.dom.focus(searchInput.tmpl.field, !searchInput.focused);
  });

  basis.dom.focus(searchInput.tmpl.field, true);
});
