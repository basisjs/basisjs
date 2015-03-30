
 /**
  * This namespace provides functions for DOM manupulations - transerval,
  * node creation, moving and test nodes. Most of functions are compatible with
  * native and simulated (object that generaly has properties like firsChild,
  * lastChild, parentNode etc) DOM structures.
  *
  * Functions overview:
  * - Order & position functions:
  *     {basis.dom.comparePosition}
  * - Getters:
  *     {basis.dom.get}, {basis.dom.tag}, {basis.dom.axis}
  * - Traversal:
  *     {basis.dom.TreeWalker}
  * - Constructors:
  *     {basis.dom.createElement}, {basis.dom.createText},
  *     {basis.dom.createFragment}
  * - DOM manipulations:
  *     {basis.dom.insert}, {basis.dom.remove}, {basis.dom.replace},
  *     {basis.dom.swap}, {basis.dom.clone}, {basis.dom.clear}, {basis.dom.wrap}
  * - Attribute setters/getters:
  *     {basis.dom.setAttribute}
  * - Checkers:
  *     {basis.dom.parentOf}, {basis.dom.isInside}
  * - Input interface:
  *     {basis.dom.focus}, {basis.dom.setSelectionRange},
  *     {basis.dom.getSelectionStart}, {basis.dom.getSelectionEnd}
  * - Misc:
  *     {basis.dom.outerHTML}, {basis.dom.textContent}
  *
  * @namespace basis.dom
  */

  var namespace = this.path;


  // import names
  var document = global.document;
  var Node = global.Node;
  var Class = basis.Class;
  var arrayFrom = basis.array.from;
  var getter = basis.getter;
  var eventUtils = require('basis.dom.event');

  // element for DOM support tests
  var testElement = document.createElement('div');

  // nodeType
  /** @const */ var ELEMENT_NODE = 1;
  /** @const */ var ATTRIBUTE_NODE = 2;
  /** @const */ var TEXT_NODE = 3;
  /** @const */ var CDATA_SECTION_NODE = 4;
  /** @const */ var ENTITY_REFERENCE_NODE = 5;
  /** @const */ var ENTITY_NODE = 6;
  /** @const */ var PROCESSING_INSTRUCTION_NODE = 7;
  /** @const */ var COMMENT_NODE = 8;
  /** @const */ var DOCUMENT_NODE = 9;
  /** @const */ var DOCUMENT_TYPE_NODE = 10;
  /** @const */ var DOCUMENT_FRAGMENT_NODE = 11;
  /** @const */ var NOTATION_NODE = 12;

  // axis
  /** @const */ var AXIS_ANCESTOR = 1;
  /** @const */ var AXIS_ANCESTOR_OR_SELF = 2;
  /** @const */ var AXIS_DESCENDANT = 4;
  /** @const */ var AXIS_DESCENDANT_OR_SELF = 8;
  /** @const */ var AXIS_SELF = 16;
  /** @const */ var AXIS_PARENT = 32;
  /** @const */ var AXIS_CHILD = 64;
  /** @const */ var AXIS_FOLLOWING = 128;
  /** @const */ var AXIS_FOLLOWING_SIBLING = 256;
  /** @const */ var AXIS_PRECEDING = 512;
  /** @const */ var AXIS_PRECEDING_SIBLING = 1024;

  // nodes compare support
  /** @const */ var POSITION_DISCONNECTED = 1;
  /** @const */ var POSITION_PRECEDING = 2;
  /** @const */ var POSITION_FOLLOWING = 4;
  /** @const */ var POSITION_CONTAINS = 8;
  /** @const */ var POSITION_CONTAINED_BY = 16;
  /** @const */ var POSITION_IMPLEMENTATION_SPECIFIC = 32;

  // directions
  var PARENT_NODE = 'parentNode';
  var FIRST_CHILD = 'firstChild';
  var LAST_CHILD = 'lastChild';
  var NEXT_SIBLING = 'nextSibling';
  var PREVIOUS_SIBLING = 'previousSibling';

  // insert position
  var INSERT_BEGIN = 'begin';
  var INSERT_END = 'end';
  var INSERT_BEFORE = 'before';
  var INSERT_AFTER = 'after';

 /**
  * Returns result of node comparation.
  * @function
  * @param {Node} nodeA
  * @param {Node} nodeB
  * @return {number}
  */
  var comparePosition;

  // init functions depends on browser support
  if (typeof testElement.compareDocumentPosition == 'function')
  {
    // W3C DOM
    comparePosition = function(nodeA, nodeB){
      return nodeA.compareDocumentPosition(nodeB);
    };
  }
  else
  {
    // IE6-8
    comparePosition = function(nodeA, nodeB){
      if (nodeA == nodeB)
        return 0;

      if (nodeA.document != nodeB.document)
        return POSITION_DISCONNECTED | POSITION_IMPLEMENTATION_SPECIFIC;

      if (nodeA.sourceIndex > nodeB.sourceIndex)
        return POSITION_PRECEDING | (POSITION_CONTAINS * nodeB.contains(nodeA));
      else
        return POSITION_FOLLOWING | (POSITION_CONTAINED_BY * nodeA.contains(nodeB));
    };
  }

 /**
  * Returns true if node is instance of Node.
  * @param {Node} node
  * @return {boolean}
  */
  var isNode;

  if (typeof Node != 'undefined')
  {
    isNode = function(node){
      return node instanceof Node;
    };

    // add support for node.contains (generally for Firefox)
    if (!Node.prototype.contains)
      Node.prototype.contains = function(node){
        return !!(this.compareDocumentPosition(node) & POSITION_CONTAINED_BY);
      };
  }
  else
  {
    // IE6-IE8 version
    isNode = function(node){
      return node && node.ownerDocument === document;
    };
  }

 /**
  * Insert newNode into node. If newNode is instance of Node, it insert without change; otherwise it converts to TextNode.
  * @param {Node} node Target node
  * @param {Node|*} newNode Inserting node or object.
  * @param {Node=} refChild Child of node.
  * @return {Node}
  */
  function handleInsert(node, newNode, refChild){
    return newNode != null
      ? node.insertBefore(isNode(newNode) ? newNode : createText(newNode), refChild || null)
      : null;
  }

 /**
  * Note: Tree nodes should have properties: parentNode, nextSibling, prevSibling, firstChild,
  * lastChild
  * @class
  */
  var TreeWalker = Class(null, {
    className: namespace + '.TreeWalker',

   /**
    * Root node of tree.
    */
    root_: null,

   /**
    * Current position of walker.
    */
    cursor_: null,

   /**
    * Default filter function.
    * @type {function()}
    */
    filter: basis.fn.$true,

   /**
    * @param {Node|object} root
    * @param {function(object):boolean} filter
    * @param {boolean} direction
    * @constructor
    */
    init: function(root, filter, direction){
      this.setRoot(root);
      this.setDirection(direction);

      if (typeof filter == 'function')
        this.filter = filter;
    },

   /**
    * @param {boolean} direction False for normal (forward) direction, true for backward direction.
    */
    setDirection: function(direction){
      basis.object.extend(this,
        direction
        ? {
            a: LAST_CHILD,        // nextChild
            b: PREVIOUS_SIBLING,  // nextSibling
            c: NEXT_SIBLING,      // prevSibling
            d: FIRST_CHILD        // prevChild
          }
        : {
            a: FIRST_CHILD,       // nextChild
            b: NEXT_SIBLING,      // nextSibling
            c: PREVIOUS_SIBLING,  // prevSibling
            d: LAST_CHILD         // prevChild
          }
      );
    },

   /**
    * Change root object.
    */
    setRoot: function(node){
      this.root_ = node || document;
      this.reset();
    },

   /**
    * Reset internal cursor to init state.
    */
    reset: function(){
      this.cursor_ = null;
    },

   /**
    * Returns first node.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    first: function(filter){
      this.reset();
      return this.next(filter);
    },

   /**
    * Returns last node.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    last: function(filter){
      this.reset();
      return this.prev(filter);
    },

   /**
    * Returns all nodes.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    nodes: function(filter, result){
      var node;

      if (!result)
        result = [];

      this.reset();

      while (node = this.next(filter))
        result.push(node);

      return result;
    },

   /**
    * Returns next node from cursor.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    next: function(filter){
      filter = filter || this.filter;

      var cursor = this.cursor_ || this.root_;

      do
      {
        var node = cursor[this.a]; // next child
        while (!node)
        {
          if (cursor === this.root_)
            return this.cursor_ = null;

          node = cursor[this.b]; // next sibling

          if (!node)
            cursor = cursor[PARENT_NODE];
        }
      }
      while (!filter(cursor = node));

      return this.cursor_ = cursor;
    },

   /**
    * Returns previous node from cursor.
    * @param {function(object):boolean} filter Override internal filter
    * @return {Node|object}
    */
    prev: function(filter){
      filter = filter || this.filter;

      var cursor = this.cursor_;
      var prevSibling = this.c; // previous sibling
      var prevChild = this.d;   // previous child

      do
      {
        var node = cursor ? cursor[prevSibling] : this.root_[prevChild];
        if (node)
        {
          while (node[prevChild])
            node = node[prevChild];
          cursor = node;
        }
        else
          if (cursor)
            cursor = cursor[PARENT_NODE];

        if (!cursor || cursor === this.root_)
        {
          cursor = null;
          break;
        }
      }
      while (!filter(cursor));

      return this.cursor_ = cursor;
    },
    destroy: function(){
      this.root_ = null;
      this.cursor_ = null;
    }
  });
  TreeWalker.BACKWARD = true;

  //
  // MISC
  //
 /**
  * Returns outerHTML for node, even for browser doesn't support this property (only IE/Webkit support)
  * @param {Node} node
  * @param {boolean=} noClone
  * @return {string}
  */
  function outerHTML(node, noClone){
    return node.outerHTML || createElement('', noClone ? node : node.cloneNode(true)).innerHTML;
  }

 /**
  * Returns all inner text of node (nodeValue for Attribute)
  * @param {Node} node
  * @return {string}
  */
  var TEXT_PROPERTIES = ['textContent', 'innerText', 'nodeValue'];

  function textContent(node){
    for (var i = 0, property; property = TEXT_PROPERTIES[i++];)
      if (node[property] != null)
        return node[property];
    return axis(node, AXIS_DESCENDANT, function(node){
      return node.nodeType == TEXT_NODE;
    }).map(getter('nodeValue')).join('');
  }

  //
  // Node getters
  //

 /**
  * Returns node by id. This is $() like function
  * @param {string|Node} ref
  * @return {Element}
  */
  function get(ref){
    if (ref && (isNode(ref) || ref.nodeType))
      return ref;
    else
      return typeof ref == 'string' ? document.getElementById(ref) : null;
  }

 /**
  * Returns all descendant elements tagName name for node.
  * @param {string|Node} node Context element.
  * @param {string} tagName Tag name.
  * @return {Array.<Element>}
  */
  function tag(node, tagName){
    var element = get(node) || document;

    if (tagName == '*' && element.all)
      return arrayFrom(element.all);
    else
      return arrayFrom(element.getElementsByTagName(tagName || '*'));
  }

  //
  // Navigation
  //

 /**
  * Returns nodes axis in XPath like way.
  * @param {Node} root Relative point for axis.
  * @param {number} axis Axis constant.
  * @param {function(node:Node):boolean} filter Filter function. If it's returns true node will be in result list.
  * @return {Array.<Node>}
  */
  function axis(root, axis, filter){
    var result = [];
    var walker;
    var cursor;

    filter = typeof filter == 'string' ? getter(filter) : filter || basis.fn.$true;

    if (axis & (AXIS_SELF | AXIS_ANCESTOR_OR_SELF | AXIS_DESCENDANT_OR_SELF))
      if (filter(root))
        result.push(root);

    switch (axis)
    {
      case AXIS_ANCESTOR:
      case AXIS_ANCESTOR_OR_SELF:
        cursor = root;
        while ((cursor = cursor[PARENT_NODE]) && cursor !== root.document)
          if (filter(cursor))
            result.push(cursor);
        break;

      case AXIS_CHILD:
        cursor = root[FIRST_CHILD];
        while (cursor)
        {
          if (filter(cursor))
            result.push(cursor);
          cursor = cursor[NEXT_SIBLING];
        }
        break;

      case AXIS_DESCENDANT:
      case AXIS_DESCENDANT_OR_SELF:
        if (root[FIRST_CHILD])
        {
          walker = new TreeWalker(root);
          walker.nodes(filter, result);
        }
        break;

      case AXIS_FOLLOWING:
        walker = new TreeWalker(root, filter);
        walker.cursor_ = root[NEXT_SIBLING] || root[PARENT_NODE];
        while (cursor = walker.next())
          result.push(cursor);
        break;

      case AXIS_FOLLOWING_SIBLING:
        cursor = root;
        while (cursor = cursor[NEXT_SIBLING])
          if (filter(cursor))
             result.push(cursor);
        break;

      case AXIS_PARENT:
        if (filter(root[PARENT_NODE]))
          result.push(root[PARENT_NODE]);
        break;

      case AXIS_PRECEDING:
        walker = new TreeWalker(root, filter, TreeWalker.BACKWARD);
        walker.cursor_ = root[PREVIOUS_SIBLING] || root[PARENT_NODE];
        while (cursor = walker.next())
          result.push(cursor);
        break;

      case AXIS_PRECEDING_SIBLING:
        cursor = root;
        while (cursor = cursor[PREVIOUS_SIBLING])
          if (filter(cursor))
            result.push(cursor);
        break;
    }

    return result;
  }

 /**
  * Returns ancestor that matchFunction returns true for.
  * @param {Node} node Start node for traversal.
  * @param {function(node:Node):boolean} matchFunction Checking function.
  * @param {Node=} bound Don't traversal after bound node.
  * @return {Node} First ancestor node that pass matchFunction.
  */
  function findAncestor(node, matchFunction, bound){
    while (node && node !== bound)
    {
      if (matchFunction(node))
        break;

      node = node.parentNode;
    }

    return node || null;
  }

  //
  // DOM constructors
  //

 /**
  * Creates a new TextNode with text as content (nodeValue).
  * @param {string} text Content.
  * @return {!Text} The new text node.
  */
  function createText(text){
    return document.createTextNode(text != null ? text : '');
  }

 /**
  * Returns new DocumentFragmentNode with arguments as childs.
  * @param {...Node|string} nodes
  * @return {DocumentFragment} The new DocumentFragment
  */
  function createFragment(){
    var result = document.createDocumentFragment();
    var len = arguments.length;
    var array = createFragment.array = [];

    for (var i = 0; i < len; i++)
      array.push(handleInsert(result, arguments[i]));

    return result;
  }

 /**
  * Using by createElement. Check if browser (Internet Explorer 6 & 7) has problem with name attribute.
  * @type {boolean}
  * @privare
  */
  var IS_ATTRIBUTE_BUG_NAME = (function(){
    var input = document.createElement('input');
    input.name = 'a';
    return !/name/.test(outerHTML(input));
  })();

 /**
  * Using by createElement. Check if browser (Internet Explorer 6 & 7) has problem with value setting for style attribute.
  * @type {boolean}
  * @privare
  */
  var IS_ATTRIBUTE_BUG_STYLE = (function(){
    testElement.setAttribute('style', 'color: red');
    return testElement.style.color !== 'red';
  })();

 /**
  * Using by createElement.
  * @type {RegExp}
  * @private
  */
  var DESCRIPTION_PART_REGEXP = /#([a-z0-9_:\-]+)|\.([a-z0-9_:\-]+)|\[([a-z0-9_:\-]+)(="((?:\\.|[^"])*)"|='((?:\\.|[^'])*)'|=((?:\\.|[^\]])*))?\s*\]|\s*(\S)/gi;

 /**
  * Creates a new Element with arguments as childs.
  * @param {string|object} config CSS-selector like definition or object for extended Element creation.
  * @param {...Node|object} children Child nodes
  * @return {!Element} The new Element.
  */
  function createElement(config){
    var isConfig = config != undefined && typeof config != 'string';
    var description = (isConfig ? config.description : config) || '';

    var elementName = 'div'; // modern browsers become case sensetive for tag names for xhtml
    var element;

    // fetch tag name
    var m = description.match(/^([a-z0-9_\-]+)(.*)$/i);
    if (m)
    {
      elementName = m[1];
      description = m[2];
    }

    // create an element

    if (description != '')
    {
      // extract properties
      var classNames = [];
      var attributes = {};
      var entryName;

      while (m = DESCRIPTION_PART_REGEXP.exec(description))
      {
        if (m[8])
        {
          throw new Error(
            'Create element error in basis.dom.createElement()' +
            '\n\nDescription:\n> ' + description +
            '\n\nProblem place:\n> ' + description.substr(0, m.index) + '-->' + description.substr(m.index) + '<--'
          );
        }

        entryName = m[1] || m[2] || m[3];

        if (m[1])     // id
          attributes.id = entryName;
        else
          if (m[2])   // class
            classNames.push(entryName);
          else
          {           // attribute
            if (entryName != 'class')
              attributes[entryName] = m[4] ? m[5] || m[6] || m[7] || '' : entryName;
          }
      }

      // create element
      if (IS_ATTRIBUTE_BUG_NAME && attributes.name && /^(input|textarea|select)$/i.test(elementName))
        elementName = '<' + elementName + ' name=' + attributes.name + '>';
    }

    // create element
    element = document.createElement(elementName);

    // set attributes
    if (attributes)
    {
      if (attributes.style && IS_ATTRIBUTE_BUG_STYLE)
        element.style.cssText = attributes.style;

      for (var attrName in attributes)
        element.setAttribute(attrName, attributes[attrName], 0);
    }

    // set css classes
    if (classNames && classNames.length)
      element.className = classNames.join(' ');

    // append child nodes
    if (arguments.length > 1)
      handleInsert(element, createFragment.apply(0, basis.array.flatten(arrayFrom(arguments, 1))));

    // attach event handlers
    if (isConfig)
    {
      if (config.css && basis.cssom)
        basis.cssom.setStyle(element, config.css);

      for (var event in config)
        if (typeof config[event] == 'function')
          eventUtils.addHandler(element, event, config[event], element);
    }

    // return an element
    return element;
  }

  //
  // DOM manipulations
  //

 /**
  * Insert source into specified insertPoint position of node.
  * @param {Node|object} node Destination node.
  * @param {Node|Array.<Node>|object|Array.<object>} source One or more nodes to be inserted.
  * @param {string|number=} insertPoint Number as value means position in nodes childNodes.
  * Also it might be one of special value: INSERT_BEGIN, INSERT_BEFORE, INSERT_AFTER, INSERT_END.
  * @param {Node|object=} refChild Pointer to Child node of node, using for INSERT_BEFORE & INSERT_AFTER
  * @return {Node|Array.<Node>} Inserted nodes (may different of source members).
  */
  function insert(node, source, insertPoint, refChild){
    node = get(node) || node; // TODO: remove

    switch (insertPoint) {
      case undefined: // insertPoint omitted
      case INSERT_END:
        refChild = null;
      break;
      case INSERT_BEGIN:
        refChild = node[FIRST_CHILD];
      break;
      case INSERT_BEFORE:
      break;
      case INSERT_AFTER:
        refChild = refChild[NEXT_SIBLING];
      break;
      default:
        insertPoint = Number(insertPoint);
        refChild = insertPoint >= 0 && insertPoint < node.childNodes.length ? node.childNodes[insertPoint] : null;
    }

    var isDOMLikeObject = !isNode(node);
    var result;

    if (!source || !Array.isArray(source))
      result = isDOMLikeObject ? source && node.insertBefore(source, refChild) : handleInsert(node, source, refChild);
    else
    {
      if (isDOMLikeObject)
      {
        result = [];
        for (var i = 0, len = source.length; i < len; i++)
          result[i] = node.insertBefore(source[i], refChild);
      }
      else
      {
        node.insertBefore(createFragment.apply(0, source), refChild);
        result = createFragment.array;
      }
    }

    return result;
  }

 /**
  * Remove node from it's parent and returns this node.
  * @param {Node} node
  * @return {Node}
  */
  function remove(node){
    return node[PARENT_NODE] ? node[PARENT_NODE].removeChild(node) : node;
  }

 /**
  * Replace oldNode for newNode and returns oldNode.
  * @param {Node} oldNode
  * @param {Node} newNode
  * @return {Node}
  */
  function replace(oldNode, newNode){
    return oldNode[PARENT_NODE] ? oldNode[PARENT_NODE].replaceChild(newNode, oldNode) : oldNode;
  }

 /**
  * Change placing of nodes and returns the result of operation.
  * @param {Node} nodeA
  * @param {Node} nodeB
  * @return {boolean}
  */
  function swap(nodeA, nodeB){
    if (nodeA === nodeB || comparePosition(nodeA, nodeB) & (POSITION_CONTAINED_BY | POSITION_CONTAINS | POSITION_DISCONNECTED))
      return false;

    replace(nodeA, testElement);
    replace(nodeB, nodeA);
    replace(testElement, nodeB);

    return true;
  }

 /**
  * Clone node.
  * @param {Node} node
  * @param {boolean} noChildren If true than clone only node with no children.
  * @return {Node}
  */
  function clone(node, noChildren){
    var result = node.cloneNode(!noChildren);
    if (result.attachEvent) // clear event handlers for IE
      axis(result, AXIS_DESCENDANT_OR_SELF).forEach(eventUtils.clearHandlers);
    return result;
  }

 /**
  * Removes all child nodes of node and returns this node.
  * @param {Node} node
  * @return {Node}
  */
  function clear(node){
    node = get(node);

    while (node[LAST_CHILD])
      node.removeChild(node[LAST_CHILD]);

    return node;
  }

 /**
  * Wrap array items into elements according to map.
  * @example
  *   basis.dom.wrap([1,2,3,4,5], { 'SPAN.match': function(val, idx){ return idx % 2 } });
  *   // result: [1, <span class="match">2</span>, 3, <span class="match">4</span>, 5]
  *
  *   basis.dom.wrap([1,2,3], { A: basis.fn.$true, B: function(val, idx){ return val == 3 } });
  *   // result: [<a>1</a>, <a>2</a>, <b><a>3</a></b>]
  * @param {Array} array
  * @param {object} map
  * @return {Array}
  */
  function wrap(array, map, getter){
    var result = [];
    getter = basis.getter(getter || basis.fn.$self);
    for (var k in map)
      for (var i = 0; i < array.length; i++)
      {
        var value = getter(array[i]);
        result[i] = map[k](array[i], i, value) ? createElement(k, value) : array[i];
      }
    return result;
  }

  //
  // Attributes
  //

 /**
  * Set new value for attribute. If value is null than attribute will be deleted.
  * @param {Node} node
  * @param {string} name
  * @param {*} value
  */
  function setAttribute(node, name, value){
    if (value == null)
      node.removeAttribute(name);
    else
      node.setAttribute(name, value);
  }

  //
  // Checkers
  //

  function is(element, names){ // names may be a string (comma or space separated tag names) or an array
    return (new RegExp('(^|\\W)' + element.tagName + '(\\W|$)')).test(names);
  }

 /**
  * Returns true if child is descendant of parent.
  * @param {Node} node
  * @param {Node} child
  * @return {boolean}
  */
  function parentOf(node, child){
    return node.contains(child);
  }

 /**
  * Returns true if node is decendant of parent or node equal to parent.
  * @param {Node} node
  * @param {Node} root
  * @return {Node}
  */
  function isInside(node, root){
    return node == root || root.contains(node);
  }

  //
  // Input selection stuff
  //

 /**
  * Set focus for node.
  * @param {Element} node
  * @param {boolean=} select Call select() method of node.
  */
  function focus(node, select){
    // try catch block here because browsers throw unexpected exeption in some cases
    try {
      node = get(node);
      node.focus();
      if (select && node.select) // && typeof node.select == 'function'
                                 // temporary removed because IE returns 'object' for DOM object methods, instead of 'function'
        node.select();
    } catch(e) {}
  }

  // Input text selection
  // Original code of Mihai Bazon, 2006
  // http://www.bazon.net/mishoo/
  function setSelectionRange(input, start, end){
    if (arguments.length < 3)
      end = start;

    if (input.setSelectionRange)
      input.setSelectionRange(start, end);
    else
      if (input.createTextRange)
      {
        // IE
        var range = input.createTextRange();
        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end - start);
        range.select();
      }
  }

  function ieGetInputPosition(isStart){
    if (document.selection)
    {
      var range = document.selection.createRange();
      if (range.compareEndPoints('StartToEnd', range) != 0)
        range.collapse(isStart);
      return range.getBookmark().charCodeAt(2) - 2;
    }

    return 0;
  }

  function getSelectionStart(input){
    if (typeof input.selectionStart != 'undefined')
      return input.selectionStart;
    else
      return ieGetInputPosition(true);
  }

  function getSelectionEnd(input){
    if (typeof input.selectionEnd != 'undefined')
      return input.selectionEnd;
    else
      return ieGetInputPosition(false);
  }

  //
  // export names
  //

  module.exports = {
    // CONST

    // nodeType
    ELEMENT_NODE: ELEMENT_NODE,
    ATTRIBUTE_NODE: ATTRIBUTE_NODE,
    TEXT_NODE: TEXT_NODE,
    CDATA_SECTION_NODE: CDATA_SECTION_NODE,
    ENTITY_REFERENCE_NODE: ENTITY_REFERENCE_NODE,
    ENTITY_NODE: ENTITY_NODE,
    PROCESSING_INSTRUCTION_NODE: PROCESSING_INSTRUCTION_NODE,
    COMMENT_NODE: COMMENT_NODE,
    DOCUMENT_TYPE_NODE: DOCUMENT_TYPE_NODE,
    DOCUMENT_NODE: DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE: DOCUMENT_FRAGMENT_NODE,
    NOTATION_NODE: NOTATION_NODE,

    // axis
    AXIS_ANCESTOR: AXIS_ANCESTOR,
    AXIS_ANCESTOR_OR_SELF: AXIS_ANCESTOR_OR_SELF,
    AXIS_DESCENDANT: AXIS_DESCENDANT,
    AXIS_DESCENDANT_OR_SELF: AXIS_DESCENDANT_OR_SELF,
    AXIS_SELF: AXIS_SELF,
    AXIS_PARENT: AXIS_PARENT,
    AXIS_CHILD: AXIS_CHILD,
    AXIS_FOLLOWING: AXIS_FOLLOWING,
    AXIS_FOLLOWING_SIBLING: AXIS_FOLLOWING_SIBLING,
    AXIS_PRECEDING: AXIS_PRECEDING,
    AXIS_PRECEDING_SIBLING: AXIS_PRECEDING_SIBLING,

    // insert position
    INSERT_BEGIN: INSERT_BEGIN,
    INSERT_END: INSERT_END,
    INSERT_BEFORE: INSERT_BEFORE,
    INSERT_AFTER: INSERT_AFTER,

    // nodes order functions
    //sort: sort,
    //comparePosition: comparePosition,

    // Classes
    TreeWalker: TreeWalker,

    // MISC
    outerHTML: outerHTML,
    textContent: textContent,

    // getters
    get: get,
    tag: tag,
    //tags: tags,
    axis: axis,
    findAncestor: findAncestor,

    // navigation
    //first: first,
    //last: last,
    //next: next,
    //prev: prev,
    //parent: parent,

    // node position
    //index: index,
    //lastIndex: lastIndex,
    //deep: deep,

    // DOM constructors
    createElement: createElement,
    createText: createText,
    createFragment: createFragment,

    // DOM manipulate
    insert: insert,
    remove: remove,
    replace: replace,
    swap: swap,
    clone: clone,
    clear: clear,
    wrap: wrap,

    // attributes
    setAttribute: setAttribute,

    // checkers
    //IS_ELEMENT_NODE: IS_ELEMENT_NODE,
    //IS_TEXT_NODE: IS_TEXT_NODE,
    //is: is,
    parentOf: parentOf,
    isInside: isInside,

    // input selection stuff
    focus: focus,
    setSelectionRange: setSelectionRange,
    getSelectionStart: getSelectionStart,
    getSelectionEnd: getSelectionEnd
  };
