/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

'use strict';

(function(){

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Non-visual DOM classes:
  *   {Basis.DOM.Wrapper.AbstractNode}, {Basis.DOM.Wrapper.InteractiveNode},
  *   {Basis.DOM.Wrapper.Node}, {Basis.DOM.Wrapper.PartitionNode},
  *   {Basis.DOM.Wrapper.GroupingNode}
  * - Visual DOM classes:
  *   {Basis.DOM.Wrapper.TmplNode}, {Basis.DOM.Wrapper.TmplContainer}, 
  *   {Basis.DOM.Wrapper.TmplPartitionNode}, {Basis.DOM.Wrapper.TmplGroupingNode},
  *   {Basis.DOM.Wrapper.TmplControl}
  * - Misc:
  *   {Basis.DOM.Wrapper.Selection}
  *
  * Aliases are available:
  * - {Basis.DOM.Wrapper.Control} for {Basis.DOM.Wrapper.TmplControl}
  *
  * @namespace Basis.DOM.Wrapper
  */

  var namespace = 'Basis.DOM.Wrapper';

  // import names

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var nsData = Basis.Data;

  var Template = Basis.Html.Template;
  var EventObject = Basis.EventObject;
  var Subscription = nsData.Subscription;
  var DataObject = nsData.DataObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;

  var Cleaner = Basis.Cleaner;
  var TimeEventManager = Basis.TimeEventManager;

  var STATE = nsData.STATE;
  var AXIS_DESCENDANT = DOM.AXIS_DESCENDANT;

  var getter = Function.getter;
  var extend = Object.extend;
  var complete = Object.complete;
  var classList = Basis.CSS.classList;
  var axis = DOM.axis;
  var createBehaviour = Basis.EventObject.createBehaviour;
  var createEvent = Basis.EventObject.createEvent;
  var event = Basis.EventObject.event;

  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_COLLECTION_CONFLICT = namespace + ': Operation is not allowed because node is under collection control';

  function sortingSearch(node){
    return node.sortingValue || 0; // it's important return zero when sortingValue is undefined,
                                   // because in this case sorting may be broken; it's also not a problem
                                   // when zero equivalent values (null, false or empty string) converts to zero
  }

  function sortAsc(a, b){
    a = a.sortingValue || 0;
    b = b.sortingValue || 0;
    return +(a > b) || -(a < b);
  }

  function sortDesc(a, b){
    a = a.sortingValue || 0;
    b = b.sortingValue || 0;
    return -(a > b) || +(a < b);
  }

  function sortChildNodes(obj){
    return obj.childNodes.sort(
      obj.localSortingDesc
        ? sortDesc
        : sortAsc
    );
  }

  //
  // registrate new subscription type
  //

  Subscription.regType(
    'COLLECTION',
    {
      collectionChanged: function(object, oldCollection){
        this.remove(object, oldCollection);
        this.add(object, object.collection);
      }
    },
    function(action, object){
      action(object, object.collection);
    }
  );

  //
  //  NODE
  //

  var SATELLITE_DESTROY_HANDLER = {
    destroy: function(object){
      DOM.replace(object.element, this);
    }
  };

  var SATELLITE_HANDLER = {
    update: function(object, delta){
      for (var key in this.satelliteConfig)
      {
        var config = this.satelliteConfig[key];
        var exists = typeof config.existsIf != 'function' || config.existsIf(this);
        var satellite = this.satellite[key];

        if (exists)
        {
          var delegate = typeof config.delegate == 'function' ? config.delegate(this) : null;
          var collection = typeof config.collection == 'function' ? config.collection(this) : null;
          if (satellite)
          {
            satellite.setDelegate(delegate);
            satellite.setCollection(collection);
          }
          else
          {
            var replaceElement = this.tmpl[config.replace || key];
            var instanceConfig = {
              delegate: delegate,
              collection: collection
            };

            if (config.config)
              Object.complete(instanceConfig, typeof config.config == 'function' ? config.config(this) : config.config);

            satellite = new config.instanceOf(instanceConfig);
            satellite.owner = this;

            this.satellite[key] = satellite;

            if (replaceElement && satellite instanceof TmplNode && satellite.element)
            {
              DOM.replace(replaceElement, satellite.element);
              satellite.addHandler(SATELLITE_DESTROY_HANDLER, replaceElement);
            }
          }
        }
        else
        {
          if (satellite)
          {
            satellite.destroy();
            satellite.owner = null;
            delete this.satellite[key];
          }
        }
      }
    }
  };

 /**
  * @class
  */
  var AbstractNode = Class(DataObject, {
    className: namespace + '.AbstractNode',

   /**
    * This is a general event for notification of childs changes to the document.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred. 
    * @param {Basis.DOM.Wrapper.AbstractNode} node
    * @param {object} delta Delta of changes.
    * @event
    */
    event_childNodesModified: createEvent('childNodesModified', 'node', 'delta'),

   /**
    * @param {Basis.DOM.Wrapper.AbstractNode} node
    * @param {Basis.Data.AbstractDataset} oldCollection
    */
    event_collectionChanged: createEvent('collectionChanged', 'node', 'oldCollection'),

   /**
    * @param {Basis.DOM.Wrapper.AbstractNode} node
    * @param {Basis.DOM.Wrapper.GroupingNode} oldGroupingNode
    */
    event_localGroupingChanged: createEvent('localGroupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {Basis.DOM.Wrapper.AbstractNode} node
    */
    event_localSortingChanged: createEvent('localSortingChanged', 'node'),

   /**
    * @inheritDoc
    */
    event_update: function(object, delta){
      DataObject.prototype.event_update.call(this, object, delta);

      var parentNode = this.parentNode;
      if (parentNode)
      {
        if (parentNode.matchFunction)
        {
          this.match();
          this.match(parentNode.matchFunction);
        }

        // if there more than one child - re-insert to change position if necessary
        if (parentNode.firstChild !== parentNode.lastChild)
          parentNode.insertBefore(this, this.nextSibling);
      }
    },

   /**
    * @inheritDoc
    */
    subscribeTo: Subscription.DELEGATE | Subscription.COLLECTION,

   /**
    * Flag determines object behaviour when parentNode changing:
    * - true: set same delegate as parentNode has on insert, or unlink delegate on remove
    * - false: nothing to do
    * @type {boolean}
    */
    autoDelegateParent: false,

   /**
    * @type {string}
    * @readonly
    */
    nodeType: 'DOMWrapperNode',

   /**
    * @type {boolean}
    * @readonly
    */
    canHaveChildren: false,

   /**
    * A list that contains all children of this node. If there are no children,
    * this is a list containing no nodes.
    * @type {Array.<Basis.DOM.Wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * Object that's manage childNodes updates.
    * @type {Basis.Data.AbstractDataset}
    */
    collection: null,

   /**
    * Map collection members to child nodes.
    * @type {Object}
    * @private
    */
    colMap_: null,

   /**
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    document: null,

   /**
    * The parent of this node. All nodes may have a parent. However, if a node
    * has just been created and not yet added to the tree, or if it has been
    * removed from the tree, this is null. 
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    parentNode: null,

   /**
    * The node immediately following this node. If there is no such node,
    * this returns null.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    nextSibling: null,

   /**
    * The node immediately preceding this node. If there is no such node,
    * this returns null.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    previousSibling: null,

   /**
    * The first child of this node. If there is no such node, this returns null.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    firstChild: null,

   /**
    * The last child of this node. If there is no such node, this returns null.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    lastChild: null,

   /**
    * Sorting function
    * @type {Function}
    */
    localSorting: null,

   /**
    * Sorting direction
    * @type {boolean}
    */
    localSortingDesc: false,

   /**
    * Grouping config
    * @type {Basis.DOM.Wrapper.GroupingNode}
    */
    localGrouping: null,

   /**
    * Class for grouping control. Class should be inherited from {Basis.DOM.Wrapper.GroupingNode}
    * @type {Class}
    */
    localGroupingClass: null,

   /**
    * Reference to group node in localGrouping
    * @type {Basis.DOM.Wrapper.AbstractNode}
    * @readonly
    */
    groupNode: null,

   /**
    * Hash of satellite object configs.
    * @type {Object}
    */
    satelliteConfig: null,

   /**
    * Satellite objects storage.
    * @type {Object}
    */
    satellite: null,

   /**
    * @param {Object} config
    * @config {boolean} autoDelegateParent Overrides prototype's {Basis.Data.DataObject#autoDelegateParent} property.
    * @config {function()|string} localSorting Initial local sorting function.
    * @config {boolean} localSortingDesc Initial local sorting order.
    * @config {Basis.DOM.Wrapper.AbstractNode} document (deprecated) Must be removed. Used as hot fix.
    * @config {Object} localGrouping Initial config for local grouping.
    * @config {Basis.Data.DataObject} collection Sets collection for object.
    * @config {Basis.Data.AbstractDataset} collection Set a collection to a new object.
    * @config {Array} childNodes Initial child node set.
    * @return {Object} Returns a config. 
    * @constructor
    */
    init: function(config){

      var collection = this.collection;
      var childNodes = this.childNodes;
      var localGrouping = this.localGrouping;

      this.collection = null; // NOTE: reset collection before inherit -> prevent double subscription activation
                              // when this.active == true and collection is assigned

      // inherit
      DataObject.prototype.init.call(this, config);

      if (localGrouping)
      {
        this.localGrouping = null;
        this.setLocalGrouping(localGrouping);
      }

      // init properties
      if (this.canHaveChildren)
      {
        // init child nodes storage
        this.childNodes = [];

        // set collection
        if (collection)
        {
          this.collection = null;
          this.setCollection(collection);
        }
        else
        {
          if (childNodes)
            this.setChildNodes(childNodes);
        }
      }
      else
      {
        if (childNodes)
          this.childNodes = null;

        if (collection)
          this.collection = null;
      }

      if (!this.satellite)
        this.satellite = {};

      if (this.satelliteConfig)
      {
        this.addHandler(SATELLITE_HANDLER);
        //SATELLITE_HANDLER.update.call(this, this, {});
      }
    },

   /**
    * Adds the node newChild to the end of the list of children of this node. If the newChild is already in the tree, it is first removed.
    * @param {Basis.DOM.Wrapper.AbstractNode} newChild The node to add.
    * @return {Basis.DOM.Wrapper.AbstractNode} The node added.
    */
    appendChild: function(newChild){
    },

   /**
    * Inserts the node newChild before the existing child node refChild. If refChild is null, insert newChild at the end of the list of children.
    * @param {Basis.DOM.Wrapper.AbstractNode} newChild The node to insert.
    * @param {Basis.DOM.Wrapper.AbstractNode} refChild The reference node, i.e., the node before which the new node must be inserted.
    * @return {Basis.DOM.Wrapper.AbstractNode} The node being inserted.
    */
    insertBefore: function(newChild, refChild){
    },

   /**
    * Removes the child node indicated by oldChild from the list of children, and returns it.
    * @param {Basis.DOM.Wrapper.AbstractNode} oldChild The node being removed.
    * @return {Basis.DOM.Wrapper.AbstractNode} The node removed.
    */
    removeChild: function(oldChild){
    },

   /**
    * Replaces the child node oldChild with newChild in the list of children, and returns the oldChild node.
    * @param {Basis.DOM.Wrapper.AbstractNode} newChild The new node to put in the child list.
    * @param {Basis.DOM.Wrapper.AbstractNode} oldChild The node being replaced in the list.
    * @return {Basis.DOM.Wrapper.AbstractNode} The node replaced.
    */
    replaceChild: function(newChild, oldChild){
    },

   /**
    * Removes all child nodes from the list of children, fast way to remove all childs.
    * @param {boolean} alive
    */
    clear: function(alive){
    },

   /**
    * Returns whether this node has any children. 
    * @return {boolean} Returns true if this node has any children, false otherwise.
    */
    hasChildNodes: function(){
      return this.childNodes.length > 0;
    },

   /**
    * Returns whether this node has any children. 
    * @return {boolean} Returns true if this node has any children, false otherwise.
    */
    setChildNodes: function(){
    },

   /**
    * @param {Object|function()|string} grouping
    * @param {boolean} alive Keep localGrouping alive after unlink
    */
    setLocalGrouping: function(grouping, alive){
    },

   /**
    * @param {function()|string} sorting
    * @param {boolean} desc
    */
    setLocalSorting: function(sorting, desc){
    },

   /**
    * @param {Basis.Data.AbstractDataset} collection
    */
    setCollection: function(collection){
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This method actions order is important, for better perfomance: 
      // inherit destroy -> clear childNodes -> remove from parent

      // inherit (fire destroy event & remove handlers)
      DataObject.prototype.destroy.call(this);

      // delete childs
      if (this.collection)
      {
        // drop collection
        this.setCollection();
      }
      else
      {
        // has children
        if (this.firstChild)
          this.clear();
      }

      // unlink from parent
      if (this.parentNode)
        this.parentNode.removeChild(this);

      // destroy group control
      if (this.localGrouping)
      {
        this.localGrouping.destroy();
        this.localGrouping = null;
      }

      // destroy satellites
      if (this.satellite)
      {
        for (var key in this.satellite)
        {
          var satellite = this.satellite[key];
          satellite.destroy();
          satellite.owner = null;
        }
        this.satellite = null;
      }

      // remove pointers
      this.document = null;
      this.childNodes = null;
      this.parentNode = null;
      this.previousSibling = null;
      this.nextSibling = null;
      this.firstChild = null;
      this.lastChild = null;
    }
  });

 /**
  * @class
  */
  var PartitionNode = Class(AbstractNode, {
    className: namespace + '.PartitionNode',

   /**
    * Destroy object if it doesn't contain any children (became empty).
    * @type {boolean}
    */
    autoDestroyIfEmpty: false,

   /**
    * The list of partition members.
    * @type {Array.<Basis.DOM.Wrapper.AbstractNode>}
    * @readonly
    */
    nodes: null,

   /**
    * First item in nodes if exists.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    */
    first: null,

   /**
    * Last item in nodes if exists.
    * @type {Basis.DOM.Wrapper.AbstractNode}
    */
    last: null,

   /**
    * @constructor
    */
    init: function(config){
      this.nodes = [];
      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * Works like insertBefore, but don't update newNode references.
    * @param {Basis.DOM.Wrapper.AbstractNode} newNode
    * @param {Basis.DOM.Wrapper.AbstractNode} refNode
    */
    insert: function(newNode, refNode){
      var nodes = this.nodes;
      var pos = refNode ? nodes.indexOf(refNode) : nodes.length;

      nodes.splice(pos, 0, newNode);
      this.first = nodes[0] || null;
      this.last = nodes[nodes.length - 1] || null;
      newNode.groupNode = this;

      this.event_childNodesModified(this, { inserted: [newNode] });
    },

   /**
    * Works like removeChild, but don't update oldNode references.
    * @param {Basis.DOM.Wrapper.AbstractNode} oldNode
    */
    remove: function(oldNode){
      var nodes = this.nodes;
      if (nodes.remove(oldNode))
      {
        this.first = nodes[0] || null;
        this.last = nodes[nodes.length - 1] || null;
        oldNode.groupNode = null;

        this.event_childNodesModified(this, { deleted: [oldNode] });
      }

      if (!this.first && this.autoDestroyIfEmpty)
        this.destroy();
    },

   /**
    * @inheritDoc
    */
    clear: function(){
      // if node haven't nodes do nothing (event don't fire)
      if (!this.first)
        return;

      // store childNodes
      var nodes = this.nodes;

      // unlink all nodes from partition
      for (var i = nodes.length; i --> 0;)
        nodes[i].groupNode = null;

      // clear nodes & pointers
      this.nodes = [];
      this.first = null;
      this.last = null;

      this.event_childNodesModified(this, { deleted: nodes });

      // destroy partition if necessary
      if (this.autoDestroyIfEmpty)
        this.destroy();
    },

   /**
    * @destructor
    */
    destroy: function(){
      AbstractNode.prototype.destroy.call(this);

      this.nodes = null;
      this.first = null;
      this.last = null;        
    }
  });

  /*
   *  Hierarchy handlers & methods
   */

  var DOMMIXIN_COLLECTION_HANDLERS = {
    datasetChanged: function(dataset, delta){

      var newDelta = {};
      var deleted = [];

      // delete nodes
      if (delta.deleted)
      {
        newDelta.deleted = deleted;
        if (this.childNodes.length == delta.deleted.length)
        {
          // copy childNodes to deleted
          deleted.push.apply(deleted, this.childNodes);

          // optimization: if all old nodes deleted -> clear childNodes
          var col = this.collection;
          this.collection = null;
          this.clear(true);   // keep alive, event fires
          this.collection = col;
          this.colMap_ = {};
        }
        else
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var delegateId = item.eventObjectId;
            var oldChild = this.colMap_[delegateId];

            delete this.colMap_[delegateId];
            oldChild.canHaveDelegate = true; // allow delegate drop
            this.removeChild(oldChild);

            deleted.push(oldChild);
          }
        }
      }

      // insert new nodes
      if (delta.inserted)
      {
        newDelta.inserted = [];
        for (var i = 0, item; item = delta.inserted[i]; i++)
        {
          //var node = this.insertBefore(item.info, con[item.pos]);
          var newChild = createChildByFactory(this, {
            active: false,
            cascadeDestroy: false,
            //canHaveDelegate: false,
            delegate: item
          });

          newChild.canHaveDelegate = false; // prevent delegate override

          // insert
          this.colMap_[item.eventObjectId] = newChild;
          newDelta.inserted.push(newChild);

          if (this.firstChild) // optimization, prepare for setChildNodes
            this.insertBefore(newChild);
        }
      }

      if (!this.firstChild)
        this.setChildNodes(newDelta.inserted); // event fires
      else
        this.event_childNodesModified(this, newDelta);

      if (deleted.length)
      {
        for (var i = 0, item; item = deleted[i]; i++)
          item.destroy();
      }
    },
    destroy: function(object){
      //this.clear();
      if (this.collection === object)
        this.setCollection();
    }
  };

  function fastChildNodesOrder(node, order){
    node.childNodes = order;
    node.firstChild = order[0] || null;
    node.lastChild = order[order.length - 1] || null;

    //DOM.insert(this, order);
    for (var i = order.length - 1; i >= 0; i--)
    {
      order[i].nextSibling = order[i + 1] || null;
      order[i].previousSibling = order[i - 1] || null;
      node.insertBefore(order[i], order[i].nextSibling);
    }
  }

  function fastChildNodesGroupOrder(node, order){
    for (var i = 0, child; child = order[i]; i++)
      child.groupNode.nodes.push(child);

    order.length = 0;
    for (var group = node.localGrouping.nullGroup; group; group = group.nextSibling)
    {
      var nodes = group.nodes;
      group.first = nodes[0] || null;
      group.last = nodes[nodes.length - 1] || null;
      order.push.apply(order, nodes);
      group.event_childNodesModified(group, { inserted: nodes });
    }

    return order;
  }

  function createChildByFactory(node, config){
    var factory = node.childFactory || (node.document && node.document.childFactory);
    var child;

    config = Object.extend({
      document: node.document,
      contextSelection: node.selection || node.contextSelection
    }, config);

    if (factory)
    {
      child = factory.call(node, config);
      if (child instanceof node.childClass)
        return child;
    }

    if (!child)
      throw EXCEPTION_NULL_CHILD;

    throw (EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.className) + ')');
  }

  var DomMixin = {
   /**
    * @inheritDoc
    */
    canHaveChildren: true,

   /**
    * All child nodes must be instances of childClass.
    * @type {Class}
    */
    childClass: AbstractNode,

   /**
    * Function that will be called, when non-instance of childClass insert.
    * @example
    *   // code with no childFactory
    *   function createChild(config){
    *     return new Basis.DOM.Wrapper.TmplNode(config);
    *   }
    *   var node = new Basis.DOM.Wrapper.TmplContainer();
    *   node.appendChild(createChild({ .. config .. }));
    *
    *   // with childFactory
    *   var CustomClass = Basis.Class(Basis.DOM.Wrapper.TmplContainer, {
    *     childFactory: function(config){
    *       return new Basis.DOM.Wrapper.TmplNode(config);
    *     }
    *   });
    *   var node = new CustomClass();
    *   node.appendChild({ .. config .. });
    * @type {function():object}
    */
    childFactory: null,

   /**
    * @inheritDoc
    */
    appendChild: function(newChild){
      return this.insertBefore(newChild);
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      if (!this.canHaveChildren)
        throw EXCEPTION_CANT_INSERT;

      if (newChild.firstChild)
      {
        // newChild can't be ancestor of current node
        var cursor = this;
        do {
          if (cursor == newChild)
            throw EXCEPTION_CANT_INSERT;
        }
        while (cursor = cursor.parentNode)
      }

      // check for collection
      if (this.collection && !this.collection.has(newChild.delegate))
        throw EXCEPTION_COLLECTION_CONFLICT;

      // construct new childClass instance if newChild is not instance of childClass
      if (newChild instanceof this.childClass == false)
        newChild = createChildByFactory(this, newChild instanceof DataObject ? { delegate: newChild } : newChild);

      // search for insert point
      var isInside = newChild.parentNode === this;
      var currentNewChildGroup = newChild.groupNode;
      var localGrouping = this.localGrouping;
      var localSorting = this.localSorting;
      var childNodes = this.childNodes;
      var newChildValue;
      var groupNodes;
      var group = null;
      var pos = -1;

      if (localGrouping)
      {
        group = localGrouping.getGroupNode(newChild);
        groupNodes = group.nodes;

        // optimization: test node position, possible it on right place
        if (isInside && newChild.nextSibling === refChild && currentNewChildGroup === group)
          return newChild;

        // calculate newChild position
        if (localSorting)
        {
          // when localSorting use binary search
          newChildValue = localSorting(newChild) || 0;
          pos = groupNodes.binarySearchPos(newChildValue, sortingSearch, this.localSortingDesc);
          newChild.sortingValue = newChildValue;
        }
        else
        {
          // if refChild in the same group, insert position will be before refChild,
          // otherwise insert into end
          if (refChild && refChild.groupNode === group)
            pos = groupNodes.indexOf(refChild);
          else
            pos = groupNodes.length;
        }

        if (pos < groupNodes.length)
        {
          refChild = groupNodes[pos];
        }
        else
        {
          // search for refChild for right ordering
          if (group.lastChild)
          {
            // fast way to find refChild via current group lastChild (if exists)
            refChild = group.lastChild.nextSibling;
          }
          else
          {
            // search for refChild as first firstChild of next sibling groups (groups might be empty)
            var cursor = group;
            refChild = null;
            while (cursor = cursor.nextSibling)
              if (refChild = cursor.firstChild)
                break;
          }
        }

        if (newChild === refChild || (isInside && newChild.nextSibling === refChild))
        {
          if (currentNewChildGroup !== group)
          {
            if (currentNewChildGroup)
              currentNewChildGroup.remove(newChild);

            group.insert(newChild);
          }

          return newChild;
        }

        pos = -1; // NOTE: drop pos, because this index for group nodes
                  // TODO: re-calculate pos as sum of previous groups nodes.length and pos
      }
      else
      {
        if (localSorting)
        {
          // if localSorting is using - refChild is ignore
          var sortingDesc = this.localSortingDesc;
          var next = newChild.nextSibling;
          var prev = newChild.previousSibling;

          newChildValue = localSorting(newChild) || 0;

          // some optimizations if node had already inside current node
          if (isInside)
          {
            if (newChildValue === newChild.sortingValue)
              return newChild;

            if (
                (!next || (sortingDesc ? next.sortingValue <= newChildValue : next.sortingValue >= newChildValue))
                &&
                (!prev || (sortingDesc ? prev.sortingValue >= newChildValue : prev.sortingValue <= newChildValue))
               )
            {
              newChild.sortingValue = newChildValue;
              return newChild;
            }
          }

          // search for refChild
          pos = childNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
          refChild = childNodes[pos];
          newChild.sortingValue = newChildValue;

          if (newChild === refChild || (isInside && next === refChild))
            return newChild;
        }
        else
        {
          // refChild isn't child of current node
          if (refChild && refChild.parentNode !== this)
            throw EXCEPTION_NODE_NOT_FOUND;

          // some optimizations and checks
          if (isInside)
          {
            // already on necessary position
            if (newChild.nextSibling === refChild)
              return newChild;

            if (newChild === refChild)
              throw EXCEPTION_CANT_INSERT;
          }
        }
      }

      //
      // ======= after this point newChild inserting or moving into new position =======
      //

      // unlink from old parent
      if (isInside)
      {
        // emulate removeChild if parentNode doesn't change (no events, speed benefits)

        // update nextSibling/lastChild
        if (newChild.nextSibling)
          newChild.nextSibling.previousSibling = newChild.previousSibling;
        else
          this.lastChild = newChild.previousSibling;

        // update previousSibling/firstChild
        if (newChild.previousSibling) 
          newChild.previousSibling.nextSibling = newChild.nextSibling;      
        else
          this.firstChild = newChild.nextSibling;

        // don't move this, this values using above to update first/last child
        newChild.previousSibling = null;
        newChild.nextSibling = null;

        childNodes.remove(newChild);

        // remove from old group (always remove for correct order)
        if (currentNewChildGroup)  // initial newChild.groupNode
          currentNewChildGroup.remove(newChild);
      }
      else
      {
        if (newChild.parentNode)
          newChild.parentNode.removeChild(newChild);
      }

      // add to group
      // NOTE: we need insert into group here, because we create fake refChild if refChild doesn't exist
      if (currentNewChildGroup !== group)
        group.insert(newChild, refChild);
      
      // insert
      if (refChild) 
      {
        // search for refChild position
        // NOTE: if position is not equal -1 than position was found before (localSorting, logN)
        if (pos == -1)
          pos = childNodes.indexOf(refChild);

        // if refChild not found than throw exception
        if (pos == -1)
          throw EXCEPTION_NODE_NOT_FOUND;

        // set next sibling
        newChild.nextSibling = refChild;

        // insert newChild into childNodes
        childNodes.splice(pos, 0, newChild);
      }
      else
      {
        // there is no refChild, insert newChild to the end of childNodes
        pos = childNodes.length;

        // create fake refChild, it helps with references updates
        refChild = { 
          previousSibling: this.lastChild
        };

        // update lastChild
        this.lastChild = newChild;

        // insert newChild into childNodes
        childNodes.push(newChild);
      }

      // update newChild
      newChild.parentNode = this;
      //newChild.document = this.document;
      newChild.previousSibling = refChild.previousSibling;

      // not need update this.lastChild, insert always before some node
      // if insert into begins
      if (pos == 0)
        this.firstChild = newChild;
      else
        refChild.previousSibling.nextSibling = newChild;

      // update refChild
      refChild.previousSibling = newChild;

      // update document & selection
      var updateDocument = false;
      var updateSelection = false;
      var newChildSelection = this.selection || this.contextSelection;

      if (!newChild.document && newChild.document !== this.document)
      {
        updateDocument = this.document;
        newChild.document = this.document;
      }

      if (!newChild.contextSelection && newChild.contextSelection !== newChildSelection)
      {
        newChild.contextSelection = newChildSelection;
        updateSelection = !newChild.selection;

        if (newChild.selected)
        {
          //newChild.unselect();
          newChildSelection.add([newChild]);
        }
      }

      if (newChild.firstChild && (updateDocument || updateSelection))
        axis(newChild, AXIS_DESCENDANT).forEach(function(node){
          if (updateDocument && !node.document)
            node.document = updateDocument;

          if (updateSelection && !node.contextSelection)
          {
            if (node.selected)
              node.unselect();

            node.contextSelection = newChildSelection;
          }
        });

      // if node doesn't move inside the same parent (parentNode changed)
      if (!isInside)
      {
        // re-match
        if (newChild.match)
          newChild.match(this.matchFunction);

        // delegate parentNode automatically, if necessary
        if (newChild.autoDelegateParent)
          newChild.setDelegate(this);

        // dispatch event
        if (!this.collection)
          this.event_childNodesModified(this, { inserted: [newChild] });
      }

      // return newChild
      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
        throw EXCEPTION_NODE_NOT_FOUND;

      if (oldChild instanceof this.childClass == false)
        throw EXCEPTION_BAD_CHILD_CLASS;

      if (this.collection && this.collection.has(oldChild))
        throw EXCEPTION_COLLECTION_CONFLICT;

      // update this
      var pos = this.childNodes.indexOf(oldChild);
      this.childNodes.splice(pos, 1);
        
      // update oldChild and this.lastChild & this.firstChild
      oldChild.parentNode = null;

      // update document & selection
      var updateDocument = oldChild.document === this.document;
      var updateSelection = oldChild.contextSelection === this.selection;

      if (oldChild.firstChild && (updateDocument || updateSelection))
        axis(oldChild, AXIS_DESCENDANT).forEach(function(node){
          if (updateDocument && node.document == this.document)
            node.document = null;

          if (updateSelection && node.contextSelection == this.selection)
          {
            if (node.selected)
              this.selection.remove([node]);
            node.contextSelection = null;
          }
        }, oldChild);

      if (updateDocument)
        oldChild.document = null;

      if (updateSelection && this.selection)
      {
        if (oldChild.selected)
          this.selection.remove([oldChild]);
        oldChild.contextSelection = null;
      }

      // update nextSibling/lastChild
      if (oldChild.nextSibling)
        oldChild.nextSibling.previousSibling = oldChild.previousSibling;
      else
        this.lastChild = oldChild.previousSibling;

      // update previousSibling/firstChild
      if (oldChild.previousSibling) 
        oldChild.previousSibling.nextSibling = oldChild.nextSibling;      
      else
        this.firstChild = oldChild.nextSibling;
        
      oldChild.nextSibling = null;
      oldChild.previousSibling = null;

      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch event
      if (!this.collection)
        this.event_childNodesModified(this, { deleted: [oldChild] });

      if (oldChild.autoDelegateParent)
        oldChild.setDelegate();

      // return removed child
      return oldChild;
    },

   /**
    * @inheritDoc
    */
    replaceChild: function(newChild, oldChild){
      if (this.collection)
        throw EXCEPTION_COLLECTION_CONFLICT;

      if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
        throw EXCEPTION_NODE_NOT_FOUND;

      // insert newChild before oldChild
      this.insertBefore(newChild, oldChild);

      // remove oldChild
      return this.removeChild(oldChild);
    },

   /**
    * @inheritDoc
    */
    clear: function(alive){

      // drop collection
      if (this.collection)
      {
        this.setCollection(); // it'll call clear again, but with no this.collection
        return;
      }

      // if node haven't childs nothing to do (event don't fire)
      if (!this.firstChild)
        return;

      // store childs
      var childNodes = this.childNodes;

      // remove all childs
      this.firstChild = null;
      this.lastChild = null;
      this.childNodes = [];

      // dispatch event
      // NOTE: important dispatch event before nodes remove/destroy, because listeners may analyze removing nodes
      this.event_childNodesModified(this, { deleted: childNodes });

      for (var i = childNodes.length; i --> 0;)
      {
        var child = childNodes[i];

        child.parentNode = null;
        child.groupNode = null;

        if (alive)
        {
          // clear document/selection
          if (child.selection || child.document)
          {
            axis(child, DOM.AXIS_DESCENDANT_OR_SELF).forEach(function(node){
              //node.unselect();
              if (this.selection && node.selection === this.selection)
              {
                if (node.selected)
                  node.selection.remove([node]);
                node.selection = null;
              }
              if (node.document === this.document)
                node.document = null;
            }, this);
          }

          child.nextSibling = null;
          child.previousSibling = null;

          if (child.autoDelegateParent)
            child.setDelegate();
        }
        else
          child.destroy();
      }

      // if local grouping, clear groups
      if (this.localGrouping)
      {
        this.localGrouping.clear();
        /*var cn = this.localGrouping.childNodes;
        for (var i = cn.length - 1, group; group = cn[i]; i--)
          group.clear(alive);*/
      }
    },

   /**
    * @params {Array.<Object>} childNodes
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.collection)
        this.clear(!!keepAlive);

      if (newChildNodes)
      {
        if ('length' in newChildNodes == false) // we don't use Array.from here to avoid make a copy of array
          newChildNodes = [newChildNodes];

        if (newChildNodes.length)
        {
          // switch off dispatch
          var tmp = this.event_childNodesModified;
          this.event_childNodesModified = Function.$undef;

          // insert nodes
          for (var i = 0, len = newChildNodes.length; i < len; i++)
            this.insertBefore(newChildNodes[i]);

          // restore event dispatch & dispatch changes event
          this.event_childNodesModified = tmp;
          this.event_childNodesModified(this, { inserted: this.childNodes });
        }
      }
    },

   /**
    * @inheritDoc
    */
    setCollection: function(collection){
      if (!collection || !this.canHaveChildren || collection instanceof AbstractDataset == false)
        collection = null;

      if (this.collection !== collection)
      {
        var oldCollection = this.collection;

        // detach
        if (oldCollection)
        {
          this.collection = null;
          this.colMap_ = null;

          oldCollection.removeHandler(DOMMIXIN_COLLECTION_HANDLERS, this);

          if (oldCollection.itemCount)
            this.clear();
        }

        // TODO: switch off localSorting & localGrouping

        // attach
        if (collection)
        {
          this.collection = collection;
          this.colMap_ = {};

          collection.addHandler(DOMMIXIN_COLLECTION_HANDLERS, this);

          if (collection.itemCount)
            DOMMIXIN_COLLECTION_HANDLERS.datasetChanged.call(this, collection, {
              inserted: collection.getItems()
            });
        }

        // TODO: restore localSorting & localGrouping, fast node reorder

        this.event_collectionChanged(this, oldCollection);
      }
    },

   /**
    * @inheritDoc
    */
    setLocalGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
      {
        /*if (this.localGrouping)
        {
          grouping = this.localGrouping;
          grouping.setGroupGetter(getter(grouping));
        }
        else*/
          grouping = {
            groupGetter: getter(grouping)
          };
      }
      else
      {
        if (typeof grouping != 'object' && grouping instanceof GroupingNode == false)
        {
          grouping = null;
        }
      }

      if (this.localGrouping !== grouping)
      {
        var oldGroupingNode = this.localGrouping;
        var order;

        if (this.localGrouping)
        {
          this.localGrouping = null;

          if (!grouping && this.firstChild)
          {
            order = this.localSorting
                      ? sortChildNodes(this)
                      : this.childNodes;

            for (var i = order.length; i --> 0;)
              order[i].groupNode = null;

            fastChildNodesOrder(this, order);
          }

          if (!alive)
            oldGroupingNode.destroy();
          else
            oldGroupingNode.owner = null;
        }

        if (grouping)
        {
          if (grouping instanceof GroupingNode)
          {
            grouping.setOwner(this);
          }
          else
          {
            grouping = new this.localGroupingClass(Object.complete({
              owner: this
            }, grouping));
          }

          this.localGrouping = grouping;

          // if there is child nodes - reorder it
          if (this.firstChild)
          {
            // new order
            if (this.localSorting)
              order = sortChildNodes(this);
            else
              order = this.childNodes;

            // split nodes by new groups
            for (var i = 0, child; child = order[i]; i++)
              child.groupNode = this.localGrouping.getGroupNode(child);

            // fill groups
            order = fastChildNodesGroupOrder(this, order);

            // apply new order
            fastChildNodesOrder(this, order);
          }
        }

        this.event_localGroupingChanged(this, oldGroupingNode);
      }
    },

   /**
    * @inheritDoc
    */
    setLocalSorting: function(sorting, desc){
      if (sorting)
        sorting = getter(sorting);

      // TODO: fix when direction changes only
      if (this.localSorting != sorting || this.localSortingDesc != !!desc)
      {
        this.localSortingDesc = !!desc;
        this.localSorting = sorting || null;

        // reorder nodes only if sorting and child nodes exists
        if (sorting && this.firstChild)
        {
          var order = [];
          var nodes;

          for (var node = this.firstChild; node; node = node.nextSibling)
            node.sortingValue = sorting(node) || 0;

          // Probably strange and dirty solution, but faster (up to 2-5 times).
          // Low dependence of node shuffling. Total permutation count equals to permutation
          // count of top level elements (if used). No events dispatching (time benefits).
          // Sorting time of Wrappers (AbstractNodes) equals N*log(N) + N (reference update).
          // NOTE: Nodes selected state will remain (sometimes it can be important)
          if (this.localGrouping)
          {
            for (var group = this.localGrouping.nullGroup; group; group = group.nextSibling)
            {
              // sort, clear and set new order, no override childNodes
              nodes = group.nodes = sortChildNodes({ childNodes: group.nodes, localSortingDesc: this.localSortingDesc });

              group.first = nodes[0] || null;
              group.last = nodes[nodes.length - 1] || null;
              order.push.apply(order, nodes);
            }
          }
          else
          { 
            order = sortChildNodes(this);
          }

          // apply new order
          fastChildNodesOrder(this, order);
        }

        this.event_localSortingChanged(this);
      }
    },

   /**
    * @inheritDoc
    */
    setMatchFunction: function(matchFunction){
      if (this.matchFunction != matchFunction)
      {
        this.matchFunction = matchFunction;
        for (var node = this.lastChild; node; node = node.previousSibling)
          node.match(matchFunction);
      }
    }
  };

 /**
  * @class
  */
  var InteractiveNode = Class(AbstractNode, {
    className: namespace + '.InteractiveNode',
  
   /**
    * Occurs after disabled property has been set to false.
    * @event
    */
    event_enable: createEvent('enable'),

   /**
    * Occurs after disabled property has been set to true.
    * @event
    */
    event_disable: createEvent('disable'),

   /**
    * Occurs after selected property has been set to true.
    * @event
    */
    event_select: createEvent('select'),

   /**
    * Occurs after selected property has been set to false.
    * @event
    */
    event_unselect: createEvent('unselect'),

   /**
    * Occurs after matched property has been set to true.
    * @event
    */
    event_match: createEvent('match'),

   /**
    * Occurs after matched property has been set to false.
    * @event
    */
    event_unmatch: createEvent('unmatch'),

   /**
    * Indicate could be able node to be selected or not.
    * @type {boolean}
    * @readonly
    */
    selectable: true,

   /**
    * Indicate node is selected.
    * @type {boolean}
    * @readonly
    */
    selected: false,

   /**
    * Set of selected child nodes.
    * @type {Basis.DOM.Wrapper.Selection}
    */
    selection: null,

   /**
    * @type {Basis.DOM.Wrapper.Selection}
    * @private
    */
    contextSelection: null,

   /**
    * @type {function()|null}
    * @readonly
    */
    matchFunction: null,

   /**
    * @type {boolean}
    * @readonly
    */
    matched: true,

   /**
    * Indicate node is disabled. Use isDisabled method to determine disabled 
    * node state instead of check for this property value (ancestor nodes may
    * be disabled and current node will be disabled too, but node disabled property
    * could has false value).
    * @type {boolean}
    * @readonly
    */
    disabled: false,

   /**
    * @param {Object} config
    * @config {Basis.DOM.Wrapper.Selection} selection Set Selection control for child nodes.
    * @config {boolean} selectable Initial value for selectable property.
    * @config {boolean} disabled Initial value for disabled property. If true 'disable' event fired.
    * @config {boolean} selected Initial value for selected property. If true 'select' event fired.
    * @constructor
    */
    init: function(config){
      // add selection object, if selection is not null
      if (this.selection && this.selection instanceof AbstractDataset == false)
        this.selection = new Selection(this.selection);

      // inherit
      AbstractNode.prototype.init.call(this, config);

      // synchronize node state according to config
      if (this.disabled)
        this.event_disable();

      if (this.selected)
      {
        this.selected = false;
        this.select(true);
      }
    },

   /**
    * Changes selection property of node.
    * @param {Basis.DOM.Wrapper.Selection} selection New selection value for node.
    * @return {boolean} Returns true if selection was changed.
    */
    setSelection: function(selection){
      if (this.selection == selection)
        return false;
        
      var oldSelection = this.selection;
      axis(this, AXIS_DESCENDANT, function(node){
        if (node.contextSelection == oldSelection)
        {
          if (node.selected)
          {
            if (oldSelection)
              oldSelection.remove([node]);
          }
          node.contextSelection = selection;
        }
      });
      this.selection = selection;
        
      return true;
    },
    
   /**
    * Returns true if node has it's own selection.
    * @return {boolean}
    */
    hasOwnSelection: function(){
      return !!this.selection;
    },

   /**
    * Makes node selected if possible.
    * @param {boolean} multiple
    * @return {boolean} Returns true if selected state has been changed.
    */
    select: function(multiple){
      var selected = this.selected;
      var selection = this.contextSelection;
      
      // here is no check for selected state, because parentNode.selection depends on it's 
      // mode may do some actions even with selected node
      if (selection)
      { 
        if (!multiple)
        {
          // check for selectable in non-multiple mode, because if node is non-selectable
          // selection will be cleared and this is not desired behaviour
          if (this.selectable)
            selection.set([this]);
        }
        else
        {
          if (selected)
            selection.remove([this]);
          else
            selection.add([this]);
        }
      }
      else
        if (!selected && this.selectable && !this.isDisabled())
        {
          this.selected = true;
          this.event_select();
        }

      return this.selected != selected;
    },

   /**
    * Makes node unselected.
    * @param {boolean} multiple
    * @return {boolean} Returns true if selected state has been changed.
    */
    unselect: function(){
      var selected = this.selected;

      if (selected)
      {
        var selection = this.contextSelection;
        if (selection)
          selection.remove([this]);
        else
        {
          this.selected = false;
          this.event_unselect();
        }
      }

      return this.selected != selected;
    },


   /**
    * Makes node enabled.
    */
    enable: function(){
      if (this.disabled)
      {
        this.disabled = false;
        this.event_enable();
      }
    },

   /**
    * Makes node disabled.
    */
    disable: function(){
      if (!this.disabled)
      {
        this.disabled = true;
        this.event_disable();
      }
    },

   /**
    * @return {boolean} Return true if node or one of it's ancestor nodes are disabled.
    */
    isDisabled: function(){
      return this.disabled 
             || (this.document && this.document.disabled)
             || !!DOM.findAncestor(this, getter('disabled'));
    },

   /**
    * @param {function()} func
    * @return {boolean}
    */
    match: function(func){
      if (typeof func != 'function')
      {
        if (this.matched)
        {
          if (this.underMatch_)
          {
            // restore init state
            this.underMatch_(this, true);
            this.underMatch_ = null;
          }
        }
        else
        {
          this.matched = true;
          this.event_match()
        }
      }
      else
      {
        if (func(this))
        {
          // match
          this.underMatch_ = func;
          if (!this.matched)
          {
            this.matched = true;
            this.event_match();
          }
        }
        else
        {
          // don't match
          this.underMatch_ = null;
          if (this.matched)
          {
            this.matched = false;
            this.event_unmatch();
          }
        }
      }
    },

   /**
    * Set match function for child nodes.
    * @param {function(node):bollean} func
    */
    setMatchFunction: function(func){
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.hasOwnSelection())
      {
        this.selection.destroy(); // how about shared selection?
        delete this.selection;
      }

      this.unselect();

      // inherit
      AbstractNode.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var Node = Class(InteractiveNode, DomMixin, {
    className: namespace + '.Node'
  });

 /**
  * @link ./demo/common/grouping.html
  * @class
  */
  var GroupingNode = Class(AbstractNode, DomMixin, {
    className: namespace + '.GroupingNode',

    map_: null,

    autoDestroyEmptyGroups: true,
    titleGetter: getter('info.title'),
    groupGetter: Function.$undef,

    childClass: PartitionNode,
    childFactory: function(config){
      return new this.childClass(complete(config, {
        titleGetter: this.titleGetter,
        autoDestroyIfEmpty: this.collection ? false : this.autoDestroyEmptyGroups
      }));
    },

    event_childNodesModified: function(node, delta){
      event.childNodesModified.call(this, node, delta);

      this.nullGroup.nextSibling = this.firstChild;

      if (delta.inserted && this.collection && this.nullGroup.first)
      {
        var parentNode = this.owner;
        var nodes = Array.from(this.nullGroup.nodes); // ??? Array.from?
        for (var i = nodes.length; i --> 0;)
          parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
      }
    },

    init: function(config){
      this.map_ = {};

      this.nullGroup = new PartitionNode({
        autoDestroyIfEmpty: false
      });

      var owner = this.owner;
      if (owner)
      {
        this.owner = null;
        this.setOwner(owner);
      }  

      AbstractNode.prototype.init.call(this, config);
    },

    getGroupNode: function(node){
      var groupRef = this.groupGetter(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

      if (!group && !this.collection)
      {
        group = this.appendChild(
          isDelegate
            ? { delegate: groupRef }
            : { info: {
                  id: groupRef,
                  title: groupRef
                }
              }
        );
      }

      return group || this.nullGroup;
    },

   /**
    * Set owner node for GroupingNode
    */
    setOwner: function(node){
      if (this.owner !== node)
      {
        if (this.owner)
          this.owner.setLocalGrouping(null, true);

        this.owner = node;
      }
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      newChild = DomMixin.insertBefore.call(this, newChild, refChild);

      if ('groupId_' in newChild == false)
      {
        newChild.groupId_ = newChild.delegate ? newChild.delegate.eventObjectId : newChild.info.id;
        this.map_[newChild.groupId_] = newChild;
      }

      if (newChild.first)
      {
        var owner = this.owner;
        var childNodes = owner.childNodes;

        var first = newChild.first;
        var last = newChild.last;

        var cursor;
        var insertArgs;
        var nextGroupFirst;
        var prevGroupLast;

        // search for prev group lastChild
        cursor = newChild;
        while (cursor = cursor.previousSibling)
        {
          if (prevGroupLast = cursor.last)
            break;
        }

        if (!prevGroupLast)
          prevGroupLast = this.nullGroup.last;

        // search for next group firstChild
        cursor = newChild;
        while (cursor = cursor.nextSibling)
        {
          if (nextGroupFirst = cursor.first)
            break;
        }

        if (first.previousSibling !== prevGroupLast || last.nextSibling !== nextGroupFirst)
        {
          // cut nodes from old position
          if (first.previousSibling)
            first.previousSibling.nextSibling = last.nextSibling;
          if (last.nextSibling)
            last.nextSibling.previousSibling = first.previousSibling;

          // remove group nodes from childNodes
          insertArgs = childNodes.splice(childNodes.indexOf(first), newChild.nodes.length);

          // insert nodes on new position and link edge nodes
          var pos = childNodes.indexOf(nextGroupFirst);
          insertArgs.unshift(pos != -1 ? pos : childNodes.length, 0);
          childNodes.splice.apply(childNodes, insertArgs);

          // firstChild/lastChild are present anyway
          first.previousSibling = prevGroupLast;
          last.nextSibling = nextGroupFirst;

          if (prevGroupLast)
            prevGroupLast.nextSibling = first;
          if (nextGroupFirst)
            nextGroupFirst.previousSibling = last;

          // update firstChild/lastChild of owner
          owner.firstChild = childNodes[0];
          owner.lastChild = childNodes[childNodes.length - 1];
        }
      }

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      DomMixin.removeChild.call(this, oldChild);

      delete this.map_[oldChild.groupId_];

      return oldChild;
    },

    clear: function(alive){
      DomMixin.clear.call(this);
      this.map_ = {};
    },

    destroy: function(){
      this.setOwner();

      AbstractNode.prototype.destroy.call(this);

      this.map_ = null;
    }
  });

  AbstractNode.prototype.localGroupingClass = GroupingNode;

 /**
  * @mixin
  */
  var TemplateMixin = function(super_){
    return {
     /**
      * Template for object.
      * @type {Basis.Html.Template}
      */
      template: new Template(
        '<div{element}/>'
      ),

     /**
      * Classes for template elements.
      * @type {object}
      */
      cssClassName: null,

     /**
      * @inheritDoc
      */
      event_select: function(){
        super_.event_select.call(this);

        classList(this.tmpl.selected || this.tmpl.content || this.element).add('selected');
        //  var element = this.tmpl.selectedElement || this.tmpl.content || this.tmpl.element;
        //  element.className += ' selected';

      },

     /**
      * @inheritDoc
      */
      event_unselect: function(){
        super_.event_unselect.call(this);

        classList(this.tmpl.selected || this.tmpl.content || this.element).remove('selected');
        //  var element = this.tmpl.selectedElement || this.tmpl.content || this.tmpl.element;
        //  element.className = element.className.replace(/(^|\s+)selected(\s+|$)/, '$2');
      },

     /**
      * @inheritDoc
      */
      event_disable:  function(){
        super_.event_disable.call(this);

        classList(this.tmpl.disabled || this.element).add('disabled');
      },

     /**
      * @inheritDoc
      */
      event_enable: function(){
        super_.event_enable.call(this);

        classList(this.tmpl.disabled || this.element).remove('disabled');
      },

     /**
      * @inheritDoc
      */
      event_match: function(){
        super_.event_match.call(this);

        DOM.display(this.element, true);
      },

     /**
      * @inheritDoc
      */
      event_unmatch: function(){
        super_.event_unmatch.call(this);

        DOM.display(this.element, false);
      },

     /**
      * @inheritDoc
      */
      init: function(config){

        // create dom fragment by template
        this.tmpl = {};
        if (this.template)
        {
          this.template.createInstance(this.tmpl, this);
          this.element = this.tmpl.element;

          if (this.tmpl.childNodesHere)
          {
            this.tmpl.childNodesElement = this.tmpl.childNodesHere.parentNode;
            this.tmpl.childNodesElement.insertPoint = this.tmpl.childNodesHere;
          }

          // insert content
          if (this.content)
            DOM.insert(this.tmpl.content || this.element, this.content);
        }
        else
          this.element = this.tmpl.element = DOM.createElement();

        this.childNodesElement = this.tmpl.childNodesElement || this.element;

        // inherit init
        super_.init.call(this, config);

        // update template
        if (this.id)
          this.element.id = this.id;

        var cssClassNames = this.cssClassName;
        if (cssClassNames)
        {
          if (typeof cssClassNames == 'string')
            cssClassNames = { element: cssClassNames };

          for (var alias in cssClassNames)
          {
            var node = this.tmpl[alias];
            if (node)
            {
              var nodeClassName = classList(node);
              String(cssClassNames[alias]).qw().forEach(nodeClassName.add, nodeClassName);
            }
          }
        }

        if (true) // this.template
        {
          var delta = {};
          for (var key in this.info)
            delta[key] = undefined;

          this.event_update(this, delta);
        }

        if (this.container)
          DOM.insert(this.container, this.element);
      },

     /**
      * Handler on template actions.
      * @param {string} actionName
      * @param {object} event
      */
      templateAction: function(actionName, event){
        // send action to document node
        //if (this.document && this.document !== this)
        //  this.document.templateAction(actionName, event, this);
      },

     /**
      * @inheritDoc
      */
      destroy: function(){
        super_.destroy.call(this);

        var element = this.element;
        if (element)
        {
          this.element = null;
          if (element.parentNode)
            element.parentNode.removeChild(element);
        }

        if (this.template)
          this.template.clearInstance(this.tmpl, this);

        this.tmpl = null;
        this.childNodesElement = null;
      }
    }
  };

 /**
  * @class
  */
  var TmplNode = Class(Node, TemplateMixin, {
    className: namespace + '.TmplNode'
  });

 /**
  * @class
  */
  var TmplPartitionNode = Class(PartitionNode, TemplateMixin, {
    className: namespace + '.TmplPartitionNode',

    titleGetter: getter('info.title'),

    template: new Template(
      '<div{element} class="Basis-PartitionNode">' + 
        '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
        '<div{content|childNodesElement} class="Basis-PartitionNode-Content"/>' + 
      '</div>'
    ),

    event_update: function(object, delta){
      PartitionNode.prototype.event_update.call(this, object, delta);

      if (this.tmpl.titleText)
        this.tmpl.titleText.nodeValue = String(this.titleGetter(this));
    }
  });

 /**
  * Template mixin for containers classes
  * @mixin
  */
  var ContainerTemplateMixin = function(super_){
    return {
      // methods
      insertBefore: function(newChild, refChild){
        // inherit
        var newChild = super_.insertBefore.call(this, newChild, refChild);

        var target = newChild.groupNode || this;
        var nextSibling = newChild.nextSibling;
        var insertPoint = nextSibling && (target == this || nextSibling.groupNode === target) ? nextSibling.element : null;
        var container = target.childNodesElement || target.element;

        container.insertBefore(newChild.element, insertPoint || container.insertPoint || null); // NOTE: null at the end for IE
          
        return newChild;
      },
      removeChild: function(oldChild){
        // inherit
        super_.removeChild.call(this, oldChild);

        // remove from dom
        var element = oldChild.element;
        var parent = element.parentNode;

        if (parent)
          parent.removeChild(element);

        return oldChild;
      },
      clear: function(alive){
        // if not alive mode node element will be removed on node destroy
        if (alive)
        {
          var node = this.firstChild;
          while (node)
          {
            var element = node.element;
            if (element.parentNode)
              element.parentNode.removeChild(element);

            node = node.nextSibling;
          }
        }

        // inherit
        super_.clear.call(this, alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.localGrouping || this;
        var container = target.childNodesElement || target.element;
        target.childNodesElement = domFragment;

        
        // call inherited method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        super_.setChildNodes.call(this, childNodes, keepAlive);

        // restore childNodesElement
        container.insertBefore(domFragment, container.insertPoint || null); // NOTE: null at the end for IE
        target.childNodesElement = container;
      }
    }
  };

 /**
  * @class
  */
  var TmplGroupingNode = Class(GroupingNode, ContainerTemplateMixin, {
    className: namespace + '.TmplGroupingNode',

   /**
    * @inheritDoc
    */
    childClass: TmplPartitionNode,

   /**
    * @inheritDoc
    */
    setOwner: function(owner){
      var oldOwner = this.owner;

      GroupingNode.prototype.setOwner.call(this, owner);

      if (this.owner != oldOwner)
      {
        if (this.owner)
          this.element = this.childNodesElement = (owner.tmpl && owner.tmpl.groupsElement) || owner.childNodesElement || owner.element;
        else
          this.element = this.childNodesElement = null;
      }
    }
  });

  TmplGroupingNode.prototype.localGroupingClass = TmplGroupingNode;

 /**
  * @class
  */
  var TmplContainer = Class(TmplNode, ContainerTemplateMixin, {
    className: namespace + '.TmplContainer',

    childClass: TmplNode,
    childFactory: function(config){
      return new this.childClass(config);
    },

    localGroupingClass: TmplGroupingNode
  });

 /**
  * @class
  */
  var Control = Class(TmplContainer, {
    className: namespace + '.Control',

   /**
    * Create selection by default with empty config.
    */
    selection: {},

   /**
    * @param {Object} config
    * @config {Object|boolean|Basis.DOM.Wrapper.Selection} selection
    * @constructor
    */
    init: function(config){
      // make document link to itself
      // NOTE: we make it before inherit because in other way
      //       child nodes (passed by config.childNodes) will be with no document
      this.document = this;

      // inherit
      TmplContainer.prototype.init.call(this, config);
                   
      // add to Basis.Cleaner
      Cleaner.add(this);
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      // selection destroy - clean selected nodes
      if (this.selection)
      {
        this.selection.destroy(); // how about shared selection?
        this.selection = null;
      }

      // inherit destroy, must be calling after inner objects destroyed
      TmplContainer.prototype.destroy.call(this);

      // remove from Cleaner
      Cleaner.remove(this);
    }
  });


  //
  // ChildNodesDataset
  //

  var CHILDNODESDATASET_HANDLER = {
    childNodesModified: function(node, delta){
      var newDelta = {};
      var node;
      var insertCount = 0;
      var deleteCount = 0;
      var inserted = delta.inserted;
      var deleted = delta.deleted;

      if (inserted && inserted.length)
      {
        newDelta.inserted = inserted;

        while (node = inserted[insertCount])
        {
          this.map_[node.eventObjectId] = node;
          insertCount++;
        }
      }

      if (deleted && deleted.length)
      {
        newDelta.deleted = deleted;

        while (node = deleted[deleteCount])
        {
          delete this.map_[node.eventObjectId];
          deleteCount++;
        }
      }

      if (insertCount || deleteCount)
        this.event_datasetChanged(this, newDelta);
    },
    destroy: function(){
      if (this.autoDestroy)
        this.destroy();
      else
        this.setSourceNode();
    }
  };

 /**
  * @class
  */
  var ChildNodesDataset = Class(AbstractDataset, {
    className: namespace + '.ChildNodesDataset',

    autoDestroy: true,
    sourceNode: null,

    event_sourceNodeChanged: createEvent('sourceNodeChanged') && function(object, oldSourceNode){
      event.sourceNodeChanged.call(this, object, oldSourceNode);

      if (!this.sourceNode && this.autoDestroy)
        this.destroy();
    },

    init: function(node, config){
      AbstractDataset.prototype.init.call(this, config);

      if (node)
        this.setSourceNode(node);
    },
    setSourceNode: function(node){
      if (node !== this.sourceNode)
      {
        var oldSourceNode = this.sourceNode;

        if (oldSourceNode)
        {
          this.sourceNode = null;
          oldSourceNode.removeHandler(CHILDNODESDATASET_HANDLER, this);
          CHILDNODESDATASET_HANDLER.childNodesModified.call(this, oldSourceNode, {
            deleted: oldSourceNode.childNodes
          });
        }

        if (node instanceof AbstractNode)
        {
          this.sourceNode = node;
          node.addHandler(CHILDNODESDATASET_HANDLER, this);
          CHILDNODESDATASET_HANDLER.childNodesModified.call(this, node, {
            inserted: node.childNodes
          });
        }

        this.event_sourceNodeChanged(this, oldSourceNode);
      }
    },
    destroy: function(){
      // drop source node if exists
      this.setSourceNode();

      // inherit
      AbstractDataset.prototype.destroy.call(this);
    }
  });


  //
  // SELECTION
  //

 /**
  * @link ./demo/selection/share.html
  * @link ./demo/selection/multiple.html
  * @link ./demo/selection/collection.html
  * @class
  */
  var Selection = Class(Dataset, {
    className: namespace + '.Selection',

   /**
    * Could selection store more than one node or not.
    * @type {boolean}
    * @readonly
    */
    multiple: false,

   /**
    * @inheritDoc
    */
    event_datasetChanged: function(dataset, delta){
      Dataset.prototype.event_datasetChanged.call(this, dataset, delta);

      if (delta.inserted)
      {
        for (var i = 0, node; node = delta.inserted[i]; i++)
        {
          if (!node.selected)
          {
            node.selected = true;
            node.event_select();
          }
        }
      }

      if (delta.deleted)
      {
        for (var i = 0, node; node = delta.deleted[i]; i++)
        {
          if (node.selected)
          {
            node.selected = false;
            node.event_unselect();
          }
        }
      }
    },

   /**
    * @inheritDoc
    */
    add: function(nodes){
      if (!this.multiple)
      {
        if (this.itemCount)
          return this.set(nodes);
        else
          nodes.splice(1);
      }

      var items = [];
      for (var i = 0, node; node = nodes[i]; i++)
      {
        if (node.contextSelection == this && node.selectable)
          items.push(node);
      }

      return Dataset.prototype.add.call(this, items);
    },

   /**
    * @inheritDoc
    */
    set: function(nodes){
      var items = [];
      for (var i = 0, node; node = nodes[i]; i++)
      {
        if (node.contextSelection == this && node.selectable)
          items.push(node);
      }

      if (!this.multiple)
        nodes.splice(1);

      return Dataset.prototype.set.call(this, items);
    }
  });

 /**
  * @func
  */
  var simpleTemplate = function(template){
    var refs = template.split(/\{((?:this|object)_[^}]+)\}/);
    var lines = [];
    for (var i = 1; i < refs.length; i += 2)
    {
      var name = refs[i].split('|')[0];
      lines.push('this.tmpl.' + name + '.nodeValue = ' + name.replace(/_/g, '.'));
    }
    
    return Function('tmpl', 'return ' + (function(super_){
      return {
        template: tmpl,
        event_update: function(object, delta){
          super_.event_update.call(this, object, delta);
          _code_();
        }
      }
    }).toString().replace('_code_()', lines.join(';\n')))(new Template(template));
  };

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    // non-template classes
    AbstractNode: AbstractNode,
    InteractiveNode: InteractiveNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,
    Control: Control,

    // template classes
    TmplGroupingNode: TmplGroupingNode,
    TmplPartitionNode: TmplPartitionNode,
    TmplNode: TmplNode,
    TmplContainer: TmplContainer,
    TmplControl: Control,

    simpleTemplate: simpleTemplate,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    Selection: Selection/*,

    // deprecated
    HtmlNode: TmplNode,
    HtmlGroupingNode: TmplGroupingNode,
    HtmlPartitionNode: TmplPartitionNode,
    HtmlContainer: TmplContainer,
    HtmlControl: Control*/
  });

})();
