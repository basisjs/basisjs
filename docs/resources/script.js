(function(){

 /**
  * @namespace
  */

  var namespace = 'BasisDoc';

  // import names

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Template = Basis.Html.Template;

  var getter = Function.getter;
  var classList = Basis.CSS.classList;

  var nsWrappers = Basis.DOM.Wrapper;
  var nsTree = Basis.Controls.Tree;
  var nsTabs = Basis.Controls.Tabs;
  var nsForm = Basis.Controls.Form;
  var nsEntity = Basis.Entity;

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
    var thread = new Basis.Animation.Thread({
      duration: 350,
      interval: 15
    });
    var modificator = new Basis.Animation.Modificator(thread, function(value){
      element.scrollTop = parseInt(value);
    }, 0, 0, true);

    modificator.timeFunction = function(value){
      return Math.sin(Math.acos(1 - value));
    }

    return {
      scrollTo: function(relElement, jump){
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
    }
  };

  var targetContent = new nsWrappers.TmplContainer({
    id: 'ObjectView',
    childClass: nsView.View,

    template: new Template(
      '<div{element} class="XControl">' +
        '<div{content|childNodesElement} class="XControl-Content"/>' +
      '</div>'
    ),
    event_delegateChanged: function(object, oldDelegate){
      this.constructor.prototype.event_delegateChanged.call(this, object, oldDelegate);

      if (this.delegate)
      {
        this.setChildNodes([nsView.viewJsDoc].concat(this.delegate.views || []).filter(function(view){
          return view.isAcceptableObject(this.info);
        }, this), true);
        this.scrollTo(this.firstChild.element, true);
      }
      else
        this.clear(true);
    }
  });

  var prototypeDataset = new nsWrappers.ChildNodesDataset(nsView.viewPrototype);
  var prototypeMapPopup = new Basis.Controls.Popup.Balloon({
    id: 'PrototypeMapPopup',
    dir: 'center bottom center top',
    selection: {},
    childClass: Class(nsWrappers.TmplNode,
      nsWrappers.simpleTemplate('<div{element} class="item" event-click="scrollTo">{this_info_title}</div>'),
      {
        templateAction: function(actionName){
          if (actionName == 'scrollTo')
          {
            var element = this.delegate.element;
            targetContent.scrollTo(element);
            this.parentNode.hide();
            classList(element).add('highlight');
            setTimeout(function(){ classList(element).remove('highlight'); });
          }
        }
      }
    ),
    localSorting: Function.getter('info.title'),
    localGrouping: Object.slice(nsView.viewPrototype.localGrouping, 'groupGetter localSorting titleGetter'.qw()),
    event_beforeShow: function(){
      this.constructor.prototype.event_beforeShow.call(this);
      this.setCollection(prototypeDataset);
    },
    event_show: function(){
      this.constructor.prototype.event_show.call(this);
      prototypeMapPopupMatchInput.select();
    },
    event_hide: function(){
      this.constructor.prototype.event_hide.call(this);
      this.setCollection();
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
      textNodeGetter: Function.getter('tmpl.this_info_title')
    }
  });
  DOM.insert(prototypeMapPopup.tmpl.content.parentNode, prototypeMapPopupMatchInput.element, DOM.INSERT_BEGIN);

  var targetHeader = new nsWrappers.TmplContainer({
    delegate: targetContent,
    collection: new nsWrappers.ChildNodesDataset(targetContent),

    childClass: Class(Basis.Controls.Button.Button, {
      captionGetter: function(button){
        return button.delegate.viewHeader;
      },
      handler: function(){
        if (this.delegate === nsView.viewPrototype)
          prototypeMapPopup.show(this.element);
        else
          this.delegate.parentNode.scrollTo(this.delegate.element);
      }
    }),

    template: new Template(
      '<div{element}>' +
        '<h2 class="view viewTitle">' +
          '<span class="title">{contentText}</span>' +
          '<span class="path">{pathText}</span>' +
        '</h2>' +
        '<div{childNodesElement} class="QuickNavBar" />' +
      '</div>'
    ),
    event_update: function(object, delta){
      this.constructor.prototype.event_update.call(this, object, delta);

      this.tmpl.contentText.nodeValue = (this.info.title || '') + (/^(method|function|class)$/.test(this.info.kind) ? nsCore.getFunctionDescription(this.info.obj).args.quote('(') : '');
      this.tmpl.pathText.nodeValue = (this.info.path || '');

      if ('kind' in delta)
        classList(this.element.firstChild).replace(delta.kind, this.info.kind, 'kind-');
    }
  });


  //
  // NavTree
  //

  var NavTree = Class(nsTree.Tree, {
    childClass: nsNav.docSection,
    open: function(path, noScroll){
      path = path.replace(/^#/, '');

      if (!path || (curHash == '#' + path))
        return;

      curHash = location.hash = '#' + path;

      var rootNS = path.split(".")[0];
      if (buildin[rootNS])
        rootNS = 'window';

      var node = this.childNodes.search(rootNS, 'info.fullPath');

      //if (typeof console != 'undefined') console.log(node);

      if (node)
      {
        node.expand();
        node = node.childNodes.search(path, 'info.fullPath')
               ||
               node.childNodes
                 .sortAsObject('info.fullPath')
                 .reverse()
                 .search(0, function(node){
                   return path.indexOf(node.info.fullPath + '.');
                 });
      }

      if (node)
      {
        var cursor = node.info.fullPath;
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
            node = node.childNodes.search(cursor, 'info.fullPath');
          }
        }

        if (node)
        {
          node.select();
          //node.expand();
          if (!noScroll)
            node.element.scrollIntoView(false);

          document.title = 'Basis API: ' + node.info.title + (node.info.path ? ' @ ' + node.info.path : '');
        }
      }
    }
  });

  var navTree = new NavTree({
    selection: {
      event_datasetChanged: function(dataset, delta){
        this.constructor.prototype.event_datasetChanged.call(this, dataset, delta);

        var selected = this.pick();
        targetContent.setDelegate(selected);
        if (selected)
        {
          navTree.open(selected.info.fullPath, true);
          location.hash = '#' + (selected ? selected.info.fullPath : null);
        }
      }
    },
    childNodes: [
      {
        info: { title: 'Buildin class extensions', fullPath: 'window' },
        collapsed: true,
        childNodes: Object.iterate(buildin, function(key, value){
          return new nsNav.docClass({
            info: {
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
        info: { title: 'Basis', fullPath: 'Basis' },
        childNodes: Object.iterate(Basis.namespaces_, function(key){
          return new nsNav.docNamespace({
            info: map[key]
          })
        })
      }
    ]
  });

  var searchTree = new nsTree.Tree({
    id: 'SearchTree',
    localSorting: getter('info.title', String.toLowerCase),
    localGrouping: nsNav.nodeTypeGrouping,
    childClass: Class(nsTree.TreeNode, {
      template: new Template(
        '<li{element} class="Basis-TreeNode">' +
          '<div{content} class="Basis-TreeNode-Title">' +
            '<span{title} class="Basis-TreeNode-Caption" event-click="select">' +
              '<span class="namespace">{namespaceText}</span>' +
              '<span{label} class="label">{titleText}</span>' +
            '</span>' +
          '</div>' +
        '</li>'
      ),
      templateAction: function(actionName, event){
        if (actionName == 'select')
          navTree.open(this.info.fullPath);

        nsTree.TreeNode.prototype.templateAction.call(this, actionName, event);
      },
      init: function(config){
        nsTree.TreeNode.prototype.init.call(this, config);

        classList(this.tmpl.content).add(this.info.kind.capitalize() + '-Content');
        this.nodeType = nsNav.kindNodeType[this.info.kind];

        if (/^(function|method|class)$/.test(this.info.kind))
          DOM.insert(this.tmpl.label, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

        this.tmpl.title.href = '#' + this.info.fullPath;
        this.tmpl.namespaceText.nodeValue = this.info.kind != 'namespace' ? this.info.path : '';
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
      changeHandler: function(value){
        var fc = value.charAt(0);
        var v = value.substr(1).replace(/./g, function(m){ return '[' + m.toUpperCase() + m.toLowerCase() + ']' });
        var rx = new RegExp('(^|[^a-zA-Z])([' + fc.toLowerCase() + fc.toUpperCase() +']' + v + ')|([a-z])(' + fc.toUpperCase() + v + ')');
        //console.log(rx.source);
        var textNodeGetter = this.textNodeGetter;
        var map = this.map;

        map['SPAN.match'] = function(s, i){ return s && (i % 5 == 2 || i % 5 == 4) };

        this.node.setMatchFunction(x = value ? function(child, reset){
          if (!reset)
          {
            var textNode = child._m || textNodeGetter(child);
            var p = textNode.nodeValue.split(rx);
            if (p.length > 1)
            {
              DOM.replace(
                child._x || textNode,
                child._x = DOM.createElement('SPAN.matched', DOM.wrap(p, map))
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

        this.node.element.scrollTop = 0;
      }
    })
  });

  var loadSearchIndex = Function.runOnce(function(){
    searchTree.setChildNodes(nsCore.Search.values.map(Function.wrapper('info')));
  });

  var searchInputFocused = false;
  var searchInput = new SearchMatchInput({
    matchFilter: {
      node: searchTree,
      regexpGetter: function(value){
        return new RegExp('(^|[^a-z])(' + value.forRegExp() + ')', 'i');
      },
      event_change: function(value, oldValue){
        this.constructor.prototype.event_change.call(this, value, oldValue);
        if (value != '')
          loadSearchIndex();

        sidebarPages.item(value != '' ? 'search' : 'tree').select();
        if (!value)
        {
          var selected = navTree.selection.pick();
          if (selected)
            selected.element.scrollIntoView(true);
        }
      }
    }
  });

  Event.addHandlers(searchInput.tmpl.field, {
    keyup: function(event){
      var key = Event.key(event);
      var ctrl = this.matchFilter.node;
      var selected = ctrl.selection.pick();
      
      if ([Event.KEY.UP, Event.KEY.DOWN].has(key))
      {
        var cn = ctrl.childNodes;
        var pos, node;
        
        if (selected && selected.matched)
          pos = cn.indexOf(selected);
        
        if (key == Event.KEY.UP)
          node = cn.lastSearch(true, 'matched', pos ? pos - 1 : null);
        else
          node = cn.search(true, 'matched', pos ? pos + 1 : null);

        if (node)
          node.select();
      }
      else
        if ([Event.KEY.ENTER, Event.KEY.CTRL_ENTER].has(key))
          if (selected)
            navTree.open(selected.info.fullPath);
    },
    focus: function(){
      searchInputFocused = true;
    },
    blur: function(){
      searchInputFocused = false;
    }
  }, searchInput);


  /*
  var clsTree = new nsTree.Tree({
    childFactory: function(cfg){
      return new nsTree.TreeFolder([{ document: this.document }].merge(cfg));
    },
    childNodes: Object.values(rootClasses).map(getter('classMap_'))
  })*/

  //
  // Source view
  //

  /*
  var sourceView = new Basis.DOM.Wrapper.TmplContainer({
    template: new Basis.Html.Template(
      '<div{element} id="SourceCodeViewer">' +
        '<div class="layout">' +
          '<div class="header">Header</div>' +
          '<div{content} class="content"></div>' +
        '</div>' +
      '</div>'
    )
  });

  DOM.insert(document.body, sourceView.element);
  DOM.insert(sourceView.content, new Basis.Plugin.SyntaxHighlight.SourceCodeNode({
    info: {
      code: Basis.DOM.Wrapper.Node.prototype.insertBefore.toString()
    }
  }).element);*/

  //
  // Layout
  //

  var panel = new Basis.Layout.VerticalPanelStack({
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

  var contentLayout = new Basis.Layout.VerticalPanelStack({
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

  targetContent.scrollTo = smoothScroll(contentLayout.lastChild.element).scrollTo;

  Event.addGlobalHandler('click', function(e){
    if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      return;
    
    var sender = Event.sender(e);

    if (sender.tagName != 'A')
      sender = DOM.findAncestor(sender, function(node){ return node.tagName == 'A' });

    if (sender && sender.pathname == location.pathname && sender.hash != '')
      navTree.open(sender.hash, DOM.parentOf(navTree.element, sender));

    //DOM.focus(searchInput.field, true);
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

  //
  // jsDocs parse
  //

  var scripts = Array.from(document.getElementsByTagName('SCRIPT'))
                  .map(getter('getAttribute("src")'))
                  .filter(getter('match(/^\\.\\.\\/[a-z0-9\\_\/]+\\.js$/i)'));
   //['../basis.js', '../dom_wraper.js', '../tree.js'];
  //  console.log(DOM.tag(document, 'SCRIPT').map(getter('getAttribute("src")')).filter(getter('match(/^\\.\\.\\/[a-z0-9\\_]+\\.js$/i)')));

  scripts.forEach(function(src){
    nsCore.loadResource(src, 'jsdoc');
  });

})();