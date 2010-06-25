(function(){

  var namespace = 'BasisDoc';


  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Data = Basis.Data;
  var Template = Basis.Html.Template;

  var cssClass = Basis.CSS.cssClass;

  var nsWrapers = Basis.DOM.Wrapers;
  var nsTree = Basis.Controls.Tree;
  var nsTabs = Basis.Controls.Tabs;
  var nsForm = Basis.Controls.Form;
  var nsEntity = Basis.Entity;

  var nsCore = BasisDoc.Core;
  var nsView = BasisDoc.View;
  var nsNav = BasisDoc.Nav;

  var curHash;

  //
  //  Overview 
  //

  var buildin = {
    'Object': Object,
    'String': String,
    'Number': Number,
    'Date': Date,
    'Array': Array,
    'Function': Function,
    'Boolean': Boolean
  };

  nsCore.walk(buildin, '', 'object');
  Object.iterate(buildin, function(name, value){
    value.className = name;
    nsCore.walk(value, name, 'class');
    nsCore.walk(value.prototype, name + '.prototype', 'prototype');
  });

  var t = new Date();
  Basis.namespaces_['Basis'] = Basis;
  nsCore.walk(Basis.namespaces_, '', 'object',0);
  if (typeof console != 'undefined') console.log(new Date - t, cnt);

  //
  // View
  //

  var objectView = new nsWrapers.HtmlContainer({
    childClass: nsView.View,
    handlers: {
      delegateChanged: function(object, oldDelegate){
        this.clear(true);
        this.setChildNodes(this.delegate ? [nsView.viewTitle, nsView.viewJsDoc].concat(this.delegate.views) : null).forEach(function(node){
          node.setDelegate(this);
        }, this.getRootDelegate());
      }
    }
  });

  //
  // NavTree
  //


  var navTree = new nsTree.Tree({
    selection: {
      handlers: {
        change: function(){
          objectView.setDelegate(this.items.first());
        }
      }
    },
    childNodes: [
      new nsNav.docSection({
        info: { title: 'Buildin class extensions' },
        collapsed: true,
        childNodes: Object.keys(buildin).map(function(name){
          return new nsNav.docClass({
            info: {
              kind: 'Class',
              title: name,
              path: '',
              objPath: name,
              obj: buildin[name]
            }
          });
        })
      }),
      new nsNav.docSection({
        info: { title: 'Basis' },
        childNodes: Object.keys(Basis.namespaces_).map(function(name){
          return new nsNav.docNamespace({
            info: map[name]
          })
        }, Basis.namespaces_)
      })
    ]
  });

  navTree.open = function(path, noScroll){
    path = path.replace(/^#/, '');

    if (!path || (curHash == '#' + path))
      return;

    curHash = location.hash = '#' + path;

    var node;
    if (path.match(/^Basis/))
      node = this.lastChild.childNodes.sortAsObject('info.objPath').reverse().search(true, function(node){ return !!path.match("^" + node.info.objPath.forRegExp()) });
    else
    {
      this.firstChild.expand();
      node = this.firstChild.childNodes.search(path.split('.')[0], 'info.objPath');
    }

    if (node)
    {
      var cursor = node.info.objPath;
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
          node = node.childNodes.search(cursor, 'info.objPath');
        }
      }

      if (node)
      {
        node.select();
        //node.expand();
        if (!noScroll)
          node.element.scrollIntoView(false);

        document.title = 'Basis API - ' + node.info.title + (node.info.path ? ' @ ' + node.info.path : '');
      }
    }
  };

  var searchTree = new nsTree.Tree({
    id: 'SearchTree',
    localSorting: 'info.title.toLowerCase()',
    localGrouping: nsNav.nodeTypeGrouping,
    childClass: Class(nsTree.TreeNode, {
      template: new Template(
        '<li{element} class="Basis-Tree-Node">' + 
          '<div{content|selectedElement} class="Tree-Node-Title Tree-Node-Content">' + 
            '<a{title} href="#">' +
              '<span class="namespace">{namespaceText}</span>' +
              '<span{label} class="label">{titleText}</span>' +
            '</a>' + 
          '</div>' + 
        '</li>'
      ),
      init: function(config){
        config = this.inherit(config);

        this.title.href = '#' + this.info.objPath;
        cssClass(this.content).add(this.info.kind.capitalize() + '-Content');

        if (this.info.kind == 'function' || this.info.kind == 'class' || this.info.kind == 'method')
          DOM.insert(this.label, DOM.createElement('SPAN.args', nsCore.getFunctionDescription(this.info.obj).args.quote('(')));

        this.namespaceText.nodeValue = this.info.kind != 'namespace' ? this.info.path : '';
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

  var loadSearchIndex = Function.runOnce(function(){
    searchTree.setChildNodes(searchValues.map(Data.wrapper('info')));
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
        this.map['SPAN.match'] = function(s, i){ return s && (i % 5 == 2 || i % 5 == 4) };
        this.node.setMatchFunction(value ? function(child, reset){
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

  var searchInput = new SearchMatchInput({
    matchFilter: {
      regexpGetter: function(value){
        return new RegExp('(^|[^a-z])(' + value.forRegExp() + ')', 'i');
      },
      /*wrapFilter: function(v, i){
        return (i % 3) == 2;
      },*/
      node: searchTree,
      handlers: {
        change: function(value){
          if (value != '')
            loadSearchIndex();

          sidebarPages.item(value != '' ? 'search' : 'tree').select();
        }
      }
    }
  });
  Event.addHandler(searchInput.field, 'keyup', function(event){
    var key = Event.key(event);
    var ctrl = this.matchFilter.node;
    var selected = ctrl.selection.items[0];
    
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
          navTree.open(selected.info.objPath);
  }, searchInput);

  /*
  var clsTree = new nsTree.Tree({
    childFactory: function(cfg){
      return new nsTree.TreeFolder([{ document: this.document }].merge(cfg));
    },
    childNodes: Object.values(rootClasses).map(Data('classMap_'))
  })*/

  //
  // Layout
  //

  var layout = new Basis.Layout.Layout({
    container: 'Layout',
    left: {
      id: 'Sidebar',
      content: new Basis.Layout.Layout({
        top: {
          id: 'Toolbar',
          content: searchInput.element
        },
        client: {
          id: 'Sidebar',
          content: sidebarPages.element
        }
      })
    },
    client: {
      id: 'Content',
      overflow: 'auto',
      overflowY: 'scroll',
      overflowX: 'visible',
      content: [
        //clsTree.element,
        objectView.element
      ]
    }
  });

  Event.addGlobalHandler('click', function(e){
    if (!Event.mouseButton(e, Event.MOUSE_LEFT))
      return;
    
    var sender = Event.sender(e);
    if (sender.tagName != 'A')
      sender = DOM.parent(sender, 'A');
    if (sender && sender.hash != '')
      navTree.open(sender.hash, DOM.parentOf(navTree.element, sender));

    DOM.focus(searchInput.field, true);
  });

  function checkLocation(){
    if (location.hash != curHash)
      navTree.open(location.hash);
  }
  setInterval(checkLocation, 250);
  setTimeout(checkLocation, 10);

  DOM.focus(searchInput.field, true);

  //
  // jsDocs parse
  //

  var scripts = DOM.tag(document, 'SCRIPT').map(Data('getAttribute("src")')).filter(Data('match(/^\\.\\.\\/[a-z0-9\\_]+\\.js$/i)')); //['../basis.js', '../dom_wraper.js', '../tree.js'];
//  console.log(DOM.tag(document, 'SCRIPT').map(Data('getAttribute("src")')).filter(Data('match(/^\\.\\.\\/[a-z0-9\\_]+\\.js$/i)')));

  function parseSource(code){
    var parts = code.replace(/\/\*+\//g, '').split(/(?:\/\*\*((?:.|[\r\n])+?)\*\/)/m);
    var ns = '';
    var isClass;
    var clsPrefix = '';
    parts.reduce(function(jsdoc, code, idx){
      if (idx % 2)
      {
        jsdoc.push(code);
        var m = code.match(/@namespace\s+(\S+)/);
        if (m)
          ns = m[1];
        var m = code.match(/@class/);
        isClass = !!m;
        if (isClass)
          clsPrefix = '';
      }
      else
        if (idx)
        {
          var m = code.match(/\s*(var\s+)?(function\s+)?([a-z0-9\_\$]+)/i);
          if (m)
          {
              //console.log(m);
              //console.log(ns, clsPrefix, isClass);
            //console.log(m[1], jsdoc.last());
            var text = jsdoc.last().replace(/(^|[\r\n]+)\s*\*[\t ]*/g, '\n').trimLeft();
            var e = nsCore.JsDocEntity({
              path: ns + '.' + (clsPrefix ? clsPrefix + '.prototype.' : '') + m[3],
              text: text
            });
            jsDocs[e.value.path] = e.value.text;
            
            if (isClass)
              clsPrefix = m[3];
            else
              if (m[1] || m[2])
              {
                clsPrefix = '';
              }
          }
        }
      return jsdoc;
    }, []);
    nsCore.processAwaitingJsDocs();
  }

  function sourceLoad(list){
    var src = list.shift();

    var t = new Basis.Ajax.Transport(src);
    t.addHandler({
      complete: function(req){
        parseSource(req.responseText);
        if (list.length)
          setTimeout(function(){
            sourceLoad(list);
          }, 5);
      }
    });
    t.get();
  }

  sourceLoad(scripts);

})();