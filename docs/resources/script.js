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
  var cssClass = Basis.CSS.cssClass;

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

  var ObjectViewControl = Class(nsWrappers.TmplContainer/*Basis.Plugin.X.Control*/, {
    template: new Template(
      '<div{element} class="XControl">' +
        '<span{header}/>' +
        '<div{content|childNodesElement} class="XControl-Content"/>' +
      '</div>'
    ),
    satelliteConfig: {
      header: {
        existsIf: Function.getter('delegate'),
        delegate: Function.$self,
        instanceOf: nsView.ViewTitle
      }
    }
  })

  var objectView = new ObjectViewControl({
    id: 'ObjectView',
    childClass: nsView.View,
    event_delegateChanged: function(object, oldDelegate){
      this.clear(true);

      this.constructor.prototype.event_delegateChanged.call(this, object, oldDelegate);

      if (this.delegate)
      {
        this.setChildNodes([nsView.viewJsDoc].concat(this.delegate.views || []).filter(function(view){
          return view.isAcceptableObject(this.info);
        }, this));
      }

      //this.recalc();
    }
  });

  objectView.tmpl.content.id = 'xxx';

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
        objectView.setDelegate(selected);
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

        this.tmpl.title.href = '#' + this.info.fullPath;
        cssClass(this.tmpl.content).add(this.info.kind.capitalize() + '-Content');

        if (/^(function|method|class)$/.test(this.info.kind))
          DOM.insert(this.tmpl.label, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

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
  var sourceView = new Basis.DOM.Wrapper.HtmlContainer({
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

  new nsWrappers.HtmlNode({
    container: 'Layout',
    id: 'Content',
    content: [
      //clsTree.element,
      objectView.element
    ]
  });

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
    if (event.ctrlKey || event.shiftKey || event.altKey)
      return;

    DOM.focus(searchInput.tmpl.field, !searchInputFocused);
  });

  function checkLocation(){
    if (location.hash != curHash)
      navTree.open(location.hash);
  }

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