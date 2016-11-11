
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

  /** @cut */ var hasOwnProperty = Object.prototype.hasOwnProperty;
  var Class = basis.Class;
  var complete = basis.object.complete;
  var arrayFrom = basis.array;
  var arrayRemove = basis.array.remove;
  var $undef = basis.fn.$undef;
  var getter = basis.getter;
  var nullGetter = basis.fn.nullGetter;
  var basisEvent = require('basis.event');
  var createEvent = basisEvent.create;
  var events = basisEvent.events;
  var basisData = require('basis.data');
  var resolveValue = basisData.resolveValue;
  var resolveDataset = basisData.resolveDataset;
  var createResolveFunction = basisData.createResolveFunction;

  var SUBSCRIPTION = basisData.SUBSCRIPTION;
  var STATE = basisData.STATE;

  var DataObject = basisData.Object;
  var ReadOnlyDataset = basisData.ReadOnlyDataset;
  var Dataset = basisData.Dataset;


  //
  // Main part
  //

  /** @const */ var EXCEPTION_CANT_INSERT = namespace + ': Node can\'t be inserted at specified point in hierarchy';
  /** @const */ var EXCEPTION_NODE_NOT_FOUND = namespace + ': Node was not found';
  /** @const */ var EXCEPTION_BAD_CHILD_CLASS = namespace + ': Child node has wrong class';
  /** @const */ var EXCEPTION_NULL_CHILD = namespace + ': Child node is null';
  /** @const */ var EXCEPTION_DATASOURCE_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource control';
  /** @const */ var EXCEPTION_DATASOURCEADAPTER_CONFLICT = namespace + ': Operation is not allowed because node is under dataSource adapter control';
  /** @const */ var EXCEPTION_PARENTNODE_OWNER_CONFLICT = namespace + ': Node can\'t has owner and parentNode';
  /** @const */ var EXCEPTION_NO_CHILDCLASS = namespace + ': Node can\'t has children and dataSource as childClass isn\'t specified';

  /** @const */ var AUTO = '__auto__';
  /** @const */ var DELEGATE = {
    ANY: true,
    NONE: false,
    PARENT: 'parent',
    OWNER: 'owner'
  };

  var childNodesDatasetMap = {};
  var satellitesDatasetMap = {};

  function warnOnDataSourceItemNodeDestoy(){
    /** @cut */ basis.dev.warn(namespace + ': node can\'t be destroyed as representing dataSource item, destroy delegate item or remove it from dataSource first');
  }

  function warnOnAutoSatelliteOwnerChange(){
    /** @cut */ basis.dev.warn(namespace + ': satellite can\'t change owner as it auto-satellite');
  }

  function warnOnAutoSatelliteDestoy(){
    /** @cut */ basis.dev.warn(namespace + ': satellite can\'t be destroyed as it auto-create satellite, and could be destroyed on owner destroy');
  }

  function lockDataSourceItemNode(node){
    node.setDelegate = basis.fn.$undef;
    node.destroy = warnOnDataSourceItemNodeDestoy;
  }

  function unlockDataSourceItemNode(node){
    var proto = node.constructor.prototype;
    node.setDelegate = proto.setDelegate;
    node.destroy = proto.destroy;
  }


  //
  // sorting
  //

  function getSortingValue(node){
    return node.sortingValue;
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

  function binarySearchPos(array, value, valueGetter, desc){
    if (!array.length)  // empty array check
      return 0;

    desc = !!desc;

    var l = 0;
    var r = array.length - 1;
    var valueType = typeof value;
    var compareValue;
    var compareValueType;
    var pos;

    do
    {
      pos = (l + r) >> 1;
      compareValue = valueGetter(array[pos]);
      compareValueType = typeof compareValue;

      if (desc)
      {
        if (valueType > compareValueType || value > compareValue)
        {
          r = pos - 1;
          continue;
        }
        if (valueType < compareValueType || value < compareValue)
        {
          l = pos + 1;
          continue;
        }
      }
      else
      {
        if (valueType < compareValueType || value < compareValue)
        {
          r = pos - 1;
          continue;
        }
        if (valueType > compareValueType || value > compareValue)
        {
          l = pos + 1;
          continue;
        }
      }

      return value == compareValue ? pos : 0;   // founded element
                                                // -1 returns when it seems as founded element,
                                                // but not equal (array item or value looked for have wrong data type for compare)
    }
    while (l <= r);

    return pos + ((compareValueType < valueType || compareValue < value) ^ desc);
  }

  //
  // selection
  //

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
      if (root.selected && !root.selectedRA_)
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
            {
              newSelection.add(selected);

              // remove selected from nodes that was not added to new selection set
              for (var i = 0; i < selected.length; i++)
              {
                var node = selected[i];
                if (node.selected && !newSelection.has(node))
                {
                  node.selected = false;
                  node.emit_unselect();
                }
              }
            }
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
      if (cursor.selected && !cursor.selectedRA_)
        selected.push(cursor);

      // change context selection
      cursor.contextSelection = newSelection;
    }
  }


  //
  // disabled
  //

  function updateNodeDisableContext(node, disabled){
    if (node.contextDisabled != disabled)
    {
      node.contextDisabled = disabled;

      if (node.disabled)
        return;

      if (disabled)
        node.emit_disable();
      else
        node.emit_enable();
    }
  }


  //
  // register new subscription types
  //

  SUBSCRIPTION.addProperty('owner');
  SUBSCRIPTION.addProperty('dataSource');
  SUBSCRIPTION.add(
    'CHILD',
    {
      childNodesModified: function(object, delta){
        var array;

        if (array = delta.inserted)
          for (var i = 0, child; child = array[i]; i++)
            SUBSCRIPTION.link('child', object, child);

        if (array = delta.deleted)
          for (var i = 0, child; child = array[i]; i++)
            SUBSCRIPTION.unlink('child', object, child);
      }
    },
    function(action, object){
      var childNodes = object.childNodes || [];

      for (var i = 0, child; child = childNodes[i]; i++)
        action('child', object, child);
    }
  );
  SUBSCRIPTION.add(
    'SATELLITE',
    {
      satelliteChanged: function(object, name, oldSatellite){
        if (oldSatellite)
          SUBSCRIPTION.unlink('satellite', object, oldSatellite);
        if (object.satellite[name])
          SUBSCRIPTION.link('satellite', object, object.satellite[name]);
      }
    },
    function(action, object){
      var satellites = object.satellite;
      if (satellites !== NULL_SATELLITE)
        for (var name in satellites)
          if (name !== AUTO)
            action('satellite', object, satellites[name]);
    }
  );


  //
  // AbstractNode
  //

  function processInstanceClass(InstanceClass){
    if (!InstanceClass.isSubclassOf(AbstractNode))
    {
      /** @cut */ basis.dev.warn(namespace + ': Bad class for instance, should be subclass of basis.dom.wrapper.AbstractNode');
      return AbstractNode;
    }

    return InstanceClass;
  }

  function processSatelliteConfig(satelliteConfig){
    /** @cut */ var loc;

    if (!satelliteConfig)
      return null;

    if (satelliteConfig.isSatelliteConfig)
      return satelliteConfig;

    if (satelliteConfig instanceof AbstractNode)
      return satelliteConfig;

    if (satelliteConfig.constructor !== Object)
      satelliteConfig = {
        instance: satelliteConfig
      };
    /** @cut */ else
    /** @cut */   loc = basis.dev.getInfo(satelliteConfig, 'loc');

    var handlerRequired = false;
    var events = 'update';
    var config = {
      isSatelliteConfig: true
    };

    for (var key in satelliteConfig)
    {
      var value = satelliteConfig[key];
      switch (key)
      {
        case 'instance':
          if (value instanceof AbstractNode)
          {
            config.instance = value;
          }
          else
          {
            if (Class.isClass(value))
              config.instanceClass = processInstanceClass(value);
            else
            {
              if (typeof value == 'string')
                value = basis.getter(value);

              config.getInstance = value;
            }
          }

          break;

        case 'instanceOf': // deprecated
        case 'satelliteClass':
          if (key == 'instanceOf')
          {
            /** @cut */ basis.dev.warn(namespace + ': `instanceOf` in satellite config is deprecated, use `instance` instead');
            if ('satelliteClass' in satelliteConfig)
            {
              /** @cut */ basis.dev.warn(namespace + ': `instanceOf` in satellite config has been ignored, as `satelliteClass` is specified');
              break;
            }
          }

          if ('instance' in satelliteConfig)
          {
            /** @cut */ basis.dev.warn(namespace + ': `' + key + '` in satellite config has been ignored, as `instance` is specified');
            break;
          }

          if (Class.isClass(value))
          {
            /** @cut */ basis.dev.warn(namespace + ': `' + key + '` in satellite config is deprecated, use `instance` instead');
            config.instanceClass = processInstanceClass(value);
          }
          /** @cut */ else
          /** @cut */   basis.dev.warn(namespace + ': bad value for `' + key + '` in satellite config, value should be a subclass of basis.dom.wrapper.AbstractNode');
          break;

        case 'existsIf':
        case 'delegate':
        case 'dataSource':
          if (value)
          {
            if (typeof value == 'string')
              value = getter(value);

            if (typeof value != 'function')
              value = basis.fn.$const(value);
            else
              handlerRequired = true;
          }

          config[key] = value;
          break;

        case 'config':
          if (typeof value == 'string')
            value = getter(value);

          config.config = value;
          break;

        case 'events':
          events = satelliteConfig.events;
          break;

        default:
          /** @cut */ basis.dev.warn('Unknown satellite config option – ' + key);
      }
    }

    if (!config.instance && !config.getInstance && !config.instanceClass)
      config.instanceClass = processInstanceClass(AbstractNode);

    if (handlerRequired)
    {
      if (Array.isArray(events))
        events = events.join(' ');

      if (typeof events == 'string')
      {
        var handler = {};
        events = events.split(/\s+/);

        for (var i = 0, eventName; eventName = events[i]; i++)
        {
          handler[eventName] = SATELLITE_UPDATE;
          config.handler = handler;
        }
      }
    }

    /** @cut */ if (loc)
    /** @cut */   basis.dev.setInfo(config, 'loc', loc);

    return config;
  }

  function applySatellites(node, satellites){
    for (var name in satellites)
      if (satellites[name] && typeof satellites[name] == 'object')
        node.setSatellite(name, satellites[name]);
  }

  // default satellite map
  var NULL_SATELLITE = Class.customExtendProperty({}, function(result, extend){
    /** @cut */ var map = basis.dev.getInfo(extend, 'map');

    for (var name in extend)
    {
      result[name] = processSatelliteConfig(extend[name]);

      /** @cut */ if (map && !basis.dev.getInfo(result[name]) && hasOwnProperty.call(map, name))
      /** @cut */   basis.dev.setInfo(result[name], 'loc', map[name]);
    }
  });

  // satellite update handler
  var SATELLITE_UPDATE = function(){
    // this -> {
    //   owner: owner,
    //   name: satelliteName,
    //   config: satelliteConfig,
    //   instance: satelliteInstance or null,
    //   instanceRA_: ResolveAdapter or null,
    //   existsRA_: ResolveAdapter or null
    //   factoryType: 'value' or 'class'
    //   factory: class or any
    // }
    var name = this.name;
    var config = this.config;
    var owner = this.owner;

    var exists = ('existsIf' in config == false) || config.existsIf(owner);

    if (resolveValue(this, SATELLITE_UPDATE, exists, 'existsRA_'))
    {
      var satellite = this.instance || config.instance;

      if (!satellite || this.factoryType == 'value')
      {
        if (!this.factoryType)
        {
          var instanceValue = config.getInstance;
          var instanceClass = config.instanceClass;

          if (typeof instanceValue == 'function')
          {
            instanceValue = instanceValue.call(owner, owner);
            if (Class.isClass(instanceValue))
              instanceClass = processInstanceClass(instanceValue);
          }

          this.factoryType = instanceClass ? 'class' : 'value';
          this.factory = instanceClass || instanceValue;
        }

        if (this.factoryType == 'class')
        {
          var satelliteConfig = {
            destroy: warnOnAutoSatelliteDestoy // auto-create satellite marker, lock destroy method invocation
          };

          if (config.delegate)
          {
            satelliteConfig.autoDelegate = false;
            satelliteConfig.delegate = config.delegate(owner);
          }

          if (config.dataSource)
            satelliteConfig.dataSource = config.dataSource(owner);

          if (config.config)
            basis.object.complete(satelliteConfig, typeof config.config == 'function'
              ? config.config(owner)
              : config.config
            );

          this.instance = new this.factory(satelliteConfig);
          owner.setSatellite(name, this.instance, true);

          /** @cut */ var loc = basis.dev.getInfo(config, 'loc');
          /** @cut */ if (loc)
          /** @cut */   basis.dev.setInfo(this.instance, 'loc', loc);

          return;
        }

        // factoryType == 'value'
        satellite = resolveAbstractNode(this, SATELLITE_UPDATE, this.factory, 'instanceRA_');
      }

      if (this.instance !== satellite)
      {
        this.instance = satellite || null;
        owner.setSatellite(name, this.instance, true);
      }

      if (satellite && satellite.owner === owner)
      {
        if (config.delegate)
          satellite.setDelegate(config.delegate(owner));

        if (config.dataSource)
          satellite.setDataSource(config.dataSource(owner));
      }
    }
    else
    {
      var satellite = this.instance;
      if (satellite)
      {
        if (config.instance)
        {
          if (config.delegate)
            satellite.setDelegate();

          if (config.dataSource)
            satellite.setDataSource();
        }

        this.instance = null;
        owner.setSatellite(name, null, true);
      }
    }
  };

  var AUTO_SATELLITE_INSTANCE_HANDLER = {
    destroy: function(){
      if (!this.instanceRA_)
        this.owner.setSatellite(this.name, null);
    }
  };


 /**
  * @class
  */
  var AbstractNode = Class(DataObject, {
    className: namespace + '.AbstractNode',
    propertyDescriptors: {
      owner: 'ownerChanged',
      parentNode: 'parentChanged',
      childNodes: {
        nested: ['length'],
        events: 'childNodesModified'
      },
      childNodesState: 'childNodesStateChanged',
      dataSource: 'dataSourceChanged',
      'getChildNodesDataset()': true,
      satellite: {
        nested: true,
        events: 'satelliteChanged'
      },
      sorting: 'sortingChanged',
      sortingDesc: 'sortingChanged',
      grouping: 'groupingChanged',
      ownerSatelliteName: 'ownerSatelliteNameChanged',
      firstChild: false,
      lastChild: false,
      previousSibling: false,
      nextSibling: false,
      groupNode: false,
      groupId: true,
      autoDelegate: false,
      destroyDataSourceMember: false,
      name: true
    },

   /**
    * @inheritDoc
    */
    subscribeTo: DataObject.prototype.subscribeTo + SUBSCRIPTION.DATASOURCE + SUBSCRIPTION.SATELLITE,

   /**
    * @inheritDoc
    */
    isSyncRequired: function(){
      return this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED;
    },

   /**
    * @inheritDoc
    */
    syncEvents: {
      activeChanged: false
    },

   /**
    * @inheritDoc
    */
    emit_update: function(delta){
      DataObject.prototype.emit_update.call(this, delta);

      var parentNode = this.parentNode;
      if (parentNode)
      {
        if (parentNode.matchFunction)
          this.match(parentNode.matchFunction);

        // re-insert to change position, group, sortingValue etc.
        parentNode.insertBefore(this, this.nextSibling);
      }
    },

   /**
    * @inheritDoc
    */
    listen: {
      owner: {
        destroy: function(){
          if (!this.ownerSatelliteName)
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
    * Name of node. Using by parent to fetch child by name.
    * @type {string}
    */
    name: null,

   /**
    * A list that contains all children of this node. If there are no children,
    * this is a list containing no nodes.
    * @type {Array.<basis.dom.wrapper.AbstractNode>}
    * @readonly
    */
    childNodes: null,

   /**
    * This is a general event for notification of childs changes to the parent node.
    * It may be dispatched after a single modification to the childNodes or after
    * multiple changes have occurred.
    * @param {object} delta Delta of changes.
    * @event
    */
    emit_childNodesModified: createEvent('childNodesModified', 'delta') && function(delta){
      events.childNodesModified.call(this, delta);

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
    * State of childNodes, similar to state property. Might be managed by dataSource (if used).
    * @type {basis.data.STATE|string}
    */
    childNodesState: STATE.UNDEFINED,

   /**
    * Fires when childNodesState or childNodesState.data was changed.
    * @param {object} oldState Value of childNodesState before changes.
    * @event
    */
    emit_childNodesStateChanged: createEvent('childNodesStateChanged', 'oldState'),

   /**
    * All child nodes must be instances of childClass.
    * @type {Class}
    */
    childClass: Class.SELF,

   /**
    * Object that's manage childNodes updates.
    * @type {basis.data.ReadOnlyDataset}
    */
    dataSource: null,

   /**
    * @param {basis.data.ReadOnlyDataset} oldDataSource
    */
    emit_dataSourceChanged: createEvent('dataSourceChanged', 'oldDataSource'),

   /**
    * @type {basis.data.ResolveAdapter}
    */
    dataSourceRA_: null,

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
    * @param {basis.dom.wrapper.AbstractNode} oldParentNode
    */
    emit_parentChanged: createEvent('parentChanged', 'oldParentNode'),

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
    * @param {function()} oldSorting
    * @param {boolean} oldSortingDesc
    */
    emit_sortingChanged: createEvent('sortingChanged', 'oldSorting', 'oldSortingDesc'),

   /**
    * Class for grouping control. Class should be inherited from {basis.dom.wrapper.GroupingNode}
    * @type {Class}
    */
    groupingClass: null,

   /**
    * GroupingNode config
    * @see ./demo/common/grouping.html
    * @see ./demo/common/grouping_of_grouping.html
    * @type {basis.dom.wrapper.GroupingNode}
    */
    grouping: null,

   /**
    * @param {basis.dom.wrapper.GroupingNode} oldGrouping
    */
    emit_groupingChanged: createEvent('groupingChanged', 'oldGrouping'),

   /**
    * Reference to group node in grouping
    * @type {basis.dom.wrapper.AbstractNode}
    * @readonly
    */
    groupNode: null,

   /**
    * Group indificator, may using for grouping.
    * @type {*}
    */
    groupId: NaN,

   /**
    * Satellite objects storage.
    * @type {Object}
    */
    satellite: NULL_SATELLITE,

   /**
    * @param {string} name Name of satellite
    * @param {basis.data.AbstractData} oldSattelite Old satellite for name
    */
    emit_satelliteChanged: createEvent('satelliteChanged', 'name', 'oldSatellite'),

   /**
    * Key in owner.satellite map.
    * @type {string}
    * @readonly
    */
    ownerSatelliteName: null,

   /**
    * @param {string} name Name of satellite
    * @param {string|null} oldName Old satellite name
    */
    emit_ownerSatelliteNameChanged: createEvent('ownerSatelliteNameChanged', 'name', 'oldName'),

   /**
    * Node owner. Generaly using by satellites and GroupingNode.
    * @type {basis.dom.wrapper.AbstractNode}
    */
    owner: null,

   /**
    * @param {basis.dom.wrapper.AbstractNode} oldOwner
    */
    emit_ownerChanged: createEvent('ownerChanged', 'oldOwner'),


    //
    // methods
    //

   /**
    * Process on init:
    *   - grouping
    *   - dataSource
    *   - childNodes
    *   - satellite
    *   - owner
    * @constructor
    */
    init: function(){
      // inherit
      DataObject.prototype.init.call(this);

      // save current values
      var childNodes = this.childNodes;
      var dataSource = this.dataSource;

      // reset values
      if (childNodes)
        this.childNodes = null;

      if (dataSource)
        this.dataSource = null;

      // apply grouping on empty childNodes, because childNodes may contains
      // configs but not Node instances
      var grouping = this.grouping;
      if (grouping)
      {
        this.grouping = null;
        this.setGrouping(grouping);
      }

      // apply child nodes properties
      if (this.childClass)
      {
        this.childNodes = [];

        if (dataSource)
        {
          this.setDataSource(dataSource);
        }
        else
        {
          if (childNodes)
            this.setChildNodes(childNodes);
        }
      }

      // process satellites
      var satellites = this.satellite;
      if (satellites !== NULL_SATELLITE)
      {
        this.satellite = NULL_SATELLITE;
        applySatellites(this, satellites);
      }

      // process owner
      var owner = this.owner;
      if (owner)
      {
        this.owner = null;
        this.setOwner(owner);
      }
    },

   /**
    * Set new state for child nodes. Fire childNodesStateChanged event only if state (or state data) was changed.
    * @param {basis.data.STATE|string} state New state for child nodes.
    * @param {*=} data
    * @return {boolean} Current child nodes state.
    */
    setChildNodesState: function(state, data){
      var stateCode = String(state);
      var oldState = this.childNodesState;

      if (!STATE.values[stateCode])
        throw new Error('Wrong state value');

      // set new state for object
      if (oldState != stateCode || oldState.data != data)
      {
        this.childNodesState = Object(stateCode);
        this.childNodesState.data = data;

        this.emit_childNodesStateChanged(oldState);
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
    * @param {boolean=} alive
    */
    clear: function(alive){
    },

   /**
    * Returns whether this node has any children.
    * @param {Array.<basis.dom.wrapper.AbstractNode>} nodes
    * @return {boolean} Returns true if this node has any children, false otherwise.
    */
    setChildNodes: function(nodes){
    },

   /**
    * @param {Object|function()|string=} grouping
    * @param {boolean=} alive Keep grouping node alive after unlink
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
    * @param {basis.data.ReadOnlyDataset=} dataSource
    */
    setDataSource: function(dataSource){
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode=} owner
    */
    setOwner: function(owner){
      if (!owner || owner instanceof AbstractNode == false)
        owner = null;

      if (owner && this.parentNode)
        throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      var oldOwner = this.owner;
      if (oldOwner !== owner)
      {
        var listenHandler = this.listen.owner;

        if (oldOwner)
        {
          if (this.ownerSatelliteName && oldOwner.satellite[AUTO] && this.ownerSatelliteName in oldOwner.satellite[AUTO])
          {
            /** @cut */ basis.dev.warn(namespace + ': auto-satellite can\'t change it\'s owner');
            return;
          }

          if (listenHandler)
            oldOwner.removeHandler(listenHandler, this);

          if (this.ownerSatelliteName)
          {
            this.owner = null; // set owner to null to prevent double event emit
                               // and warnings on double removeHandler
            oldOwner.setSatellite(this.ownerSatelliteName, null);
          }
        }

        if (owner && listenHandler)
          owner.addHandler(listenHandler, this);

        this.owner = owner;
        this.emit_ownerChanged(oldOwner);

        if (this.autoDelegate == DELEGATE.OWNER || this.autoDelegate === DELEGATE.ANY)
          this.setDelegate(owner);
      }
    },

   /**
    * Set replace satellite with defined name for new one.
    * @param {string} name Satellite name.
    * @param {basis.data.Object} satellite New satellite node.
    * @param {boolean} autoSet Method invoked by auto-create
    */
    setSatellite: function(name, satellite, autoSet){
      var oldSatellite = this.satellite[name] || null;
      var auto = this.satellite[AUTO];
      var autoConfig = auto && auto[name];
      var preserveAuto = autoSet && autoConfig;

      if (preserveAuto)
      {
        satellite = autoConfig.instance;
        if (satellite && autoConfig.config.instance)
          delete autoConfig.config.instance.setOwner;
      }
      else
      {
        satellite = processSatelliteConfig(satellite);

        if (satellite && satellite.owner === this && auto && satellite.ownerSatelliteName && auto[satellite.ownerSatelliteName])
        {
          /** @cut */ basis.dev.warn(namespace + ': auto-create satellite can\'t change name inside owner');
          return;
        }

        // if setSatellite was called not on auto-satellite update
        if (autoConfig)
        {
          // remove old auto-config
          delete auto[name];

          if (autoConfig.config.instance)
            autoConfig.config.instance.removeHandler(AUTO_SATELLITE_INSTANCE_HANDLER, autoConfig);

          if (autoConfig.config.handler)
            this.removeHandler(autoConfig.config.handler, autoConfig);
        }
      }

      if (oldSatellite !== satellite)
      {
        var satelliteListen = this.listen.satellite;
        var satellitePersonalListen = this.listen['satellite:' + name];
        var destroySatellite;

        if (oldSatellite)
        {
          // unlink old satellite
          delete this.satellite[name];
          var oldSatelliteName = oldSatellite.ownerSatelliteName;
          if (oldSatelliteName != null)
          {
            oldSatellite.ownerSatelliteName = null;
            oldSatellite.emit_ownerSatelliteNameChanged(oldSatelliteName);
          }

          if (autoConfig && oldSatellite.destroy === warnOnAutoSatelliteDestoy)
          {
            destroySatellite = oldSatellite;
          }
          else
          {
            // regular satellite
            if (satelliteListen)
              oldSatellite.removeHandler(satelliteListen, this);
            if (satellitePersonalListen)
              oldSatellite.removeHandler(satellitePersonalListen, this);

            oldSatellite.setOwner(null);
          }

          if (preserveAuto && !satellite && autoConfig.config.instance)
            autoConfig.config.instance.setOwner = warnOnAutoSatelliteOwnerChange;
        }

        if (satellite)
        {
          // check value is auto-config
          if (satellite instanceof AbstractNode == false)
          {
            // auto-create satellite
            var autoConfig = {
              owner: this,
              name: name,
              config: satellite,
              factoryType: null,
              factory: null,
              instance: null,
              instanceRA_: null,
              existsRA_: null
            };

            // auto-create satellite
            if (satellite.handler)
              this.addHandler(satellite.handler, autoConfig);

            if (satellite.instance)
            {
              satellite.instance.addHandler(AUTO_SATELLITE_INSTANCE_HANDLER, autoConfig);
              satellite.instance.setOwner = warnOnAutoSatelliteOwnerChange;
            }

            // create auto
            if (!auto)
            {
              if (this.satellite === NULL_SATELLITE)
                this.satellite = {};
              auto = this.satellite[AUTO] = {};
            }

            auto[name] = autoConfig;
            SATELLITE_UPDATE.call(autoConfig, this);

            if (!autoConfig.instance && oldSatellite)
              this.emit_satelliteChanged(name, oldSatellite);

            if (destroySatellite)
            {
              // auto create satellite must be destroyed
              delete destroySatellite.destroy;
              destroySatellite.destroy();
            }

            return;
          }

          // link new satellite
          if (satellite.owner !== this)
          {
            if (autoConfig && autoConfig.config.delegate)
            {
              // ignore autoDelegate if satellite is auto-satellite and config has delegate setting
              var autoDelegate = satellite.autoDelegate;
              satellite.autoDelegate = false;
              satellite.setOwner(this);
              satellite.autoDelegate = autoDelegate;
            }
            else
              satellite.setOwner(this);

            // reset satellite if owner was not set
            if (satellite.owner !== this)
            {
              this.setSatellite(name, null);
              return;
            }

            if (satelliteListen)
              satellite.addHandler(satelliteListen, this);
            if (satellitePersonalListen)
              satellite.addHandler(satellitePersonalListen, this);
          }
          else
          {
            // move satellite inside owner
            if (satellite.ownerSatelliteName)
            {
              delete this.satellite[satellite.ownerSatelliteName];
              this.emit_satelliteChanged(satellite.ownerSatelliteName, satellite);
            }
          }

          if (this.satellite == NULL_SATELLITE)
            this.satellite = {};

          this.satellite[name] = satellite;
          var oldSatelliteName = satellite.ownerSatelliteName;
          if (oldSatelliteName != name)
          {
            satellite.ownerSatelliteName = name;
            satellite.emit_ownerSatelliteNameChanged(oldSatelliteName);
          }
        }

        this.emit_satelliteChanged(name, oldSatellite);

        if (destroySatellite)
        {
          // auto create satellite must be destroyed
          delete destroySatellite.destroy;
          destroySatellite.destroy();
        }
      }
    },

   /**
    * Returns
    * @return {basis.dom.wrapper.ChildNodesDataset}
    */
    getChildNodesDataset: function(){
      return childNodesDatasetMap[this.basisObjectId] || new ChildNodesDataset({
        sourceNode: this
      });
    },

   /**
    * Returns
    * @return {basis.dom.wrapper.ChildNodesDataset}
    */
    getSatellitesDataset: function(){
      return satellitesDatasetMap[this.basisObjectId] || new SatellitesDataset({
        sourceNode: this
      });
    },

   /**
    * @destructor
    */
    destroy: function(){
      // This order of actions is better for perfomance:
      // inherit destroy -> clear childNodes -> remove from parent
      // DON'T CHANGE ORDER WITH NO ANALYZE AND TESTS

      // inherit (fire destroy event & remove handlers)
      DataObject.prototype.destroy.call(this);

      // delete children
      if (this.dataSource || this.dataSourceRA_)
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
      var satellites = this.satellite;
      if (satellites !== NULL_SATELLITE)
      {
        var auto = satellites[AUTO];
        delete satellites[AUTO];

        for (var name in auto)
        {
          if (auto[name].config.instance && !auto[name].instance)
            auto[name].config.instance.destroy();
          if (auto[name].existsRA_)
            resolveValue(auto[name], null, null, 'existsRA_');
          if (auto[name].instanceRA_)
            resolveValue(auto[name], null, null, 'instanceRA_');
        }

        for (var name in satellites)
        {
          var satellite = satellites[name];

          // drop owner to avoid events and correct auto-satellite remove
          satellite.owner = null;
          satellite.ownerSatelliteName = null;

          if (satellite.destroy === warnOnAutoSatelliteDestoy)
            delete satellite.destroy;

          satellite.destroy();
        }

        this.satellite = null;
      }

      // reset childNodes pointer
      this.childNodes = null;
    }
  });

  var resolveAbstractNode = createResolveFunction(AbstractNode);


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
    init: function(){
      this.nodes = [];
      AbstractNode.prototype.init.call(this);
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
        nodes.push(newNode);
        this.last = newNode;
      }
      else
        nodes.splice(pos, 0, newNode);

      this.first = nodes[0];

      newNode.groupNode = this;

      this.emit_childNodesModified({ inserted: [newNode] });
    },

   /**
    * Works like removeChild, but don't update oldNode references.
    * @param {basis.dom.wrapper.AbstractNode} oldNode
    */
    remove: function(oldNode){
      var nodes = this.nodes;
      if (arrayRemove(nodes, oldNode))
      {
        this.first = nodes[0] || null;
        this.last = nodes[nodes.length - 1] || null;
        oldNode.groupNode = null;

        this.emit_childNodesModified({ deleted: [oldNode] });
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
      for (var i = nodes.length; i-- > 0;)
        nodes[i].groupNode = null;

      // clear nodes & pointers
      this.nodes = [];
      this.first = null;
      this.last = null;

      this.emit_childNodesModified({ deleted: nodes });

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
    itemsChanged: function(dataSource, delta){
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
          deleted = arrayFrom(this.childNodes);

          // restore posibility to change delegate and destroy
          for (var i = 0, child; child = deleted[i]; i++)
            unlockDataSourceItemNode(child);

          // optimization: if all old nodes deleted -> clear childNodes
          this.dataSourceMap_ = null; // prevents exception on clear
          this.clear(true);   // keep alive, event fires
          this.dataSourceMap_ = {};
        }
        else
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var delegateId = item.basisObjectId;
            var oldChild = this.dataSourceMap_[delegateId];

            // restore posibility to change delegate and destroy
            unlockDataSourceItemNode(oldChild);

            delete this.dataSourceMap_[delegateId];
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
            delegate: item
          });

          // prevent delegate override and destroy
          // NOTE: we can't define setDelegate in config, because it
          // prevents delegate assignment
          lockDataSourceItemNode(newChild);

          // insert
          this.dataSourceMap_[item.basisObjectId] = newChild;
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
        this.emit_childNodesModified(newDelta);

      // destroy removed items
      if (this.destroyDataSourceMember && deleted.length)
        for (var i = 0, item; item = deleted[i]; i++)
          item.destroy();
    },
    stateChanged: function(dataSource){
      this.setChildNodesState(dataSource.state, dataSource.state.data);
    },
    destroy: function(){
      if (!this.dataSourceRA_)
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

    var groups = [node.grouping.nullGroup].concat(node.grouping.childNodes);
    var result = []; // new order
    for (var i = 0, group; group = groups[i]; i++)
    {
      var nodes = group.nodes;
      group.first = nodes[0] || null;
      group.last = nodes[nodes.length - 1] || null;
      result.push.apply(result, nodes);
      group.emit_childNodesModified({ inserted: nodes });
    }

    return result;
  }

  function createChildByFactory(node, config){
    var child;

    if (typeof node.childFactory == 'function')
    {
      child = node.childFactory(config);

      if (child instanceof node.childClass)
      {
        /** @cut */ var info = basis.dev.getInfo(config);
        /** @cut */ if (info)
        /** @cut */   for (var key in info)
        /** @cut */     basis.dev.setInfo(child, key, info[key]);

        return child;
      }
    }

    if (!child)
      throw EXCEPTION_NULL_CHILD;

    /** @cut */ basis.dev.warn(EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.constructor && child.constructor.className) + ')');
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
    * @param {*} value
    * @param {function|string} getter
    * @return {basis.dom.wrapper.AbstractNode|undefined}
    */
    getChild: function(value, getter){
      return basis.array.search(this.childNodes, value, getter);
    },

   /**
    * @param {string} name
    * @return {basis.dom.wrapper.AbstractNode|undefined} Return first child node with specified name.
    */
    getChildByName: function(name){
      return this.getChild(name, 'name');
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
        throw EXCEPTION_NO_CHILDCLASS;

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
        if (!isChildClassInstance || !newChild.delegate || this.dataSourceMap_[newChild.delegate.basisObjectId] !== newChild)
          throw EXCEPTION_DATASOURCE_CONFLICT;
      }
      else
      {
        if (this.dataSourceRA_)
          throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;
      }

      // construct new childClass instance if newChild is not instance of childClass
      if (!isChildClassInstance)
        newChild = createChildByFactory(this, newChild instanceof DataObject ? { delegate: newChild } : newChild);

      if (newChild.owner)
        throw EXCEPTION_PARENTNODE_OWNER_CONFLICT;

      // search for insert point
      var isInside = newChild.parentNode === this;
      var childNodes = this.childNodes;
      var grouping = this.grouping;
      var groupNodes;
      var currentNewChildGroup = newChild.groupNode;
      var group = null;
      var sorting = this.sorting;
      var sortingDesc;
      var correctSortPos = false;
      var newChildValue;
      var pos = -1;
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
        newChildValue = sorting(newChild);

        if (newChildValue == null)
          newChildValue = -Infinity;
        else if (typeof newChildValue != 'number' || newChildValue !== newChildValue)
          newChildValue = String(newChildValue);

        // some optimizations if node had already inside current node
        if (isInside)
        {
          if (newChildValue === newChild.sortingValue)
          {
            correctSortPos = true;
          }
          else
          {
            if (sortingDesc)
            {
              correctSortPos =
                (!nextSibling || (typeof nextSibling.sortingValue <= typeof newChildValue && nextSibling.sortingValue <= newChildValue)) &&
                (!prevSibling || (typeof prevSibling.sortingValue >= typeof newChildValue && prevSibling.sortingValue >= newChildValue));
            }
            else
            {
              correctSortPos =
                (!nextSibling || (typeof nextSibling.sortingValue >= typeof newChildValue && nextSibling.sortingValue >= newChildValue)) &&
                (!prevSibling || (typeof prevSibling.sortingValue <= typeof newChildValue && prevSibling.sortingValue <= newChildValue));
            }

            if (correctSortPos)
              newChild.sortingValue = newChildValue;
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
          if (correctSortPos || (sorting === nullGetter && nextSibling === refChild))
            return newChild;

        // calculate newChild position
        if (sorting !== nullGetter)
        {
          if (currentNewChildGroup === group && correctSortPos)
          {
            if (nextSibling && nextSibling.groupNode === group)
              pos = groupNodes.indexOf(nextSibling);
            else
              pos = groupNodes.length;
          }
          else
          {
            // when sorting use binary search
            pos = binarySearchPos(groupNodes, newChildValue, getSortingValue, sortingDesc);
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
          pos = binarySearchPos(childNodes, newChildValue, getSortingValue, sortingDesc, this.lll);
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
      // ======= after this point newChild will be inserted or moved on new position =======
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
          arrayRemove(childNodes, newChild);
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

      // if node doesn't move inside the same parent (parentNode changed)
      if (!isInside)
      {
        // update selection & disabled
        updateNodeContextSelection(newChild, newChild.contextSelection, this.selection || this.contextSelection, true);
        updateNodeDisableContext(newChild, this.disabled || this.contextDisabled);

        // re-match
        if ((newChild.underMatch_ || this.matchFunction) && newChild.match)
          newChild.match(this.matchFunction);

        // delegate parentNode automatically, if necessary
        if (newChild.autoDelegate == DELEGATE.PARENT || newChild.autoDelegate === DELEGATE.ANY)
          newChild.setDelegate(this);

        // dispatch events
        newChild.emit_parentChanged(null);
        if (!this.dataSource)
          this.emit_childNodesModified({ inserted: [newChild] });

        // add listener
        if (newChild.listen.parentNode)
          this.addHandler(newChild.listen.parentNode, newChild);
      }

      // return newChild
      return newChild;
    },

   /**
    * @inheritDoc
    */
    removeChild: function(oldChild){
      if (!oldChild || oldChild.parentNode !== this)
        throw EXCEPTION_NODE_NOT_FOUND;

      if (oldChild instanceof this.childClass == false)
        throw EXCEPTION_BAD_CHILD_CLASS;

      if (this.dataSource)
      {
        if (!oldChild.delegate || this.dataSourceMap_[oldChild.delegate.basisObjectId])
          throw EXCEPTION_DATASOURCE_CONFLICT;
      }
      else
      {
        if (this.dataSourceRA_)
          throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;
      }

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

      // remove listener from parentNode
      if (oldChild.listen.parentNode)
        this.removeHandler(oldChild.listen.parentNode, oldChild);

      // update selection
      updateNodeContextSelection(oldChild, oldChild.contextSelection, null, true);

      // remove from group if any
      if (oldChild.groupNode)
        oldChild.groupNode.remove(oldChild);

      // dispatch events
      oldChild.emit_parentChanged(this);
      if (!this.dataSource)
        this.emit_childNodesModified({ deleted: [oldChild] });

      // remove delegate if autoDelegate
      if (oldChild.autoDelegate == DELEGATE.PARENT || oldChild.autoDelegate === DELEGATE.ANY)
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

      if (this.dataSourceRA_)
        throw EXCEPTION_DATASOURCEADAPTER_CONFLICT;

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
      // NOTE: when this.dataSourceMap_ is falsy than fast child nodes replacement case
      if (this.dataSource && this.dataSourceMap_ && this.dataSource.itemCount)
        throw EXCEPTION_DATASOURCE_CONFLICT;

      // if node haven't childs nothing to do (event don't fire)
      if (!this.firstChild)
        return;

      // clear selection context for child for alive mode
      if (alive)
        updateNodeContextSelection(this, this.selection || this.contextSelection, null, false, true);

      // store children
      var childNodes = this.childNodes;

      // remove all children
      this.firstChild = null;
      this.lastChild = null;
      this.childNodes = [];

      // dispatch event
      // NOTE: important dispatch event before nodes remove/destroy, because listeners may analyze removing nodes
      this.emit_childNodesModified({ deleted: childNodes });

      for (var i = childNodes.length; i-- > 0;)
      {
        var child = childNodes[i];

        if (child.listen.parentNode)
          child.parentNode.removeHandler(child.listen.parentNode, child);

        child.parentNode = null;
        child.groupNode = null;

        if (alive)
        {
          child.nextSibling = null;
          child.previousSibling = null;

          child.emit_parentChanged(this);

          if (child.autoDelegate == DELEGATE.PARENT || child.autoDelegate === DELEGATE.ANY)
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
    * @param {Array.<Object>} newChildNodes
    * @param {boolean} keepAlive
    */
    setChildNodes: function(newChildNodes, keepAlive){
      if (!this.dataSource && !this.dataSourceRA_)
        this.clear(keepAlive);

      if (newChildNodes)
      {
        if ('length' in newChildNodes == false) // NOTE: we don't use basis.array.from here to avoid make a copy of array
          newChildNodes = [newChildNodes];

        if (newChildNodes.length)
        {
          // switch off dispatch
          var tmp = this.emit_childNodesModified;
          this.emit_childNodesModified = $undef;

          // insert nodes
          for (var i = 0, len = newChildNodes.length; i < len; i++)
            this.insertBefore(newChildNodes[i]);

          // restore event dispatch & dispatch changes event
          this.emit_childNodesModified = tmp;
          this.emit_childNodesModified({ inserted: this.childNodes });
        }
      }
    },

   /**
    * @inheritDoc
    */
    setDataSource: function(dataSource){
      if (!this.childClass)
        throw EXCEPTION_NO_CHILDCLASS;

      // dataset
      dataSource = resolveDataset(this, this.setDataSource, dataSource, 'dataSourceRA_');

      if (this.dataSource !== dataSource)
      {
        var oldDataSource = this.dataSource;
        var dataSourceMap = this.dataSourceMap_ || {};
        var listenHandler = this.listen.dataSource;
        var inserted;
        var deleted;

        // detach
        if (oldDataSource)
        {
          if (listenHandler)
            oldDataSource.removeHandler(listenHandler, this);

          if (dataSource)
          {
            inserted = dataSource.getItems().filter(function(item){
              return !oldDataSource.has(item);
            });

            deleted = oldDataSource.getItems().filter(function(item){
              return !dataSource.has(item);
            });
          }
          else
          {
            deleted = oldDataSource.getItems();
          }
        }
        else
        {
          if (dataSource)
            inserted = dataSource.getItems();
        }

        // remove old children
        if (!oldDataSource || !dataSource)
        {
          if (this.firstChild)
          {
            // return posibility to change delegate
            if (oldDataSource)
              for (var i = 0, child; child = this.childNodes[i]; i++)
                unlockDataSourceItemNode(child);

            // otherwise clear operation is not allowed
            this.dataSource = null;
            this.clear(oldDataSource && !this.destroyDataSourceMember);
          }
        }
        else
        {
          if (oldDataSource && deleted.length && listenHandler)
            listenHandler.itemsChanged.call(this, oldDataSource, {
              deleted: deleted
            });
        }

        this.dataSource = dataSource;

        // TODO: switch off sorting & grouping

        // attach
        if (dataSource)
        {
          this.dataSourceMap_ = dataSourceMap;
          this.setChildNodesState(dataSource.state, dataSource.state.data);

          if (listenHandler)
          {
            dataSource.addHandler(listenHandler, this);

            if (inserted.length)
              listenHandler.itemsChanged.call(this, dataSource, {
                inserted: inserted
              });
          }
        }
        else
        {
          this.dataSourceMap_ = null;
          this.setChildNodesState(STATE.UNDEFINED);
        }

        // TODO: restore sorting & grouping, fast node reorder

        this.emit_dataSourceChanged(oldDataSource);
      }
    },

   /**
    * @inheritDoc
    */
    setGrouping: function(grouping, alive){
      if (typeof grouping == 'function' || typeof grouping == 'string')
        grouping = {
          rule: grouping
        };

      if (grouping instanceof GroupingNode == false)
      {
        grouping = grouping && typeof grouping == 'object'
          ? new this.groupingClass(grouping)
          : null;
      }

      if (this.grouping !== grouping)
      {
        var oldGrouping = this.grouping;
        var order;

        if (oldGrouping)
        {
          // NOTE: important to reset grouping before calling fastChildNodesOrder
          // because it sorts nodes in according to grouping
          // NOTE: important to reset grouping before owner reset for oldGrouping
          // otherwise groupingChanged event occur twice
          this.grouping = null;

          if (!grouping)
          {
            if (this.firstChild)
            {
              // new order
              if (this.sorting !== nullGetter)
                order = sortChildNodes(this);
              else
                order = this.childNodes;

              // reset references and clear group nodes
              oldGrouping.nullGroup.clear();
              var groups = oldGrouping.childNodes.slice(0);
              for (var i = 0; i < groups.length; i++)
                groups[i].clear();

              // apply new order
              fastChildNodesOrder(this, order);
            }
          }

          oldGrouping.setOwner();
        }

        if (grouping)
        {
          // NOTE: important to set grouping before owner for that grouping,
          // because grouping will try set grouping property on it's owner change
          // for new owner and fall in recursion
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

        this.emit_groupingChanged(oldGrouping);

        if (oldGrouping && !alive)
          oldGrouping.destroy();
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
          {
            var newChildValue = sorting(node);
            if (newChildValue == null)
              newChildValue = -Infinity;
            else if (typeof newChildValue != 'number' || newChildValue !== newChildValue)
              newChildValue = String(newChildValue);
            node.sortingValue = newChildValue;
          }

          // Probably strange and dirty solution, but faster (up to 2-5 times).
          // Low dependence of node shuffling. Total permutation count equals to permutation
          // count of top level elements (if used). No events dispatching (time benefits).
          // Sorting time of Wrappers (AbstractNodes) equals N*log(N) + N (reference update).
          // NOTE: Nodes selected state will remain (sometimes it can be important)
          if (this.grouping)
          {
            var groups = [this.grouping.nullGroup].concat(this.grouping.childNodes);
            for (var i = 0, group; group = groups[i]; i++)
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

        this.emit_sortingChanged(oldSorting, oldSortingDesc);
      }
    },

   /**
    * Set match function for child nodes.
    * @param {function(node):boolean} matchFunction
    */
    setMatchFunction: function(matchFunction){
      if (this.matchFunction != matchFunction)
      {
        var oldMatchFunction = this.matchFunction;
        this.matchFunction = matchFunction;

        for (var node = this.lastChild; node; node = node.previousSibling)
          node.match(matchFunction);

        this.emit_matchFunctionChanged(oldMatchFunction);
      }
    }
  };


 /**
  * @class
  */
  var Node = Class(AbstractNode, DomMixin, {
    className: namespace + '.Node',
    propertyDescriptors: {
      disabled: 'disable enable',
      contextDisabled: false,
      selected: 'select unselect',
      contextSelection: false,
      selection: 'selectionChanged',
      matched: 'match unmatch',
      matchFunction: 'matchFunctionChanged'
    },

   /**
    * @param {string} name
    * @param {basis.data.Object} oldSatellite Old satellite for key
    */
    emit_satelliteChanged: function(name, oldSatellite){
      AbstractNode.prototype.emit_satelliteChanged.call(this, name, oldSatellite);

      if (this.satellite[name] instanceof Node)
        updateNodeDisableContext(this.satellite[name], this.disabled || this.contextDisabled);
    },

   /**
    * @type {boolean}
    * @readonly
    */
    contextDisabled: false,

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
    * @type {basis.data.ResolveAdapter}
    */
    disabledRA_: null,

   /**
    * Occurs after disabled property has been set to false.
    * @event
    */
    emit_enable: createEvent('enable') && function(){
      for (var child = this.firstChild; child; child = child.nextSibling)
        updateNodeDisableContext(child, false);

      events.enable.call(this);
    },

   /**
    * Occurs after disabled property has been set to true.
    * @event
    */
    emit_disable: createEvent('disable') && function(){
      for (var child = this.firstChild; child; child = child.nextSibling)
        updateNodeDisableContext(child, true);

      events.disable.call(this);
    },

   /**
    * Set of selected child nodes.
    * @type {basis.dom.wrapper.Selection}
    */
    selection: null,

   /**
    * Occurs after selecttion property has been changed.
    * @event
    */
    emit_selectionChanged: createEvent('selectionChanged', 'oldSelection'),

   /**
    * @type {basis.dom.wrapper.Selection}
    * @private
    */
    contextSelection: null,

   /**
    * Indicate node is selected.
    * @type {boolean}
    * @readonly
    */
    selected: false,

   /**
    * @type {basis.data.ResolveAdapter}
    */
    selectedRA_: null,

   /**
    * Occurs after selected property has been set to true.
    * @event
    */
    emit_select: createEvent('select'),

   /**
    * Occurs after selected property has been set to false.
    * @event
    */
    emit_unselect: createEvent('unselect'),

   /**
    * @type {boolean}
    * @readonly
    */
    matched: true,

   /**
    * Occurs after matched property has been set to true.
    * @event
    */
    emit_match: createEvent('match'),

   /**
    * Occurs after matched property has been set to false.
    * @event
    */
    emit_unmatch: createEvent('unmatch'),

   /**
    * @type {function()|null}
    * @readonly
    */
    matchFunction: null,

   /**
    * Occurs after matchFunction property has been changed.
    * @event
    */
    emit_matchFunctionChanged: createEvent('matchFunctionChanged', 'oldMatchFunction'),

   /**
    * Extend owner listener
    */
    listen: {
      owner: {
        enable: function(){
          updateNodeDisableContext(this, false);
        },
        disable: function(){
          updateNodeDisableContext(this, true);
        }
      },
      selection: {
        destroy: function(){
          this.setSelection();
        }
      }
    },

   /**
    * @constructor
    */
    init: function(){
      var disabled = this.disabled;
      this.disabled = false;

      // add selection object, if selection is not null
      var selection = this.selection;
      if (selection)
      {
        this.selection = null;
        this.setSelection(selection, true);
      }

      // inherit
      AbstractNode.prototype.init.call(this);

      // synchronize disabled
      if (disabled)
      {
        disabled = !!resolveValue(this, this.setDisabled, disabled, 'disabledRA_');
        if (disabled)
        {
          this.disabled = disabled;
          for (var child = this.firstChild; child; child = child.nextSibling)
            updateNodeDisableContext(child, true);
        }
      }

      // selected
      if (this.selected)
        this.selected = !!resolveValue(this, this.setSelected, this.selected, 'selectedRA_');
    },

   /**
    * Changes selection property of node.
    * @param {basis.dom.wrapper.Selection=} selection New selection value for node.
    * @return {boolean} Returns true if selection was changed.
    */
    setSelection: function(selection, silent){
      var oldSelection = this.selection;

      if (selection instanceof Selection === false)
        selection = selection ? new Selection(selection) : null;

      if (oldSelection !== selection)
      {
        // change context selection for child nodes
        updateNodeContextSelection(this, oldSelection || this.contextSelection, selection || this.contextSelection, false, true);

        if (this.listen.selection)
        {
          if (oldSelection)
            oldSelection.removeHandler(this.listen.selection, this);
          if (selection)
            selection.addHandler(this.listen.selection, this);
        }

        // update selection
        this.selection = selection;
        if (!silent)
          this.emit_selectionChanged(oldSelection);

        return true;
      }
    },

   /**
    * Set new value for selected property.
    * @param {boolean} selected Should be node selected or not.
    * @param {boolean} multiple Apply new state in multiple select mode or not.
    * @return {boolean} Returns true if selected property was changed.
    */
    setSelected: function(selected, multiple){
      var selection = this.contextSelection;

      selected = !!resolveValue(this, this.setSelected, selected, 'selectedRA_');

      // special case, when node selected and has selection context check only
      // resolve adapter influence on selected if exists, and restore selection
      // influence when no resolve adapter
      if (this.selected && selection)
      {
        if (this.selectedRA_)
        {
          if (selection.has(this))
          {
            this.selected = false;
            selection.remove(this);
            this.selected = true;
          }
        }
        else
        {
          if (!selection.has(this))
            selection.add(this);
        }
      }

      if (selected !== this.selected)
      {
        if (this.selectedRA_) // when resolveValue using ignore selection
        {
          this.selected = selected;
          if (selected)
            this.emit_select();
          else
            this.emit_unselect();
        }
        else
        {
          if (selected) // this.selected = false -> true
          {
            if (selection)
            {
              if (multiple)
                selection.add(this);
              else
                selection.set(this);
            }
            else
            {
              this.selected = true;
              this.emit_select();
            }
          }
          else // this.selected = true -> false
          {
            if (selection)
            {
              selection.remove(this);
            }
            else
            {
              this.selected = false;
              this.emit_unselect();
            }
          }
        }

        return true;
      }
      else
      {
        if (!this.selectedRA_ && selected && selection)  // this.selected = true -> true
        {
          if (multiple)
            selection.remove(this);
          else
            selection.set(this);
        }
      }

      return false;
    },

   /**
    * Makes node selected if possible.
    * @param {boolean} multiple
    * @return {boolean} Returns true if selected state has been changed.
    */
    select: function(multiple){
      if (this.selectedRA_)
      {
        /** @cut */ basis.dev.warn('`selected` property is under bb-value and can\'t be changed by `select()` method. Use `setSelected()` instead.');
        return false;
      }

      return this.setSelected(true, multiple);
    },

   /**
    * Makes node unselected.
    * @return {boolean} Returns true if selected state has been changed.
    */
    unselect: function(){
      if (this.selectedRA_)
      {
        /** @cut */ basis.dev.warn('`selected` property is under bb-value and can\'t be changed by `unselect()` method. Use `setSelected()` instead.');
        return false;
      }

      return this.setSelected(false);
    },

   /**
    * Set new value for disabled property.
    * @param {boolean} disabled Should be node disabled or not.
    * @return {boolean} Returns true if disabled property was changed.
    */
    setDisabled: function(disabled){
      disabled = !!resolveValue(this, this.setDisabled, disabled, 'disabledRA_');

      if (this.disabled !== disabled)
      {
        this.disabled = disabled;

        if (!this.contextDisabled)
          if (disabled)
            this.emit_disable();
          else
            this.emit_enable();

        return true;
      }

      return false;
    },

   /**
    * Makes node disabled.
    * @return {boolean} Returns true if disabled property was changed.
    */
    disable: function(){
      if (this.disabledRA_)
      {
        /** @cut */ basis.dev.warn('`disabled` property is under bb-value and can\'t be changed by `disable()` method. Use `setDisabled()` instead.');
        return false;
      }

      return this.setDisabled(true);
    },

   /**
    * Makes node enabled.
    * @return {boolean} Returns true if disabled property was changed.
    */
    enable: function(){
      if (this.disabledRA_)
      {
        /** @cut */ basis.dev.warn('`disabled` property is under bb-value and can\'t be changed by `enable()` method. Use `setDisabled()` instead.');
        return false;
      }

      return this.setDisabled(false);
    },

   /**
    * @return {boolean} Return true if node itself or context (one of ancestors/owner) are disabled.
    */
    isDisabled: function(){
      return this.disabled || this.contextDisabled;
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
          this.emit_match();
        else
          this.emit_unmatch();
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      // unlink disabled bb-value
      if (this.disabledRA_)
        resolveValue(this, null, null, 'disabledRA_');

      if (this.selectedRA_)
        resolveValue(this, null, null, 'selectedRA_');

      this.contextSelection = null;
      if (this.selection)
        this.setSelection();

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
    emit_childNodesModified: function(delta){
      events.childNodesModified.call(this, delta);

      var array;
      if (array = delta.inserted)
      {
        for (var i = 0, child; child = array[i++];)
        {
          child.groupId_ = child.delegate ? child.delegate.basisObjectId : child.data.id;
          this.map_[child.groupId_] = child;
        }

        if (this.dataSource && this.nullGroup.first)
        {
          var parentNode = this.owner;
          var nodes = arrayFrom(this.nullGroup.nodes); // basis.array.from, because nullGroup.nodes may be transformed
          for (var i = nodes.length; i-- > 0;)
            parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
        }
      }
    },

   /**
    * @inheritDoc
    */
    emit_ownerChanged: function(oldOwner){
      // detach from old owner, if it still connected
      if (oldOwner && oldOwner.grouping === this)
        oldOwner.setGrouping(null, true);

      // attach to new owner, if any and doesn't connected
      if (this.owner && this.owner.grouping !== this)
        this.owner.setGrouping(this);

      events.ownerChanged.call(this, oldOwner);

      if (!this.owner && this.autoDestroyWithNoOwner)
        this.destroy();
    },

    // properties

    map_: null,
    nullGroup: null,

    autoDestroyWithNoOwner: true,
    autoDestroyEmptyGroups: true,
    rule: nullGetter,

    childClass: PartitionNode,
    childFactory: function(config){
      return new this.childClass(complete({
        autoDestroyIfEmpty: this.dataSource ? false : this.autoDestroyEmptyGroups
      }, config));
    },

    // methods

    init: function(){
      this.map_ = {};
      this.nullGroup = new PartitionNode();

      AbstractNode.prototype.init.call(this);
    },

   /**
    * @param {basis.dom.wrapper.AbstractNode} node
    * @return {basis.dom.wrapper.PartitionNode}
    */
    getGroupNode: function(node, autocreate){
      var groupRef = this.rule(node);
      var isDelegate = groupRef instanceof DataObject;
      var group = this.map_[isDelegate ? groupRef.basisObjectId : groupRef];

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

    setDataSource: function(dataSource){
      var curDataSource = this.dataSource;

      DomMixin.setDataSource.call(this, dataSource);

      var owner = this.owner;
      if (owner && this.dataSource !== curDataSource)
      {
        var nodes = arrayFrom(owner.childNodes);
        for (var i = nodes.length - 1; i >= 0; i--)
          owner.insertBefore(nodes[i], nodes[i + 1]);
      }
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
            for (var i = nodesCount, insertBefore = afterNext; i-- > 0;)
            {
              parent.insertBefore(nodes[i], insertBefore);
              insertBefore = nodes[i];
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

      this.getGroupNode = function(){
        return nullGroup;
      };

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
      var memberMap = this.members_;
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
          memberMap[node.basisObjectId] = node;
          insertCount++;
        }
      }

      if (deleted && deleted.length)
      {
        newDelta.deleted = deleted;

        while (node = deleted[deleteCount])
        {
          delete memberMap[node.basisObjectId];
          deleteCount++;
        }
      }

      if (insertCount || deleteCount)
        this.emit_itemsChanged(newDelta);
    },
    destroy: function(){
      this.destroy();
    }
  };

  var SATELLITEDATASET_HANDLER = {
    satelliteChanged: function(sender, name, oldSatellite){
      var delta = {};

      if (sender.satellite[name])
      {
        delta.inserted = [sender.satellite[name]];
      }

      if (oldSatellite)
      {
        delta.deleted = [oldSatellite];
      }

      this.emit_itemsChanged(delta);
    },
    destroy: function(){
      this.destroy();
    }
  };

 /**
  * You should avoid to create instances of this class using `new` operator,
  * use basis.dom.wrapper.AbstractNode#getChildNodesDataset method instead.
  * @class
  */
  var ChildNodesDataset = Class(ReadOnlyDataset, {
    className: namespace + '.ChildNodesDataset',

   /**
    * @type {basis.dom.wrapper.AbstractNode}
    */
    sourceNode: null,

   /**
    * @constructor
    */
    init: function(){
      ReadOnlyDataset.prototype.init.call(this);

      var sourceNode = this.sourceNode;

      // add to map
      childNodesDatasetMap[sourceNode.basisObjectId] = this;

      // add existing nodes
      if (sourceNode.firstChild)
        CHILDNODESDATASET_HANDLER.childNodesModified.call(this, sourceNode, {
          inserted: sourceNode.childNodes
        });

      // add handler for changes listening
      sourceNode.addHandler(CHILDNODESDATASET_HANDLER, this);
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.sourceNode.removeHandler(CHILDNODESDATASET_HANDLER, this);
      delete childNodesDatasetMap[this.sourceNode.basisObjectId];

      // inherit
      ReadOnlyDataset.prototype.destroy.call(this);
    }
  });

  var SatellitesDataset = basis.Class(ReadOnlyDataset, {
    className: '.SatellitesDataset',

    /**
    * @type {basis.dom.wrapper.AbstractNode}
    */
    sourceNode: null,

    /**
    * @constructor
    */
    init: function(){
      ReadOnlyDataset.prototype.init.call(this);

      var sourceNode = this.sourceNode;

      // add to map
      satellitesDatasetMap[sourceNode.basisObjectId] = this;

      var satellites = [];

      for (var satelliteName in sourceNode.satellite)
        if (sourceNode.satellite.hasOwnProperty(satelliteName))
        {
          var node = sourceNode.satellite[satelliteName];
          if (node instanceof AbstractNode)
            satellites.push(node);
        }

      // add existing nodes
      if (satellites.length)
        this.emit_itemsChanged({
          inserted: satellites
        });

      // add handler for changes listening
      sourceNode.addHandler(SATELLITEDATASET_HANDLER, this);
    },

    /**
    * @destructor
    */
    destroy: function(){
      this.sourceNode.removeHandler(SATELLITEDATASET_HANDLER, this);
      delete satellitesDatasetMap[this.sourceNode.basisObjectId];

      // inherit
      ReadOnlyDataset.prototype.destroy.call(this);
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
    emit_itemsChanged: function(delta){
      var array;

      Dataset.prototype.emit_itemsChanged.call(this, delta);

      if (array = delta.deleted)
        for (var i = 0, node; node = array[i]; i++)
        {
          if (node.selected && node.contextSelection === this)
          {
            node.selected = false;
            node.emit_unselect();
          }
        }

      if (array = delta.inserted)
        for (var i = 0, node; node = array[i]; i++)
        {
          if (!node.selected && node.contextSelection === this)
          {
            node.selected = true;
            node.emit_select();
          }
        }
    },

   /**
    * @inheritDoc
    */
    add: function(nodes){
      if (!nodes)
        return;

      if (!this.multiple && this.itemCount)
        return this.set(nodes);

      if (!Array.isArray(nodes))
        nodes = [nodes];

      nodes = nodes.filter(this.filter, this);

      if (!this.multiple && nodes.length > 1)
      {
        /** @cut */ basis.dev.warn(namespace + '.Selection#add() can\'t accept more than one node as not in multiple mode');
        nodes = [nodes[0]];
      }

      if (nodes.length)
        return Dataset.prototype.add.call(this, nodes);
    },

   /**
    * @inheritDoc
    */
    set: function(nodes){
      if (!nodes)
        return this.clear();

      if (!Array.isArray(nodes))
        nodes = [nodes];

      nodes = nodes.filter(this.filter, this);

      if (!this.multiple && nodes.length > 1)
      {
        /** @cut */ basis.dev.warn(namespace + '.Selection#set() can\'t accept more than one node as not in multiple mode');
        nodes = [nodes[0]];
      }

      if (nodes.length)
        return Dataset.prototype.set.call(this, nodes);
      else
        return this.clear();
    },

   /**
    * Rule that defines which node can't be added to selection
    */
    filter: function(node){
      return node instanceof Node && !node.selectedRA_ && node.contextSelection === this;
    }
  });


  //
  // export names
  //

  module.exports = {
    // const
    DELEGATE: DELEGATE,

    // classes
    AbstractNode: AbstractNode,
    Node: Node,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode,

    // datasets
    ChildNodesDataset: ChildNodesDataset,
    SatellitesDataset: SatellitesDataset,
    Selection: Selection,
    nullSelection: new ReadOnlyDataset
  };
