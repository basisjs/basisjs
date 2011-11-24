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

basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.html');

!function(basis){

  'use strict';

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Non-visual DOM classes:
  *   {basis.dom.wrapper.AbstractNode}, {basis.dom.wrapper.InteractiveNode},
  *   {basis.dom.wrapper.Node}, {basis.dom.wrapper.PartitionNode},
  *   {basis.dom.wrapper.GroupingNode}
  * - Misc:
  *   {basis.dom.wrapper.Selection}
  *
  * @namespace basis.dom.wrapper
  */

  var namespace = 'basis.dom.wrapper';

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;
  var nsData = basis.data;

  var EventObject = basis.EventObject;
  var Subscription = nsData.Subscription;
  var DataObject = nsData.DataObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;

  var STATE = nsData.STATE;
  var AXIS_DESCENDANT = DOM.AXIS_DESCENDANT;
  var AXIS_DESCENDANT_OR_SELF = DOM.AXIS_DESCENDANT_OR_SELF;

  var getter = Function.getter;
  var extend = Object.extend;
  var complete = Object.complete;
  var axis = DOM.axis;
  var createEvent = basis.EventObject.createEvent;
  var event = basis.EventObject.event;

  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_DATASOURCE_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource control';

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
    'DATASOURCE',
    {
      dataSourceChanged: function(object, oldDataSource){
        this.remove(object, oldDataSource);
        this.add(object, object.dataSource);
      }
    },
    function(action, object){
      action(object, object.dataSource);
    }
  );

  //
  //  NODE
  //

  var NULL_SATELLITE_CONFIG = Class.ExtensibleProperty();
  var SATELLITE_DESTROY_HANDLER = {
    ownerChanged: function(sender, oldOwner){
      if (sender.owner !== this)
      {
        // ???
      }
    },
    destroy: function(object){
      DOM.replace(object.element, this);
    }
  };

  var SATELLITE_UPDATE = function(){
    // this -> {
    //   key: satelliteName,
    //   owner: owner,
    //   config: satelliteConfig
    // }
    var key = this.key;
    var config = this.config;
    var owner = this.owner;

    var exists = typeof config.existsIf != 'function' || config.existsIf(owner);
    var satellite = owner.satellite[key];

    if (exists)
    {
      var setDelegate = 'delegate' in config;
      var setDataSource = 'dataSource' in config;

      var delegate = typeof config.delegate == 'function' ? config.delegate(owner) : null;
      var dataSource = typeof config.dataSource == 'function' ? config.dataSource(owner) : null;

      if (satellite)
      {
        if (setDelegate)
          satellite.setDelegate(delegate);

        if (setDataSource)
          satellite.setDataSource(dataSource);
      }
      else
      {
        var replaceElement = owner.tmpl[config.replace || key];
        var instanceConfig = {
          owner: owner
        };

        if (setDelegate)
          instanceConfig.delegate = delegate;

        if (setDataSource)
          instanceConfig.dataSource = dataSource;

        if (config.config)
          Object.complete(instanceConfig, typeof config.config == 'function' ? config.config(owner) : config.config);

        satellite = new config.instanceOf(instanceConfig);
        //if (satellite.listen.owner)
        //  owner.addHandler(satellite.listen.owner, satellite);

        owner.satellite[key] = satellite;

        if (replaceElement && satellite instanceof basis.ui.Node && satellite.element)
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
        //if (satellite.listen.owner)
        //  owner.removeHandler(satellite.listen.owner, satellite);

        satellite.destroy();
        satellite.owner = null;
        delete owner.satellite[key];
      }
    }
  };

  var SATELLITE_OWNER_HOOK = Class.CustomExtendProperty(
    {
      update: true
    },
    function(result, extend){
      for (var key in extend)
        result[key] = extend[key] ? SATELLITE_UPDATE : null;    
    }
  );

 /**
  * @class
  */
  var AbstractNode = Class(DataObject, {
    className: namespace + '.AbstractNode',

    //
    // events
    //

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

        // re-insert to change position, group, sortingValue etc.
        parentNode.insertBefore(this, this.nextSibling);
      }
    },

    // new events

   /**
    * This is a general event for notification of childs changes to the document.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred. 
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {object} delta Delta of changes.
    * @event
    */
    event_childNodesModified: createEvent('childNodesModified', 'node', 'delta'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.Data.AbstractDataset} oldDataSource
    */
    event_dataSourceChanged: createEvent('dataSourceChanged', 'node', 'oldDataSource'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.GroupingNode} oldGroupingNode
    */
    event_localGroupingChanged: createEvent('localGroupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {function()} oldLocalSorting
    * @param {boolean} oldLocalSortingDesc
    */
    event_localSortingChanged: createEvent('localSortingChanged', 'node', 'oldLocalSorting', 'oldLocalSortingDesc'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_ownerChanged: createEvent('ownerChanged', 'node', 'oldOwner'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_satellitesChanged: createEvent('satellitesChanged', 'node', 'delta'),

    //
    // properties
    //

   /**
    * @inheritDoc
    */
    subscribeTo: DataObject.prototype.subscribeTo + Subscription.DATASOURCE,

   /**
    * @inheritDoc
    */
    listen: {
      owner: {
        destroy: function(){
          this.setOwner();
        }
      }
    },

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
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * Object that's manage childNodes updates.
    * @type {basis.Data.AbstractDataset}
    */
    dataSource: null,

   /**
    * Map dataSource members to child nodes.
    * @type {Object}
    * @private
    */
    colMap_: null,

   /**
    * @type {Boolean}
    */
    destroyDataSourceMember: true,

   /**
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    document: null,

   /**
    * The parent of this node. All nodes may have a parent. However, if a node
    * has just been created and not yet added to the tree, or if it has been
    * removed from the tree, this is null. 
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    parentNode: null,

   /**
    * The node immediately following this node. If there is no such node,
    * this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    nextSibling: null,

   /**
    * The node immediately preceding this node. If there is no such node,
    * this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    previousSibling: null,

   /**
    * The first child of this node. If there is no such node, this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    firstChild: null,

   /**
    * The last child of this node. If there is no such node, this returns null.
    * @type {basis.dom.wrapper.AbstractNode}
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
    * GroupingNode config
    * @see ./demo/common/grouping.html
    * @see ./demo/common/grouping_of_grouping.html
    * @type {basis.dom.wrapper.GroupingNode}
    */
    localGrouping: null,

   /**
    * Class for grouping control. Class should be inherited from {basis.dom.wrapper.GroupingNode}
    * @type {Class}
    */
    localGroupingClass: null,

   /**
    * Reference to group node in localGrouping
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    groupNode: null,

   /**
    * Hash of satellite object configs.
    * @type {Object}
    */
    satelliteConfig: NULL_SATELLITE_CONFIG,

   /**
    * Satellite objects storage.
    * @type {Object}
    */
    satellite: null,

   /**
    * Node owner. Generaly using by satellites and GroupingNode.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    owner: null,

    //
    // methods
    //

   /**
    * Process on init:
    *   - localGrouping
    *   - childNodes
    *   - dataSource
    *   - satelliteConfig
    *   - owner
    * @param {Object} config
    * @return {Object} Returns a config. 
    * @constructor
    */
    init: function(config){

      var dataSource = this.dataSource;
      var childNodes = this.childNodes;
      var localGrouping = this.localGrouping;

      if (dataSource)
        this.dataSource = null; // NOTE: reset dataSource before inherit -> prevent double subscription activation
                                // when this.active == true and dataSource is assigned

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

        // set dataSource
        if (dataSource)
        {
          this.dataSource = null;
          this.setDataSource(dataSource);
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

        if (dataSource)
          this.dataSource = null;
      }

      // process satellite
      if (!this.satellite)
        this.satellite = {};

      if (this.satelliteConfig !== NULL_SATELLITE_CONFIG)
      {
        //this.addHandler(SATELLITE_HANDLER);
        for (var key in this.satelliteConfig)
        {
          var config = this.satelliteConfig[key];

          if (Class.isClass(config))
            config = { instanceOf: config };

          if (typeof config == 'object')
          {
            var context = {
              key: key,
              owner: this,
              config: config
            };

            var hook = config.hook
              ? SATELLITE_OWNER_HOOK.__extend__(config.hook)
              : SATELLITE_OWNER_HOOK;

            for (var key in hook)
              if (hook[key] === SATELLITE_UPDATE)
              {
                this.addHandler(hook, context);
                break;
              }

            SATELLITE_UPDATE.call(context)
          }
        }
      }

      var owner = this.owner;
      if (owner)
      {
        this.owner = null;
        this.setOwner(owner);
      }
    },

   /**
    * Adds the node newChild to the end of the list of children of this node. If the newChild is already in the tree, it is first removed.
    * @param {basis.dom.wrapper.AbstractNode} newChild The node to add.
    * @return {basis.dom.wrapper.AbstractNode} The node added.
    */
    appendChild: function(newChild){
    },

   /**
    * Inserts the node newChild before the existing child node refChild. If refChild is null, insert newChild at the end of the list of children.
    * @param {basis.dom.wrapper.AbstractNode} newChild The node to insert.
    * @param {basis.dom.wrapper.AbstractNode} refChild The reference node, i.e., the node before which the new node must be inserted.
    * @return {basis.dom.wrapper.AbstractNode} The node being inserted.
    */
    insertBefore: function(newChild, refChild){
    },

   /**
    * Removes the child node indicated by oldChild from the list of children, and returns it.
    * @param {basis.dom.wrapper.AbstractNode} oldChild The node being removed.
    * @return {basis.dom.wrapper.AbstractNode} The node removed.
    */
    removeChild: function(oldChild){
    },

   /**
    * Replaces the child node oldChild with newChild in the list of children, and returns the oldChild node.
    * @param {basis.dom.wrapper.AbstractNode} newChild The new node to put in the child list.
    * @param {basis.dom.wrapper.AbstractNode} oldChild The node being replaced in the list.
    * @return {basis.dom.wrapper.AbstractNode} The node replaced.
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
    * @param {basis.Data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    *
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      if (this.owner !== owner)
      {
        var oldOwner = this.owner;

        if (oldOwner)
          oldOwner.removeHandler(this.listen.owner, this);

        if (this.owner = owner)
          owner.addHandler(this.listen.owner, this);

        this.event_ownerChanged(this, oldOwner);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This order of actions is better for perfomance: 
      // inherit destroy -> clear childNodes -> remove from parent
      // DON'T CHANGE WITH NO ANALIZE AND TESTS

      // inherit (fire destroy event & remove handlers)
      DataObject.prototype.destroy.call(this);

      // delete childs
      if (this.dataSource)
      {
        // drop dataSource
        this.setDataSource();
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

      // drop owner
      if (this.owner)
        this.setOwner();

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
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    nodes: null,

   /**
    * First item in nodes if exists.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    first: null,

   /**
    * Last item in nodes if exists.
    * @type {basis.dom.wrapper.AbstractNode}
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
    * @param {basis.dom.wrapper.AbstractNode} newNode
    * @param {basis.dom.wrapper.AbstractNode} refNode
    */
    insert: function(newNode, refNode){
      var nodes = this.nodes;
      var pos = refNode ? nodes.indexOf(refNode) : nodes.length;

      if (pos == -1)
        pos = nodes.length;

      nodes.splice(pos, 0, newNode);
      this.first = nodes[0] || null;
      this.last = nodes[nodes.length - 1] || null;
      newNode.groupNode = this;

      this.event_childNodesModified(this, { inserted: [newNode] });
    },

   /**
    * Works like removeChild, but don't update oldNode references.
    * @param {basis.dom.wrapper.AbstractNode} oldNode
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

  var DOMMIXIN_DATASOURCE_HANDLER = {
    datasetChanged: function(dataset, delta){

      var newDelta = {};
      var deleted = [];

      // WARN: it is better process deleted nodes before inserted, because if all child nodes
      // are replaced for new one, we able to use fast clear and setChildNodes methods

      // delete nodes
      if (delta.deleted)
      {
        newDelta.deleted = deleted;
        if (this.childNodes.length == delta.deleted.length)
        {
          // copy childNodes to deleted
          deleted.push.apply(deleted, this.childNodes);

          // optimization: if all old nodes deleted -> clear childNodes
          var tmp = this.dataSource;
          this.dataSource = null;
          this.clear(true);   // keep alive, event fires
          this.dataSource = tmp;
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
          var newChild = createChildByFactory(this, {
            cascadeDestroy: false,     // NOTE: it's important set cascadeDestroy to false, otherwise
                                       // there will be two attempts to destroy node - 1st on delegate
                                       // destroy, 2nd on object removal from dataSource
            //canHaveDelegate: false,  // NOTE: we can't set canHaveDelegate in config, because it
                                       // prevents delegate assignment
            delegate: item
          });

          newChild.canHaveDelegate = false; // prevent delegate override

          // insert
          this.colMap_[item.eventObjectId] = newChild;
          newDelta.inserted.push(newChild);

          // optimization: insert child only if node has at least one child, otherwise setChildNodes method
          // will be used which is much faster (reduce event count, bulk insertion)
          if (this.firstChild)
            this.insertBefore(newChild);
        }
      }

      if (!this.firstChild)
        // use fast child insert method if possible (it also fire childNodesModified event)
        this.setChildNodes(newDelta.inserted);
      else
        this.event_childNodesModified(this, newDelta);

      // destroy removed items
      if (this.destroyDataSourceMember && deleted.length)
      {
        for (var i = 0, item; item = deleted[i]; i++)
          item.destroy();
      }
    },
    destroy: function(object){
      //this.clear();
      if (this.dataSource === object)
        this.setDataSource();
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

    throw (EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.constructor && child.constructor.className) + ')');
  }

 /**
  * @mixin
  */
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
    *   // example code with no childFactory
    *   function createNode(config){
    *     return new basis.dom.wrapper.Node(config);
    *   }
    *   var node = new basis.dom.wrapper.Node();
    *   node.appendChild(createNode({ .. config .. }));
    *
    *   // solution with childFactory
    *   var node = new basis.dom.wrapper.Node({
    *     childFactory: function(config){
    *       return new basis.dom.wrapper.Node(config);
    *     }
    *   });
    *   node.appendChild({ .. config .. });
    * @type {function():object}
    */
    childFactory: null,

   /**
    * @inheritDoc
    */
    listen: {
      dataSource: DOMMIXIN_DATASOURCE_HANDLER
    },

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

      // check for dataSource
      if (this.dataSource && !this.dataSource.has(newChild.delegate))
        throw EXCEPTION_DATASOURCE_CONFLICT;

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
        var cursor;
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
          if (group.last)
          {
            // fast way to find refChild via current group lastChild (if exists)
            refChild = group.last.nextSibling;
          }
          else
          {
            // search for refChild as first firstChild of next sibling groups (groups might be empty)
            cursor = group;
            refChild = null;
            while (cursor = cursor.nextSibling)
              if (refChild = cursor.first)
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
            if (newChildValue === newChild.localSorting)
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
          newChild.sortingValue = newChildValue; // change sortingValue AFTER search

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

        if (pos == -1)
          childNodes.remove(newChild);
        else
        {
          var oldPos = childNodes.indexOf(newChild);
          childNodes.splice(oldPos, 1);
          if (oldPos < pos)
            pos--;
        }

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
      if (currentNewChildGroup != group)
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

        // insert newChild into childNodes
        childNodes.push(newChild);

        // create fake refChild, it helps with references updates
        refChild = { 
          previousSibling: this.lastChild
        };

        // update lastChild
        this.lastChild = newChild;
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
        if (!this.dataSource)
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

      if (this.dataSource && this.dataSource.has(oldChild))
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // update this
      var pos = this.childNodes.indexOf(oldChild);
      this.childNodes.splice(pos, 1);
        
      // update oldChild and this.lastChild & this.firstChild
      oldChild.parentNode = null;

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

      //
      // update document
      //
      if (oldChild.document === this.document)
      {
        axis(oldChild, AXIS_DESCENDANT_OR_SELF).forEach(function(node){
          if (node.document == this.document)
            node.document = null;
        }, this);
      }

      //
      // update selection
      //
      if (oldChild.contextSelection)
      {
        var contextSelection = oldChild.contextSelection;
        var cursor = oldChild;
        var unselect = [];
        while (cursor)  // cursor will be null at the end, because oldChild.parentNode == null
        {
          if (cursor.contextSelection === contextSelection)
          {
            if (cursor.selected)
              unselect.push(cursor);
            cursor.contextSelection = null;
          }

          if (!cursor.selection && cursor.firstChild)
            cursor = cursor.firstChild;
          else
          {
            if (cursor.nextSibling)
              cursor = cursor.nextSibling;
            else
            {
              while (cursor = cursor.parentNode)
              {
                if (cursor.nextSibling)
                {
                  cursor = cursor.nextSibling;
                  break;
                }
              }
            }
          }
        }

        contextSelection.remove(unselect);
      }

      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch event
      if (!this.dataSource)
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
      if (this.dataSource)
        throw EXCEPTION_DATASOURCE_CONFLICT;

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

      // drop dataSource
      if (this.dataSource)
      {
        this.setDataSource(); // it'll call clear again, but with no this.dataSource
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
        //this.localGrouping.clear();
        var cn = this.localGrouping.childNodes;
        for (var i = cn.length - 1, group; group = cn[i]; i--)
          group.clear();
      }
    },

   /**
    * @params {Array.<Object>} childNodes
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.dataSource)
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
    setDataSource: function(dataSource){
      if (!dataSource || !this.canHaveChildren || dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;

        // detach
        if (oldDataSource)
        {
          this.dataSource = null;
          this.colMap_ = null;

          oldDataSource.removeHandler(this.listen.dataSource, this);

          if (oldDataSource.itemCount)
            this.clear();
        }

        // TODO: switch off localSorting & localGrouping

        // attach
        if (dataSource)
        {
          this.dataSource = dataSource;
          this.colMap_ = {};

          dataSource.addHandler(this.listen.dataSource, this);

          if (dataSource.itemCount)
            this.listen.dataSource.datasetChanged.call(this, dataSource, {
              inserted: dataSource.getItems()
            });
        }

        // TODO: restore localSorting & localGrouping, fast node reorder

        this.event_dataSourceChanged(this, oldDataSource);
      }
    },

   /**
    * @inheritDoc
    */
    setLocalGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
        grouping = {
          groupGetter: getter(grouping)
        };

      if (grouping instanceof GroupingNode == false)
      {
        grouping = grouping != null && typeof grouping == 'object'
          ? new this.localGroupingClass(Object.complete({
              //owner: this
            }, grouping))
          : null;
      }

      if (this.localGrouping !== grouping)
      {
        var oldGroupingNode = this.localGrouping;
        var order;

        if (this.localGrouping)
        {
          if (!grouping)
          {
            //NOTE: it's important to clear locaGrouping before calling fastChildNodesOrder
            //because it sorts nodes in according to localGrouping
            this.localGrouping = null;

            if (this.firstChild)
            {
              order = this.localSorting
                        ? sortChildNodes(this)
                        : this.childNodes;

              for (var i = order.length; i --> 0;)
                order[i].groupNode = null;

              fastChildNodesOrder(this, order);
            }
          }

          oldGroupingNode.setOwner();
        }

        if (grouping)
        {
          // NOTE: it important set localGrouping before set owner for grouping,
          // because grouping will try set localGrouping property on owner change
          // for it's new owner and it fall in recursion
          this.localGrouping = grouping;
          grouping.setOwner(this);

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
        var oldLocalSorting = this.localSorting;
        var oldLocalSortingDesc = this.localSortingDesc;

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

        this.event_localSortingChanged(this, oldLocalSorting, oldLocalSortingDesc);
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
    event_enable: createEvent('enable', 'node'),

   /**
    * Occurs after disabled property has been set to true.
    * @event
    */
    event_disable: createEvent('disable', 'node'),

   /**
    * Occurs after selected property has been set to true.
    * @event
    */
    event_select: createEvent('select', 'node'),

   /**
    * Occurs after selected property has been set to false.
    * @event
    */
    event_unselect: createEvent('unselect', 'node'),

   /**
    * Occurs after matched property has been set to true.
    * @event
    */
    event_match: createEvent('match', 'node'),

   /**
    * Occurs after matched property has been set to false.
    * @event
    */
    event_unmatch: createEvent('unmatch', 'node'),

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
    * @type {basis.dom.wrapper.Selection}
    */
    selection: null,

   /**
    * @type {basis.dom.wrapper.Selection}
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
    * @config {basis.dom.wrapper.Selection} selection Set Selection control for child nodes.
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
        this.event_disable(this);

      if (this.selected)
      {
        this.selected = false;
        this.select(true);
      }
    },

   /**
    * Changes selection property of node.
    * @param {basis.dom.wrapper.Selection} selection New selection value for node.
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
          this.event_select(this);
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
          this.event_unselect(this);
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
        this.event_enable(this);
      }
    },

   /**
    * Makes node disabled.
    */
    disable: function(){
      if (!this.disabled)
      {
        this.disabled = true;
        this.event_disable(this);
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
          this.event_match(this)
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
            this.event_match(this);
          }
        }
        else
        {
          // don't match
          this.underMatch_ = null;
          if (this.matched)
          {
            this.matched = false;
            this.event_unmatch(this);
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
  * @see ./demo/common/grouping.html
  * @see ./demo/common/grouping_of_grouping.html
  * @class
  */
  var GroupingNode = Class(AbstractNode, DomMixin, {
    className: namespace + '.GroupingNode',

    // events

    event_childNodesModified: function(node, delta){
      event.childNodesModified.call(this, node, delta);

      this.nullGroup.nextSibling = this.firstChild;

      if (delta.inserted && this.dataSource && this.nullGroup.first)
      {
        var parentNode = this.owner;
        var nodes = Array.from(this.nullGroup.nodes); // ??? Array.from?
        for (var i = nodes.length; i --> 0;)
          parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
      }
    },

    event_ownerChanged: function(node, oldOwner){
      // detach from old owner, if it still connected
      if (oldOwner && oldOwner.localGrouping === this)
        oldOwner.setLocalGrouping(null, true);

      // attach to new owner, if any and doesn't connected
      if (this.owner && this.owner.localGrouping !== this)
        this.owner.setLocalGrouping(this);

      event.ownerChanged.call(this, node, oldOwner);

      if (!this.owner && this.autoDestroyWithNoOwner)
        this.destroy();
    },

    // properties

    map_: null,

    autoDestroyWithNoOwner: true,
    autoDestroyEmptyGroups: true,
    titleGetter: getter('data.title'),
    groupGetter: Function.$undef,

    childClass: PartitionNode,
    childFactory: function(config){
      return new this.childClass(complete(config, {
        titleGetter: this.titleGetter,
        autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      }));
    },

    // methods

    init: function(config){
      this.map_ = {};

      this.nullGroup = new PartitionNode({
        autoDestroyIfEmpty: false
      });

      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @return {basis.dom.wrapper.PartitionNode}
    */
    getGroupNode: function(node){
      var groupRef = this.groupGetter(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

      if (!group && !this.dataSource)
      {
        group = this.appendChild(
          isDelegate
            ? { delegate: groupRef }
            : { data: {
                  id: groupRef,
                  title: groupRef
                }
              }
        );
      }

      return group || this.nullGroup;
    },

   /**
    * @inheritDoc
    */
    insertBefore: function(newChild, refChild){
      newChild = DomMixin.insertBefore.call(this, newChild, refChild);

      if ('groupId_' in newChild == false)
      {
        newChild.groupId_ = newChild.delegate ? newChild.delegate.eventObjectId : newChild.data.id;
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


  //
  // ChildNodesDataset
  //

  var CHILDNODESDATASET_HANDLER = {
    childNodesModified: function(node, delta){
      var memberMap = this.memberMap_;
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
          memberMap[node.eventObjectId] = node;
          insertCount++;
        }
      }

      if (deleted && deleted.length)
      {
        newDelta.deleted = deleted;

        while (node = deleted[deleteCount])
        {
          delete memberMap[node.eventObjectId];
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

   /**
    * @inheritDoc
    */
    listen: {
      sourceNode: CHILDNODESDATASET_HANDLER
    },

    event_sourceNodeChanged: createEvent('sourceNodeChanged') && function(object, oldSourceNode){
      event.sourceNodeChanged.call(this, object, oldSourceNode);

      if (!this.sourceNode && this.autoDestroy)
        this.destroy();
    },

   /**
    * use extend constructor
    */
    extendConstructor_: false,

   /**
    * @constructor
    */
    init: function(node, config){
      AbstractDataset.prototype.init.call(this, config);

      if (node)
        this.setSourceNode(node);
    },

   /**
    * Set source node for dataset.
    * @param {basis.dom.wrapper.AbstractNode} node
    */
    setSourceNode: function(node){
      if (node instanceof AbstractNode == false)
        node = null;

      if (node !== this.sourceNode)
      {
        var oldSourceNode = this.sourceNode;

        if (oldSourceNode)
        {
          oldSourceNode.removeHandler(this.listen.sourceNode, this);
          this.listen.sourceNode.childNodesModified.call(this, oldSourceNode, {
            deleted: oldSourceNode.childNodes
          });
        }

        if (node)
        {
          node.addHandler(this.listen.sourceNode, this);
          this.listen.sourceNode.childNodesModified.call(this, node, {
            inserted: node.childNodes
          });
        }

        this.sourceNode = node;

        this.event_sourceNodeChanged(this, oldSourceNode);
      }
    },

   /**
    * @destructor
    */
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
  * @see ./demo/common/selection_share.html
  * @see ./demo/common/selection_multiple.html
  * @see ./demo/common/selection_dataSource.html
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

  function simpleTemplate(){
    return basis.ui.apply(this, arguments);
  }

  //
  // export names
  //

  basis.namespace(namespace, simpleTemplate).extend({
    // non-template classes
    AbstractNode: AbstractNode,
    InteractiveNode: InteractiveNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,

    simpleTemplate: simpleTemplate,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    Selection: Selection
  });

}(basis);
