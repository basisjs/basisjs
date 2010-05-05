/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = String('Basis.DOM.Wrapers.Register');

    // import names

    var Class = Basis.Class;
    var Data = Basis.Data;
    var MWrapers = Basis.DOM.Wrapers;

    //
    // Main part
    //

    // CONST
    
    var EXCEPTION_EVENT_OBJECT_NEEDED = 'Object must be an instance of Basis.DOM.Wrapers.EventObject';

    var RegisterHandlers = {
      childNodesModified: function(node, delta){
        //console.log('childNodesModified: ', node, delta);
        this.lock();
        if (delta.inserted)
          for (var i = 0, item; item = delta.inserted[i]; i++)
            this.handleAdd(this.getter(item.node.info, item.node));

        if (delta.deleted)
          for (var i = 0, item; item = delta.deleted[i]; i++)
            this.handleRemove(this.getter(item.node.info, item.node));
        this.unlock();
      }/*,
      childInserted: function(child){
        //console.log('register add');
        this.handleAdd(this.getter(child.info, child));
      },
      childRemoved: function(child){ 
        //console.log('register remove');
        this.handleRemove(this.getter(child.info, child));
      }*/,
      childUpdated: function(child, newInfo, oldInfo){
        var newValue = this.getter(newInfo, child);
        var oldValue = this.getter(oldInfo, child);
        if (oldValue !== newValue)
        {
          //console.log('register update', child, newData, oldData);
          this.handleUpdate(newValue, oldValue);
        }
      },/*
      childsInserted: function(node){
        this.handleAddAll(node);
      },
      childsRemoved: function(node){
        this.handleRemoveAll(node);
      },*/
      destroy: function(node){
        this.detach(node);
      }
    };

    var Register = Class.create(MWrapers.Property, {
      className: namespace + '.Register',

      // constructor
      init: function(initValue, getter, behaviour){
        this.inherit(initValue, behaviour);
        this.attachments = new Array();
        this.getter = Data.getter(getter);
      },

      // attachment methods
      attach: function(node){
        if (node instanceof MWrapers.EventObject)
        {
          if (this.attachments.add(node))
          {
            // add events handler
            node.addHandler(RegisterHandlers, this);

            // process all node childs
            //this.dispatch('attach', node);
            this.handleAddAll(node);

            // node attached
            return true;
          }
        }
        else
          throw EXCEPTION_EVENT_OBJECT_NEEDED;
      },
      detach: function(node){
        if (this.attachments.remove(node))
        {
          // remove events handler
          node.removeHandler(RegisterHandlers, this);

          // process all node childs
          //this.dispatch('detach', node);
          this.handleRemoveAll(node);

          // node detached
          return true;
        }
      },
      isAttached: function(node){
        return this.attachments.indexOf(node) != -1;
      },

      // handle events
      handleAdd:    function(value){},
      handleRemove: function(value){},
      handleUpdate: function(newValue, oldValue){
        this.handleRemove(oldValue);
        this.handleAdd(newValue);
      },
      handleAddAll: function(node){
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          this.handleAdd(this.getter(node.childNodes[i].info, node.childNodes[i]));
      },
      handleRemoveAll: function(node){
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          this.handleRemove(this.getter(node.childNodes[i].info, node.childNodes[i]));
      },

      // destructor
      destroy: function(){
        for (var i = 0, node; node = this.attachments[i]; i++)
          node.removeHandler(RegisterHandlers, this);
        this.attachments.clear();

        this.inherit();

        delete this.getter;
      }
    });

    //
    // Collections
    //

    var Collection = Class.create(Register, {
      className: namespace + '.Collection',

      init: function(getter){
        this.inherit([], getter || Function.$self);
        this.childNodes = this.value;
      },
      add: function(value){
        this.value.push(value);
      },
      remove: function(value){
        this.value.remove(value);
      },
      handleAdd: function(value){
        this.add(value);
        this.dispatch('change', this.value);
        this.dispatch('childInserted', value);
      },
      handleRemove: function(value){
        this.remove(value);
        this.dispatch('change', this.value);
        this.dispatch('childRemoved', value);
      },
      destroy: function(){
        this.inherit();

        delete this.childNodes;
      }
    });

    var SortedCollection = Class.create(Collection, {
      className: namespace + '.SortedCollection',

      add: function(value){
        // insert
        this.value.splice(this.value.binarySearchPos(value), 0, value);
      },
      remove: function(value){
        var pos = this.value.binarySearch(value);

        if (pos != -1)
          // delete from sorted array
          this.value.splice(pos, 1);
      }
    });

    //
    // Filters
    //

    var FilterMethods = {      
      init: function(getter, filter){
        this.inherit(getter);

        this.filter = filter ? Data.getter(filter) : false;
      },
      handleAdd: function(value){
        if (!this.filter || this.filter(value))
          this.inherit(value);
      },
      handleRemove: function(value){
        if (!this.filter || this.filter(value))
          this.inherit(value);
      },
      destroy: function(){
        this.inherit();

        delete this.filter;
      }
    };

    // We cann't inherit SortedFilter from SortedCollection & Filter, because 
    // something wrong with Basis class model iherit methods. May be this case
    // will be fixed in future. But now Filter & SortedFilter inherited from
    // different classes and not connected.

    var Filter = Class.create(Collection, FilterMethods, {
      className: namespace + '.Filter'
    });

    var SortedFilter = Class.create(SortedCollection, FilterMethods, {
      className: namespace + '.SortedFilter'
    });

    //
    // Aggregates
    //

    var Count = Class.create(Register, {
      className: namespace + '.Count',

      init: function(getter){
        this.inherit(0, getter || Function.$true);
      },

      handleAdd: function(value){
        this.set(this.value + (Number(value) ? 1 : 0));
      },
      handleRemove: function(value){
        this.set(this.value - (Number(value) ? 1 : 0));
      },
      // optimize
      handleUpdate: function(newValue, oldValue){
        this.set(this.value + (Number(newValue) ? 1 : 0) - (Number(oldValue) ? 1 : 0));
      },
      handleAddAll: function(node){
        var diff = 0;
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          diff += Number(this.getter(node.childNodes[i].info, node.childNodes[i])) ? 1 : 0;
        this.set(this.value + diff);
      },
      handleRemoveAll: function(node){
        var diff = 0;
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          diff += Number(this.getter(node.childNodes[i].info, node.childNodes[i])) ? 1 : 0;
        this.set(this.value - diff);
      }
    });

    var Sum = Class.create(Register, {
      className: namespace + '.Sum',

      init: function(getter){
        this.inherit(0, getter || Function.$self);
      },
      handleAdd: function(value){
        this.set(this.value + (Number(value) || 0));
      },
      handleRemove: function(value){
        this.set(this.value - (Number(value) || 0));
      },
      // optimize
      handleUpdate: function(newValue, oldValue){
        this.set(this.value + (Number(newValue) || 0) - (Number(oldValue) || 0));
      },
      handleAddAll: function(node){
        var diff = 0;
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          diff += Number(this.getter(node.childNodes[i].info, node.childNodes[i])) || 0;
        this.set(this.value + diff);
      },
      handleRemoveAll: function(node){
        var diff = 0;
        for (var i = node.childNodes.length - 1; i >= 0; i--)
          diff += Number(this.getter(node.childNodes[i].info, node.childNodes[i])) || 0;
        this.set(this.value - diff);
      }
    });

    var Avg = Class.create(Register, {
      className: namespace + '.Avg',

      init: function(getter){
        this.inherit(0, getter || Function.$self);
        this._count = 0;
        this._sum   = 0;
      },
      handleAdd: function(value){
        this._sum   += value;
        this._count += 1;
        this.set(this._sum/(this._count||1));
      },
      handleRemove: function(value){
        this._sum   -= value;
        this._count -= 1;
        this.set(this._sum/(this._count||1));
      }
    });

    var Min = Class.create(Register, {
      className: namespace + '.Min',
      init: function(getter){
        this.inherit(null, getter);
        this.collection = new SortedCollection(getter);
        this.collection.addLink(this, this.update);
      },
      update: function(){
        this.set(this.collection.value.first());
      },
      handleAdd: function(value){
        this.collection.handleAdd(value);
      },
      handleRemove: function(value){
        this.collection.handleRemove(value);
      },
      destroy: function(){
        this.collection.destroy();
        delete this.collection;
        this.inherit();
      }
    });
    var Max = Class.create(Register, {
      className: namespace + '.Max',
      init: function(getter){
        this.inherit(null, getter);
        this.collection = new SortedCollection(getter);
        this.collection.addLink(this, this.update);
      },
      update: function(){
        this.set(this.collection.value.last());
      },
      handleAdd: function(value){
        this.collection.handleAdd(value);
      },
      handleRemove: function(value){
        this.collection.handleRemove(value);
      },
      destroy: function(){
        this.collection.destroy();
        delete this.collection;
        this.inherit();
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Register: Register,
      Count: Count,
      Sum: Sum,
      Avg: Avg,
      Min: Min,
      Max: Max,
      Collection: Collection,
      SortedCollection: SortedCollection,
      Filter: Filter,
      SortedFilter: SortedFilter
    });

  })();
