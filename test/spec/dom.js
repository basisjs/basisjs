module.exports = {
  name: 'basis.dom',

  html: __dirname + '/dom.html',
  init: function(){
    var domUtils = basis.require('basis.dom');
    var pg = domUtils.get('playground');

    function resolveNodes(nodes){
      var result = [];
      if (!nodes)
        nodes = [];
      else
        if (nodes.constructor != Array)
          nodes = [nodes];
      for (var i = 0; i < nodes.length; i++)
        result.push(nodes[i].id || nodes[i].nodeValue);
      return result.join(' ');
    }

    var a1 = 'n1 n2 1 n3 2 n4 n5 3 n6 4 n7 5 n8 n9 6 7 8 n10 9';
    var a2 = '1 2 3 4 5 6 7 8 9';
    var a3 = 'n1 n2 n3 n4 n5 n6 n7 n8 n9 n10';
    var a4 = 'n1 n10 9 n3 8 n4 n7 7 n8 n9 6 5 n6 4 n5 3 2 n2 1';

    var IS_ELEMENT_NODE = function(node){
      return node.nodeType == 1;
    };
    var IS_TEXT_NODE = function(node){
      return node.nodeType == 3;
    };
  },

  test: [
    {
      name: 'TreeWalker',
      test: [
        {
          name: 'create',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            assert(resolveNodes(w.nodes()) === a1);
            w.setDirection(domUtils.TreeWalker.BACKWARD);
            assert(resolveNodes(w.nodes()) === a4);

            var w = new domUtils.TreeWalker(pg, IS_TEXT_NODE);
            assert(resolveNodes(w.nodes()) === a2);
            assert(resolveNodes(w.nodes(basis.fn.$true)) === a1);
            w.next();
            w.next();
            assert(resolveNodes(w.nodes()) === a2);

            var w = new domUtils.TreeWalker(pg);
            assert(resolveNodes(w.nodes(IS_TEXT_NODE)) === a2);
            assert(resolveNodes(w.nodes()) === a1);

            assert(resolveNodes(new domUtils.TreeWalker(pg, IS_ELEMENT_NODE).nodes()) === a3);

            assert(resolveNodes(new domUtils.TreeWalker(pg, null, domUtils.TreeWalker.BACKWARD).nodes()) === a4);
          }
        },
        {
          name: 'next/prev',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            var r1 = [];
            var r2 = [];
            var node;
            while (node = w.next())
              r1.push(node);
            while (node = w.prev())
              r2.push(node);

            assert(resolveNodes(r2.reverse()) === resolveNodes(r1));
          }
        },
        {
          name: 'next',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            assert(resolveNodes(w.next()) === 'n1');
            assert(resolveNodes(w.next()) === 'n2');
            assert(w.cursor_ === domUtils.get('n2'));
            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.next(IS_TEXT_NODE)) === '1');
            assert(w.filter !== IS_TEXT_NODE);
            assert(resolveNodes(w.next(IS_TEXT_NODE)) === '2');
          }
        },
        {
          name: 'next backward',
          test: function(){
            var w = new domUtils.TreeWalker(pg, null, domUtils.TreeWalker.BACKWARD);
            assert(resolveNodes(w.next()) === 'n1');
            assert(resolveNodes(w.next()) === 'n10');
            assert(w.cursor_ === domUtils.get('n10'));
            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.next(IS_TEXT_NODE)) === '9');
            assert(w.filter !== IS_TEXT_NODE);
            assert(resolveNodes(w.next(IS_TEXT_NODE)) === '8');
          }
        },
        {
          name: 'prev',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            assert(resolveNodes(w.prev()) === '9');
            assert(resolveNodes(w.prev()) === 'n10');
            assert(w.cursor_ === domUtils.get('n10'));
            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.prev(IS_TEXT_NODE)) === '9');
            assert(w.filter !== IS_TEXT_NODE);
            assert(resolveNodes(w.prev(IS_TEXT_NODE)) === '8');
          }
        },
        {
          name: 'prev backward',
          test: function(){
            var w = new domUtils.TreeWalker(pg, null, domUtils.TreeWalker.BACKWARD);
            assert(resolveNodes(w.prev()) === '1');
            assert(resolveNodes(w.prev()) === 'n2');
            assert(w.cursor_ === domUtils.get('n2'));
            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.prev(IS_TEXT_NODE)) === '1');
            assert(w.filter !== IS_TEXT_NODE);
            assert(resolveNodes(w.prev(IS_TEXT_NODE)) === '2');
          }
        },
        {
          name: 'first',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            assert(resolveNodes(w.first()) === 'n1');
            assert(w.cursor_ === domUtils.get('n1'));
            w.next();
            assert(w.cursor_ !== domUtils.get('n1'));
            assert(resolveNodes(w.first()) === 'n1');

            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.first(IS_TEXT_NODE)) === '1');
            assert(w.filter !== IS_TEXT_NODE);
            w.next();
            assert(resolveNodes(w.first(IS_TEXT_NODE)) === '1');
          }
        },
        {
          name: 'first backward',
          test: function(){
            var w = new domUtils.TreeWalker(pg, null, domUtils.TreeWalker.BACKWARD);
            assert(resolveNodes(w.first()) === 'n1');
            assert(w.cursor_ === domUtils.get('n1'));
            w.next();
            assert(w.cursor_ !== domUtils.get('n1'));
            assert(resolveNodes(w.first()) === 'n1');

            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.first(IS_TEXT_NODE)) === '9');
            assert(w.filter != IS_TEXT_NODE);
            w.next();
            assert(resolveNodes(w.first(IS_TEXT_NODE)) === '9');
          }
        },
        {
          name: 'last',
          test: function(){
            var w = new domUtils.TreeWalker(pg);
            var el;
            assert(resolveNodes(el = w.last()) === '9');
            assert(el, w.cursor_);
            w.next();
            assert(el !== w.cursor_);
            assert(resolveNodes(w.last()) === '9');

            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.last(IS_ELEMENT_NODE)) === 'n10');
            assert(w.filter !== IS_ELEMENT_NODE);
            w.next();
            assert(resolveNodes(w.last(IS_ELEMENT_NODE)) === 'n10');
          }
        },
        {
          name: 'last backward',
          test: function(){
            var w = new domUtils.TreeWalker(pg, null, domUtils.TreeWalker.BACKWARD);
            var el;
            assert(resolveNodes(el = w.last()) === '1');
            assert(w.cursor_ === el);
            w.next();
            assert(el !== w.cursor_);
            assert(resolveNodes(w.last()) === '1');

            w.reset();
            assert(w.cursor_ === null);
            assert(resolveNodes(w.last(IS_ELEMENT_NODE)) === 'n2');
            assert(w.filter !== IS_ELEMENT_NODE);
            w.next();
            assert(resolveNodes(w.last(IS_ELEMENT_NODE)) === 'n2');
          }
        }
      ]
    },
    {
      name: 'axis',
      test: [
        {
          name: 'AXIS_ANCESTOR/AXIS_ANCESTOR_OR_SELF',
          test: function(){
            var root = domUtils.get('n6');
            var node = root.parentNode;
            var r1 = [];
            while (node && node != root.document)
            {
              r1.push(node);
              node = node.parentNode;
            }

            assert(r1, domUtils.axis(root, domUtils.AXIS_ANCESTOR));
            assert([document.body], domUtils.axis(root, domUtils.AXIS_ANCESTOR, function(node){
              return node.tagName == 'BODY';
            }));

            r1.unshift(root);
            assert(r1, domUtils.axis(root, domUtils.AXIS_ANCESTOR_OR_SELF));
            assert([document.body], domUtils.axis(root, domUtils.AXIS_ANCESTOR_OR_SELF, function(node){
              return node.tagName == 'BODY';
            }));
          }
        },
        {
          name: 'AXIS_CHILD',
          test: function(){
            var root = domUtils.get('n1');
            var node = root.firstChild;
            var r1 = [];
            while (node)
            {
              r1.push(node);
              node = node.nextSibling;
            }

            assert(r1, domUtils.axis(root, domUtils.AXIS_CHILD));
            assert(['n2', 'n3', 'n10'].map(domUtils.get), domUtils.axis(root, domUtils.AXIS_CHILD, function(node){
              return node.tagName == 'LI';
            }));

            var root = domUtils.get('n3');
            var node = root.firstChild;
            var r1 = [];
            while (node)
            {
              r1.push(node);
              node = node.nextSibling;
            }
            assert(r1, domUtils.axis(root, domUtils.AXIS_CHILD));
            assert(r1.filter(IS_TEXT_NODE), domUtils.axis(root, domUtils.AXIS_CHILD, IS_TEXT_NODE));
          }
        }
      ]
    }
  ]
};
