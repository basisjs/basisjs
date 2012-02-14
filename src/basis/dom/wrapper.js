/**
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.event');
basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.html');

(function(basis){

  'use strict';

 /**
  * This namespace contains base classes and functions for components of Basis framework.
  *
  * Namespace overview:
  * - Non-visual DOM classes:
  *   {basis.dom.wrapper.AbstractNode},
  *   {basis.dom.wrapper.Node}, {basis.dom.wrapper.PartitionNode},
  *   {basis.dom.wrapper.GroupingNode}
  * - Datasets:
  *   {basis.dom.wrapper.ChildNodesDataset}, {basis.dom.wrapper.Selection}
  *
  * @namespace basis.dom.wrapper
  */

  var namespace = 'basis.dom.wrapper';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var nsData = basis.data;

  var createEvent = basis.event.create;
  var events = basis.event.events;
  var LISTEN = basis.event.LISTEN;

  var SUBSCRIPTION = nsData.SUBSCRIPTION;
  var DataObject = nsData.DataObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;

  var STATE = nsData.STATE;

  var getter = Function.getter;
  var nullGetter = Function.nullGetter;
  var $undef = Function.$undef;
  var complete = Object.complete;
  var oneFunctionProperty = Class.oneFunctionProperty;


  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_DATASOURCE_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource control';
  /** @const */ var EXCEPTION_PARENTNODE_OWNER_CONFLICT = namespace + ': Node can\'t has owner and parentNode';

  var DELEGATE = {
    NONE: 'none',
    PARENT: 'parent',
    OWNER: 'owner'
  };

  function sortingSearch(node){
    return node.sortingValue || 0; // it's important return a zero when sortingValue is undefined,
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
      obj.sortingDesc
        ? sortDesc
        : sortAsc
    );
  }


  function updateNodeContextSelection(root, oldSelection, newSelection, rootUpdate, ignoreRootSelection){
    // exit if no changes
    if (oldSelection === newSelection)
      return;

    // main part
    var nextNode;
    var cursor = root;
    var selected = [];

    // update root context selection if necessary
    if (rootUpdate)
    {
      root.contextSelection = newSelection;
      if (root.selected)
        selected.push(root);
    }

    while (cursor)
    {
      // go into deep
      // if node has selection and node is not root, don't go into deep
      nextNode = !cursor.selection || (ignoreRootSelection && cursor === root)
        ? cursor.firstChild
        : null;

      if (nextNode && nextNode.contextSelection !== oldSelection)
        throw 'Try change wrong context selection';

      while (!nextNode)
      {
        // stop traversal if cursor on root again
        if (cursor === root)
        {
          // remove selected nodes from old selection, or add to new one
          if (selected.length)
          {
            if (oldSelection)
              oldSelection.remove(selected);

            if (newSelection)
              newSelection.add(selected);
          }

          return;
        }

        // go to next sibling
        nextNode = cursor.nextSibling;

        // if no sibling, going up
        if (!nextNode)
          cursor = cursor.parentNode;
      }

      // update cursor
      cursor = nextNode;

      // store selected nodes
      if (cursor.selected)
        selected.push(cursor);

      // change context selection
      cursor.contextSelection = newSelection;
    }
  }


  //
  // registrate new subscription types
  //

  SUBSCRIPTION.add(
    'OWNER',
    {
      ownerChanged: function(object, oldOwner){
        this.remove(object, oldOwner);
        this.add(object, object.owner);
      }
    },
    function(action, object){
      action(object, object.owner);
    }
  );

  SUBSCRIPTION.add(
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
  // AbstractNode
  //

  // default satellite config
  var NULL_SATELLITE_CONFIG = Class.customExtendProperty(
    {},
    function(result, extend){
      for (var key in extend)
      {
        var config = extend[key];

        if (Class.isClass(config))
          config = {
            instanceOf: config
          };

        if (config && typeof config == 'object')
        {
          var hookRequired = false;
          var contextConfig = {
            instanceOf: config.instanceOf
          };
          var context = {
            key: key,
            config: contextConfig
          };

          if (typeof config.config)
            contextConfig.config = config.config;

          if (typeof config.existsIf == 'function')
            hookRequired = contextConfig.existsIf = config.existsIf;

          if (typeof config.delegate == 'function')
            hookRequired = contextConfig.delegate = config.delegate;

          if (typeof config.dataSource == 'function')
            hookRequired = contextConfig.dataSource = config.dataSource;

          if (hookRequired)
          {
            var hook = config.hook
              ? SATELLITE_OWNER_HOOK.__extend__(config.hook)
              : SATELLITE_OWNER_HOOK;

            for (var hookEvent in hook)
              if (hook[hookEvent] === SATELLITE_UPDATE)
              {
                context.hook = hook;
                break;
              }
          }

          result[key] = context;
        }
        else
          result[key] = null;
      }
    }
  );

  var SATELLITE_UPDATE = function(){
    // this -> {
    //   owner: owner,
    //   context: { 
    //     key: satelliteName,
    //     config: satelliteConfig
    //   }
    // }
    var owner = this.owner;
    var key = this.context.key;
    var config = this.context.config;

    var exists = !config.existsIf || config.existsIf(owner);
    var satellite = owner.satellite[key];

    if (exists)
    {
      if (satellite)
      {
        if (config.delegate)
          satellite.setDelegate(config.delegate(owner));

        if (config.dataSource)
          satellite.setDataSource(config.dataSource(owner));
      }
      else
      {
        var satelliteConfig = (
          typeof config.config == 'function'
            ? config.config(owner)
            : config.config
        ) || {};

        satelliteConfig.owner = owner;

        if (config.delegate)
          satelliteConfig.delegate = config.delegate(owner);

        if (config.dataSource)
          satelliteConfig.dataSource = config.dataSource(owner);

        satellite = new config.instanceOf(satelliteConfig);

        owner.satellite[key] = satellite;
        owner.event_satelliteChanged(this, key, null);

        if (owner.listen.satellite)
          satellite.addHandler(owner.listen.satellite, owner);
      }
    }
    else
    {
      if (satellite)
      {
        delete owner.satellite[key];

        owner.event_satelliteChanged(owner, key, satellite);

        satellite.destroy();
      }
    }
  };

  // default satellite hooks
  var SATELLITE_OWNER_HOOK = oneFunctionProperty(
    SATELLITE_UPDATE,
    {
      update: true
    }
  );


  //
  // reg new type of listen
  //

  LISTEN.add('owner', 'ownerChanged');
  LISTEN.add('dataSource', 'dataSourceChanged');


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
          this.match(parentNode.matchFunction);

        // re-insert to change position, group, sortingValue etc.
        parentNode.insertBefore(this, this.nextSibling);
      }
    },

    // new events

   /**
    * This is a general event for notification of childs changes to the parent node.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred. 
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {object} delta Delta of changes.
    * @event
    */
    event_childNodesModified: createEvent('childNodesModified', 'node', 'delta') && function(node, delta){
      events.childNodesModified.call(this, node, delta);

      var listen = this.listen.childNode;
      var array;
      if (listen)
      {
        if (array = delta.inserted)
          for (var i = 0, child; child = array[i]; i++)
            child.addHandler(listen, this);

        if (array = delta.deleted)
          for (var i = 0, child; child = array[i]; i++)
            child.removeHandler(listen, this);
      }
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.data.AbstractDataset} oldDataSource
    */
    event_dataSourceChanged: createEvent('dataSourceChanged', 'node', 'oldDataSource'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.GroupingNode} oldGroupingNode
    */
    event_groupingChanged: createEvent('groupingChanged', 'node', 'oldGroupingNode'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {function()} oldSorting
    * @param {boolean} oldSortingDesc
    */
    event_sortingChanged: createEvent('sortingChanged', 'node', 'oldSorting', 'oldSortingDesc'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    event_ownerChanged: createEvent('ownerChanged', 'node', 'oldOwner'),

   /**
    * @param {basis.dom.wrapper.AbstractNode} node Initiator of event
    * @param {string} key
    * @param {basis.dom.wrapper.AbstractNode} oldSattelite Old satellite for key
    */
    event_satelliteChanged: createEvent('satelliteChanged', 'node', 'key', 'oldSattelite'),

    //
    // properties
    //

   /**
    * @inheritDoc
    */
    subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASOURCE,

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
    * Flag determines object behaviour to delegate some related object
    * @type {basis.dom.wrapper.DELEGATE}
    */
    autoDelegate: DELEGATE.NONE,

   /**
    * @type {string}
    * @readonly
    */
    nodeType: 'DOMWrapperNode',

   /**
    * A list that contains all children of this node. If there are no children,
    * this is a list containing no nodes.
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * All child nodes must be instances of childClass.
    * @type {Class}
    */
    childClass: AbstractNode,

   /**
    * Object that's manage childNodes updates.
    * @type {basis.data.AbstractDataset}
    */
    dataSource: null,

   /**
    * Map dataSource members to child nodes.
    * @type {Object}
    * @private
    */
    dataSourceMap_: null,

   /**
    * @type {Boolean}
    */
    destroyDataSourceMember: true,

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
    * @type {function(node)}
    */
    sorting: nullGetter,

   /**
    * Sorting direction
    * @type {boolean}
    */
    sortingDesc: false,

   /**
    * GroupingNode config
    * @see ./demo/common/grouping.html
    * @see ./demo/common/grouping_of_grouping.html
    * @type {basis.dom.wrapper.GroupingNode}
    */
    grouping: null,

   /**
    * Class for grouping control. Class should be inherited from {basis.dom.wrapper.GroupingNode}
    * @type {Class}
    */
    groupingClass: null,

   /**
    * Reference to group node in grouping
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
    *   - grouping
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
      var grouping = this.grouping;

      ;;;if (('autoDelegateParent' in this) && typeof console != 'undefined') console.warn('autoDelegateParent property is deprecate. Use autoDelegate instead');

      if (dataSource)
        this.dataSource = null; // NOTE: reset dataSource before inherit -> prevent double subscription activation
                                // when this.active == true and dataSource is assigned

      // inherit
      DataObject.prototype.init.call(this, config);

      if (grouping)
      {
        this.grouping = null;
        this.setGrouping(grouping);
      }

      // init properties
      if (this.childClass)
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
      else
      {
        var satelliteListen = this.listen.satellite;
        for (var key in this.satellite)
        {
          var satellite = this.satellite[key];

          satellite.setOwner(this);
          this.event_satelliteChanged(this, key, null);

          if (satelliteListen)
            satellite.addHandler(satelliteListen, this);
        }  
      }

      if (this.satelliteConfig !== NULL_SATELLITE_CONFIG)
      {
        for (var key in this.satelliteConfig)
        {
          var satelliteConfig = this.satelliteConfig[key];
          if (satelliteConfig && typeof satelliteConfig == 'object')
          {
            var context = {
              context: satelliteConfig,
              owner: this
            };

            if (satelliteConfig.hook)
              this.addHandler(satelliteConfig.hook, context);

            SATELLITE_UPDATE.call(context);
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
    setChildNodes: function(){
    },

   /**
    * @param {Object|function()|string} grouping
    * @param {boolean} alive Keep grouping node alive after unlink
    */
    setGrouping: function(grouping, alive){
    },

   /**
    * @param {function()|string} sorting
    * @param {boolean} desc
    */
    setSorting: function(sorting, desc){
    },

   /**
    * @param {basis.data.AbstractDataset} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} owner
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      //if (owner && this.parentNode)
      //  throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      var oldOwner = this.owner;
      if (oldOwner !== owner)
      {
        this.owner = owner;

        this.event_ownerChanged(this, oldOwner);

        if (this.autoDelegate == DELEGATE.OWNER)
          this.setDelegate(owner);
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This order of actions is better for perfomance: 
      // inherit destroy -> clear childNodes -> remove from parent
      // DON'T CHANGE ORDER WITH NO ANALIZE AND TESTS

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
      if (this.grouping)
      {
        this.grouping.setOwner();
        this.grouping = null;
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
          satellite.owner = null;  // should we drop owner?
          satellite.destroy();
        }
        this.satellite = null;
      }

      // remove pointers
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
      var pos = refNode ? nodes.indexOf(refNode) : -1;

      if (pos == -1)
      {
        nodes.push(newNode)
        this.last = newNode;
      }
      else
        nodes.splice(pos, 0, newNode);

      this.first = nodes[0];

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
    datasetChanged: function(dataSource, delta){
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
          deleted = Array.from(this.childNodes);

          // optimization: if all old nodes deleted -> clear childNodes
          var tmp = this.dataSource;
          this.dataSource = null;
          this.clear(true);   // keep alive, event fires
          this.dataSource = tmp;
          this.dataSourceMap_ = {};
        }
        else
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var delegateId = item.eventObjectId;
            var oldChild = this.dataSourceMap_[delegateId];

            delete this.dataSourceMap_[delegateId];
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
          this.dataSourceMap_[item.eventObjectId] = newChild;
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
    destroy: function(dataSource){
      if (this.dataSource === dataSource)
        this.setDataSource();
    }
  };

  function fastChildNodesOrder(node, order){
    var lastIndex = order.length - 1;
    node.childNodes = order;
    node.firstChild = order[0] || null;
    node.lastChild = order[lastIndex] || null;

    //DOM.insert(this, order);
    for (var orderNode, i = lastIndex; orderNode = order[i]; i--)
    {
      orderNode.nextSibling = order[i + 1] || null;
      orderNode.previousSibling = order[i - 1] || null;
      node.insertBefore(orderNode, orderNode.nextSibling);
    }
  }

  function fastChildNodesGroupOrder(node, order){
    for (var i = 0, child; child = order[i]; i++)
      child.groupNode.nodes.push(child);

    order.length = 0;
    for (var group = node.grouping.nullGroup; group; group = group.nextSibling)
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
    var child;

    if (typeof node.childFactory == 'function')
    {
      child = node.childFactory(config);

      if (child instanceof node.childClass)
        return child;
    }

    if (!child)
      throw EXCEPTION_NULL_CHILD;

    ;;;if (typeof console != 'undefined') console.warn(EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.constructor && child.constructor.className) + ')');
    throw EXCEPTION_BAD_CHILD_CLASS;
  }

 /**
  * @mixin
  */
  var DomMixin = {
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
      if (!this.childClass)
        throw EXCEPTION_CANT_INSERT;

      if (newChild.firstChild)
      {
        // newChild can't be ancestor of current node
        var cursor = this;
        while (cursor = cursor.parentNode){
          if (cursor === newChild)
            throw EXCEPTION_CANT_INSERT;
        }
      }

      var isChildClassInstance = newChild && newChild instanceof this.childClass;

      // check for dataSource
      if (this.dataSource)
      {
        if (!isChildClassInstance || this.dataSourceMap_[newChild.delegate.eventObjectId] !== newChild)
          throw EXCEPTION_DATASOURCE_CONFLICT;
      }

      // construct new childClass instance if newChild is not instance of childClass
      if (!isChildClassInstance)
        newChild = createChildByFactory(this, newChild instanceof DataObject ? { delegate: newChild } : newChild);

      //if (newChild.owner)
      //  throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      // search for insert point
      var isInside = newChild.parentNode === this;
      var currentNewChildGroup = newChild.groupNode;
      var grouping = this.grouping;
      var sorting = this.sorting;
      var sortingDesc;
      var childNodes = this.childNodes;
      var newChildValue;
      var groupNodes;
      var group = null;
      var pos = -1;
      var correctSortPos = false;
      var nextSibling;
      var prevSibling;

      if (isInside)
      {
        nextSibling = newChild.nextSibling;
        prevSibling = newChild.previousSibling;
      }

      if (sorting !== nullGetter)
      {
        // if sorting is using - refChild is ignore
        refChild = null; // ignore
        sortingDesc = this.sortingDesc;
        newChildValue = sorting(newChild) || 0;

        // some optimizations if node had already inside current node
        if (isInside)
        {
          if (newChildValue === newChild.sortingValue)
          {
            correctSortPos = true;
          }
          else
          {
            if (
                (!nextSibling || (sortingDesc ? nextSibling.sortingValue <= newChildValue : nextSibling.sortingValue >= newChildValue))
                &&
                (!prevSibling || (sortingDesc ? prevSibling.sortingValue >= newChildValue : prevSibling.sortingValue <= newChildValue))
               )
            {
              newChild.sortingValue = newChildValue;
              correctSortPos = true;
            }
          }
        }
      }

      if (grouping)
      {
        var cursor;
        group = grouping.getGroupNode(newChild, true);
        groupNodes = group.nodes;

        // optimization: test node position, possible it on right place
        if (currentNewChildGroup === group)
          if (correctSortPos || (isInside && nextSibling === refChild))
            return newChild;

        // calculate newChild position
        if (sorting !== nullGetter)
        {
          if (correctSortPos)
          {
            if (nextSibling && nextSibling.groupNode === group)
              pos = groupNodes.indexOf(nextSibling);
            else
              pos = groupNodes.length;
          }
          else
          {
            // when sorting use binary search
            pos = groupNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
            newChild.sortingValue = newChildValue;
          }
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

        if (newChild === refChild || (isInside && nextSibling === refChild))
        {
          if (currentNewChildGroup !== group)
          {
            if (currentNewChildGroup)
              currentNewChildGroup.remove(newChild);

            group.insert(newChild, refChild);
          }

          return newChild;
        }

        pos = -1; // NOTE: drop pos, because this index for group nodes
                  // TODO: re-calculate pos as sum of previous groups nodes.length and pos
      }
      else
      {
        if (sorting !== nullGetter)
        {
          // if sorting is using - refChild is ignore
          if (correctSortPos)
            return newChild;

          // search for refChild
          pos = childNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc);
          refChild = childNodes[pos];
          newChild.sortingValue = newChildValue; // change sortingValue AFTER search

          // optimization: if node on right position, than return
          if (newChild === refChild || (isInside && nextSibling === refChild))
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
            if (nextSibling === refChild)
              return newChild;

            // test make sense only if newChild inside parentNode
            if (newChild === refChild)
              throw EXCEPTION_CANT_INSERT;
          }
        }
      }

      //
      // ======= after this point newChild will be inserted or moved into new position =======
      //

      // unlink from old parent
      if (isInside)
      {
        // emulate removeChild if parentNode doesn't change (no events, speed benefits)

        // update nextSibling/lastChild
        if (nextSibling)
        {
          nextSibling.previousSibling = prevSibling;
          newChild.nextSibling = null;
        }
        else
          this.lastChild = prevSibling;

        // update previousSibling/firstChild
        if (prevSibling) 
        {
          prevSibling.nextSibling = nextSibling;
          newChild.previousSibling = null;
        }
        else
          this.firstChild = nextSibling;

        if (pos == -1)
          childNodes.remove(newChild);
        else
        {
          var oldPos = childNodes.indexOf(newChild);
          childNodes.splice(oldPos, 1);
          pos -= oldPos < pos;
        }

        // remove from old group (always remove for correct order)
        if (currentNewChildGroup)  // initial newChild.groupNode
        {
          currentNewChildGroup.remove(newChild);
          currentNewChildGroup = null;
        }
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
        // NOTE: if position is not equal -1 than position was found before (sorting, logN)
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
      newChild.previousSibling = refChild.previousSibling;

      // not need update this.lastChild, insert always before some node
      // if insert into begins
      if (pos == 0)
        this.firstChild = newChild;
      else
        refChild.previousSibling.nextSibling = newChild;

      // update refChild
      refChild.previousSibling = newChild;

      // update selection
      updateNodeContextSelection(newChild, newChild.contextSelection, this.selection || this.contextSelection, true);

      // if node doesn't move inside the same parent (parentNode changed)
      if (!isInside)
      {
        // re-match
        if (newChild.match)
          newChild.match(this.matchFunction);

        // delegate parentNode automatically, if necessary
        if (newChild.autoDelegate == DELEGATE.PARENT)
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
      if (!oldChild || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
        throw EXCEPTION_NODE_NOT_FOUND;

      if (oldChild instanceof this.childClass == false)
        throw EXCEPTION_BAD_CHILD_CLASS;

      if (this.dataSource && this.dataSource.has(oldChild.delegate))
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // update this
      var pos = this.childNodes.indexOf(oldChild);

      if (pos == -1)
        throw EXCEPTION_NODE_NOT_FOUND;        

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

      // update selection
      updateNodeContextSelection(oldChild, oldChild.contextSelection, null, true);

      // remove from group if any
      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch event
      if (!this.dataSource)
        this.event_childNodesModified(this, { deleted: [oldChild] });

      if (oldChild.autoDelegate == DELEGATE.PARENT)
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

      if (oldChild == null || oldChild.parentNode !== this)
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
      // clear possible only if dataSource is empty
      if (this.dataSource && this.dataSource.itemCount)
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // if node haven't childs nothing to do (event don't fire)
      if (!this.firstChild)
        return;

      // clear selection context for child for alive mode
      if (alive)
        updateNodeContextSelection(this, this.selection || this.contextSelection, null, false, true);

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
          child.nextSibling = null;
          child.previousSibling = null;

          if (child.autoDelegate == DELEGATE.PARENT)
            child.setDelegate();
        }
        else
          child.destroy();
      }

      // if local grouping, clear groups
      if (this.grouping)
      {
        //this.grouping.clear();
        for (var childNodes = this.grouping.childNodes, i = childNodes.length - 1, group; group = childNodes[i]; i--)
          group.clear();
      }
    },

   /**
    * @params {Array.<Object>} childNodes
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.dataSource)
        this.clear(keepAlive);

      if (newChildNodes)
      {
        if ('length' in newChildNodes == false) // NOTE: we don't use Array.from here to avoid make a copy of array
          newChildNodes = [newChildNodes];

        if (newChildNodes.length)
        {
          // switch off dispatch
          var tmp = this.event_childNodesModified;
          this.event_childNodesModified = $undef;

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
      if (!dataSource || !this.childClass || dataSource instanceof AbstractDataset == false)
        dataSource = null;

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;
        var listenHandler = this.listen.dataSource;

        // detach
        if (oldDataSource)
        {
          this.dataSourceMap_ = null;
          this.dataSource = null;
        }

        // remove old childs
        if (this.firstChild)
          this.clear();

        this.dataSource = dataSource;

        // TODO: switch off sorting & grouping

        // attach
        if (dataSource)
        {
          this.dataSourceMap_ = {};

          if (listenHandler)
          {
            if (dataSource.itemCount && listenHandler.datasetChanged)
              listenHandler.datasetChanged.call(this, dataSource, {
                inserted: dataSource.getItems()
              });
          }
        }

        // TODO: restore sorting & grouping, fast node reorder

        this.event_dataSourceChanged(this, oldDataSource);
      }
    },

   /**
    * @inheritDoc
    */
    setGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
        grouping = {
          groupGetter: grouping
        };

      if (grouping instanceof GroupingNode == false)
      {
        grouping = grouping && typeof grouping == 'object'
          ? new this.groupingClass(grouping)
          : null;
      }

      if (this.grouping !== grouping)
      {
        var oldGroupingNode = this.grouping;
        var order;

        if (this.grouping)
        {
          if (!grouping)
          {
            // NOTE: it's important to clear locaGrouping before calling fastChildNodesOrder
            // because it sorts nodes in according to grouping
            this.grouping = null;

            if (this.firstChild)
            {
              // new order
              if (this.sorting !== nullGetter)
                order = sortChildNodes(this);
              else
                order = this.childNodes;

              // reset reference to group node
              for (var i = order.length; i --> 0;)
                order[i].groupNode = null;

              // apply new order
              fastChildNodesOrder(this, order);
            }
          }

          oldGroupingNode.setOwner();
        }

        if (grouping)
        {
          // NOTE: it important set grouping before set owner for grouping,
          // because grouping will try set grouping property on owner change
          // for it's new owner and it fall in recursion
          this.grouping = grouping;
          grouping.setOwner(this);

          // if there is child nodes - reorder it
          if (this.firstChild)
          {
            // new order
            if (this.sorting !== nullGetter)
              order = sortChildNodes(this);
            else
              order = this.childNodes;

            // split nodes by new groups
            for (var i = 0, child; child = order[i]; i++)
              child.groupNode = this.grouping.getGroupNode(child, true);

            // fill groups
            order = fastChildNodesGroupOrder(this, order);

            // apply new order
            fastChildNodesOrder(this, order);
          }
        }

        this.event_groupingChanged(this, oldGroupingNode);
      }
    },

   /**
    * @inheritDoc
    */
    setSorting: function(sorting, sortingDesc){
      sorting = getter(sorting);
      sortingDesc = !!sortingDesc;

      // TODO: fix when direction changes only
      if (this.sorting !== sorting || this.sortingDesc != !!sortingDesc)
      {
        var oldSorting = this.sorting;
        var oldSortingDesc = this.sortingDesc;

        this.sorting = sorting;
        this.sortingDesc = !!sortingDesc;

        // reorder nodes only if sorting and child nodes exists
        if (sorting !== nullGetter && this.firstChild)
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
          if (this.grouping)
          {
            for (var group = this.grouping.nullGroup; group; group = group.nextSibling)
            {
              // sort, clear and set new order, no override childNodes
              nodes = group.nodes = sortChildNodes({ childNodes: group.nodes, sortingDesc: this.sortingDesc });

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

        this.event_sortingChanged(this, oldSorting, oldSortingDesc);
      }
    },

   /**
    * Set match function for child nodes.
    * @param {function(node):boolean} func
    */
    setMatchFunction: function(matchFunction){
      if (this.matchFunction != matchFunction)
      {
        var oldMatchFunction = this.matchFunction;
        this.matchFunction = matchFunction;

        for (var node = this.lastChild; node; node = node.previousSibling)
          node.match(matchFunction);

        this.event_matchFunctionChanged(this, oldMatchFunction);
      }
    }
  };


 /**
  * @class
  */
  var Node = Class(AbstractNode, DomMixin, {
    className: namespace + '.Node',

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
    * Occurs after matchFunction property has been changed.
    * @event
    */
    event_matchFunctionChanged: createEvent('matchFunctionChanged', 'node', 'oldMatchFunction'),

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
      if (this.selection !== selection)
      {
        // change context selection for child nodes
        updateNodeContextSelection(this, this.selection || this.contextSelection, selection || this.contextSelection, false, true);

        // update selection
        this.selection = selection;

        return true;
      }
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
        if (!selected && this.selectable/* && !this.isDisabled()*/)
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
             || !!DOM.findAncestor(this, getter('disabled'));
             // TODO: add check for groupNode, when groupNode will support for disabled
    },

   /**
    * @param {function()} func
    * @return {boolean}
    */
    match: function(func){
      if (typeof func != 'function')
        func = null;

      if (this.underMatch_ && !func)
        this.underMatch_(this, true);

      this.underMatch_ = func;

      var matched = !func || func(this);

      if (this.matched != matched)
      {
        this.matched = matched;

        if (matched)
          this.event_match(this)
        else
          this.event_unmatch(this)
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      if (this.hasOwnSelection())
      {
        this.selection.destroy(); // how about shared selection?
        this.selection = null;
      }

      this.unselect();

      // inherit
      AbstractNode.prototype.destroy.call(this);
    }
  });

 /**
  * @see ./demo/common/grouping.html
  * @see ./demo/common/grouping_of_grouping.html
  * @class
  */
  var GroupingNode = Class(AbstractNode, DomMixin, {
    className: namespace + '.GroupingNode',

    // events

   /**
    * @inheritDoc
    */
    event_childNodesModified: function(node, delta){
      events.childNodesModified.call(this, node, delta);

      this.nullGroup.nextSibling = this.firstChild;

      var array;
      if (array = delta.inserted)
      {
        for (var i = 0, child; child = array[i++];)
        {
          child.groupId_ = child.delegate ? child.delegate.eventObjectId : child.data.id;
          this.map_[child.groupId_] = child;
        }

        if (this.dataSource && this.nullGroup.first)
        {
          var parentNode = this.owner;
          var nodes = Array.from(this.nullGroup.nodes); // Array.from, because nullGroup.nodes may be transformed
          for (var i = nodes.length; i --> 0;)
            parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
        }
      }
    },

   /**
    * @inheritDoc
    */
    event_ownerChanged: function(node, oldOwner){
      // detach from old owner, if it still connected
      if (oldOwner && oldOwner.grouping === this)
        oldOwner.setGrouping(null, true);

      // attach to new owner, if any and doesn't connected
      if (this.owner && this.owner.grouping !== this)
        this.owner.setGrouping(this);

      events.ownerChanged.call(this, node, oldOwner);

      if (!this.owner && this.autoDestroyWithNoOwner)
        this.destroy();
    },

    // properties

    map_: null,

    autoDestroyWithNoOwner: true,
    autoDestroyEmptyGroups: true,
    //titleGetter: getter('data.title'),
    groupGetter: nullGetter,

    childClass: PartitionNode,
    childFactory: function(config){
      //return new this.childClass(complete(config, {
      //  titleGetter: this.titleGetter,
      //  autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      //}));
      return new this.childClass(complete({
        autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      }, config));
    },

    // methods

    init: function(config){
      this.map_ = {};
      this.nullGroup = new PartitionNode();

      ;;;if ('titleGetter' in this) console.warn(namespace + '.GroupingNode: titleGetter is not support anymore for GroupingNode; extend partition nodes with titleGetter instead');

      AbstractNode.prototype.init.call(this, config);
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @return {basis.dom.wrapper.PartitionNode}
    */
    getGroupNode: function(node, autocreate){
      var groupRef = this.groupGetter(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

      if (this.dataSource)
        autocreate = false;

      if (!group && autocreate)
      {
        group = this.appendChild(
          isDelegate
            ? groupRef
            : { 
                data: {
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

      var firstNode = newChild.first;

      if (firstNode)
      {
        var parent = firstNode.parentNode;
        var lastNode = newChild.last;

        var beforePrev;
        var beforeNext;
        var afterPrev;
        var afterNext = null;

        // search for next group firstChild
        // we can't get newChild.nextSibling.first, because next sibling group may be empty
        var cursor = newChild;
        while (cursor = cursor.nextSibling)
        {
          if (afterNext = cursor.first)
            break;
        }

        afterPrev = afterNext ? afterNext.previousSibling : parent.lastChild;

        beforePrev = firstNode.previousSibling;
        beforeNext = lastNode.nextSibling;

        if (beforeNext !== afterNext)
        {
          var parentChildNodes = parent.childNodes;
          var nodes = newChild.nodes;
          var nodesCount = nodes.length;

          // update previousSibling/nextSibling references
          if (beforePrev)
            beforePrev.nextSibling = beforeNext;
          if (beforeNext)
            beforeNext.previousSibling = beforePrev;

          if (afterPrev)
            afterPrev.nextSibling = firstNode;
          if (afterNext)
            afterNext.previousSibling = lastNode;

          firstNode.previousSibling = afterPrev;
          lastNode.nextSibling = afterNext;

          // search position for cut and
          var firstPos = parentChildNodes.indexOf(firstNode);
          var afterNextPos = afterNext
            ? parentChildNodes.indexOf(afterNext)
            : parentChildNodes.length;

          if (afterNextPos > firstPos)
            afterNextPos -= nodesCount;

          // cut nodes from parent childNodes and insert on new position
          parentChildNodes.splice(firstPos, nodesCount);
          parentChildNodes.splice.apply(parentChildNodes, [afterNextPos, 0].concat(nodes));

          // update first/last child ref for parent
          if (!afterPrev || !beforePrev)
            parent.firstChild = parentChildNodes[0];
          if (!afterNext || !beforeNext)
            parent.lastChild = parentChildNodes[parentChildNodes.length - 1];

          // re-insert partition nodes
          if (firstNode instanceof PartitionNode)
            for (var i = nodesCount, insertBefore = afterNext; i --> 0;)
            {
              parent.insertBefore(nodes[i], insertBefore);
              refChild = nodes[i];
            }
        }
      }

      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      if (oldChild = DomMixin.removeChild.call(this, oldChild))
      {
        delete this.map_[oldChild.groupId_];

        for (var i = 0, node; node = oldChild.nodes[i]; i++)
          node.parentNode.insertBefore(node);
      }

      return oldChild;
    },

   /**
    * @inheritDoc
    */
    clear: function(alive){
      var nodes = [];
      var getGroupNode = this.getGroupNode;
      var nullGroup = this.nullGroup;

      this.getGroupNode = function(){ return nullGroup };

      for (var group = this.firstChild; group; group = group.nextSibling)
        nodes.push.apply(nodes, group.nodes);

      for (var i = 0, child; child = nodes[i]; i++)
        child.parentNode.insertBefore(child);

      this.getGroupNode = getGroupNode;

      DomMixin.clear.call(this, alive);

      this.map_ = {};
      /*for (var i = 0, node; node = nodes[i]; i++)
      {
        node.groupNode = null;
        node.parentNode.insertBefore(node);
      }*/
    },

   /**
    * @inheritDoc
    */
    destroy: function(){
      this.autoDestroyWithNoOwner = false;
      //this.setOwner();

      AbstractNode.prototype.destroy.call(this);

      this.nullGroup.destroy();
      this.nullGroup = null;

      this.map_ = null;
    }
  });

  AbstractNode.prototype.groupingClass = GroupingNode;


  //
  // ChildNodesDataset
  //

  var CHILDNODESDATASET_HANDLER = {
    childNodesModified: function(sender, delta){
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
      events.sourceNodeChanged.call(this, object, oldSourceNode);

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
        var listenHandler = this.listen.sourceNode;

        this.sourceNode = node;

        if (listenHandler)
        {
          var childNodesModifiedHandler = listenHandler.childNodesModified;

          if (oldSourceNode)
          {
            oldSourceNode.removeHandler(listenHandler, this);

            if (childNodesModifiedHandler)
              childNodesModifiedHandler.call(this, oldSourceNode, {
                deleted: oldSourceNode.childNodes
              });
          }

          if (node)
          {
            node.addHandler(listenHandler, this);

            if (childNodesModifiedHandler)
              childNodesModifiedHandler.call(this, node, {
                inserted: node.childNodes
              });
          }
        }

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


  //
  // export names
  //

  basis.namespace(namespace).extend({
    // const
    DELEGATE: DELEGATE,

    // classes
    AbstractNode: AbstractNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    Selection: Selection,
    nullSelection: new AbstractDataset
  });

})(basis);
