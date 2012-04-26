(function(){

 /**
  * @namespace
  */

  var namespace = 'BasisDoc';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var nsWrappers = basis.dom.wrapper;
  var nsTree = basis.ui.tree;
  var nsTabs = basis.ui.tabs;
  var nsForm = basis.ui.form;
  var nsPopup = basis.ui.popup;
  var nsButton = basis.ui.button;
  var nsLayout = basis.layout;
  var nsEntity = basis.entity;
  var nsAnimation = basis.animation;

  var uiContainer = basis.ui.Container;
  var uiNode = basis.ui.Node;
  
  var nsCore = BasisDoc.Core;
  var nsView = BasisDoc.View;
  var nsNav = BasisDoc.Nav;

  //
  // main part
  //

  var curHash;

  //
  //  Overview 
  //

  var buildin = nsCore.buildin;

  //
  // View
  //

  function smoothScroll(element){
    var thread = new nsAnimation.Thread({
      duration: 350,
      interval: 15
    });
    var modificator = new nsAnimation.Modificator(thread, function(value){
      element.scrollTop = parseInt(value);
    }, 0, 0, true);

    modificator.timeFunction = function(value){
      return Math.sin(Math.acos(1 - value));
    }

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
    }
  };

  var targetContent = new uiContainer({
    id: 'ObjectView',
    childClass: nsView.View,

    template:
      '<div class="XControl">' +
        '<div{content|childNodesElement} class="XControl-Content"/>' +
      '</div>',

    setDelegate: function(delegate){
      this.clear(true);

      uiContainer.prototype.setDelegate.call(this, delegate);

      if (this.delegate)
      {
        this.setChildNodes([nsView.viewJsDoc].concat(this.delegate.views || []).filter(function(view){
          return view.isAcceptableObject(this.data);
        }, this), true);

        this.scrollTo(this.firstChild.element, true);
      }
    },

    handler1: {
      delegateChanged: function(object, oldDelegate){
        if (this.delegate)
        {
          this.setChildNodes([nsView.viewJsDoc].concat(this.delegate.views || []).filter(function(view){
            return view.isAcceptableObject(this.data);
          }, this), true);
          this.scrollTo(this.firstChild.element, true);
        }
        else
          this.clear(true);
      }
    }
  });

  var prototypeDataset = new nsWrappers.ChildNodesDataset(nsView.viewPrototype);
  var prototypeMapPopup = new nsPopup.Balloon({
    id: 'PrototypeMapPopup',
    dir: 'center bottom center top',
    selection: {},
    childClass: Class(uiNode,
      basis.ui('<div{element} class="item" event-click="scrollTo">{this_data_key}</div>'),
      {
        action: {
          scrollTo: function(event){
            var element = this.delegate.element;
            targetContent.scrollTo(element);
            this.parentNode.hide();
            classList(element).add('highlight');
            setTimeout(function(){ classList(element).remove('highlight'); });
          }
        }
      }
    ),
    sorting: Function.getter('data.title'),
    grouping: Object.slice(nsView.viewPrototype.grouping, 'groupGetter sorting childClass'.qw()),
    event_beforeShow: function(){
      this.constructor.prototype.event_beforeShow.call(this);
      this.setDataSource(prototypeDataset);
    },
    event_show: function(){
      this.constructor.prototype.event_show.call(this);
      prototypeMapPopupMatchInput.select();
    },
    event_hide: function(){
      this.constructor.prototype.event_hide.call(this);
      this.setDataSource();
      prototypeMapPopupMatchInput.setValue();
    }
  });

  var prototypeMapPopupMatchInput = new nsForm.MatchInput({
    event_keyup: function(event){
      this.constructor.prototype.event_keyup.call(this);

      var selected = prototypeMapPopup.selection.pick();
      switch (Event.key(event)){
        case Event.KEY.UP: 
          prototypeMapPopup.selection.set([selected && selected.previousSibling || prototypeMapPopup.lastChild]);
        break;
        case Event.KEY.DOWN: 
          prototypeMapPopup.selection.set([selected && selected.nextSibling || prototypeMapPopup.firstChild]);
        break;
        case Event.KEY.ENTER: 
          if (selected)
            selected.templateAction('scrollTo');
        break;
      }
    },
    matchFilter: {
      node: prototypeMapPopup,
      textNodeGetter: Function.getter('tmpl.this_data_title')
    }
  });
  DOM.insert(prototypeMapPopup.tmpl.content.parentNode, prototypeMapPopupMatchInput.element, DOM.INSERT_BEGIN);

  var targetHeader = new uiContainer({
    delegate: targetContent,
    dataSource: new nsWrappers.ChildNodesDataset(targetContent),

    childClass: Class(nsButton.Button, {
      binding: {
        caption: function(button){
          return button.delegate.viewHeader;
        }
      },
      click: function(){
        if (this.delegate === nsView.viewPrototype)
          prototypeMapPopup.show(this.element);
        else
          this.delegate.parentNode.scrollTo(this.delegate.element);
      }
    }),

    template:
      '<div>' +
        '<h2 class="view viewTitle kind-{kind}">' +
          '<span class="title">{title}</span>' +
          '<span class="path">{path}</span>' +
        '</h2>' +
        '<div{childNodesElement} class="QuickNavBar" />' +
      '</div>',

    binding: {
      kind: 'data:',
      path: 'data:path || ""',
      title: {
        events: 'update',
        getter: function(node){
          return (node.data.title || '') + (/^(method|function|class)$/.test(node.data.kind) ? nsCore.getFunctionDescription(node.data.obj).args.quote('(') : '');
        }
      }
    }/*,

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.contentText.nodeValue = (this.data.title || '') + (/^(method|function|class)$/.test(this.data.kind) ? nsCore.getFunctionDescription(this.data.obj).args.quote('(') : '');
      tmpl.pathText.nodeValue = this.data.path || '';

      if (delta && 'kind' in delta)
        classList(this.element.firstChild).replace(delta.kind, this.data.kind, 'kind-');
    }*/
  });


  //
  // NavTree
  //

  var navTree = new nsTree.Tree({
    selection: {
      handler: {
        datasetChanged: function(dataset, delta){
          var selected = this.pick();
          if (selected)
          {
            navTree.open(selected.data.fullPath, true);
            location.hash = '#' + selected.data.fullPath;
          }

          targetContent.setDelegate(selected);
        }
      }
    },
    childClass: nsNav.docSection,
    childNodes: [
      {
        data: { title: 'Buildin class extensions', fullPath: 'window' },
        collapsed: true,
        childNodes: Object.iterate(buildin, function(key, value){
          return new nsNav.docClass({
            data: {
              kind: 'Class',
              title: key,
              path: '',
              fullPath: key,
              obj: value
            }
          });
        })
      },
      {
        data: { title: 'basis', fullPath: 'basis' },
        childNodes: Object.iterate(basis.namespaces_, function(key){
          return mapDO[key];
        })
      }
    ],

    open: function(path, noScroll){
      path = path.replace(/^#/, '');

      if (!path || (curHash == '#' + path))
        return;

      curHash = location.hash = '#' + path;

      var rootNS = path.split(".")[0];
      if (buildin[rootNS])
        rootNS = 'window';

      var node = this.childNodes.search(rootNS, 'data.fullPath');

      //if (typeof console != 'undefined') console.log(node);

      if (node)
      {
        node.expand();
        node = node.childNodes.search(path, 'data.fullPath')
               ||
               node.childNodes
                 .sortAsObject('data.fullPath')
                 .reverse()
                 .search(0, function(node){
                   return path.indexOf(node.data.fullPath + '.');
                 });
      }


      if (node)
      {
        var cursor = node.data.fullPath;
        var least = path.replace(new RegExp("^" + cursor.forRegExp() + '\\.?'), '');
        if (least)
        {
          var parts = least.split(/\./);
          while (node && parts.length)
          {
            var p = parts.shift();
            cursor += '.' + p;
            if (p == 'prototype')
              cursor += '.' + parts.shift();

            node.expand();
            node = node.childNodes.search(cursor, 'data.fullPath');
          }
        }

        if (node)
        {
          node.select();
          //node.expand();
          if (!noScroll)
            node.element.scrollIntoView(false);

          document.title = 'Basis API: ' + node.data.title + (node.data.path ? ' @ ' + node.data.path : '');
        }
      }
    }
  });

  var searchTree = new nsTree.Tree({
    id: 'SearchTree',
    sorting: getter('data.title', String.toLowerCase),
    grouping: nsNav.nodeTypeGrouping,
    childClass: Class(nsTree.Node, {
      template:
        '<li class="Basis-TreeNode">' +
          '<div{content} class="Basis-TreeNode-Title {selected} {disabled}">' +
            '<span class="Basis-TreeNode-Caption" event-click="select">' +
              '<span class="namespace">{namespace}</span>' +
              '<span class="label">{title}<!--{args}--></span>' +
            '</span>' +
          '</div>' +
        '</li>',

      binding: {
        args: function(node){
          if (/^(function|method|class)$/.test(node.data.kind))
            return DOM.createElement('SPAN.args', nsCore.getFunctionDescription(node.data.obj).args.quote('('));
        },
        namespace: function(node){
          return node.data.kind != 'namespace' ? node.data.path : '';
        }
      },

      action: {
        select: function(){
          navTree.open(this.data.fullPath);
        }
      },

      init: function(config){
        nsTree.Node.prototype.init.call(this, config);

        this.nodeType = nsNav.kindNodeType[this.data.kind];
        classList(this.tmpl.content).add(this.data.kind.capitalize() + '-Content');
      }
    })
  });

  var sidebarPages = new nsTabs.PageControl({
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

  var SearchMatchInput = Class(nsForm.MatchInput, {
    matchFilterClass: Class(nsForm.MatchFilter, {
      textNodeGetter: getter('tmpl.title'),
      event_change: function(value, oldValue){
        nsForm.MatchProperty.prototype.event_change.call(this, value, oldValue);

        var fc = value.charAt(0);
        var v = value.substr(1).replace(/./g, function(m){ return '[' + m.toUpperCase() + m.toLowerCase() + ']' });
        var rx = new RegExp('(^|[^a-zA-Z])([' + fc.toLowerCase() + fc.toUpperCase() +']' + v + ')|([a-z])(' + fc.toUpperCase() + v + ')');
        //console.log(rx.source);
        var textNodeGetter = this.textNodeGetter;
        var wrapMap = this.map;

        wrapMap['SPAN.match'] = function(s, i){ return s && (i % 5 == 2 || i % 5 == 4) };

        this.node.setMatchFunction(x = value ? function(child, reset){
          if (!reset)
          {
            var textNode = child._m || textNodeGetter(child);
            var p = textNode.nodeValue.split(rx);
            if (p.length > 1)
            {
              DOM.replace(
                child._x || textNode,
                child._x = DOM.createElement('SPAN.matched', DOM.wrap(p, wrapMap))
              );
              child._m = textNode;
              return true;
            }
          }
          
          if (child._x)
          {
            DOM.replace(child._x, child._m);
            delete child._x;
            delete child._m;
          }
          
          return false;
        } : null);

        DOM.get('SidebarContent').scrollTop = 0;
      }
    })
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
  /*console.log('build search cloud', new Date - t, nsCore.searchIndex.itemCount);
  console.log(searchCloud.getItems().map(function(item){
    return item.data.id + ': ' + item.itemCount;
  }));*/


  var searchInputFocused = false;
  var searchInput = new SearchMatchInput({
    cssClassName: 'empty Basis-MatchInput',
    action: {
      clear: function(){
        this.setValue();
      }
    },
    matchFilter: {
      node: searchTree,
      regexpGetter: function(value){
        return new RegExp('(^|[^a-z])(' + value.forRegExp() + ')', 'i');
      },
      handler: {
        change: function(value, oldValue){
          classList(searchInput.element).bool('empty', !value);

          if (value)
          {
            if (!oldValue)
            {
              searchCloud.setSource(nsCore.searchIndex);
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
      }
    }
  });
  DOM.insert(searchInput.element, DOM.createElement('#CancelSearchButton[event-click="clear"]', 'x'));

  Event.addHandlers(searchInput.tmpl.field, {
    keyup: function(event){
      var key = Event.key(event);
      var ctrl = this.matchFilter.node;
      var selected = ctrl.selection.pick();
      
      if ([Event.KEY.UP, Event.KEY.DOWN].has(key))
      {
        var cn = ctrl.childNodes;
        var pos = -1, node;
        
        if (selected && selected.matched)
          pos = cn.indexOf(selected);
        
        if (key == Event.KEY.UP)
          node = cn.lastSearch(true, 'matched', pos == -1 ? cn.length : pos);
        else
          node = cn.search(true, 'matched', pos + 1);

        if (node)
          node.select();
      }
      else
        if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER].has(key))
          if (selected)
            navTree.open(selected.data.fullPath);
    },
    keydown: function(event){
      var key = Event.key(event);
      var chr = String.fromCharCode(key);

      if (key == 27)
        return searchInput.setValue();

      if (!/[a-z\_0-9\x08\x09\x0A\x0D\x23-\x28]/i.test(chr))
        Event.kill(event);
    },
    focus: function(){
      searchInputFocused = true;
    },
    blur: function(){
      searchInputFocused = false;
    }
  }, searchInput);


  //
  // Source view
  //

  /*
  var sourceView = new basis.DOM.Wrapper.TmplContainer({
    template:
      '<div{element} id="SourceCodeViewer">' +
        '<div class="layout">' +
          '<div class="header">Header</div>' +
          '<div{content} class="content"></div>' +
        '</div>' +
      '</div>'
  });

  DOM.insert(document.body, sourceView.element);
  DOM.insert(sourceView.content, new basis.Plugin.SyntaxHighlight.SourceCodeNode({
    data: {
      code: basis.DOM.Wrapper.Node.prototype.insertBefore.toString()
    }
  }).element);*/

  //
  // Layout
  //

  var panel = new nsLayout.VerticalPanelStack({
    container: 'Layout',
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

  var contentLayout = new nsLayout.VerticalPanelStack({
    container: 'Layout',
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

  targetContent.scrollTo = smoothScroll(contentLayout.lastChild.element);

  //
  // Global events
  //

  Event.addGlobalHandler('click', function(e){
    if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      return;
    
    var sender = Event.sender(e);

    if (sender.tagName != 'A')
      sender = DOM.findAncestor(sender, function(node){ return node.tagName == 'A' });

    if (sender && sender.pathname == location.pathname && sender.hash != '')
      navTree.open(sender.hash, DOM.parentOf(navTree.element, sender));
  });

  Event.addGlobalHandler('keydown', function(e){
    var event = Event(e);
    if (event.ctrlKey || event.shiftKey || event.altKey || prototypeMapPopup.visible)
      return;

    DOM.focus(searchInput.tmpl.field, !searchInputFocused);
  });

  function checkLocation(){
    if (location.hash != curHash)
      navTree.open(location.hash);
  }

  if ('onhashchange' in window)
    Event.addHandler(window, 'hashchange', checkLocation);
  else
    setInterval(checkLocation, 250);
  setTimeout(checkLocation, 0);

  DOM.focus(searchInput.tmpl.field, true);


})();