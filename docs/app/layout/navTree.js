
  basis.require('app.ext.docTree');

  var curHash;

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
          return app.core.mapDO[key];
        })
      }
    ],

    selection: {
      handler: {
        datasetChanged: function(){
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

      if (!path || (curHash == '#' + path))
        return;

      curHash = location.hash = '#' + path;

      var root = path.split(".")[0];
      if (app.core.buildin[root])
        root = 'window';

      var node = this.childNodes.search(root, 'data.fullPath');

      if (node)
      {
        node.expand();
        node = node.childNodes.search(path, 'data.fullPath')
               ||
               node.childNodes
                 .sortAsObject('data.fullPath')
                 .reverse()
                 .search(0, function(item){
                   return path.indexOf(item.data.fullPath + '.');
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

  function checkLocation(){
    if (location.hash != curHash)
      navTree.open(location.hash);
  }

  if ('onhashchange' in window)
    basis.dom.event.addHandler(window, 'hashchange', checkLocation);
  else
    setInterval(checkLocation, 250);
  setTimeout(checkLocation, 0);

  //
  // exports
  //

  module.exports = navTree;
