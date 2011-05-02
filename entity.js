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

    var ENTITYSET_WRAP_METHOD = function(data){
      return this.inherit(data && data.map(this.wrapper));
    };

    var ENTITYSET_INIT_METHOD = function(name){
      return function(config){
        if (config)
        {
          this.name = config.name || getUntitledName(name);
          this.wrapper = config.wrapper;
        }
        else
          this.name = getUntitledName(name);

        this.inherit(config);
      }
    }

    var ENTITYSET_SYNC_METHOD = function(data, set){

      Dataset.setAccumulateState(true);
      data = (data || []).map(this.wrapper);
      Dataset.setAccumulateState(false);

      var res = this.inherit(data, set);

      return res;
    };

   /**
    * @class
    */
    var EntitySet = Class(Dataset, {
      className: namespace + '.EntitySet',

      wrapper: Function.$self,

      init: ENTITYSET_INIT_METHOD('EntitySet'),
      sync: ENTITYSET_SYNC_METHOD,

      set: ENTITYSET_WRAP_METHOD,
      add: ENTITYSET_WRAP_METHOD,
      remove: ENTITYSET_WRAP_METHOD,

      destroy: function(){
        this.inherit();

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

      init: ENTITYSET_INIT_METHOD('EntityCollection'),
      sync: ENTITYSET_SYNC_METHOD/*,

      set: ENTITYSET_WRAP_METHOD,
      add: ENTITYSET_WRAP_METHOD,
      remove: ENTITYSET_WRAP_METHOD*/
    });

    //
    // Entity grouping
    //

   /**
    * @class
    */
    var EntityGrouping = Class(Grouping, {
      className: namespace + '.EntityGrouping',

      groupClass: ReadOnlyEntitySet,

      init: ENTITYSET_INIT_METHOD('EntityGrouping'),
      sync: ENTITYSET_SYNC_METHOD,

      getGroup: function(object, autocreate){
        var group = this.inherit(object, autocreate);
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
                    return entityType.singleton = new entityType.entityClass(data);
                }
              }
            }

            if (idValue != null)
              entity = entityType.map_[idValue];

            if (entity && entity.entityType === entityType)
              entity.update(data);
            else
              entity = new entityType.entityClass(data);

            return entity;
          }
          else
            return entityType.singleton;
        };

        var entityType = new EntityTypeConstructor(config || {}, result);
        var entityClass = entityType.entityClass;
        var isSingleton = entityType.isSingleton;

        extend(result, {
          entityType: entityType,

          get: function(data){
            return entityType.get(data);
          },
          getAll: function(){
            return arrayFrom(entityType.all.getItems());
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
                sources: [dataset || entityType.all],
                filter: memberSelector
              });
            }

            return collection;
          },
          getCollection: function(name){
            return entityType.collection_[name];
          },
          createGrouping: function(name, groupGetter, dataset){
            var grouping = entityType.grouping_[name];
            if (!grouping && groupGetter)
            {
              return entityType.grouping_[name] = new EntityGrouping({
                wrapper: result,
                sources: [dataset || entityType.all],
                groupGetter: groupGetter
              });
            }

            return grouping;
          },
          getGrouping: function(name){
            return entityType.grouping_[name];
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
    // Entity type construcotr
    //

    var get_singleton = getter('singleton');
    var fieldDestroyHandlers = {};

   /**
    * @class
    */
    var EntityTypeConstructor = Class(null, {
      className: namespace + '.EntityType',
      name: 'UntitledEntityType',

      defaults: {},
      fields: {},
      extensible: false,

      init: function(config, wrapper){
        this.name = config.name || getUntitledName(this.name);

        ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, getter('name'))) console.warn('Dublicate entity type name: ', this.name);
        entityTypes.push(this);

        this.isSingleton = config.isSingleton;
        this.wrapper = wrapper;

        this.all = new ReadOnlyEntitySet({
          wrapper: wrapper
        });
        this.map_ = {};

        if (config.extensible)
          this.extensible = true;

        this.fields = {};
        this.defaults = {};
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
                  data = data.info;
                return data[idField]; 
              }
            };

            this.getId = getId;
            this.get = function(data){
              return this.map_[isKeyType[typeof data] ? idFieldWrapper(data) : getId(data)];
            };
          }
        }
        else
        {
          this.get = get_singleton;
        }

        this.aliases = {};
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
              sources: [this.all],
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
              sources: [this.all],
              groupGetter: config.groupings[name] || Function.$true
            });
          }
        }

        this.reflection_ = {};
        if (config.reflections)
          for (var name in config.reflections)
            this.addReflection(name, config.reflections[name]);

        this.entityClass = Class(Entity, {
          className: namespace,//this.constructor.className + '.' + this.name.replace(/\s/g, '_'),
          entityType: this,
          all: this.all,
          getId: idField
            ? function(){
                return this.info[idField];
              }
            : Function.$null
        });
      },
      addField: function(key, wrapper){
        if (this.all.length)
        {
          ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not added, because instance of this entity type has already exists.');
          return;
        }

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
      addReflection: function(name, cfg){
        var ref = new Reflection(name, cfg);
        this.reflection_[name] = ref;
        var all = this.all.getItems();
        for (var i = all.length; --i >= 0;)
          ref.update(all[i]);
      },
      get: Function.$null,
      /*create: function(data){
        var entity = this.singleton || new this.entityClass(data);

        if (this.isSingleton)
          this.singleton = entity;

        return entity;
      },*/
      getId: function(entityOrData){
        if (entityOrData && this.idField)
        {
          var source = entityOrData;

          if (entityOrData instanceof DataObject)
            source = source.info;

          for (var i = 0, name; name = this.idFieldNames[i]; i++)
            if (name in source)
              return source[name];
        }
      }
    });

    //
    //  Entity
    //

    function entityWarn(entity, message){
      ;;;if (typeof console != 'undefined') console.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.eventObjectId + ': ' + message, entity); 
    };

    var ENTITY_ROLLBACK_HANDLER = {
      stateChanged: function(object, oldState){
        if (this.state == STATE.READY)
          this.rollbackData_ = null;
      }
    };

   /**
    * @class
    */
    var Entity = Class(DataObject, {
      className: namespace + '.Entity',

      canHaveDelegate: false,

      rollbackData_: null,
      silentSet_: false,

      behaviour: {
        update: function(object, delta){
          this.inherit(object, delta);

          for (var name in this.entityType.reflection_)
            this.entityType.reflection_[name].update(this);
        },
        destroy: function(){
          this.inherit();

          for (var name in this.reflection_)
            this.entityType.reflection_[name].detach(this);
        }
      },

      init: function(data){
        var entityType = this.entityType;

        // inherit
        this.inherit();

        // copy default values
        // make it here, because update event dispatch on this.inherit() when info passed in config
        //this.info = extend({}, this.entityType.defaults);

        // set up some properties
        this.fieldHandlers_ = {};
        this.value = // backward compatibility
        this.info = {};
        //this.delegate = this;

        var defaults = entityType.defaults;
        var fields = entityType.fields;
        var aliases = entityType.aliases;
        
        var values = {};

        for (var key in data)
          values[aliases[key] || key] = data[key];

        for (var key in defaults)
        {
          var value = key in values ? fields[key](values[key]) : defaults[key];

          if (entityType.idField == key)
          {
            if (value != null)
            {
              if (entityType.map_[value])
              {
                ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.info[key] + ' => ' + value);
                continue;
              }

              entityType.map_[value] = this;
            }
          }

          if (value && value !== this && value instanceof EventObject)
          {
            //if (value.addHandler(fieldDestroyHandlers[key], this))
            value.handlers_.push({
              handler: fieldDestroyHandlers[key],
              thisObject: this
            });
            this.fieldHandlers_[key] = true;
          }

          this.info[key] = value;
        }

        // apply data for entity
        /*/this.silentSet_ = true;

        
        for (var key in defaults)
          this.info[key] = defaults[key];

        if (data)
        {
          for (var key in data)
            this.set(key, data[key]);
        }

        this.silentSet_ = false;/**/

        // reg entity in all entity type instances list
        var all = this.all;

        all.map_[this.eventObjectId] = this;
        all.version++;
        all.itemCount++;

        all.dispatch('datasetChanged', all, {
          inserted: [this]
        });

        // fire reflections
        this.reflection_ = {};
        for (var name in entityType.reflection_)
          entityType.reflection_[name].update(this);
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      get: function(key){
        if (this.info)
          return this.info[this.entityType.aliases[key] || key];
      },
      set: function(key, value, rollback){
        // shortcut
        var entityType = this.entityType;

        // resolve field key
        key = entityType.aliases[key] || key;

        // get value wrapper
        var valueWrapper = entityType.fields[key];

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
        var delta;
        var newValue = valueWrapper(value, this.info[key]);
        var curValue = this.info[key];  // NOTE: value can be modify by valueWrapper,
                                        // that why we fetch it again after valueWrapper call

        var valueChanged = newValue !== curValue
                           // date comparation fix;
                           && (!newValue || !curValue || newValue.constructor !== Date || curValue.constructor !== Date || Number(newValue) !== Number(curValue));

        // if value changed make some actions:
        // - update id map if neccessary
        // - attach/detach handlers on object destroy (for EventObjects)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged)
        {
          if (entityType.idField == key)
          {
            var map_ = entityType.map_;
            if (map_[newValue])
            {
              ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.info[key] + ' => ' + newValue);
              return;
            }

            if (curValue != null)
              delete map_[curValue];

            if (newValue != null)
              map_[newValue] = this;
          }

          // set new value for field and increase updateCount
          this.info[key] = newValue;
          this.updateCount += 1;
          
          // remove attached handler if exists
          if (this.fieldHandlers_[key])
          {
            curValue.removeHandler(fieldDestroyHandlers[key], this);
            delete this.fieldHandlers_[key];
          }

          // add new handler if object is instance of EventObject
          // newValue !== this prevents recursion for self update
          if (newValue && newValue !== this && newValue instanceof EventObject)
          {
            if (newValue.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          } 
          

          // prepare result and delta;
          delta = {};
          delta[key] = curValue;

          // if rollback mode - store changes
          if (rollback)
          {
            if (!this.rollbackHandler_)
              this.rollbackHandler_ = this.addHandler(ENTITY_ROLLBACK_HANDLER);
            this.rollbackData_ = complete(this.rollbackData_ || {}, delta);
          }

          // fire event for not silent mode
          if (!this.silentSet_)
            this.dispatch('update', this, delta);
        }

        // return delta or false (if no changes)
        return delta ? { key: key, value: curValue } : false;
      },
      update: function(data, forceEvent, rollback){
        if (data)
        {
          var updateCount = 0;
          var delta = {};
          var setResult;

          // switch off change event dispatch
          this.silentSet_ = true;

          // update fields
          for (var key in data)
            if (setResult = this.set(key, data[key], rollback))
            {
              updateCount++;
              delta[setResult.key] = setResult.value;
            }

          // switch on change event dispatch
          this.silentSet_ = false;

          // dispatch event
          if (updateCount)
          {
            this.dispatch('update', this, delta);
            return delta;
          }
        }

        return false;
      },
      reset: function(){
        this.update(this.entityType.defaults);
      },
      clear: function(){
        var data = {};
        for (var key in this.info)
          data[key] = undefined;
        return this.update(data);
      },
      rollback: function(){
        if (this.state == STATE.PROCESSING)
        {
          ;;;entityWarn(this, 'Entity in processing state (entity.rollback() aborted)');
          return;
        }

        if (this.rollbackData_)
        {
          this.update(this.rollbackData_);
          delete this.rollbackData_;
        }
        this.setState(STATE.READY);
      },
      destroy: function(){
        // shortcut
        var entityType = this.entityType;

        // unlink attached handlers
        for (var key in this.fieldHandlers_)
          this.info[key].removeHandler(fieldDestroyHandlers[key], this);
          //removeFromDestroyMap(this.info[key], this, key);
        delete this.fieldHandlers_;

        // delete from identify hash
        var id = this.info[entityType.idField];
        if (entityType.map_[id] === this)
          delete entityType.map_[id];

        // delete from all entity type list
        var all = this.all;

        delete all.map_[this.eventObjectId];
        all.version++;
        all.itemCount--;

        // inherit
        this.inherit();

        all.dispatch('datasetChanged', all, {
          deleted: [this]
        });

        this.value = // backward compatibility
        this.info = {}; 

        delete this.rollbackData_;

        // clear links
        //delete this.info;
        //delete this.value;
      }
    });

    //
    // Reflection
    //

   /**
    * @class
    */
    var Reflection = Class(null, {
      className: namespace + '.Reflection',
      init: function(name, config){
        this.name = name;
        this.keepReflectionAlive = config.keepReflectionAlive === true;
        this.dataGetter = config.dataGetter || $self;
        this.destroyDataGetter = config.destroyDataGetter || null;
        this.entityType = config.entityType || $self;
        this.isExists = config.isExists || function(value){ return !!Object.keys(value).length };
      },
      update: function(entity){
        if (this.isExists(entity.info, entity))
          this.attach(entity, this.name);
        else
          this.detach(entity, this.name);
      },
      attach: function(entity){
        var ref = entity.reflection_[this.name];
        var data = this.dataGetter(entity.info, entity);
        if (ref)
        {
          if (ref instanceof DataObject)
            ref.update(data);
          else
            extend(ref, data);
        }
        else
          entity.reflection_[this.name] = this.entityType(data);
      },
      detach: function(entity){
        var ref = entity.reflection_[this.name];
        if (ref)
        {
          if (!this.keepReflectionAlive)
          {
            if (typeof ref.destroy == 'function')
              ref.destroy();
          }
          else
          {
            if (this.destroyDataGetter)
            {
              var data = this.destroyDataGetter(entity.info, entity);
              if (ref instanceof DataObject)
                ref.update(data);
              else
                extend(ref, data);
            }
          }
          delete entity.reflection_[this.name];
        }
      },
      destroy: function(){
      }
    });

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

      EntitySetType: EntitySetWrapper,
      EntitySet: EntitySet,
      ReadOnlyEntitySet: ReadOnlyEntitySet,
      Collection: EntityCollection,
      Grouping: EntityGrouping
    });

  })();