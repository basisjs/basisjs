var DocTree = require('app.ext.docTree').DocTree;
var mapDO = require('app.core').mapDO;
var router = require('basis.router');
var arraySearch = basis.array.search;
var curHash;

var navTree = new DocTree({
  childNodes: [
    {
      data: { kind: 'Section', title: 'basis', fullPath: 'basis' },
      action: { select: function(){} }, // selectable: false
      childNodes: basis.object.iterate(basis.namespaces_, function(key){
        if (key in mapDO == false) debugger;
        return mapDO[key];
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

    var root = path.split('.')[0];
    var node = arraySearch(this.childNodes, root, 'data.fullPath');

    if (node)
    {
      node.expand();
      node = arraySearch(node.childNodes, path, 'data.fullPath') ||
             arraySearch(
               basis.array.sort(node.childNodes, 'data.fullPath').reverse(),
               0,
               function(item){
                 return path.indexOf(item.data.fullPath + '.');
               }
             );
    }


    if (node)
    {
      var cursor = node.data.fullPath;
      var least = path.replace(new RegExp('^' + basis.string.forRegExp(cursor) + '\\.?'), '');
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

router.add('*all', function(path){
  navTree.open(path);
});

basis.nextTick(function(){
  router.start();
});

//
// exports
//

module.exports = navTree;
