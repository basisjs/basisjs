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

  'use strict';

 /**
  * @namespace Basis.Entity
  */

  var namespace = 'Basis.Entity';

  // import names

  var Class = Basis.Class;
  var Cleaner = Basis.Cleaner;

  var extend = Object.extend;
  var complete = Object.complete;
  var arrayFrom = Array.from;
  var $self = Function.$self;
  var getter = Function.getter;

  var nsData = Basis.Data;
  var nsWrappers = Basis.DOM.Wrapper;

  var EventObject = Basis.EventObject;
  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;
  var AggregateDataset = nsData.AggregateDataset;
  var Collection = nsData.Collection;
  var Grouping = nsData.Grouping;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;

  var NULL_INFO = {};

  //

  var isKeyType = { 'string': 1, 'number': 1 };
  var entityTypes = [];

  var NumericId = function(value){
    return isNaN(value) ? null : Number(value);
  }
  var IntId = function(value){
    return isNaN(value) ? null : parseInt(value);
  }
  var StringId = function(value){
    return value == null ? null : String(value);
  }

  // ---

  var untitledNames = {};
  function getUntitledName(name){
    untitledNames[name] = untitledNames[name] || 0;
    return name + (untitledNames[name]++);
  }

  //
  // Index
  //

  var Index = Basis.Class(null, {
    init: function(normalize){
      var index = this.index = {};

      this.normalize = normalize;
      this.valueWrapper = function(newValue, oldValue){
        // normalize new value
        var value = normalize(newValue, oldValue);

        if (value !== oldValue && index[value])
        {
          ;;;if (typeof console != undefined) console.warn('Duplicate value for index ' + oldValue + ' => ' + newValue);
          return oldValue;  // no changes
        }

        return value;
      }
    },
    get: function(value, checkType){
      var item = this.index[value];
      return item && (!checkType || item instanceof checkType) ? item : null;
    },
    add: function(value, item){
      var curr = this.index[value];
      if (item && (!curr || curr === item))
      {
        this.index[value] = item;
        return true;
      }
    },
    remove: function(value, item){
      if (this.index[value] === item)
      {
        delete this.index[value];
        return true;
      }
    },
    destroy: function(){
      this.index = null;
    }
  });


  function CalculateField(){
    var args = Array.from(arguments);
    var func = args.pop();

    if (typeof func != 'function')
      console.warn('Last argument for calculate field constructor must be a function');

    var cond = [];
    var calcArgs = [];
    for (var i = 0, name; i < args.length; i++)
    {
      var name = args[i].quote('"');
      cond.push(name + ' in delta');
      calcArgs.push('data[' + name + ']');
    }

    var result = new Function('calc',
      'return function(delta, data){' +
        (cond.length ? 'if (' + cond.join(' || ') + ')' : '') +
        'return calc(' + calcArgs.join(', ') + ')' +
      '}'
    )(func);
    result.args = args;
    return result;
  }

  //
  // EntitySet
  //

  var ENTITYSET_WRAP_METHOD = function(superClass, method){
    return function(data){
      return superClass.prototype[method].call(this, data && data.map(this.wrapper));
    };
  }

  var ENTITYSET_INIT_METHOD = function(superClass, name){
    return function(config){
      if (!this.name)
        this.name = getUntitledName(name);
      /*if (config)
      {
        this.name = config.name || getUntitledName(name);
        this.wrapper = config.wrapper;
      }
      else
        this.name = getUntitledName(name);*/

      // inherit
      superClass.prototype.init.call(this, config);
    }
  }

  var ENTITYSET_SYNC_METHOD = function(superClass){
    return function(data, set){
      Dataset.setAccumulateState(true);
      data = (data || []).map(this.wrapper);
      Dataset.setAccumulateState(false);

      var res = superClass.prototype.sync.call(this, data, set);

      return res;
    };
  }

 /**
  * @class
  */
  var EntitySet = Class(Dataset, {
    className: namespace + '.EntitySet',

    wrapper: Function.$self,

    init: ENTITYSET_INIT_METHOD(Dataset, 'EntitySet'),
    sync: ENTITYSET_SYNC_METHOD(Dataset),

    set: ENTITYSET_WRAP_METHOD(Dataset, 'set'),
    add: ENTITYSET_WRAP_METHOD(Dataset, 'add'),
    remove: ENTITYSET_WRAP_METHOD(Dataset, 'remove'),

    destroy: function(){
      // inherit
      Dataset.prototype.destroy.call(this);

      delete this.wrapper;
    }
  });

  //
  // Read only EntitySet
  //

 /**
  * @class
  */
  var ReadOnlyEntitySet = Class(EntitySet, {
    className: namespace + '.ReadOnlyEntitySet',

    set: Function.$false,
    add: Function.$false,
    remove: Function.$false,
    clear: Function.$false
  });

  //
  // Entity collection
  //

 /**
  * @class
  */
  var EntityCollection = Class(Collection, {
    className: namespace + '.EntityCollection',

    init: ENTITYSET_INIT_METHOD(Collection, 'EntityCollection'),
    sync: ENTITYSET_SYNC_METHOD(Collection)/*,

    set: ENTITYSET_WRAP_METHOD,
    add: ENTITYSET_WRAP_METHOD,
    remove: ENTITYSET_WRAP_METHOD*/
  });

  EntityCollection.sourceHandler = Collection.sourceHandler;

  //
  // Entity grouping
  //

 /**
  * @class
  */
  var EntityGrouping = Class(Grouping, {
    className: namespace + '.EntityGrouping',

    subsetClass: ReadOnlyEntitySet,

    init: ENTITYSET_INIT_METHOD(Grouping, 'EntityGrouping'),
    sync: ENTITYSET_SYNC_METHOD(Grouping),

    getSubset: function(object, autocreate){
      var group = Grouping.prototype.getSubset.call(this, object, autocreate);
      if (group)
        group.wrapper = this.wrapper;
      return group;
    }
  });

  //
  // EntitySetWrapper
  //

  var EntitySetWrapper = function(wrapper){
    if (this instanceof EntitySetWrapper)
    {
      var entitySetType = new EntitySetConstructor(wrapper || $self);

      return function(data, entitySet){
        if (data != null)
        {
          if (!(entitySet instanceof EntitySet))
            entitySet = entitySetType.createEntitySet();

          entitySet.set(data instanceof Dataset ? data.getItems() : Array.from(data));

          return entitySet;
        }
        else
          return null;
      };
    }
  };
  EntitySetWrapper.className = namespace + '.EntitySetWrapper';

  //
  // EntitySetConstructor
  //

 /**
  * @class
  */
  var EntitySetConstructor = Class(null, {
    className: namespace + '.EntitySetConstructor',

    init: function(wrapper){
      this.wrapper = wrapper;
    },
    createEntitySet: function(){
      return new EntitySet({
        wrapper: this.wrapper,
        name: 'Set of ' + ((this.wrapper.entityType || this.wrapper).name || '').quote('{')
      });
    }
  });

 /*
  *  EntityTypeWrapper
  */

  var EntityTypeWrapper = function(config){
    if (this instanceof EntityTypeWrapper)
    {
      var result = function(data, entity){
        // newData - data for target EntityType instance
        // entity - current instance of target EntityType

        if (data != null)
        {
          // if newData instance of target EntityType return newData
          if (data === entity || data.entityType === entityType)
            return data;

          var idValue;
          var idField = entityType.idField;

          if (isKeyType[typeof data])
          {
            if (!idField)
              return;

            idValue = data;
            data = {};
            data[idField] = idValue;
          }
          else
          {
            if (idField)
              idValue = data[idField];
            else
            {
              if (isSingleton)
              {
                entity = entityType.singleton;
                if (!entity)
                  return entityType.singleton = new entityClass(data);
              }
            }
          }

          if (idValue != null && index)
            entity = index.get(idValue, entityType.entityClass);

          if (entity && entity.entityType === entityType)
            entity.update(data);
          else
            entity = new entityClass(data);

          return entity;
        }
        else
          return entityType.singleton;
      };

      var entityType = new EntityTypeConstructor(config || {}, result);
      var index = entityType.index__;
      var entityClass = entityType.entityClass;
      var isSingleton = entityType.isSingleton;

      extend(result, {
        toString: function(){
          return this.typeName + '()';
        },
        entityType: entityType,
        type: result,
        typeName: entityType.name,
        index: index,

        get: function(data){
          return entityType.get(data);
        },
        addField: function(key, wrapper){
          entityType.addField(key, wrapper);
        },
        all: entityType.all,
        createCollection: function(name, memberSelector, dataset){
          var collection = entityType.collection_[name];

          if (!collection && memberSelector)
          {
            return entityType.collection_[name] = new EntityCollection({
              wrapper: result,
              source: dataset || entityType.all,
              rule: memberSelector
            });
          }

          return collection;
        },
        getCollection: function(name){
          return entityType.collection_[name];
        },
        createGrouping: function(name, rule, dataset){
          var grouping = entityType.grouping_[name];
          if (!grouping && rule)
          {
            return entityType.grouping_[name] = new EntityGrouping({
              wrapper: result,
              source: dataset || entityType.all,
              rule: rule
            });
          }

          return grouping;
        },
        getGrouping: function(name){
          return entityType.grouping_[name];
        },
        getSlot: function(index, defaults){
          return entityType.getSlot(index, defaults);
        }
      });

      // debug only
      //result.entityType = entityType;
      //result.callText = function(){ return entityType.name };

      return result;
    }
    //else
    //  return namedEntityTypes.get(config);
  };
  EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

  //
  // Entity type constructor
  //

  var getSingleton = getter('singleton');
  var fieldDestroyHandlers = {};

 /**
  * @class
  */
  var Slot = Class(DataObject, {
    className: namespace + '.Slot'
  });

 /**
  * @class
  */
  var EntityTypeConstructor = Class(null, {
    className: namespace + '.EntityType',
    name: 'UntitledEntityType',

    defaults: null,
    fields: null,
    extensible: false,

    index__: null,
    slot_: null,

    init: function(config, wrapper){
      this.name = config.name || getUntitledName(this.name);

      var index__;
      var entityClass__;

      ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, getter('name'))) console.warn('Dublicate entity type name: ', this.name);
      entityTypes.push(this);

      this.isSingleton = config.isSingleton;
      this.wrapper = wrapper;

      this.all = new ReadOnlyEntitySet(Object.extend(config.all || {}, {
        wrapper: wrapper
      }));
      this.slot_ = {};

      if (config.extensible)
        this.extensible = true;

      this.fields = {};
      this.defaults = {};
      this.aliases = {};
      this.getters = {};
      if (config.fields)
        for (var key in config.fields)
        {
          var func = config.fields[key];

          if (key === config.id || [NumericId, IntId, StringId].has(func))
            func = new Index(func);

          if (func instanceof Index)
          {
            config.id = key;
            this.index__ = index__ = func;
            func = func.valueWrapper;
          }

          this.addField(key, func);
        }

      if (!this.isSingleton)
      {
        var idField = this.idField = config.id || null;
        this.idFieldNames = [];
        if (idField)
        {
          this.idFieldNames.push(idField);

          var idFieldWrapper = this.fields[this.idField];
          var getId = function(data){
            if (data)
            {
              if (data instanceof DataObject)
                data = data.data;
              return data[idField]; 
            }
          };

          this.getId = getId;
          this.get = function(data){
            //return this.index_[isKeyType[typeof data] ? idFieldWrapper(data) : getId(data)];
            return index__.get(isKeyType[typeof data] ? index__.normalize(data) : getId(data), entityClass__);
          };
        }
      }
      else
      {
        this.get = getSingleton;
      }

      if (config.aliases)
      {
        //extend(this.aliases, config.aliases);
        Object.iterate(config.aliases, function(key, value){
          this.aliases[key] = value;
          if (value == this.idField)
            this.idFieldNames.push(key);
        }, this);
      }

      this.collection_ = {};
      if (config.collections)
      {
        for (var name in config.collections)
        {
          this.collection_[name] = new EntityCollection({
            name: name,
            wrapper: wrapper,
            source: this.all,
            rule: config.collections[name] || Function.$true
          });
        }
      }

      this.grouping_ = {};
      if (config.groupings)
      {
        for (var name in config.groupings)
        {
          this.grouping_[name] = new EntityGrouping({
            name: name,
            wrapper: wrapper,
            source: this.all,
            rule: config.groupings[name] || Function.$true
          });
        }
      }

      ;;;if (config.reflections) console.warn('Reflections are deprecated');

      entityClass__ = this.entityClass = Entity(this, this.all, index__, this.slot_, this.fields, this.defaults, this.getters, this.aliases).extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        getId: idField
          ? function(){
              return this.data[idField];
            }
          : Function.$null
      });
    },
    addField: function(key, wrapper){
      if (this.all.itemCount)
      {
        ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not added, you must destroy all existed entity first.');
        return;
      }

      this.aliases[key] = key;
      if (typeof wrapper == 'function')
      {
        this.fields[key] = wrapper;
        this.defaults[key] = this.fields[key]();
      }
      else
      {
        ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not a function. Field description has been ignored. Wraper: ', wrapper);
        this.fields[key] = $self;
        this.defaults[key] = this.defaults[key]; // init key
      }

      this.getters['get_' + key] = function(){
        return this.data[key];
      };
      /*this.setters['set_' + key] = function(value, rollback){
        return this.set(key, value, rollback);
      };*/

      if (!fieldDestroyHandlers[key])
        fieldDestroyHandlers[key] = {
          destroy: function(){
            this.set(key, null);
          }
        };
    },
    addCalcField: function(){
      if (!this.calcs)
        this.calcs = {};
      
      if (Object.keys(this.fields).some(wrapper.args.has, wrapper.args))
        throw 'Calculate field can\'t depend on calculate fields';

      this.calcs[key] = wrapper;
      this.fields[key] = function(value, oldValue){
        if (typeof console != 'undefined') console.log('Calculate fields is readonly');
        return oldValue;
      }
    },
    get: Function.$null,
    getId: function(entityOrData){
      if (entityOrData && this.idField)
      {
        var source = entityOrData;

        if (entityOrData instanceof DataObject)
          source = source.data;

        for (var i = 0, name; name = this.idFieldNames[i]; i++)
          if (name in source)
            return source[name];
      }
    },
    getSlot: function(id, defaults){
      var slot = this.slot_[id];
      if (!slot)
      {
        var defaults = extend({}, defaults);
        defaults[this.idField] = id;
        slot = this.slot_[id] = new DataObject({
          delegate: this.index__[id],
          data: defaults
        });
      }
      return slot;
    }
  });

  //
  //  Entity
  //

  function entityWarn(entity, message){
    ;;;if (typeof console != 'undefined') console.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.eventObjectId + ': ' + message, entity); 
  };

  function fieldCleaner(key){
    this.set(key, null);
  };

 /**
  * @class
  */
  var BaseEntity = Class(DataObject, {
    className: namespace + '.BaseEntity',
    init: EventObject.prototype.init
  });

 /**
  * @class
  */
  var Entity = function(entityType, all, index__, typeSlot, fields, defaults, getters, aliases){

    var idField = entityType.idField;

    return Class(BaseEntity, getters, {
      className: namespace + '.Entity',

      canHaveDelegate: false,
      index: index__,

      modified: null,
      isTarget: true,
      event_rollbackUpdate: EventObject.createEvent('rollbackUpdate'),

      extendConstructor_: false,
      init: function(data){
        //var entityType = this.entityType;

        // inherit
        BaseEntity.prototype.init.call(this);

        // copy default values

        // set up some properties
        this.fieldHandlers_ = {};
        this.data = {};//new entityType.xdefaults;//{};
        this.root = this;
        this.target = this;

        var values = {};

        for (var key in data)
          values[aliases[key] || key] = data[key];

        for (var key in fields)
        {
          var value = key in values ? fields[key](values[key]) : defaults[key];

          if (value && value !== this && value instanceof EventObject)
          {
              //this.destroyHandlers[this.eventObjectId] = fieldCleaner.bind(this, key);

            if (value.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          this.data[key] = value;
        }

        if (this.calcs)
        {
          for (var key in this.calcs)
            this.data[key] = this.calcs(this.data, this.data);
        }

        // add to index
        if (idField)
        {
          var id = this.data[idField];
          if (id != null)
          {
            index__.add(id, this);
            if (typeSlot[id])
              typeSlot[id].setDelegate(this);
          }
        }

        // reg entity in all entity type instances list
        all.event_datasetChanged(all, {
          inserted: [this]
        });
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      get: function(key){
        if (this.data)
          return this.data[aliases[key] || key];
      },
      set: function(key, value, rollback, silent){
        // resolve field key
        key = aliases[key] || key;

        // get value wrapper
        var valueWrapper = fields[key];

        if (!valueWrapper)
        {
          // exit if no new fields allowed
          if (!entityType.extensible)
          {
            ;;;entityWarn(this, 'Set value for "' + key + '" property is ignored.');
            return;
          }

          // emulate field wrapper
          valueWrapper = $self;
        }

        // main part
        var update = true;
        var delta;
        var updateDelta;
        var result;
        var rollbackData = this.modified;
        var newValue = valueWrapper(value, this.data[key]);
        var curValue = this.data[key];  // NOTE: value can be modify by valueWrapper,
                                        // that why we fetch it again after valueWrapper call

        var valueChanged = newValue !== curValue
                           // date comparation fix;
                           && (!newValue || !curValue || newValue.constructor !== Date || curValue.constructor !== Date || +newValue !== +curValue);

        // if value changed make some actions:
        // - update id map if neccessary
        // - attach/detach handlers on object destroy (for EventObjects)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged)
        {
          result = {};

          // NOTE: rollback mode is not allowed for id field
          if (idField == key)
          {
            // if current value is not null, remove old value from index first
            if (curValue != null)
            {
              index__.remove(curValue, this);
              if (typeSlot[curValue])
                typeSlot[curValue].setDelegate();
            }

            // if new value is not null, add new value to index
            if (newValue != null)
            {
              index__.add(newValue, this);
              if (typeSlot[newValue])
                typeSlot[newValue].setDelegate(this);
            }
          }
          else
          {
            // NOTE: rollback mode is not allowed for id field
            if (rollback)
            {
              // rollback mode

              // create rollback storage if absent
              // actually this means rollback mode is switched on
              if (!rollbackData)
                this.modified = rollbackData = {};

              // save current value if key is not in rollback storage
              // if key is not in rollback storage, than this key didn't change since rollback mode was switched on
              if (key in rollbackData === false)
              {
                // create rollback delta
                result.rollback = {
                  key: key,
                  value: undefined
                };

                // store current value
                rollbackData[key] = curValue;
              }
              else
              {
                if (rollbackData[key] === newValue)
                {
                  result.rollback = {
                    key: key,
                    value: newValue
                  };

                  delete rollbackData[key];

                  if (!Object.keys(rollbackData).length)
                    this.modified = null;
                }
              }
            }
            else
            {
              // if update with no rollback and object in rollback mode
              // and has changing key in rollback storage, than change
              // value in rollback storage, but not in info
              if (rollbackData && key in rollbackData)
              {
                if (rollbackData[key] !== newValue)
                {
                  // create rollback delta
                  result.rollback = {
                    key: key,
                    value: rollbackData[key]
                  };

                  // store new value
                  rollbackData[key] = newValue;

                  // prevent data update
                  update = false;
                }
                else
                  return false;
              }
            }
          }

          if (update)
          {
            // set new value for field
            this.data[key] = newValue;
            
            // remove attached handler if exists
            if (this.fieldHandlers_[key])
            {
              curValue.removeHandler(fieldDestroyHandlers[key], this);
              this.fieldHandlers_[key] = false;
            }

            // add new handler if object is instance of EventObject
            // newValue !== this prevents recursion for self update
            if (newValue && newValue !== this && newValue instanceof EventObject)
            {
              if (newValue.addHandler(fieldDestroyHandlers[key], this))
                this.fieldHandlers_[key] = true;
            }

            // prepare result
            result.key = key;
            result.value = curValue;
          }
        }
        else
        {
          if (!rollback && rollbackData && key in rollbackData)
          {
            // delete from rollback
            result = {
              rollback: {
                key: key,
                value: rollbackData[key]
              }
            };

            delete rollbackData[key];

            if (!Object.keys(rollbackData).length)
              this.modified = null;
          }
        }

        // fire events for not silent mode
        if (!silent && result)
        {
          var delta = {};
          var update = result.key;

          if (this.calcs)
          {
            for (var key in this.calcs)
            {
              var value = this.calcs[key].call(this, this.data, this.data)
              if (this.data[key] !== value)
              {
                delta[key] = this.data[key];
                this.data[key] = value;
                update = true;
              }
            }
          }

          if (update)
          {
            delta[key] = curValue;
            this.event_update(this, delta);
          }

          if (result.rollback)
          {
            var rollbackDelta = {};
            rollbackDelta[result.rollback.key] = result.rollback.value;
            this.event_rollbackUpdate(this, rollbackDelta);
          }
        }

        // return delta or false (if no changes)
        return result || false;
      },
      update: function(data, rollback){
        if (data)
        {
          var update;
          var delta = {};

          var rollbackUpdate;
          var rollbackDelta = {};

          var setResult;

          // update fields
          for (var key in data)
          {
            if (setResult = this.set(key, data[key], rollback, true)) //this.set(key, data[key], rollback))
            {
              if (setResult.key)
              {
                update = true;
                delta[setResult.key] = setResult.value;
              }
              if (setResult.rollback)
              {
                rollbackUpdate = true;
                rollbackDelta[setResult.rollback.key] = setResult.rollback.value;
              }
            }
          }

          if (this.calcs)
          {
            for (var key in this.calcs)
            {
              var value = this.calcs[key].call(this, this.data, this.data)
              if (this.data[key] !== value)
              {
                delta[key] = this.data[key];
                this.data[key] = value;
                update = true;
              }
            }
          }

          // dispatch events
          if (update)
            this.event_update(this, delta);

          if (rollbackUpdate)
            this.event_rollbackUpdate(this, rollbackDelta);
        }

        return update ? delta : false;
      },
      reset: function(){
        this.update(defaults);
      },
      clear: function(){
        var data = {};
        for (var key in this.data)
          data[key] = undefined;
        return this.update(data);
      },
      commit: function(data){
        if (this.modified)
        {
          var rollbackData = this.modified;
          this.modified = null;
        }

        this.update(data);

        if (rollbackData)
          this.event_rollbackUpdate(this, rollbackData);
      },
      rollback: function(){
        if (this.state == STATE.PROCESSING)
        {
          ;;;entityWarn(this, 'Entity in processing state (entity.rollback() aborted)');
          return;
        }

        if (this.modified)
        {
          var rollbackData = this.modified;
          this.modified = null;
          this.update(rollbackData);

          this.event_rollbackUpdate(this, rollbackData);
        }
        this.setState(STATE.READY);
      },
      destroy: function(){
        // shortcut
        //var entityType = this.entityType;

        // unlink attached handlers
        for (var key in this.fieldHandlers_)
          this.data[key].removeHandler(fieldDestroyHandlers[key], this);
          //removeFromDestroyMap(this.data[key], this, key);
        this.fieldHandlers_ = NULL_INFO;

        // delete from index
        var id = this.data[idField];
        if (id)
          index__.remove(id, this);

        // inherit
        DataObject.prototype.destroy.call(this);

        // delete from all entity type list (is it right order?)
        all.event_datasetChanged(all, {
          deleted: [this]
        });

        // clear links
        this.data = NULL_INFO; 
        this.modified = null;
      }
    });
  };

  //
  // Misc
  //

  function isEntity(value){
    return value && value instanceof Entity;
  }

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    isEntity: isEntity,

    NumericId: NumericId,
    IntId: IntId,
    StringId: StringId,
    Index: Index,
    CalculateField: CalculateField,

    EntityType: EntityTypeWrapper,
    Entity: Entity,
    BaseEntity: BaseEntity,

    EntitySetType: EntitySetWrapper,
    EntitySet: EntitySet,
    ReadOnlyEntitySet: ReadOnlyEntitySet,
    Collection: EntityCollection,
    Grouping: EntityGrouping
  });

})();