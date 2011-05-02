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

  (function(){

   /**
    * This namespace contains base classes and functions for components of Basis framework.
    *
    * Namespace overview:
    * - Non-visual DOM classes:
    *   {Basis.DOM.Wrapper.AbstractNode}, {Basis.DOM.Wrapper.InteractiveNode},
    *   {Basis.DOM.Wrapper.Node}, {Basis.DOM.Wrapper.PartitionNode},
    *   {Basis.DOM.Wrapper.GroupControl}
    * - Visual DOM classes:
    *   {Basis.DOM.Wrapper.HtmlNode}, {Basis.DOM.Wrapper.HtmlContainer}, 
    *   {Basis.DOM.Wrapper.HtmlPartitionNode}, {Basis.DOM.Wrapper.HtmlGroupControl},
    *   {Basis.DOM.Wrapper.HtmlControl}
    * - Misc:
    *   {Basis.DOM.Wrapper.Selection}
    *
    * Aliases are available:
    * - {Basis.DOM.Wrapper.Control} for {Basis.DOM.Wrapper.HtmlControl}
    *
    * @namespace Basis.DOM.Wrapper
    */

    var namespace = 'Basis.DOM.Wrapper';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var Template = Basis.Html.Template;

    var EventObject = Basis.EventObject;
    var createBehaviour = Basis.EventObject.createBehaviour;

    var Cleaner = Basis.Cleaner;
    var TimeEventManager = Basis.TimeEventManager;

    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;
    var extend = Object.extend;
    var complete = Object.complete;

    var nsData = Basis.Data;
    var STATE = nsData.STATE;
    var SUBSCRIPTION = nsData.SUBSCRIPTION;
    var DataObject = nsData.DataObject;
    var AbstractDataset = nsData.AbstractDataset;
    var Dataset = nsData.Dataset;

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
      return node.sortingValue;
    }

    //
    //  NODE
    //

   /**
    * @class
    */
    var AbstractNode = Class(DataObject, {
      className: namespace + '.AbstractNode',

     /**
      * @inheritDoc
      */
      behaviour: {
        update: function(node, delta){
          var parentNode = this.parentNode;

          if (parentNode)
          {
            // TODO: remove this event dispatch. it using only by DOM.Wrapper.Register
            this.parentNode.dispatch('childUpdated', this, this.info, [this.info, delta].merge(), delta);

            if (parentNode.matchFunction)
            {
              this.match();
              this.match(parentNode.matchFunction);
            }

            // if more than one child - re-insert to change position if necessary
            if (parentNode.firstChild !== parentNode.lastChild)
              parentNode.insertBefore(this, this.nextSibling);
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
      * @type {Array.<Basis.DOM.Wrapper.AbstractNode>}
      * @readonly
      */
      childNodes: [],

     /**
      * Map for collection member -> child node.
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
      * Indicates that child nodes are sensetive for it's position. If true positionChanged
      * event will be fired for child nodes on child nodes permutation. 
      * @type {boolean}
      */
      positionDependent: false,

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
      * @type {Object}
      */
      localGrouping: null,

     /**
      * Reference to group node in groupControl
      * @type {Basis.DOM.Wrapper.AbstractNode}
      */
      groupNode: null,

     /**
      * Groups controling object
      * @type {Basis.DOM.Wrapper.GroupControl}
      */
      groupControl: null,

     /**
      * Class for grouping control. Class should be inherited from {Basis.DOM.Wrapper.GroupControl}
      * @type {Class}
      */
      groupControlClass: null,

     /**
      * @param {Object} config
      * @config {boolean} autoDelegateParent Overrides prototype's {Basis.Data.DataObject#autoDelegateParent} property.
      * @config {boolean} positionDependent Override prototype's positionDependent property.
      * @config {function()|string} localSorting Initial local sorting function.
      * @config {boolean} localSortingDesc Initial local sorting order.
      * @config {Basis.DOM.Wrapper.AbstractNode} document (deprecated) Must be removed. Used as hot fix.
      * @config {Object} localGrouping Initial config for local grouping.
      * @config {Basis.Data.DataObject} collection Sets collection for object.
      * @config {Array} childNodes Initial child node set.
      * @return {Object} Returns a config. 
      * @constructor
      */
      init: function(config){
        // apply config
        config = config || {};

        if (typeof config.autoDelegateParent == 'boolean')
          this.autoDelegateParent = config.autoDelegateParent;

        if (typeof config.positionDependent == 'boolean')
          this.positionDependent = config.positionDependent;

        if (config.localSorting)
          this.localSorting = getter(config.localSorting);

        if (typeof config.localSortingDesc == 'boolean')
          this.localSortingDesc = config.localSortingDesc;

        if ('localGrouping' in config)
          this.localGrouping = config.localGrouping;

        if (config.document)
          this.document = config.document;

        if (this.localGrouping)
          this.setLocalGrouping(this.localGrouping);

        // init properties
        if (this.canHaveChildren)
          this.childNodes = new Array();

        // inherit
        config = this.inherit(config);

        // append childs
        if (this.canHaveChildren && !this.collection)
        {
          if (config.childNodes)
            this.setChildNodes(config.childNodes); //DOM.insert(this, config.childNodes);
        }

        // return config
        return config;
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
      */
      setLocalGrouping: function(grouping){
      },

     /**
      * @param {function()|string} sorting
      * @param {boolean} desc
      */
      setLocalSorting: function(sorting, desc){
      },

     /**
      * @destructor
      */
      destroy: function(){
        // This method actions order is important, for better perfomance: 
        // inherit destroy -> clear childNodes -> remove from parent

        var collection = this.collection;

        // inherit (fire destroy event & remove handlers)
        this.inherit();

        // destroy group control
        if (this.groupControl)
        {
          this.groupControl.destroy();
          delete this.groupControl;
        }

        // delete childs
        if (!collection && this.firstChild)
          this.clear();

        // unlink from parent
        if (this.parentNode)
          this.parentNode.removeChild(this);

        // remove pointers
        delete this.document;
        delete this.parentNode;
        delete this.nextSibling;
        delete this.previousSibling;
        delete this.childNodes;
        delete this.firstChild;
        delete this.lastChild;

        // data remove
        delete this.info;
        delete this.config;
      }
    });

   /**
    * @class
    */
    var PartitionNode = Class(AbstractNode, {
      className: namespace + '.PartitionNode',
      canHaveChildren: true,

      titleGetter: getter('info.title'),

     /**
      * Destroy object if it doesn't contain any children (became empty).
      * @type {boolean}
      */
      autoDestroyIfEmpty: true,

     /**
      * @param {Object} config
      * @config {boolean} autoDestroyIfEmpty Override prototype value for autoDestroyIfEmpty property.
      * @config {function()} titleGetter
      * @constructor
      */
      init: function(config){
        // apply config
        if (typeof config == 'object')
        {
          if (typeof config.autoDestroyIfEmpty == 'boolean')
            this.autoDestroyIfEmpty = !!config.autoDestroyIfEmpty;

          if (config.titleGetter)
            this.titleGetter = getter(config.titleGetter);
        }

        // inherit
        return this.inherit(config);
      },

     /**
      * Set new getter for title
      * @param {string|function()} titleGetter
      */
      setTitleGetter: function(titleGetter){
        titleGetter = getter(titleGetter);
        if (this.titleGetter !== titleGetter)
        {
          this.titleGetter = titleGetter;
          this.dispatch('update', this, {});
        }
      },

     /**
      * @inheritDoc
      */
      appendChild: function(newChild){
        return this.insertBefore(newChild);
      },
      insertBefore: function(newChild, refChild){
        var pos = refChild ? this.childNodes.indexOf(refChild) : -1;

        if (pos == -1)
          this.childNodes.push(newChild);
        else
          this.childNodes.splice(pos, 0, newChild);

        this.firstChild = this.childNodes[0];
        this.lastChild = this.childNodes.last();
        newChild.groupNode = this;

        this.dispatch('childNodesModified', this, { inserted: [newChild] });

        return newChild;
      },
      removeChild: function(oldChild){
        var pos = this.childNodes.indexOf(oldChild);
        if (pos != -1)
        {
          this.childNodes.splice(pos, 1);
          this.firstChild = this.childNodes[0] || null;
          this.lastChild = this.childNodes.last() || null;
          oldChild.groupNode = null;

          this.dispatch('childNodesModified', this, { deleted: [oldChild] });
        }

        if (!this.firstChild && this.autoDestroyIfEmpty)
          this.destroy();

        return oldChild;
      },
      clear: function(alive){
        // if node haven't childs nothing to do (event don't fire)
        if (!this.firstChild)
          return;

        // delete all nodes from partition
        for (var i = 0, node; node = this.childNodes[i]; i++)
          node.groupNode = null;

        // store childNodes
        var childNodes = Array.from(this.childNodes);

        // update childNodes & pointers
        this.childNodes.clear();
        this.firstChild = this.lastChild = null;

        this.dispatch('childNodesModified', this, { deleted: childNodes.reverse() }); // why reverse here?

        // destroy partition if necessary
        if (this.autoDestroyIfEmpty)
          this.destroy();
      }
    });

   /**
    * @class InteractiveNode
    */
    var InteractiveNode = Class(AbstractNode, {
      className: namespace + '.InteractiveNode',

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

      controlSelection: null,

     /**
      * Set of selected child nodes.
      * @type {Basis.DOM.Wrapper.Selection}
      */
      selection: null,

     /**
      * @type {function()|null}
      */
      matchFunction: null,

     /**
      * @type {boolean}
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
        // apply config
        if (typeof config == 'object')
        {
          if (config.selection instanceof Selection)
            this.selection = config.selection;

          if (config.selectable == false)
            this.selectable = false;
        }

        // inherit
        config = this.inherit(config);

        // synchronize node state according to config
        if (config.disabled)
          this.disable();

        if (config.selected)
          this.select(true);

        return config;
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
        DOM.axis(this, DOM.AXIS_DESCENDANT, function(node){
          if (node.controlSelection == oldSelection)
          {
            if (node.selected)
            {
              if (oldSelection)
                oldSelection.remove([node]);
            }
            node.controlSelection = selection;
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
        var selection = this.controlSelection;
        
        // here is no check for selected state, because parentNode.selection depends on it's 
        // mode may do some actions even with selected node
        if (selection)
        { 
          if (!multiple)
            selection.set([this]);
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
            this.dispatch('select');
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
          var selection = this.controlSelection;
          if (selection)
            selection.remove([this]);
          else
          {
            this.selected = false;
            this.dispatch('unselect');
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
          this.dispatch('enable');
        }
      },

     /**
      * Makes node disabled.
      */
      disable: function(){
        if (!this.disabled)
        {
          //DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, function(node){
          //  if (node.selected)
          //    node.unselect();
          //});
          this.disabled = true;
          this.dispatch('disable');
        }
      },

     /**
      * @return {boolean} Return true if node or one of it's ancestor nodes are disabled.
      */
      isDisabled: function(){
        return this.disabled 
               || (this.document && this.document.disabled)
               || !!DOM.parent(this, getter('disabled'));
      },

     /**
      * Set new match function.
      */
      setMatchFunction: function(){
      },

     /**
      * @param {function()} func
      * @return {boolean}
      */
      match: function(func){
        if (typeof func != 'function')
        {
          if (this.matched && this.underMatch)
          {
            // restore init state
            this.underMatch(this, true);
            delete this.underMatch;
          }
          else
            if (!this.matched)
            {
              this.matched = true;
              this.dispatch('match')
            }

          return true;
        }
        
        if (func(this))
        {
          // match
          this.underMatch = func;
          if (!this.matched)
          {
            this.matched = true;
            this.dispatch('match');
          }
        }
        else
        {
          // don't match
          delete this.underMatch;
          if (this.matched)
          {
            this.matched = false;
            this.dispatch('unmatch');
          }
        }
        return this.matched;
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
        this.inherit();
      }
    });

    /*
     *  Hierarchy handlers & methods
     */

    var HIERARCHYTOOLS_COLLECTION_HANDLERS = {
      datasetChanged: function(dataset, delta){

        var newDelta = {};
        var deleted = [];

        // delete nodes
        if (delta.deleted)
        {
          if (this.childNodes.length == delta.deleted.length)
          {
            deleted = Array.from(this.childNodes);
            // optimization: if all old nodes deleted -> clear childNodes
            var col = this.collection;
            this.collection = null;
            this.clear(true);   // keep alive
            this.collection = col;
          }
          else
          {
            for (var i = 0, item; item = delta.deleted[i]; i++)
            {
              var oldChild = this.colMap_[item.eventObjectId];

              oldChild.canHaveDelegate = true; // allow delegate drop

              // remove & destroy
              deleted.push(this.removeChild(oldChild));
            }
            newDelta.deleted = deleted;
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
              isActiveSubscriber: false,
              cascadeDestroy: false,
              delegate: item
            });

            newChild.canHaveDelegate = false; // prevent delegate override

            // insert
            this.colMap_[item.eventObjectId] = newChild;
            newDelta.inserted.push(newChild);

            if (this.firstChild)
              this.insertBefore(newChild);
          }
        }

        if (!this.firstChild)
          this.setChildNodes(newDelta.inserted);
        else
          this.dispatch('childNodesModified', this, newDelta);

        if (deleted.length)
          deleted.forEach(getter('destroy()'));
      },
      destroy: function(object){
        //this.clear();
        if (this.collection == object)
          this.setCollection();
      }
    };

    function fastChildNodesOrder(node, order){
      // make a copy, no override childNodes (instead of node.childNodes = order)
      node.childNodes.set(order);
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
        child.groupNode.childNodes.push(child);

      order.clear();
      for (var group = node.groupControl.nullGroup; group; group = group.nextSibling)
      {
        var childNodes = group.childNodes;
        group.firstChild = childNodes[0] || null;
        group.lastChild = childNodes[childNodes.length - 1] || null;
        order.push.apply(order, childNodes);
        group.dispatch('childNodesModified', group, { inserted: Array.from(childNodes) });
      }

      return order;
    }

    function createChildByFactory(node, config){
      var factory = node.childFactory || (node.document && node.document.childFactory);
      var child;

      if (config instanceof DataObject)
        config = {
          //cascadeDestroy: !!this.collection,
          delegate: config
        };
      //else
      //  config = Object.complete({ document: node.document }, config);

      if (factory)
        child = factory.call(node, config);

      if (!child)
        throw new Error(EXCEPTION_NULL_CHILD);

      if (!(child instanceof node.childClass))
        //;;;console.warn('Bad child class: ', this, newChild, this.childClass);
        throw new Error(EXCEPTION_BAD_CHILD_CLASS + ' (expected ' + (node.childClass && node.childClass.className) + ' but ' + (child && child.className) + ')');
        // should we destroy

      return child;
    }

    var HierarchyTools = {
      // DOM default property values
      canHaveChildren: true,

     /**
      * @type {Class}
      */
      childClass: AbstractNode,

     /**
      * @type {Function}
      */
      childFactory: null,

      // position trace properties
      positionUpdateTimer_: null,
      minPosition_: 1E12,
      maxPosition_: 0,

      updatePositions_: function(pos1, pos2){
        if (this.positionDependent)
        {
          this.minPosition_ = Math.min(this.minPosition_, pos1, pos2);
          this.maxPosition_ = Math.max(this.maxPosition_, pos1, pos2);
          if (!this.positionUpdateTimer_)
          {
            this.positionUpdateTimer_ = function(){
              var len = Math.min(this.maxPosition_ + 1, this.childNodes.length);

              var gnode = this.childNodes[this.minPosition_];
              var group = gnode && gnode.groupNode;
              var gpos = this.minPosition_;
              if (group)
                gpos = group.childNodes.indexOf(gnode);

              for (var i = this.minPosition_; i < len; i++, gpos++)
              {
                var node = this.childNodes[i];
                if (node.groupNode != group)
                {
                  gpos = 0;
                  group = node.groupNode;
                }
                node.dispatch('updatePosition', i, gpos);
              }

              delete this.minPosition_;
              delete this.maxPosition_;
              delete this.positionUpdateTimer_;
            };
            TimeEventManager.add(this, 'positionUpdateTimer_', Date.now());
          }
        }
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
          throw new Error(EXCEPTION_CANT_INSERT);

        if (newChild.firstChild && DOM.axis(this, DOM.AXIS_ANCESTOR_OR_SELF).has(newChild))
          throw new Error(EXCEPTION_CANT_INSERT);

        if (this.collection && !this.collection.has(newChild.delegate))
          throw new Error(EXCEPTION_COLLECTION_CONFLICT);

        // construct new childClass instance if newChild is not instance of childClass
        if (newChild instanceof this.childClass == false)
          newChild = createChildByFactory(this, newChild);

        // search for insert point
        var isInside = newChild.parentNode === this;
        var localSorting = this.localSorting;
        var childNodes = this.childNodes;

        if (this.localGrouping)
        {
          var newChildValue;
          var pos = 0;
          var group = this.groupControl.getGroupNode(newChild);
          var groupChildNodes = group.childNodes;
          var childGroup = newChild.groupNode;

          if (isInside && newChild.nextSibling === refChild && childGroup === group)
            return newChild;

          if (this.localSorting)
          {
            newChildValue = localSorting(newChild);
            pos = groupChildNodes.binarySearchPos(newChildValue, sortingSearch, this.localSortingDesc);
            newChild.sortingValue = newChildValue;
          }
          else
          {
            if (refChild && refChild.groupNode === group)
              pos = groupChildNodes.indexOf(refChild);
            else
              pos = groupChildNodes.length;
          }

          refChild = groupChildNodes[pos];

          if (!refChild && pos >= groupChildNodes.length)
          {
            var cursor = group;
            while (cursor = cursor.nextSibling)
              if (refChild = cursor.firstChild)
                break;
          }

          if (newChild === refChild || (isInside && newChild.nextSibling === refChild))
          {
            if (childGroup !== group)
            {
              if (childGroup)
                childGroup.removeChild(newChild);

              group.insertBefore(newChild);

              // for group position update
              pos = this.childNodes.indexOf(newChild);
              this.updatePositions_(pos, pos);
            }

            return newChild;
          }
        }
        else
          if (localSorting)
          {
            // if localSorting is using - refChild is ignore
            var newChildValue = localSorting(newChild);
            var sortingDesc = this.localSortingDesc;
            var next = newChild.nextSibling;
            var prev = newChild.previousSibling;

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
            refChild = childNodes[childNodes.binarySearchPos(newChildValue, sortingSearch, sortingDesc)];
            newChild.sortingValue = newChildValue;

            if (newChild === refChild || (isInside && next === refChild))
              return newChild;
          }
          else
          {
            // refChild isn't child of current node
            if (refChild && refChild.parentNode !== this)
              throw new Error(EXCEPTION_NODE_NOT_FOUND);

            // some optimizations and checks
            if (isInside)
            {
              // already on necessary position
              if (newChild.nextSibling === refChild)
                return newChild;

              if (newChild === refChild)
                throw new Error(EXCEPTION_CANT_INSERT);
            }
          }

        // unlink from old parent/position
        var prevPosition = -1;

        // newChild.parentNode.removeChild(newNode);
        if (isInside)
        {
          // if parentNode not changing emulate removeChild (no events, speed benefits)

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

          prevPosition = this.childNodes.indexOf(newChild);
          this.childNodes.splice(prevPosition, 1);

          // remove from old group (always remove for correct order)
          if (newChild.groupNode)
            newChild.groupNode.removeChild(newChild);
        }
        else
        {
          if (newChild.parentNode)
            newChild.parentNode.removeChild(newChild);
        }
        
        // insert
        var pos = refChild
              ? this.childNodes.indexOf(refChild)
              : this.childNodes.length;

        if (pos == -1)
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

        // update childNodes
        this.childNodes.splice(pos, 0, newChild);
        this.updatePositions_(pos, prevPosition == -1 ? this.childNodes.length - 1 : prevPosition + (pos < prevPosition));

        // add to group
        if (newChild.groupNode != group)
          group.insertBefore(newChild, refChild);

        if (!refChild) 
        {
          refChild = {
            previousSibling: this.lastChild
          };
          this.lastChild = newChild;
        }
        else
          newChild.nextSibling = refChild;

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
        var newChildSelection = this.selection || this.controlSelection;

        if (!newChild.document && newChild.document !== this.document)
        {
          updateDocument = true;
          newChild.document = this.document;
        }

        if (!newChild.controlSelection && newChild.controlSelection !== newChildSelection)
        {
          newChild.controlSelection = newChildSelection;
          updateSelection = !newChild.selection;

          if (newChild.selected)
          {
            //newChild.unselect();
            newChildSelection.add([newChild]);
          }
        }

        if (newChild.firstChild && (updateDocument || updateSelection))
          DOM.axis(newChild, DOM.AXIS_DESCENDANT).forEach(function(node){
            if (updateDocument && !node.document)
              node.document = this.document;

            if (updateSelection && !node.controlSelection)
            {
              if (node.selected)
                node.unselect();

              node.controlSelection = newChildSelection;
            }
          }, newChild);

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
            this.dispatch('childNodesModified', this, { inserted: [newChild] });
        }

        // return newChild
        return newChild;
      },

     /**
      * @inheritDoc
      */
      removeChild: function(oldChild){
        if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

        if (oldChild instanceof this.childClass == false)
          throw new Error(EXCEPTION_BAD_CHILD_CLASS);

        if (this.collection && this.collection.has(oldChild))
          throw new Error(EXCEPTION_COLLECTION_CONFLICT);

        // update this
        var pos = this.childNodes.indexOf(oldChild);
        this.childNodes.splice(pos, 1);
        this.updatePositions_(pos, this.firstChild == this.lastChild ? 0 : this.childNodes.length - 1);
          
        // update oldChild and this.lastChild & this.firstChild
        oldChild.parentNode = null;

        // update document & selection
        var updateDocument = oldChild.document === this.document;
        var updateSelection = oldChild.controlSelection === this.selection;

        if (oldChild.firstChild && (updateDocument || updateSelection))
          DOM.axis(oldChild, DOM.AXIS_DESCENDANT).forEach(function(node){
            if (updateDocument && node.document == this.document)
              node.document = null;

            if (updateSelection && node.controlSelection == this.selection)
            {
              if (node.selected)
                this.selection.remove([node]);
              node.controlSelection = null;
            }
          }, oldChild);

        if (updateDocument)
          oldChild.document = null;

        if (updateSelection)
        {
          if (oldChild.selected)
            this.selection.remove([oldChild]);
          oldChild.controlSelection = null;
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
          oldChild.groupNode.removeChild(oldChild);

        // dispatch event
        if (!this.collection)
          this.dispatch('childNodesModified', this, { deleted: [oldChild] });

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
          throw new Error(EXCEPTION_COLLECTION_CONFLICT);

        if (oldChild == null || oldChild.parentNode !== this) // this.childNodes.absent(oldChild) truly but speedless
          throw new Error(EXCEPTION_NODE_NOT_FOUND);

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
        var childNodes = Array.from(this.childNodes);

        // remove all childs
        this.firstChild = null;
        this.lastChild = null;
        this.childNodes.clear();

        // dispatch event
        // NOTE: important dispatch event before nodes remove/destroy, because listeners may analyze removing nodes
        this.dispatch('childNodesModified', this, { deleted: childNodes.reverse() }); // why reverse?

        while (childNodes.length)
        {
          var child = childNodes.pop();

          child.parentNode = null;
          child.groupNode = null;
          //?if (child.firstChild)  // improve perfomace
          if (child.selection || child.document)
            DOM.axis(child, DOM.AXIS_DESCENDANT_OR_SELF).forEach(function(node){
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

          if (alive)
          {
            //child.unselect();
            //child.document = null;
            child.nextSibling = null;
            child.previousSibling = null;

            if (child.autoDelegateParent)
              child.setDelegate();
          }
          else
            child.destroy();
        }
        //alert(this.selection);
        if (this.groupControl)
        {
          var cn = this.groupControl.childNodes;
          for (var i = cn.length - 1, group; group = cn[i]; i--)
            group.clear(alive);
        }
      },

     /**
      * @params {Array.<Object>} childNodes
      */
      setChildNodes: function(childNodes, keepAlive){
        if (!this.collection)
          this.clear(!!keepAlive);

        if (childNodes)
        {
          if ('length' in childNodes == false) // we don't use Array.from here to avoid make a copy of array
            childNodes = [childNodes];

          if (childNodes.length)
          {
            // switch off dispatch
            this.dispatch = Function.$undef;

            // insert nodes
            var inserted = [];
            for (var i = 0; i < childNodes.length; i++)
              inserted.push(this.insertBefore(childNodes[i]));

            // restore event dispatch & dispatch changes event
            delete this.dispatch;
            this.dispatch('childNodesModified', this, { inserted: inserted });
          }
        }

        // returns childNodes
        return this.childNodes;
      },

     /**
      * @inheritDoc
      */
      setCollection: function(collection){
        if (!this.canHaveChildren)
          return;

        if (this.collection !== collection)
        {
          var oldCollection = this.collection;

          // detach
          if (oldCollection)
          {
            if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION.COLLECTION))
              oldCollection.removeSubscriber(this, SUBSCRIPTION.COLLECTION);
            oldCollection.removeHandler(HIERARCHYTOOLS_COLLECTION_HANDLERS, this);

            delete this.collection;
            delete this.colMap_;

            if (oldCollection.itemCount)
              this.clear();
          }

          // TODO: switch off localSorting & localGrouping

          // attach
          if (collection && collection instanceof AbstractDataset)
          {
            this.collection = collection;
            
            this.colMap_ = {};
            if (collection.itemCount)
              HIERARCHYTOOLS_COLLECTION_HANDLERS.datasetChanged.call(this, collection, {
                inserted: collection.getItems()
              });

            collection.addHandler(HIERARCHYTOOLS_COLLECTION_HANDLERS, this);
            if (this.isActiveSubscriber && (this.subscriptionType & SUBSCRIPTION.COLLECTION))
              collection.addSubscriber(this, SUBSCRIPTION.COLLECTION);
          }

          // TODO: restore localSorting & localGrouping, fast node reorder

          this.dispatch('collectionChanged', this, oldCollection);
        }
      },

     /**
      * @inheritDoc
      */
      setLocalGrouping: function(grouping){
        var isLocalGroupingChanged = false;
        var order;
        if (!grouping)
        {
          if (this.groupControl)
          {
            this.localGrouping = null;

            this.groupControl.destroy();
            delete this.groupControl;

            if (this.firstChild)
            {
              order = this.childNodes;
              if (this.localSorting)
                order = order.sortAsObject(sortingSearch, null, this.localSortingDesc);

              for (var i = 0; i < order.length; i++)
                order[i].groupNode = null;

              fastChildNodesOrder(this, order);
            }

            isLocalGroupingChanged = true;
          }
        }
        else
        {
          var getterOnly = typeof grouping == 'function' || typeof grouping == 'string';
          var groupGetter = getter(getterOnly ? grouping : grouping.groupGetter);
          var config = getterOnly ? null : grouping;

          if (groupGetter && (!this.groupControl || this.groupControl.groupGetter !== groupGetter))
          {
            this.localGrouping = grouping;

            // create new group control if not exists
            if (!this.groupControl)
              this.groupControl = new this.groupControlClass({ // (this.groupControlClass || GroupControl)
                //traceEvents_:1,
                //handlers: config.handlers,
                groupControlHolder: this,
                autoDestroyEmptyGroups: config ? config.autoDestroyEmptyGroups : undefined
              });
            else
              this.groupControl.clear();

            if (config)
            {
              this.groupControl.setLocalSorting(
                'localSorting' in config ? config.localSorting : this.groupControl.localSorting,
                'localSortingDesc' in config ? config.localSortingDesc : this.groupControl.localSortingDesc
              );

              if (config.titleGetter)
                this.groupControl.setTitleGetter(config.titleGetter);

              if (typeof config.isActiveSubscriber == 'boolean')
                this.groupControl.setIsActiveSubscriber(config.isActiveSubscriber);

              if (typeof config.subscriptionType == 'number')
                this.groupControl.setSubscriptionType(config.subscriptionType);

              if ('collection' in config)
                this.groupControl.setCollection(config.collection);

              //if (config.handlers)
              //  this.groupControl.addHandler(config.handlers, config.handlersContext);
            }

            this.groupControl.groupGetter = groupGetter;

            // if there is child nodes - reorder it
            if (this.firstChild)
            {
              // new order
              order = this.childNodes;
              if (this.localSorting)
                order = order.sortAsObject(sortingSearch, null, this.localSortingDesc);

              // split nodes by new groups
              for (var i = 0, child; child = order[i]; i++)
                child.groupNode = this.groupControl.getGroupNode(child);

              // fill groups
              fastChildNodesGroupOrder(this, order);

              // apply new order
              fastChildNodesOrder(this, order);
            }

            isLocalGroupingChanged = true;
          }
          else
          {
            if (config && this.groupControl)
            {
              // update group control settings
              this.groupControl.setLocalSorting(
                'localSorting' in config ? config.localSorting : this.groupControl.localSorting,
                'localSortingDesc' in config ? config.localSortingDesc : this.groupControl.localSortingDesc
              );

              if (config.titleGetter)
                this.groupControl.setTitleGetter(config.titleGetter);
              
              isLocalGroupingChanged = true;
            }
          }
        }

        if (isLocalGroupingChanged)
          this.dispatch('localGroupingChanged', this);
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
            var childNodes;

            for (var node = this.firstChild; node; node = node.nextSibling)
              node.sortingValue = sorting(node);

            // Probably strange and dirty solution, but faster (up to 2-5 times).
            // Low dependence of node shuffling. Total permutation count equals to permutation
            // count of top level elements (if used). No events dispatching (time benefits).
            // Sorting time of Wrappers (AbstractNodes) equals N*log(N) + N (reference update).
            // NOTE: Nodes selected state will remain (sometimes it can be important)
            if (this.localGrouping)
            {
              for (var group = this.groupControl.nullGroup; group; group = group.nextSibling)
              {
                // make a copy, no override childNodes
                childNodes = group.childNodes;
                childNodes.set(childNodes.sortAsObject(sortingSearch, null, this.localSortingDesc));
                group.firstChild = childNodes[0] || null;
                group.lastChild = childNodes[childNodes.length - 1] || null;
                order.push.apply(order, childNodes);
              }
            }
            else
            { 
              order = this.childNodes.sortAsObject(sortingSearch, null, this.localSortingDesc);
            }

            // apply new order
            fastChildNodesOrder(this, order);

            // update position dependent nodes
            clearTimeout(this.positionUpdateTimer_);
            delete this.positionUpdateTimer_;
            if (this.positionDependent)
            {
              var len = this.childNodes.length;
              var group = this.firstChild && this.firstChild.groupNode;
              for (var i = 0, gpos = 0; i < len; i++, gpos++)
              {
                var node = this.childNodes[i];
                if (node.groupNode != group)
                {
                  gpos = 0;
                  group = node.groupNode;
                }
                node.dispatch('updatePosition', i, gpos);
              }
            }
          }

          this.dispatch('localSortingChanged', this);
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
        return this.matchFunction;
      }
    };

   /**
    * @class Node
    */
    var Node = Class(InteractiveNode, HierarchyTools, {
      className: namespace + '.Node',

     /**
      * @param {Object} config
      * @config {function()} childFactory Override prototype's childFactory property.
      * @config {function()} childClass Override prototype's childClass property.
      */
      init: function(config){
        if (config)
        {
          if (typeof config.childFactory == 'function')
            this.childFactory = config.childFactory;

          if (typeof config.childClass == 'function')
            this.childClass = config.childClass;
        }
        
        return this.inherit(config);
      }

      //
      // destructor
      //

      /* there is no destructor */
    });

   /**
    * @class GroupControl
    */
    var GroupControl = Class(AbstractNode, HierarchyTools, {
      className: namespace + '.GroupControl',

      map_: {},

      autoDestroyEmptyGroups: true,
      groupTitleGetter: getter('info.title'),

      childClass: PartitionNode,
      childFactory: function(config){
        return new this.childClass(complete(config, {
          titleGetter: this.groupTitleGetter,
          autoDestroyIfEmpty: this.collection ? false : this.autoDestroyEmptyGroups
        }));
      },

      behaviour: {
        childNodesModified: function(object, delta){
          this.nullGroup.nextSibling = this.firstChild;

          if (delta.inserted && this.collection && this.nullGroup.firstChild)
          {
            var parentNode = this.nullGroup.firstChild.parentNode;
            var nodes = Array.from(this.nullGroup.childNodes);
            for (var i = nodes.length - 1; i >= 0; i--)
              parentNode.insertBefore(nodes[i], nodes[i].nextSibling);
          }
        }
      },

      init: function(config){
        this.map_ = {};

        if (typeof config.autoDestroyEmptyGroups != 'undefined')
          this.autoDestroyEmptyGroups = !!config.autoDestroyEmptyGroups;

        this.groupControlHolder = config.groupControlHolder;

        this.nullGroup = new PartitionNode({
          autoDestroyIfEmpty: false
        });

        this.inherit(config);

        return config;
      },

      setTitleGetter: function(titleGetter){
        this.groupTitleGetter = getter(titleGetter);

        for (var group = this.firstChild; group; group = group.nextSibling)
          group.setTitleGetter(this.groupTitleGetter);
      },

      getGroupNode: function(node){
        var groupRef = this.groupGetter(node);
        var isDelegate = groupRef instanceof EventObject;
        var group = this.map_[isDelegate ? groupRef.eventObjectId : groupRef];

        if (!group && !this.collection)
        {
          group = this.appendChild({
            info: isDelegate ? groupRef : { id: groupRef, title: groupRef }
          });
        }

        return group || this.nullGroup;
      },

      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
        {
          if ('groupId_' in newChild == false)
          {
            newChild.groupId_ = newChild.delegate ? newChild.delegate.eventObjectId : newChild.info.id;
            this.map_[newChild.groupId_] = newChild;
          }

          if (newChild.firstChild)
          {
            var owner = this.groupControlHolder;
            var childNodes = owner.childNodes;

            var firstChild = newChild.firstChild;
            var lastChild = newChild.lastChild;

            var cursor;
            var insertArgs;
            var nextGroupFirstChild;
            var prevGroupLastChild;

            // search for prev group lastChild
            cursor = newChild.previousSibling;
            while (cursor)
            {
              if (prevGroupLastChild = cursor.lastChild)
                break;

              cursor = cursor.previousSibling;
            }

            if (!prevGroupLastChild)
              prevGroupLastChild = this.nullGroup.lastChild;

            // search for next group firstChild
            cursor = newChild.nextSibling;
            while (cursor)
            {
              if (nextGroupFirstChild = cursor.firstChild)
                break;

              cursor = cursor.nextSibling;
            }

            if (firstChild.previousSibling != prevGroupLastChild || lastChild.nextSibling != nextGroupFirstChild)
            {
              // cut nodes from old position
              if (firstChild.previousSibling)
                firstChild.previousSibling.nextSibling = lastChild.nextSibling;
              if (lastChild.nextSibling)
                lastChild.nextSibling.previousSibling = firstChild.previousSibling;

              insertArgs = childNodes.splice(childNodes.indexOf(firstChild), newChild.childNodes.length);

              // insert nodes on new position and link edge nodes
              var pos = childNodes.indexOf(nextGroupFirstChild);
              insertArgs.unshift(pos != -1 ? pos : childNodes.length, 0);
              childNodes.splice.apply(childNodes, insertArgs);

              // firstChild/lastChild are present anyway
              firstChild.previousSibling = prevGroupLastChild;
              lastChild.nextSibling = nextGroupFirstChild;

              if (prevGroupLastChild)
                prevGroupLastChild.nextSibling = firstChild;
              if (nextGroupFirstChild)
                nextGroupFirstChild.previousSibling = lastChild;

              owner.firstChild = childNodes[0];
              owner.lastChild = childNodes[childNodes.length - 1];
            }
          }

          return newChild;
        }
      },

      removeChild: function(oldChild){
        if (oldChild = this.inherit(oldChild))
        {
          delete this.map_[oldChild.groupId_];
          return oldChild;
        }
      },

      clear: function(alive){
        this.map_ = {};
        this.inherit();
      },

      destroy: function(){
        this.inherit();
        delete this.map_;
      }
    });

    AbstractNode.prototype.groupControlClass = GroupControl;

    //
    // HTML reflections
    //

    var HTML_EVENT_OBJECT_ID_HOLDER = 'basisEventObjectId';
    var eventObjectMap = {};

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
            var replaceElement = this.tmpl[config.replace || key];
            if (satellite)
            {
              satellite.setDelegate(delegate);
              satellite.setCollection(collection);
            }
            else
            {
              var instanceConfig = {
                document: this.document,
                delegate: delegate,
                collection: collection
              };

              if (config.config)
                Object.complete(instanceConfig, typeof config.config == 'function' ? config.config(this) : config.config);

              satellite = new config.instanceOf(instanceConfig);

              this.satellite[key] = satellite;
              satellite.owner = this;

              if (replaceElement && satellite instanceof HtmlNode && satellite.element)
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
              delete satellite.owner;
              delete this.satellite[key];
            }
          }
        }
      }/*,
      destroy: function(){
        for (var key in this.satellite)
        {
          var satellite = this.satellite[key];

          satellite.destroy();
          delete satellite.owner;
        }
        delete this.satellite;
      }*/
    };

   /**
    * @class HtmlNode
    */
    var HtmlNode = Class(Node, {
      className: namespace + '.HtmlNode',

      behaviour: {
        select:   function(){
          //cssClass(this.selectedElement || this.content || this.element).add('selected');
          var element = this.tmpl.selectedElement || this.tmpl.content || this.tmpl.element;
          element.className += ' selected';
        },
        unselect: function(){
          //cssClass(this.selectedElement || this.content || this.element).remove('selected');
          var element = this.tmpl.selectedElement || this.tmpl.content || this.tmpl.element;
          element.className = element.className.replace(/(^|\s+)selected(\s+|$)/, '$2');
        },
        disable:  function(){ cssClass(this.tmpl.disabledElement || this.tmpl.element).add('disabled') },
        enable:   function(){ cssClass(this.tmpl.disabledElement || this.tmpl.element).remove('disabled') },
        match:    function(){ DOM.display(this.tmpl.element, true) },
        unmatch:  function(){ DOM.display(this.tmpl.element, false) }
      },

      // childFactory: null,

      // reassigned bellow
      //childClass: HtmlNode,
      //groupControlClass: HtmlGroupControl,

     /**
      * Template for object.
      * @type {Basis.Html.Template}
      */
      template: new Template(
        '<div{element|childNodesElement}></div>'
      ),

     /**
      * @type {Object}
      */
      cssClassName: {},

     /**
      * Hash of satellite object configs.
      * @type {Object}
      */
      satelliteConfig: null,

     /**
      * @param {Object} config
      * @config {Basis.Html.Template} template Override prototype's template with custom template.
      * @config {Object|string} cssClassName Set of CSS classes for parts of HTML structure.
      * @config {Node} container Specify HTML element that will be a container of template root element (node.element).
      * @config {Node|Array.<Node>} content
      * @config {string} id Id for template root element (node.element).
      * @constructor
      */
      init: function(config){
        if (config)
        {
          if (typeof config != 'object' || !isNaN(config['nodeType']))
            config = { content: config };
          else
          {
            if (config.template)
              this.template = config.template;
          }
        }

        // create html structure by template
        if (this.template)
        {
          this.template.createInstance(this.tmpl = {});
          extend(this, this.tmpl);
        }

        // inherit init
        config = this.inherit(config);

        var cssClassNames = config.cssClassName;
        if (cssClassNames)
        {
          if (typeof cssClassNames == 'string')
            cssClassNames = { element: cssClassNames };

          for (var alias in cssClassNames)
          {
            var node = this.tmpl[alias];
            if (node)
            {
              var nodeClassName = cssClass(node);
              nodeClassName.add.apply(nodeClassName, String(cssClassNames[alias]).qw());
            }
          }
        }

        if (this.tmpl && this.tmpl.element)
        {
          ;;;this.tmpl.element.setAttribute('_e', this.eventObjectId)
          this.tmpl.element[HTML_EVENT_OBJECT_ID_HOLDER] = this.eventObjectId;
          eventObjectMap[this.eventObjectId] = this;
          
          if (config.id)
            this.tmpl.element.id = config.id;
        }

        if (this.satelliteConfig)
        {
          this.satellite = {};
          this.addHandler(SATELLITE_HANDLER);
          SATELLITE_HANDLER.update.call(this, this, {});
        }

        // insert content
        if (config.content)
          DOM.insert(this.tmpl.content || this.tmpl.element, config.content);

        // add to container
        if (config.container)
          DOM.insert(config.container, this.tmpl.element);
       
        return config;
      },

      addEventListener: function(eventName, dispatchEvent, donotKill){
        dispatchEvent = dispatchEvent || eventName;
        Event.addHandler(this.tmpl.element, eventName, function(event){ 
          var node = this.getNodeByEventSender(event);          
          
          if (node)
            node.dispatch(dispatchEvent, event);
            
          this.dispatch(dispatchEvent, event, node);
          
          if (!donotKill && Event.sender(event).tagName != 'INPUT')
            Event.kill(event);
        }, this);
      },
      getNodeByEventSender: function(event){
        var sender = Event.sender(event);
        var htmlNode = sender[HTML_EVENT_OBJECT_ID_HOLDER] ? sender : DOM.parent(sender, getter(HTML_EVENT_OBJECT_ID_HOLDER), 0, this.tmpl.element);
        if (htmlNode)
        {
          var node = eventObjectMap[htmlNode[HTML_EVENT_OBJECT_ID_HOLDER]];
          if (node && node.document == this)
            return node;
        }
      },

      destroy: function(){
        delete eventObjectMap[this.eventObjectId];

        if (this.satellite)
        {
          for (var key in this.satellite)
          {
            var satellite = this.satellite[key];
            satellite.destroy();
            delete satellite.owner;
          }
          delete this.satellite;
        }

        this.inherit();

        var element = this.element;
        if (element)
        {
          Event.clearHandlers(element);
          if (element.parentNode)
            element.parentNode.removeChild(element);
        }

        if (this.template)
        {
          this.template.clearInstance(this);
          delete this.tmpl;
        }
        else
        {
          // maybe remove after refactoring
          delete this.element;
          delete this.content;
          delete this.childNodesElement;
        }
      }
    });

   /**
    * @class
    */
    var HtmlContainer = Class(HtmlNode, {
      className: namespace + '.HtmlContainer',

      groupControlClass: HtmlGroupControl,

      childClass: HtmlNode,
      childFactory: function(config){
        return new (this.childClass === HtmlNode ? HtmlNode : this.childClass)(config);
      },

      // DOM methods
      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
        { 
          if (this == newChild.parentNode)
          {
            var container = newChild.groupNode;
            var insertPoint = null;

            if (!container || !container.childNodesElement)
              container = this;

            if (newChild != container.lastChild)
              insertPoint = newChild.nextSibling.element;

            while (insertPoint && insertPoint.parentNode != container.childNodesElement)
              insertPoint = insertPoint.parentNode;

            container.childNodesElement.insertBefore(newChild.element, insertPoint);
          }
          
          return newChild;
        }
      },
      removeChild: function(oldChild){
        if (this.inherit(oldChild))
        {
          // this.childNodesElement.removeChild(oldChild.element);
          var element = oldChild.element;
          var parent = element.parentNode;
          if (parent)
            parent.removeChild(element);
          return oldChild;
        }
      },
      // TODO: fix method. make it sensetive for alive and fix bug with setChildNodes(array, true)
      clear: function(alive){
        // if not alive mode node element will be removed on node destroy
        if (alive)
        {
          var node = this.firstChild;
          while (node)
          {
            if (node.element.parentNode)
              node.element.parentNode.removeChild(node.element);

            node = node.nextSibling;
          }
        }

        this.inherit(alive);
      },
      setChildNodes: function(childNodes, keepAlive){
        // reallocate childNodesElement to new DocumentFragment
        var domFragment = DOM.createFragment();
        var target = this.groupControl || this;
        var container = target.childNodesElement;
        target.childNodesElement = domFragment;
        
        // call inherited method
        // NOTE: make sure that dispatching childNodesModified event handlers are not sensetive
        // for child node positions at real DOM (html document), because all new child nodes
        // will be inserted into temporary DocumentFragment that will be inserted into html document
        // later (after inherited method call)
        this.inherit(childNodes, keepAlive);

        // restore childNodesElement
        container.appendChild(domFragment);
        target.childNodesElement = container;

        return this.childNodes;
      }
    });

   /**
    * @class HtmlPartitionNode
    */
    var HtmlPartitionNode = Class(PartitionNode, HtmlContainer).extend({
      className: namespace + '.HtmlPartitionNode',

      template: new Template(
        '<div{element} class="Basis-PartitionNode">' + 
          '<div class="Basis-PartitionNode-Title">{titleText}</div>' + 
          '<div{content|childNodesElement} class="Basis-PartitionNode-Content"></div>' + 
        '</div>'
      ),

      behaviour: createBehaviour(PartitionNode,
        createBehaviour(HtmlContainer, {
          update: function(object, delta){
            this.inherit(object, delta);

            if (this.tmpl.titleText)
              this.tmpl.titleText.nodeValue = Object.coalesce(this.titleGetter(this), '');
          }
        })
      ),

      clear: PartitionNode.prototype.clear
    });

   /**
    * @class HtmlGroupControl
    */
    var HtmlGroupControl = Class(GroupControl, HtmlContainer).extend({
      className: namespace + '.HtmlGroupControl',

      behaviour: GroupControl.prototype.behaviour,//createBehaviour(HtmlContainer, GroupControl.prototype.behaviour),

      template: null,
      childClass: HtmlPartitionNode,
      childFactory: GroupControl.prototype.childFactory,

      init: function(config){
        config = this.inherit(config);

        if (this.groupControlHolder)
        {
          //this.parentNode = config.groupControlHolder;
          //this.childNodesElement = this.parentNode.groupsElement;
          this.tmpl = this.tmpl || {};
          this.childNodesElement = this.groupControlHolder.tmpl.groupsElement || this.groupControlHolder.childNodesElement;
          this.document = this.groupControlHolder;
        }

        return config;
      },
      clear: function(membersAlive){
        var groups = Array.from(this.childNodes);
        while (groups.length)
        {
          var group = groups.pop();
          group.clear(membersAlive);
          group.destroy();
        }
      },
      destroy: function(){
        this.inherit();
        delete this.groupControlHolder;
        delete this.childNodesElement;
      }
    });

    // links to preinited values
    HtmlContainer.prototype.groupControlClass = HtmlGroupControl;

    //
    // CONTROL
    //

   /**
    * @class Control
    */
    var Control = Class(HtmlContainer, {
      className: namespace + '.Control',

      childClass: null,

      // set default childFactory
      childFactory: function(config){
        return new this.childClass(config);
      },

     /**
      * @param {Object} config
      * @config {Object|boolean|Basis.DOM.Wrapper.Selection} selection
      * @constructor
      */
      init: function(config){
        config = extend({}, config);

        // add selection object
        if ('selection' in config == false)
          config.selection = {};

        if (config.selection instanceof Selection == false)
          config.selection = new Selection(config.selection instanceof Object ? config.selection : null);

        // make document link to itself
        // NOTE: we make it before inherit because in other way
        //       child nodes (passed by config.childNodes) will be with no document
        this.document = this;

        // inherit
        config = this.inherit(config);
                     
        // add to Basis.Cleaner
        Cleaner.add(this);

        // return config
        return config;
      },

     /**
      * Add to selection list all selectable descendant nodes.
      */
      select: function(){
      	// select all child nodes?
        // var document = this.document;
        // this.selection.set(DOM.axis(this, DOM.AXIS_DESCENDANT, function(node){ return node.document == document }));
      },

     /**
      * Remove all nodes from selection.
      */
      unselect: function(){
        if (this.selection)
          this.selection.clear();
      },

     /**
      * @inheritDoc
      */
      disable: function(){
        if (!this.disabled)
        {
          //this.selection.clear();
          this.disabled = true;
          this.dispatch('disable');
        }
      },

      destroy: function(){
        // selection destroy - clean selected nodes
        if (this.selection)
        {
          this.selection.destroy(); // how about shared selection?
          delete this.selection;
        }

        // inherit destroy, must be calling after inner objects destroyed
        this.inherit();

        // unlink from Cleaner
        Cleaner.remove(this);
      }
    });


    //
    // ChildNodesDataset
    //

    var CHILDNODES_DATASET_HANDLER = {
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
        {
          this.itemCount += insertCount - deleteCount;
          this.version++;

          this.dispatch('datasetChanged', this, newDelta);
        }
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

      behaviour: {
        sourceNodeChanged: function(object, oldSourceNode){
          if (!this.sourceNode && this.autoDestroy)
            this.destroy();
        }
      },

      init: function(node, config){
        this.inherit(config);

        this.setSourceNode(node);
      },
      setSourceNode: function(node){
        if (node !== this.sourceNode)
        {
          var oldSourceNode = this.sourceNode;

          if (oldSourceNode)
          {
            oldSourceNode.removeHandler(CHILDNODES_DATASET_HANDLER, this);
            CHILDNODES_DATASET_HANDLER.childNodesModified.call(this, oldSourceNode, {
              deleted: oldSourceNode.childNodes
            });
            delete this.sourceNode;
          }

          if (node instanceof AbstractNode)
          {
            this.sourceNode = node;
            node.addHandler(CHILDNODES_DATASET_HANDLER, this);
            CHILDNODES_DATASET_HANDLER.childNodesModified.call(this, node, {
              inserted: node.childNodes
            });
          }

          this.dispatch('sourceNodeChanged', this, oldSourceNode);
        }

        return this.sourceNode;
      },
      destroy: function(){
        if (this.sourceNode)
        {
          this.sourceNode.removeHandler(CHILDNODES_DATASET_HANDLER, this);
          delete this.sourceNode;
        }

        this.inherit();
      }
    });


    //
    // SELECTION
    //

    var SELECTION_WRAPPED_METHOD = function(nodes){
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
        if (node.controlSelection == this && node.selectable)
          items.push(node);
      }

      return this.inherit(items);
    };

    var SELECTION_WRAPPED_METHOD2 = function(nodes){
      if (!this.multiple)
        nodes.splice(1);

      var items = [];
      for (var i = 0, node; node = nodes[i]; i++)
      {
        if (node.controlSelection == this && node.selectable)
          items.push(node);
      }

      return this.inherit(items);
    };


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
      * Default behaviour
      */
      behaviour: {
        datasetChanged: function(dataset, delta){
          if (delta.inserted)
          {
            for (var i = 0, node; node = delta.inserted[i]; i++)
            {
              if (!node.selected)
              {
                node.selected = true;
                node.dispatch('select');
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
                node.dispatch('unselect');
              }
            }
          }
        
          //this.items = this.getItems();

          this.dispatch('change'); // backward compatibility
        }
      },

     /**
      * @param {Object} config
      * @config {boolean} multiple Set multiple mode for selection (more than one node can be selected).
      * @constructor
      */
      init: function(config){
        this.inherit(config);

        if (config)
        {
          if (config.multiple)
            this.multiple = !!config.multiple;
        }
      },

      add: SELECTION_WRAPPED_METHOD,
      set: SELECTION_WRAPPED_METHOD2,

     /**
      * Returns first any item if exists
      */
      pick: function(){
        for (var objectId in this.map_)
          return this.map_[objectId];
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      // tools
      HierarchyTools: HierarchyTools,

      // classes
      AbstractNode: AbstractNode,
      InteractiveNode: InteractiveNode,
      Node: Node,
      ChildNodesDataset: ChildNodesDataset,
      Selection: Selection,
      GroupControl: GroupControl,
      PartitionNode: PartitionNode,
      Control: Control,
      HtmlGroupControl: HtmlGroupControl,
      HtmlPartitionNode: HtmlPartitionNode,
      HtmlNode: HtmlNode,
      HtmlContainer: HtmlContainer,
      HtmlControl: Control
    });

  })();
