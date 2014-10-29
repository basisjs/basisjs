// include all basis.js modules
require('basis.all');

var domUtils = require('basis.dom');
var domEventUtils = require('basis.dom.event');
var Node = require('basis.ui').Node;
var PageControl = require('basis.ui.tabs').PageControl;
var Cloud = require('basis.data.dataset').Cloud;
var appStat = require('app.stat');
var searchIndex = require('app.core').searchIndex;
var router = require('basis.router');
var animation = require('basis.animation');
var l10n = require('basis.l10n');
var VerticalPanelStack = require('basis.ui.panel').VerticalPanelStack;

l10n.setCultureList('en-US/ru-RU ru-RU'); // en-US temporary fallback on ru-RU
l10n.enableMarkup = true;
//basis.l10n.setCulture('ru-RU');

require('basis.app').create({
  title: 'Basis.js API',
  init: function(){
    var initTime = new Date;

    basis.object.extend(app, this);

    //
    // main part
    //
    var prototypeMapPopup = resource('./app/layout/prototypeMapPopup.js');

    var targetHeader = require('./app/layout/targetHeader.js');
    var targetContent = require('./app/layout/targetContent.js');

    targetHeader.setDelegate(targetContent);
    targetHeader.setDataSource(targetContent.getChildNodesDataset());

    var navTree = require('./app/layout/navTree.js');
    var searchTree = require('./app/layout/searchTree.js');

    navTree.selection.addHandler({
      itemsChanged: function(){
        var selected = this.pick();
        targetContent.setDelegate(selected);
        app.setTitle('Basis.js API' + (selected ? ': ' + selected.data.title + (selected.data.path ? ' @ ' + selected.data.path : '') : ''));
      }
    });

    searchTree.selection.addHandler({
      itemsChanged: function(){
        var item = this.pick();
        if (item)
          router.navigate(item.data.fullPath);
      }
    });

    var sidebarPages = new PageControl({
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
    var searchInput = require('./app/layout/searchInput.js');
    searchInput.matchFilter.node = searchTree;
    searchInput.matchFilter.addHandler({
      change: function(sender, oldValue){
        if (this.value)
        {
          if (!oldValue)
          {
            searchCloud.setSource(searchIndex);
            sidebarPages.getChildByName('search').select();
          }

          searchTree.setDataSource(searchCloud.getSubset(this.value.charAt(0).toUpperCase()));
        }
        else
        {
          sidebarPages.getChildByName('tree').select();
          var selected = navTree.selection.pick();
          if (selected)
            selected.element.scrollIntoView(true);
        }
      }
    });

    var searchCloud = new Cloud({
      ruleEvents: false,
      rule: function(obj){
        return obj.data.title
          .replace(/(?:^|[\.\_])?([A-Z])(?:[A-Z]+|[a-z]+)|(?:^|[\.\_])?(?:([a-z])[a-z]+|([A-Z])[A-Z]+)|[^a-zA-Z]/g, '$1$2$3')
          .toUpperCase()
          .split('');
      }
    });

    //
    // Layout
    //

    var sidebar = new VerticalPanelStack({
      template: '<b:include src="basis.ui.panel.Stack" id="Sidebar"/>',
      childNodes: [
        {
          template: '<b:include src="basis.ui.panel.Panel" id="Toolbar"/>',
          childNodes: searchInput
        },
        {
          flex: 1,
          template: '<b:include src="basis.ui.panel.Panel" id="SidebarContent"/>',
          childNodes: sidebarPages
        }
      ]
    });

    var contentLayout = new VerticalPanelStack({
      template: '<b:include src="basis.ui.panel.Stack" id="Content"/>',
      childNodes: [
        {
          template: '<b:include src="basis.ui.panel.Panel" id="ContentHeader"/>',
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
      var thread = new animation.Thread({
        duration: 350,
        interval: 15
      });
      var modificator = new animation.Modificator(thread, function(value){
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
    domEventUtils.addGlobalHandler('click', function(event){
      if (!event.mouseLeft)
        return;

      var sender = event.sender;

      if (sender.tagName != 'A')
        sender = domUtils.findAncestor(sender, function(node){
          return node.tagName == 'A';
        });

      if (sender && sender.pathname == location.pathname && sender.hash != '')
        navTree.open(sender.hash, domUtils.parentOf(navTree.element, sender));
    });

    domEventUtils.addGlobalHandler('keydown', function(event){
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || prototypeMapPopup().visible)
        return;

      searchInput.focus(!searchInput.focused);
    });

    searchInput.focus(true);

    appStat.initTime.set(new Date - initTime);

    return new Node({
      template: resource('./app/template/layout.tmpl'),
      binding: {
        sidebar: sidebar,
        content: contentLayout
      }
    });
  }
});
