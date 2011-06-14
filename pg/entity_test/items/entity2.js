
  (function(){

   /**
    * @namespace Basis.Entity
    */

    var namespace = 'Basis.Entity';

    // import names

    var Class = Basis.Class;
    var Data = Basis.Data;
    var Cleaner = Basis.Cleaner;

    var extend = Object.extend;
    var complete = Object.complete;
    var arrayFrom = Array.from;
    var $self = Function.$self;

    var nsWrapers = Basis.DOM.Wrapers;

    var EventObject = nsWrapers.EventObject;
    var DataObject = nsWrapers.DataObject;
    var STATE = nsWrapers.STATE;

    //

    var isKeyType = { 'string': 1, 'number': 1 };
    var entityTypes = [];
    var readOnly_ = {};

    function setReadOnly(object, isReadOnly){
      readOnly_[object.eventObjectId] = isReadOnly;
    };

    //var isReadOnly = Data('eventObjectId', readOnly_);
    function isReadOnly(object){
      return readOnly_[object.eventObjectId];
    }

    // ---

    var untitledNames = {};
    function getUntitledName(name){
      untitledNames[name] = untitledNames[name] || 0;
      return name + (untitledNames[name]++);
    }

    function optimizeDelta(delta){
      var resultDelta = {};
      var result = false;

      for (var key in delta)
        if (delta[key] && delta[key].length)
        {
          resultDelta[key] = delta[key];
          result = true;
        }

      if (result)
        return resultDelta;
    }

    /**
     *  EntitySetWrapper
     */

    var EntitySetWrapper = function(wrapper){
      if (this instanceof EntitySetWrapper)
      {
        var entitySetType = new EntitySetType(wrapper || $self);

        return function(data, entitySet){
          if (data != null)
          {
            if (!(entitySet instanceof EntitySet))
              entitySet = entitySetType.createEntitySet();

            entitySet.set(data instanceof EntitySet ? data.items : data);

            return entitySet;
          }
          else
            return null;
        };
      }
    };
    EntitySetWrapper.className = namespace + '.EntitySetWrapper';

    var EntitySetType = Class(null, {
      className: namespace + '.EntitySetType',

      init: function(wrapper){
        this.wrapper = wrapper;
      },
      createEntitySet: function(){
        return new EntitySet(this.wrapper, 'Set of ' + ((this.wrapper.entityType || this.wrapper).name || '').quote('{'));
      }
    });

    // ----------------

    var ENTITYSET_ENTITY_HANDLER = {
      update: function(object, newInfo, oldInfo, delta){
        this.dispatch('itemUpdate', object, newInfo, oldInfo, delta);
      },
      destroy: function(object){
        this.remove([object]);
      }
    };

    var eventObjectIdGetter = function(object){ return object.eventObjectId };

    function binInsert(array, item, id){
      array.splice(array.binarySearchPos(id || eventObjectIdGetter(item), eventObjectIdGetter), 0, item);
    }
    function binRemove(array, item, id){
      array.splice(array.binarySearchPos(id || eventObjectIdGetter(item), eventObjectIdGetter), 1);
    }

    function addItem(dataset, object){
      var objectId = object.eventObjectId;
      dataset.map_[objectId] = object;
      //dataset.items.splice(dataset.items.binarySearchPos(objectId, eventObjectIdGetter), 0, object);
      binInsert(dataset.items, object, objectId);
      object.addHandler(ENTITYSET_ENTITY_HANDLER, dataset);
      return object;
    }

    function removeItem(dataset, object){
      var objectId = object.eventObjectId;
      delete dataset.map_[objectId];
      //dataset.items.splice(dataset.items.binarySearchPos(objectId, eventObjectIdGetter), 1);
      binRemove(dataset.items, object, objectId);
      object.removeHandler(ENTITYSET_ENTITY_HANDLER, dataset);      
      return object;
    }

    var EntitySet = Class(DataObject, {
      className: namespace + '.EntitySet',

      init: function(wrapper, title){
        this.inherit();

        this.wrapper = wrapper;
        this.map_ = {};
        this.items = [];
      },

      setDelegate: Function.$null,
      
      has: function(object){
        return !!(object && this.map_[object.eventObjectId]);
      },
      set: function(data){

        // prevent changes for readonly datasets
        if (isReadOnly(this))
          return;

        // a little optimizations
        if (!this.items.length)
          return this.add(data);

        if (!data.length)
          return this.clear();

        // main part

        // convert data to neccessary type
        data = arrayFrom(data);

        // build map for new data
        var map_ = {};
        for (var i = 0; i < data.length; i++)
        {
          var object = this.wrapper(data[i]);
          var objectId = object.eventObjectId;

          map_[objectId] = object;
        }

        // delete data
        var deleted = [];
        for (var objectId in this.map_)
        {
          if (map_[objectId])
          {
            delete map_[objectId];
          }
          else
          {
            /*
              var object = this.map_[objectId];
              removeItem(this, object);
              deleted.push(object);
            */
            deleted.push(removeItem(this, this.map_[objectId]));
          }
        }
        
        // insert data
        var inserted = [];
        for (var objectId in map_)
        {
          /*
            var object = map_[objectId];
            addItem(this, object);
            inserted.push(object);
          */
          inserted.push(addItem(this, map_[objectId]));
        }

        // trace changes
        var delta;
        if (delta = optimizeDelta({ inserted: inserted, deleted: deleted }))
        {
          this.dispatch('datasetChanged', this, delta);
          return delta;
        }
      },
      add: function(data){
        // prevent changes for readonly datasets
        if (isReadOnly(this))
          return;

        // convert data to neccessary type
        data = arrayFrom(data);
        
        // insert
        var delta;
        var inserted = [];
        for (var i = 0; i < data.length; i++)
        {
          var object = this.wrapper(data[i]);
          var objectId = object.eventObjectId;
          if (!this.map_[objectId])
          {
            /*
              addItem(this, object);
              inserted.push(object);
            */
            inserted.push(addItem(this, object));
          }
        }

        // trace changes
        if (inserted.length)
          this.dispatch('datasetChanged', this, delta = {
            inserted: inserted
          });

        return delta;
      },
      remove: function(data){
        // prevent changes for readonly datasets
        if (isReadOnly(this))
          return;

        // convert data to neccessary type
        data = arrayFrom(data);

        // delete items
        var delta;
        var deleted = [];
        for (var i = 0; i < data.length; i++)
        {
          var object = this.wrapper(data[i]);
          var objectId = object.eventObjectId;
          if (this.map_[objectId])
          {
            /*
              removeItem(this, object);
              deleted.push(object);
            */
            deleted.push(removeItem(this, object));
          }
        }

        // trace changes
        if (deleted.length)
          this.dispatch('datasetChanged', this, delta = {
            deleted: deleted
          });

        return delta;
      },

      clear: function(){
        // prevent changes for readonly datasets
        if (isReadOnly(this))
          return;

        var delta;
        var deleted = this.items.splice(0);
        this.map_ = {};

        if (deleted.length)
        {
          for (var i = 0; i < deleted.length; i++)
            deleted[i].removeHandler(ENTITYSET_ENTITY_HANDLER, this);

          this.dispatch('datasetChanged', this, delta = {
            deleted: deleted
          });
        }

        return delta;
      },

      destroy: function(){
        this.clear();
        this.inherit();
        delete this.wrapper;
        delete this.map_;
        delete this.items;
      }
    });


    function buffer_addItem(buffer, dataset, object){
      var objectId = object.eventObjectId;
      var datasetId = dataset.eventObjectId;
      var map_ = buffer.map_[objectId];
      if (!map_)
      {
        map_ = buffer.map_[objectId] = {
          obj: object,
          cnt: 0
        };
      }

      if (!map_[datasetId])
      {
        map_[datasetId] = dataset;
        return !(map_.cnt++); // return true if object is new item
      }
    }

    function buffer_removeItem(buffer, dataset, object){
      var objectId = object.eventObjectId;
      var datasetId = dataset.eventObjectId;
      var map_ = buffer.map_[objectId];
      if (map_ && map_[datasetId])
      {
        delete map_[datasetId];
        if (map_.cnt-- == 1)
        {
          delete buffer.map_[objectId];
          return true;
        }
      }
    }

    var bufferHandler = {
      datasetChanged: function(object, delta){
        var inserted = [];
        var deleted = [];

        if (delta.inserted)
        {
          for (var i = 0, item; item = delta.inserted[i]; i++)
            if (buffer_addItem(this, object, item))
            {
              inserted.push(item);
              binInsert(this.buffer, item);
            }
        }

        if (delta.deleted)
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
            if (buffer_removeItem(this, object, item))
            {
              deleted.push(item);
              binRemove(this.buffer, item);
            }
        }

        if (delta = optimizeDelta({ inserted: inserted, deleted: deleted }))
          this.dispatch('bufferChanged', this, delta);
      }
    };

    var DatasetBuffer = Class(EventObject, {
      className: namespace + '.DatasetBuffer',
      init: function(config){
        this.sources = [];
        this.buffer = [];
        this.map_ = {};

        return this.inherit(config);
      },
      add: function(source){
        if (source instanceof EntitySet)
        {
          var objectId = source.eventObjectId;
          if (!this.map_[objectId])
          {
            this.map_[objectId] = source;
            this.sources.push(source);

            source.addHandler(bufferHandler, this);
            bufferHandler.datasetChanged.call(this, source, { inserted: source.items });

            return true;
          }
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.add: source isn\'t type of EntitySet');
        }
      },
      remove: function(source){
        if (source instanceof EntitySet)
        {
          var objectId = source.eventObjectId;
          if (this.map_[objectId])
          {
            delete this.map_[objectId];
            this.sources.remove(source);

            source.removeHandler(bufferHandler, this);
            bufferHandler.datasetChanged.call(this, source, { deleted: source.items });

            return true;
          }
        }
        else
        {
          ;;;if(typeof console != 'undefined') console.warn(this.className + '.remove: source isn\'t type of EntitySet');
        }
      },
      set: function(){},
      clear: function(){}
    });

    var FILTER_INSERT = 'inserted';
    var FILTER_DELETE = 'deleted';

    function filterItem(dataset, object){
      var objectId = object.eventObjectId;
      var isExists = !!dataset.filter(object);
      var hasItem = !!dataset.map_[objectId];
      if (isExists ^ hasItem)
      {
        if (isExists)
        {
          dataset.map_[objectId] = object;
          binInsert(dataset.items, object);
          return FILTER_INSERT;
        }
        else
        {
          delete dataset.map_[objectId];
          binRemove(dataset.items, object);
          return FILTER_DELETE;
        }
      }
    }

    var esm_handler = {
      update: function(object){
        var delta = filterItem(this, object);
        if (delta)
        {
          this.dispatch('datasetChanged', this.items,
            delta == FILTER_INSERT
              ? { inserted: [object] }
              : { deleted:  [object] }
          );
        }
      }
    };

    var EntitySetMerger = Class(EntitySet, {
      init: function(){

        this.sources = new DatasetBuffer({
          handlersContext: this,
          handlers: {
            bufferChanged: function(object, delta){
              var inserted = [];
              var deleted = [];
              if (delta.inserted)
              {
                for (var i = 0, item; item = delta.inserted[i]; i++)
                {
                  item.addHandler(esm_handler, this);

                  if (filterItem(this, item))
                    inserted.push(item);
                }
              }

              if (delta.deleted)
              {
                for (var i = 0, item; item = delta.deleted[i]; i++)
                {
                  item.removeHandler(esm_handler, this);

                  if (this.map_[item.eventObjectId])
                  {
                    delete this.map_[item.eventObjectId];
                    binRemove(this.items, item);
                    deleted.push(item);
                  }
                }
              }

              if (delta = optimizeDelta({ inserted: inserted, deleted: deleted }))
                this.dispatch('datasetChanged', this, delta);
            }
          }
        });

        this.filter = function(e){ return e.info.Id % 2 };

        this.inherit($self);
      },
      setFilter: function(filter){
        filter = filter ? Data(filter) : Function.$true;
        if (this.filter != filter)
        {
          this.filter = filter;

          var items = this.sources.buffer;
          var inserted = [];
          var deleted = [];
          for (var i = 0, item; item = items[i]; i++)
          {
            switch (filterItem(this, item)){
              case FILTER_INSERT: inserted.push(item); break;
              case FILTER_DELETE: deleted.push(item); break;
            }
          }

          var delta;
          if (delta = optimizeDelta({ inserted: inserted, deleted: deleted }))
            this.dispatch('datasetChanged', this, delta);
        }
      }
    })

   /*
    *  EntityTypeWrapper
    */

    var EntityTypeWrapper = function(config){
      if (this instanceof EntityTypeWrapper)
      {
        var result = function(newData, entity){
          // newData - data for target EntityType instance
          // entity - current instance of target EntityType

          if (newData != null)
          {
            // if newData instance of target EntityType return newData
            if (newData === entity || newData instanceof entityClass)
              return newData;

            // fetch data
            var data = newData instanceof DataObject ? newData.info : newData;

            /*
            var parse = !(entity instanceof entityClass)
                        || !isKeyType[typeof data]
                        || entityType.idField;

            if (parse)
              entity = entityType.parse(data, true);
            else
              entity.update(data);
            */

            var refEntity = entityType.get(data);
            if (entity && (!refEntity || entity !== refEntity))
              entity.update(data)
            else
              entity = entityType.parse(data, true);

            return entity;
          }
          else
            return entityType.isSingleton ? entityType.create() : null;
        };

        var entityType = new EntityTypeConstructor(config, result);
        var entityClass = entityType.entityClass;

        extend(result, {
          /*getConfig: function(){
            var result = {
              id: entityType.idField,
              name: entityType.name,
              fields: {},
              aliases: {},
              reflection: {}
            };
            for (var key in entityType.fields)
              result.fields[key] = {
                wrapper: entityType.fields[key],
                defaultValue: entityType.defaults[key]
              };
            for (var key in entityType.reflection_)
              result.reflection[key] = {
                description: 'todo...'
              };
            for (var key in entityType.aliases)
              result.aliases[key] = entityType.aliases[key];

            return result;
          },*/
          get: function(data){
            return entityType.get(data);
          },
          getAll: function(){
            return arrayFrom(entityType.all.items);
          },
          addField: function(key, wrapper){
            entityType.addField(key, wrapper);
          },
          all: entityType.all,
          createCollection: function(name, memberSelector, entitySet){
            var collection = entityType._collection[name];

            if (!collection && memberSelector)
            {
              collection = entityType._collection[name] = new EntitySetMerger();
              collection.sources.add(entitySet);
              collection.setFilter(memberSelector);
            }

            return entityType._collection[name];
          },
          getCollection: function(name){
            return entityType._collection[name];
          },
          createGrouping: function(name, groupSelector, entitySet){
            ;;;if (name == '*') return entityType._grouping;

            var grouping = entityType._grouping[name];

            if (!grouping && groupSelector)
              grouping = entityType._grouping[name] = new GroupingEntitySet(entityType, name, groupSelector, entitySet);

            return grouping;
          },
          getGrouping: function(name){
            return entityType._grouping[name];
          }
        });

        // debug only
        ;;;
        result.entityType = entityType;
        //result.callText = function(){ return entityType.name };

        return result;
      }
      //else
      //  return namedEntityTypes.get(config);
    };
    EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

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

    var EntityTypeConstructor = Class(null, {
      className: namespace + '.EntityType',
      name: 'UntitledEntityType',

      defaults: {},
      fields: {},
      extensible: false,

      init: function(config, wrapper){
        this.name = config.name || getUntitledName(this.name);

        ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, Data('name'))) console.warn('Dublicate entity type name: ', this.name);
        entityTypes.push(this);

        this.isSingleton = config.isSingleton;
        this.wrapper = wrapper;
        this.handlers = config.handlers;

        this.all = new EntitySet(wrapper, 'All entities of ' + this.name.quote('{'));
        //readOnly_[this.all.eventObjectId] = true;
        setReadOnly(this.all, true);
        this.map_ = {};

        if (config.extensible)
          this.extensible = true;

        this.fields = {};
        this.defaults = {};
        if (config.fields)
          for (var key in config.fields)
            this.addField(key, config.fields[key]);

        this.idField = config.id || null;
        this.idFieldNames = [];
        if (this.idField)
          this.idFieldNames.push(this.idField);

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

        this._collection = {};
        if (config.collections)
          for (var name in config.collections)
            this._collection[name] = new CollectionEntitySet(this, name, config.collections[name] || Function.$true);

        this._grouping = {};
        if (config.groupings)
          for (var name in config.groupings)
            this._grouping[name] = new GroupingEntitySet(this, name, config.groupings[name] || Function.$true);

        this.reflection_ = {};
        if (config.reflections)
          for (var name in config.reflections)
            this.addReflection(name, config.reflections[name]);

        this.entityClass = Class(Entity, {
          className: this.constructor.className + '.' + this.name.replace(/\s/g, '_'),
          entityType: this,
          all: this.all
        });

        if (config.dirty)
          this.entityClass.prototype.dirty = true;
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
      },
      addReflection: function(name, cfg){
        var ref = new Reflection(name, cfg);
        this.reflection_[name] = ref;
        for (var i = this.all.items.length; --i >= 0;)
          ref.update(this.all.items[i]);
      },
      get: function(data){
        if (this.isSingleton)
          return this.singleton;

        if (this.idField)
          return this.map_[isKeyType[typeof data] ? this.fields[this.idField](data) : this.getId(data)];
      },
      create: function(data){
        var entity = this.singleton || new this.entityClass(data);

        if (this.isSingleton)
          this.singleton = entity;

        return entity;
      },
      parse: function(data, autocreate){
        if (data && data.entityType === this)
          return data;

        var entity = this.get(data);
        var isKeyValue = isKeyType[typeof data];

        if (!entity)
        {
          if (isKeyValue)
          {
            if (this.idField)
            {
              //data = Data.wrapper(this.idField)(data);
              var idValue = data;
              data = {};
              data[this.idField] = idValue;
            }
            else
              return;
          }

          if (autocreate)
            entity = this.create(data);
        }
        else
          if (!isKeyValue && (entity !== data))
            entity.update(data);

        return entity;
      },
      getId: function(entityOrData){
        if (entityOrData && this.idField)
        {
          var source = entityOrData;

          if (entityOrData instanceof Entity)
            source = source.info;

          for (var i = 0, name; name = this.idFieldNames[i]; i++)
            if (name in source)
              return source[name];
        }
      }
    });

    /*
     *  Entity
     */

    function entityWarn(entity, message){
      ;;;if (typeof console != 'undefined') console.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.eventObjectId + ': ' + message, entity); 
    };

    var fieldHandlers = {};
    function getFieldHandler(key){
      var fieldHandler = fieldHandlers[key];
      if (!fieldHandler)
        return fieldHandlers[key] = {
          destroy: function(){
            this.set(key, null);
          }
        };

      return fieldHandler;
    }

    var Entity = Class(DataObject, {
      className: namespace + '.Entity',

      rollbackData_: null,

      /*setDelegate: function(){
        console.log('used');
        this.inherit.apply(this, arguments);
      },*/

      behaviour: nsWrapers.createBehaviour(DataObject, {
        update: function(object, newValue, oldValue, delta){
          this.inherit(object, newValue, oldValue, delta);

          for (var name in this.entityType.reflection_)
            this.entityType.reflection_[name].update(this);
        },
        destroy: function(){
          this.inherit();

          for (var name in this.reflection_)
            this.entityType.reflection_[name].detach(this);
        },/*
        update: function(object, newInfo, oldInfo, delta){
          this.inherit(object, newInfo, oldInfo, delta);

          var keys = Object.keys(this.value);
          keys.remove(this.entityType.idField);
          this.update(Object.slice(this.info, keys));
        },/*
        delegateChanged: function(object, oldDelegate){
          this.inherit(object, oldDelegate);

          //this.info = this;
          this.update(Object.slice(this.info, Object.keys(this.value).remove(this.entityType.idField)));
        },*/
        stateChanged: function(object, newState, oldState, errorText){
          this.inherit(object, newState, oldState, errorText);

          if (newState == STATE.READY)
            this.rollbackData_ = null;
        }
      }),

      init: function(data){
        // inherit
        this.inherit({
          info: extend({}, this.entityType.defaults), // copy default values
          handlers: this.entityType.handlers
        });

        // set up some properties
        this.fieldHandlers_ = {};
        this.value = this.info; // backward compatibility
        //this.delegate = this;

        // apply data for entity
        this.silentSet_ = true;
        if (data)
          for (var key in data)
            this.set(key, data[key]);
        this.silentSet_ = false;

        // reg entity in all entity type instances list
        setReadOnly(this.all, false);
        this.all.add([this]);
        setReadOnly(this.all, true);

        // fire reflections
        this.reflection_ = {};
        for (var name in this.entityType.reflection_)
          this.entityType.reflection_[name].update(this);
      },
      setDelegate: Function.$null,
      toString: function(){
        return '[object Entity(' + this.entityType.name + ')]';
      },
      getId: function(data){
        return this.entityType.getId(data || this);
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

          // simulate field wrapper
          valueWrapper = $self;
        }

        // main part
        var result = false;
        var delta = {};
        var newValue = valueWrapper(value, this.info[key]);
        var curValue = this.info[key];

        var valueChanged = newValue !== curValue;

        // fix for date comparation
        if (valueChanged && newValue instanceof Date && curValue instanceof Date)
          valueChanged = newValue - curValue;

        // if value changed make some actions:
        // - update id map if neccessary
        // - attach/detach handlers on object destroy (for EventObjects)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged)
        {
          if (entityType.idField == key)
          {
            var keyEntity = entityType.map_[newValue];
            if (keyEntity && keyEntity !== this)
            {
              ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.info[key] + ' => ' + newValue);
              return;
            }

            if (curValue != null)
              delete entityType.map_[curValue];

            if (newValue != null)
              entityType.map_[newValue] = this;
          }

          // set new value for field and increase updateCount
          this.info[key] = newValue;
          this.updateCount++;

          var handler = this.fieldHandlers_[key];

          // remove attached handler if exists
          if (handler)
          {
            //curValue.removeHandler(this.fieldHandlers_[key], this);
            //delete this.fieldHandlers_[key];
            handler = !curValue.removeHandler(getFieldHandler(key), this);
          }

          // add new handler if object is instance of EventObject
          // newValue !== this prevents recursion for self update
          if (newValue !== this && newValue instanceof EventObject)
          {
            /*this.fieldHandlers_[key] = {
              destroy: function(){
                this.set(key, null);
              }
            };
            newValue.addHandler(this.fieldHandlers_[key], this);*/
            handler = newValue.addHandler(getFieldHandler(key), this);
          }

          if (handler)
            this.fieldHandlers_[key] = handler;
          else
            delete this.fieldHandlers_[key];

          // prepare result and delta;
          result = { key: key, value: curValue };
          delta[key] = curValue;

          // if rollback mode - store changes
          if (rollback)
            this.rollbackData_ = complete(this.rollbackData_ || {}, delta);

          // fire event for not silent mode
          if (!this.silentSet_)
            this.dispatch('update', this, this.info, [this.info, delta].merge(), delta);
        }

        // return delta or false (if no changes)
        return result;
      },
      update: function(data, forceEvent, rollback){
        var updateCount = this.updateCount;
        var delta = {};
        var setResult;

        if (!data)
          data = {};

        // switch off change event dispatch
        this.silentSet_ = true;

        // update fields
        for (var key in data)
          if (setResult = this.set(key, data[key], rollback))
            delta[setResult.key] = setResult.value;

        // switch on change event dispatch
        this.silentSet_ = false;

        // dispatch event
        if (forceEvent || (this.updateCount != updateCount))
          this.dispatch('update', this, this.info, [this.info, delta].merge(), delta);

        return this.updateCount != updateCount ? delta : false;
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
          this.rollbackData_ = null;
        }
        this.setState(STATE.READY);
      },
      destroy: function(){
        // prevent call this method again
        this.destroy = Function.$undef;

        // delete from identify hash
        var id = this.getId();
        if (this.entityType.map_[id] === this)
          delete this.entityType.map_[id];

        setReadOnly(this.all, false);
        this.all.remove([this]);
        setReadOnly(this.all, true);

        // unlink attached handlers
        for (var key in this.fieldHandlers_)
          this.info[key].removeHandler(getFieldHandler(key), this);
        delete this.fieldHandlers_;

        // fire object destroy event handlers, primary for linked objects
        this.dispatch('destroy', this);

        // fire reset event on reset
        var tmp = this.info;
        this.info = {};
        this.value = this.info; // backward compatibility
        this.dispatch('update', this, this.info, tmp, {});

        // inherit
        this.dispatch = Function.$undef;
        this.inherit();

        // clear links
        delete this.info;
        delete this.value;
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      Entity: Entity,
      EntityType: EntityTypeWrapper,
      EntitySet: EntitySet,
      EntitySetType: EntitySetWrapper,
      EntitySetMerger: EntitySetMerger
    });

  })();