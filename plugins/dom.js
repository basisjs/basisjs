(function(){

  var namespace = 'Basis.DOM';

   /**
    * Sort nodes in their DOM order.
    * @function
    * @param {[Node]} nodes List of nodes.
    * @return {[Node]} Sorted node list.
    */
    var sort = $self;

    // init functions depends on browser support
    if (typeof testElement.compareDocumentPosition == 'function')
    {
      // W3C DOM sheme
      sort = function(nodes){
        return nodes.sort(function(a, b){ return 3 - (comparePosition(a, b) & (POSITION_PRECENDING | POSITION_FOLLOWING)) }); // 6
      };
    }
    else
    {
      // IE6-8 DOM sheme
      sort = function(nodes){
        return nodes.sortAsObject(getter('sourceIndex'));
      };
    }


   /**
    * Returns all descendant elements with names for node.
    * @param {string|[string]} names Comma or space separated names string, or string list of names.
    * @param {Element} node Context element.
    * @return {[Element]}
    */
    function tags(node, names){
      return sort(
        (tagNames(names) || ['*'])
        .map(function(name){ return tag(node, name) })
        .flatten()
      );
    }

  function nextElement(node, filter, viewDeep, root){
    if (!filter || filter == '*')
      filter = $true;

    if (typeof filter == 'string')
      filter = getter('tagName==' + filter.quote());

    viewDeep = viewDeep || 0;

    do
    {
      node = node[this];  // this contains direction
    
      if (!node || node === root)
        break;

      if (filter(node))
        return node;
    }
    while (--viewDeep); 

    return null;
  }

  var prev = nextElement.bind(PREVIOUS_SIBLING);
  var next = nextElement.bind(NEXT_SIBLING);
  var parent = nextElement.bind(PARENT_NODE);

  function first(node, filter, viewDeep){
    node = node[FIRST_CHILD];
    
    return !node || !filter || filter(node) ? node : next(node, filter, viewDeep);
  }

  function last(node, filter, viewDeep){
    node = node[LAST_CHILD];
    
    return !node || !filter || filter(node) ? node : prev(node, filter, viewDeep);
  }

  function count(node, filter, root){
    var count = 0;
    // this contains direction
    while (node = nextElement.call(this, node, filter, 0, root))
      count++;
    return count;
  }

  var index = count.bind(PREVIOUS_SIBLING);
  var lastIndex = count.bind(NEXT_SIBLING);
  var deep = count.bind(PARENT_NODE);

  Basis.namespace(namespace).extend({
    // navigation
    first: first,
    last: last,
    next: next,
    prev: prev,
    parent: parent,

    // node position
    index: index,
    lastIndex: lastIndex,
    deep: deep,

    tags: tags
  });

})();