basis.require('basis.dom.event');
basis.require('app.ext.docTree');

var curHash;
var arraySearch = basis.array.search;

var navTree = new app.ext.docTree.DocTree({
  childNodes: [
    {
      data: { kind: 'Section', title: 'Buildin class extensions', fullPath: 'window' },
      selectable: false,
      collapsed: true,
      childNodes: basis.object.iterate(app.core.buildin, function(key, value){
        return new app.ext.docTree.DocTreeClassNode({
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
      data: { kind: 'Section', title: 'basis', fullPath: 'basis' },
      selectable: false,
      childNodes: basis.object.iterate(basis.namespaces_, function(key){
        if (key in app.core.mapDO == false) debugger;
        return app.core.mapDO[key];
      })
    }
  ],

  selection: {
    handler: {
      itemsChanged: function(){
        var selected = this.pick();
        if (selected)
        {
          navTree.open(selected.data.fullPath, true);
          location.hash = '#' + selected.data.fullPath;
        }
      }
    }
  },

  open: function(path, noScroll){
    path = path.replace(/^#/, '');

    if (curHash == '#' + path)
      return;

    curHash = location.hash = '#' + path;

    if (!path)
    {
      this.selection.clear();
      return;
    }

    var root = path.split(".")[0];
    if (app.core.buildin[root])
      root = 'window';

    var node = arraySearch(this.childNodes, root, 'data.fullPath');

    if (node)
    {
      node.expand();
      node = arraySearch(node.childNodes, path, 'data.fullPath')
             ||
             arraySearch(
               node.childNodes
                 .sortAsObject('data.fullPath')
                 .reverse(),
               0,
               function(item){
                 return path.indexOf(item.data.fullPath + '.');
               }
             );
    }


    if (node)
    {
      var cursor = node.data.fullPath;
      var least = path.replace(new RegExp("^" + basis.string.forRegExp(cursor) + '\\.?'), '');
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
          node = arraySearch(node.childNodes, cursor, 'data.fullPath');
        }
      }

      if (node)
      {
        node.select();
        //node.expand();
        if (!noScroll)
          node.element.scrollIntoView(false);

        return;
      }
    }

    // if node not found
    this.selection.clear();
    document.title = 'Basis API';
  }
});

function checkLocation(){
  if (location.hash != curHash)
    navTree.open(location.hash);
}

if ('onhashchange' in window)
  basis.dom.event.addHandler(window, 'hashchange', checkLocation);
else
  setInterval(checkLocation, 250);

basis.nextTick(checkLocation);

//
// exports
//

module.exports = navTree;
