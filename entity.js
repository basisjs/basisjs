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

            if (idValue != null)
              entity = entityType.index_[idValue];

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
        var entityClass = entityType.entityClass;
        var isSingleton = entityType.isSingleton;

        extend(result, {
          toString: function(){
            return this.typeName + '()';
          },
          entityType: entityType,
          type: result,
          typeName: entityType.name,

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
                filter: memberSelector
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

      index_: null,
      slot_: null,

      init: function(config, wrapper){
        this.name = config.name || getUntitledName(this.name);

        ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, getter('name'))) console.warn('Dublicate entity type name: ', this.name);
        entityTypes.push(this);

        this.isSingleton = config.isSingleton;
        this.wrapper = wrapper;

        this.all = new ReadOnlyEntitySet(Object.extend(config.all || {}, {
          wrapper: wrapper
        }));
        this.index_ = {};
        this.slot_ = {};

        if (config.extensible)
          this.extensible = true;

        this.fields = {};
        this.defaults = {};
        this.aliases = {};
        if (config.fields)
          for (var key in config.fields)
          {
            var func = config.fields[key];
            this.addField(key, func);
            if ([NumericId, IntId, StringId].has(func))
              config.id = key;
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
              return this.index_[isKeyType[typeof data] ? idFieldWrapper(data) : getId(data)];
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
              filter: config.collections[name] || Function.$true
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
        /*this.reflection_ = {};
        if (config.reflections)
          for (var name in config.reflections)
            this.addReflection(name, config.reflections[name]);*/

        this.entityClass = Entity(this, this.all, this.index_, this.slot_, this.fields, this.defaults, this.aliases);
        this.entityClass.prototype.entityType = this;
        this.entityClass.prototype.type = wrapper;
        this.entityClass.prototype.typeName = this.name;
        this.entityClass.prototype.getId = idField
            ? function(){
                return this.data[idField];
              }
            : Function.$null;
        /*Class(, {
        
          className: namespace,//this.constructor.className + '.' + this.name.replace(/\s/g, '_'),
          entityType: this,
          defaults: this.defaults,
          all: this.all,
          getId: idField
            ? function(){
                return this.data[idField];
              }
            : Function.$null
        });*/
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

        if (!fieldDestroyHandlers[key])
          fieldDestroyHandlers[key] = {
            destroy: function(){
              this.set(key, null);
            }
          };
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
            delegate: this.index_[id],
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
    var Entity = function(entityType, all, typeIndex, typeSlot, fields, defaults, aliases){

      var idField = entityType.idField;

      return Class(BaseEntity, {
        className: namespace + '.Entity',

        canHaveDelegate: false,

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

          if (idField)
          {
            var id = this.data[idField];
            if (id != null)
            {
              if (typeIndex[id])
              {
                // id value is used by another entity
                ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.data[key] + ' => ' + value);
                this.data[idField] = null;
              }
              else
              {
                // id value is free, use it
                typeIndex[id] = this;

                // link to slot
                var slot = typeSlot[id];
                if (slot)
                  slot.setDelegate(this); 
              }
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
              // if new value is already in use, ignore changes
              if (typeIndex[newValue])
              {
                ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.data[key] + ' => ' + newValue);
                return false;  // no changes
              }

              // if current value is not null, remove old value from index first
              if (curValue != null)
              {
                delete typeIndex[curValue];
                if (typeSlot[curValue])
                  typeSlot[curValue].setDelegate();
              }

              // if new value is not null, add new value to index
              if (newValue != null)
              {
                typeIndex[newValue] = this;
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
            if (result.key)
            {
              var delta = {};
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

          // delete from identify hash
          var id = this.data[idField];
          if (typeIndex[id] === this)
          {
            delete typeIndex[id];
            if (typeSlot[id])
              typeSlot[id].setDelegate();
          }

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