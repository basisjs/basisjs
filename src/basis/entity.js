
  basis.require('basis.event');
  basis.require('basis.data');
  basis.require('basis.data.dataset');


 /**
  * @namespace basis.entity
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;

  var keys = basis.object.keys;
  var extend = basis.object.extend;
  var complete = basis.object.complete;
  var $self = basis.fn.$self;
  var getter = basis.getter;
  var arrayFrom = basis.array.from;

  var Emitter = basis.event.Emitter;
  var createEvent = basis.event.create;

  var DataObject = basis.data.Object;
  var Slot = basis.data.Slot;
  var AbstractDataset = basis.data.AbstractDataset;
  var Dataset = basis.data.Dataset;
  var Subset = basis.data.dataset.Subset;
  var Split = basis.data.dataset.Split;
  var STATE = basis.data.STATE;

  var NULL_INFO = {};

  //

  var isKeyType = { 'string': 1, 'number': 1 };
  var entityTypes = [];

  var NumericId = function(value){
    return isNaN(value) ? null : Number(value);
  };
  var NumberId = function(value){
    return isNaN(value) ? null : Number(value);
  };
  var IntId = function(value){
    return isNaN(value) ? null : parseInt(value, 10);
  };
  var StringId = function(value){
    return value == null ? null : String(value);
  };

  // ---

  var untitledNames = {};
  function getUntitledName(name){
    untitledNames[name] = untitledNames[name] || 0;
    return name + (untitledNames[name]++);
  }

  //
  // Index
  //

  var Index = basis.Class(null, {
    className: namespace + '.Index',

    init: function(fn){
      var index = {};
      this.index = index;

      this.calcWrapper = function(newValue, oldValue){
        // normalize new value
        var value = fn(newValue, oldValue);

        if (value !== oldValue && index[value])
          throw 'Duplicate value for index ' + oldValue + ' => ' + newValue;

        return value;
      };
    },
    get: function(value, checkType){
      var item = this.index[value];
      if (item && (!checkType || item instanceof checkType))
        return item;
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
      this.calcWrapper = null;
    }
  });


  function CalculateField(){
    var names = arrayFrom(arguments);
    var calcFn = names.pop();
    var foo = names[0];
    var bar = names[1];
    var baz = names[2];
    var result;

    if (typeof calcFn != 'function')
      throw 'Last argument for calculate field constructor must be a function';

    switch (names.length)
    {
      case 0:
        result = function(){
          return calcFn();
        };
        break;
      case 1:
        result = function(delta, data, oldValue){
          if (foo in delta)
            return calcFn(data[foo]);

          return oldValue;
        };
        break;
      case 2:
        result = function(delta, data, oldValue){
          if (foo in delta || bar in delta)
            return calcFn(data[foo], data[bar]);

          return oldValue;
        };
        break;
      case 3:
        result = function(delta, data, oldValue){
          if (foo in delta || bar in delta || baz in delta)
            return calcFn(data[foo], data[bar], data[baz]);

          return oldValue;
        };
        break;
      default:
        result = function(delta, data, oldValue){
          var changed = false;
          var args = [];

          for (var i = 0, name; name = names[i]; i++)
          {
            changed = changed || name in delta;
            args.push(data[name]);
          }

          if (changed)
            return calcFn.apply(null, args);

          return oldValue;
        };
    }

    // verbose function code in dev mode
    /** @cut */ result = Function('calcFn', 'return ' + result.toString()
    /** @cut */   .replace(/(foo|bar|baz)/g, function(m, w){
    /** @cut */      return '"' + names[w == 'foo' ? 0 : (w == 'bar' ? 1 : 2)] + '"';
    /** @cut */    })
    /** @cut */   .replace(/\[\"([^"]+)\"\]/g, '.$1'))(calcFn);

    result.args = names;
    result.calc = result;

    return result;
  }

  function ConcatString(){
    return CalculateField.apply(null, arrayFrom(arguments).concat(function(){
      var value = [];
      for (var i = arguments.length; i-- > 0;)
      {
        if (arguments[i] == null)
          return null;
        value.push(arguments[i]);
      }
      return value.join('-');
    }));
  }

  //
  // EntitySet
  //

  var ENTITYSET_WRAP_METHOD = function(superClass, method){
    return function(data){
      return superClass.prototype[method].call(this, data && data.map(this.wrapper));
    };
  };

  var ENTITYSET_INIT_METHOD = function(superClass, name){
    return function(){
      if (!this.name)
        this.name = getUntitledName(name);

      // inherit
      superClass.prototype.init.call(this);
    };
  };

  var ENTITYSET_SYNC_METHOD = function(superClass){
    return function(data, set){
      Dataset.setAccumulateState(true);
      data = (data || []).map(this.wrapper);
      Dataset.setAccumulateState(false);

      return superClass.prototype.sync.call(this, data, set);
    };
  };

 /**
  * @class
  */
  var EntitySet = Class(Dataset, {
    className: namespace + '.EntitySet',

    wrapper: $self,

    init: ENTITYSET_INIT_METHOD(Dataset, 'EntitySet'),
    sync: ENTITYSET_SYNC_METHOD(Dataset),

    set: ENTITYSET_WRAP_METHOD(Dataset, 'set'),
    add: ENTITYSET_WRAP_METHOD(Dataset, 'add'),
    remove: ENTITYSET_WRAP_METHOD(Dataset, 'remove'),

    destroy: function(){
      Dataset.prototype.destroy.call(this);
      this.wrapper = null;
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

    set: basis.fn.$false,
    add: basis.fn.$false,
    remove: basis.fn.$false,
    clear: basis.fn.$false
  });

  //
  // Entity collection
  //

 /**
  * @class
  */
  var EntityCollection = Class(Subset, {
    className: namespace + '.EntityCollection',

    init: ENTITYSET_INIT_METHOD(Subset, 'EntityCollection'),
    sync: ENTITYSET_SYNC_METHOD(Subset)
  });

  EntityCollection.sourceHandler = Subset.sourceHandler;

  //
  // Entity grouping
  //

 /**
  * @class
  */
  var EntityGrouping = Class(Split, {
    className: namespace + '.EntityGrouping',

    subsetClass: ReadOnlyEntitySet,

    init: ENTITYSET_INIT_METHOD(Split, 'EntityGrouping'),
    sync: ENTITYSET_SYNC_METHOD(Split),

    getSubset: function(object, autocreate){
      var group = Split.prototype.getSubset.call(this, object, autocreate);
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
      if (!wrapper)
        wrapper = $self;

      var entitySetType = new EntitySetConstructor({
        entitySetClass: {
          name: 'Set of {' + ((wrapper.entityType || wrapper).name || 'UnknownWrapper') + '}',
          wrapper: wrapper
        }
      });

      var result = function(data, entitySet){
        if (data != null)
        {
          if (!(entitySet instanceof EntitySet))
            entitySet = entitySetType.createEntitySet();

          entitySet.set(data instanceof Dataset ? data.getItems() : arrayFrom(data));

          return entitySet;
        }
        else
          return null;
      };

      result.entitySetType = entitySetType;
      result.reader = function(data){
        if (Array.isArray(data))
          return data.map(wrapper.reader || wrapper);
        return data;
      }

      return result;
    }
  };
  ;;;EntitySetWrapper.className = namespace + '.EntitySetWrapper';

  //
  // EntitySetConstructor
  //

 /**
  * @class
  */
  var EntitySetConstructor = Class(null, {
    className: namespace + '.EntitySetConstructor',

    entitySetClass: EntitySet,

    extendConstructor_: true,
    createEntitySet: function(){
      return new this.entitySetClass();
    }
  });

 /*
  *  EntityTypeWrapper
  */

  var EntityTypeWrapper = function(config){
    if (this instanceof EntityTypeWrapper)
    {
      var result;

      if (config.singleton)
        result = function(data){
          var entity = entityType.get();

          if (entity)
          {
            if (data)
              entity.update(data);
          }
          else
            entity = new entityClass(data || {});

          return entity;
        };
      else
        result = function(data, entity){
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
              if (entityType.compositeKey)
                idValue = entityType.compositeKey(data, data);
              else
                if (idField)
                  idValue = data[idField];
            }

            if (idValue != null && index)
              entity = index.get(idValue, entityType.entityClass);

            if (entity && entity.entityType === entityType)
              entity.update(data);
            else
              entity = new entityClass(data);

            return entity;
          }
        };

      var entityType = new EntityTypeConstructor(config || {}, result);
      var index = entityType.index__;
      var entityClass = entityType.entityClass;

      extend(result, {
        toString: function(){
          return this.typeName + '()';
        },
        entityType: entityType,
        type: result,
        typeName: entityType.name,
        index: index,
        reader: function(data){
          return entityType.reader(data);
        },

        get: function(data){
          return entityType.get(data);
        },
        addField: function(key, wrapper){
          entityType.addField(key, wrapper);
        },
        all: entityType.all,
        getSlot: function(index, defaults){
          return entityType.getSlot(index, defaults);
        },

        extend: function(){
          entityClass.extend.apply(entityClass, arguments);
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
  ;;;EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

  //
  // Entity type constructor
  //

  var fieldDestroyHandlers = {};

 /**
  * @class
  */
  var EntityTypeConstructor = Class(null, {
    className: namespace + '.EntityType',

    defaults: null,
    fields: null,

    index__: null,
    slots: null,

    init: function(config, wrapper){
      // process name
      this.name = config.name || getUntitledName('UntitledEntityType');
      ;;;if (entityTypes.search(this.name, getter('name'))) basis.dev.warn('Dublicate entity type name: ', this.name);

      // init properties
      this.fields = {};
      this.idFields = {};
      this.defaults = {};
      this.aliases = {};
      this.slots = {};

      // init index
      if (config.index)
      {
        if (config.index instanceof Index)
          this.index__ = config.index;
        /** @cut */else basis.dev.warn('index must be instanceof basis.entity.Index');
      }

      // wrapper and all instances set
      this.wrapper = wrapper;
      this.all = new ReadOnlyEntitySet(basis.object.complete({
        wrapper: wrapper
      }, config.all));

      // singleton
      this.singleton = !!config.singleton;
      if (this.singleton)
      {
        var singletonInstance;
        this.get = function(){
          return singletonInstance;
        };
        this.all.addHandler({
          itemsChanged: function(sender, delta){
            singletonInstance = delta.inserted ? delta.inserted[0] : null;
          }
        }, this);
      }

      ;;;if ('isSingleton' in config) basis.dev.warn('Property `isSingleton` in config is obsolete. Use `singleton` property instead.');      

      // create entity class
      this.entityClass = createEntityClass(this, this.all, this.fields, this.defaults, this.slots);
      this.entityClass.extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        state: config.state || this.entityClass.prototype.state
      });

      // define fields, aliases and constrains
      basis.object.iterate(config.fields, this.addField, this);
      basis.object.iterate(config.aliases, this.addAlias, this);

      if (config.constrains)
        config.constrains.forEach(function(item){
          this.addCalcField(null, item);
        }, this);

      // reg entity type
      entityTypes.push(this);
    },
    reader: function(data){
      var result = {};

      // key type value
      if (isKeyType[typeof data])
      {
        if (this.idField)
        {
          result[this.idField] = data;
          return result;
        }
        return null;
      }

      // return null id data is not an object
      if (!data || data == null)
        return null;

        
      // map data
      for (var key in data)
      {
        var fieldKey = key in this.aliases 
          ? this.aliases[key]
          : '';

        if (fieldKey && fieldKey in this.fields)
        {
          result[fieldKey] = this.fields[fieldKey].reader
            ? this.fields[fieldKey].reader(data[key])
            : data[key];
        }
      }

      return result;
    },
    addAlias: function(alias, key){
      if (key in this.fields)
      {
        if (alias in this.aliases == false)
          this.aliases[alias] = key;
        else
        {
          ;;;basis.dev.warn('Alias `{0}` already exists'.format(alias));
        }
      }
      else
      {
        ;;;basis.dev.warn('Can\'t add alias `{0}` for non-exists field `{1}`'.format(alias, key));
      }
    },
    addField: function(key, config){
      if (this.all.itemCount)
      {
        ;;;basis.dev.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not added, you must destroy all existed entity first.');
        return;
      }

      this.aliases[key] = key;

      if (typeof config == 'function' && config.calc !== config)
      {
        config = {
          type: config
        };
      }

      if ('type' in config && typeof config.type != 'function')
      {
        ;;;basis.dev.warn('(debug) EntityType ' + this.name + ': Field wrapper for `' + key + '` field is not a function. Field wrapper has been ignored. Wrapper: ', config.type);
        config.type = $self;
      }

      var wrapper = config.type || $self;

      if ([NumericId, NumberId, IntId, StringId].has(wrapper))
        config.id = true;

      if (config.id)
      {
        if (!this.index__)
          this.index__ = new Index(String);

        this.idFields[key] = true;

        if (this.idField || this.compositeKey)
        {
          this.idField = null;
          this.compositeKey = ConcatString.apply(null, keys(this.idFields));
        }
        else
        {
          this.idField = key;
        }
      }

      if (config.calc)
        this.addCalcField(key, config.calc);
      else
        this.fields[key] = wrapper;

      this.defaults[key] = 'defValue' in config ? config.defValue : wrapper();

      this.entityClass.prototype['get_' + key] = function(){
        return this.data[key];
      };
      this.entityClass.prototype['set_' + key] = function(value, rollback){
        return this.set(key, value, rollback);
      };

      if (!fieldDestroyHandlers[key])
        fieldDestroyHandlers[key] = {
          destroy: function(){
            this.set(key, null);
          }
        };
    },
    addCalcField: function(key, wrapper){
      if (key && this.fields[key])
      {
        ;;;basis.dev.warn('Field `{0}` had defined already'.format(key));
        return;
      }

      if (!this.calcs)
        this.calcs = [];

      var calcConfig = {
        args: wrapper.args || [],
        wrapper: wrapper
      };

      // NOTE: simple dependence calculation
      // TODO: check, is algoritm make real check for dependencies or not?
      var before = this.calcs.length;
      var after = 0;

      if (wrapper.args)
        for (var i = 0; i < this.calcs.length; i++)
          if (wrapper.args.has(this.calcs[i].key))
            after = i + 1;

      if (key)
      {
        // natural calc field

        calcConfig.key = key;
        for (var i = 0; i < this.calcs.length; i++)
          if (this.calcs[i].args.has(key))
          {
            before = i;
            break;
          }

        if (after > before)
        {
          ;;;basis.dev.warn('Can\'t add calculate field `{0}`, because recursion'.format(key));
          return;
        }

        if (this.idField && key == this.idField)
          this.compositeKey = wrapper;

        this.fields[key] = function(value, oldValue){
          ;;;basis.dev.log('Calculate fields are readonly');
          return oldValue;
        };
      }
      else
      {
        // constrain
        before = after;
      }

      this.calcs.splice(Math.min(before, after), 0, calcConfig);
    },
    get: function(entityOrData){
      var id = this.getId(entityOrData);
      if (id != null)
        return this.index__.get(id, this.entityClass);
    },
    getId: function(entityOrData){
      if ((this.idField || this.compositeKey) && entityOrData != null)
      {
        if (isKeyType[typeof entityOrData])
          return entityOrData;

        if (entityOrData && entityOrData.entityType === this)
          return entityOrData.__id__;

        if (entityOrData instanceof DataObject)
          entityOrData = entityOrData.data;

        if (this.compositeKey)
          return this.compositeKey(entityOrData, entityOrData);
        else
          return entityOrData[this.idField];
      }
    },
    getSlot: function(data){
      var id = this.getId(data);
      if (id != null)
      {
        var slot = this.slots[id];
        if (!slot)
        {
          if (isKeyType[typeof data])
          {
            var tmp = {};
            if (this.idField && !this.compositeKey)
              tmp[this.idField] = data;
            data = tmp;
          }

          slot = this.slots[id] = new Slot({
            delegate: this.get(id),
            data: data
          });
        }
        return slot;
      }
    }
  });

  //
  //  Entity
  //

  function entityWarn(entity, message){
    basis.dev.warn('[basis.entity ' + entity.entityType.name + '#' + entity.basisObjectId + '] ' + message, entity); 
  }

 /**
  * @class
  */
  var BaseEntity = Class(DataObject, {
    className: namespace + '.BaseEntity',

    canSetDelegate: false,
    isTarget: true,

    modified: null,

    emit_rollbackUpdate: createEvent('rollbackUpdate')
  });

 /**
  * @class
  */
  var createEntityClass = function(entityType, all, fields, defaults, slots){

    function calc(entity, delta, rollbackDelta){
      var calcs = entityType.calcs;
      var data = entity.data;
      var updated = false;
      var curId = entity.__id__;
      var newId;

      try {
        if (calcs)
        {
          for (var i = 0, calc; calc = calcs[i]; i++)
          {
            var key = calc.key;
            var oldValue = data[key];
            var newValue = calc.wrapper(delta, data, oldValue);

            // if no key that's a constrain, nothing to do
            if (key && newValue !== oldValue)
            {
              data[key] = newValue;
              delta[key] = oldValue;
              updated = true;
            }
          }
        }

        if (entityType.compositeKey)
          newId = entityType.compositeKey(delta, data, curId);
        else
          newId = entityType.idField && entityType.idField in delta ? data[entityType.idField] : curId;

        if (newId !== curId)
          entityType.index__.calcWrapper(newId, curId);

      } catch(e) {
        ;;;entityWarn(entity, '(rollback changes) Exception on field calcs: ' + (e && e.message || e));

        // rollback all changes
        updated = false;
        newId = curId;

        for (var key in delta)
          entity.data[key] = delta[key];

        if (rollbackDelta && !entity.modified)
          for (var key in rollbackDelta)
          {
            entity.modified = rollbackDelta;
            break;
          }
      }

      if (newId !== curId)
      {
        entity.__id__ = newId;
        updateIndex(entity, curId, newId);
      }

      return updated;      
    }

    function updateIndex(entity, curValue, newValue){
      var index = entityType.index__;

      // if current value is not null, remove old value from index first
      if (curValue != null)
      {
        index.remove(curValue, entity);
        if (slots[curValue])
          slots[curValue].setDelegate();
      }

      // if new value is not null, add new value to index
      if (newValue != null)
      {
        index.add(newValue, entity);
        if (slots[newValue])
          slots[newValue].setDelegate(entity);
      }
    }

    return Class(BaseEntity, {
      className: namespace + '.Entity',

      extendConstructor_: false,
      init: function(data){
        // ignore delegate and data
        this.delegate = null;
        this.data = {};

        // inherit
        BaseEntity.prototype.init.call(this);

        // set up some properties
        this.fieldHandlers_ = {};

        ;;;for (var key in data) if (!fields[key]) entityWarn(this, 'Field "' + key + '" is not defined, value has been ignored.');

        // copy default values
        var value;
        var delta = {};
        for (var key in fields)
        {
          if (key in data)
          {
            delta[key] = defaults[key];
            value = fields[key](data[key]);
          }
          else
          {
            value = defaults[key];
          }

          if (value && value !== this && value instanceof Emitter)
          {
            if (value.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          this.data[key] = value;
        }

        calc(this, delta);

        // reg entity in all entity type instances list
        all.emit_itemsChanged({
          inserted: [this]
        });
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      getId: function(){
        return this.__id__;
      },
      get: function(key){
        return this.data[key];
      },
      set: function(key, value, rollback, silent_){
        // get value wrapper
        var valueWrapper = fields[key];

        if (!valueWrapper)
        {
          ;;;entityWarn(this, 'Field "' + key + '" is not defined, value has been ignored.');
          return false;
        }

        // main part
        var result;
        var rollbackData = this.modified;
        var newValue = valueWrapper(value, this.data[key]);
        var curValue = this.data[key];  // NOTE: value can be modify by valueWrapper,
                                        // that why we fetch it again after valueWrapper call

        var valueChanged = newValue !== curValue
                           // date comparison fix;
                           && (!newValue || !curValue || newValue.constructor !== Date || curValue.constructor !== Date || +newValue !== +curValue);

        // if value changed:
        // - update index for id field
        // - attach/detach handlers on object destroy (for Emitters)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged) updateField:
        {
          result = {};

          // NOTE: rollback is not allowed for id field
          if (key != entityType.idField)
          {
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

                  if (!keys(rollbackData).length)
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

                  break updateField; // skip update field
                }
                else
                  return false;
              }
            }
          }

          // main part of field update

          // set new value for field
          this.data[key] = newValue;
          
          // remove attached handler if exists
          if (this.fieldHandlers_[key])
          {
            curValue.removeHandler(fieldDestroyHandlers[key], this);
            this.fieldHandlers_[key] = false;
          }

          // add new handler if object is instance of basis.event.Emitter
          // newValue !== this prevents recursion for self update
          if (newValue && newValue !== this && newValue instanceof Emitter)
          {
            if (newValue.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          // prepare result
          result.key = key;
          result.value = curValue;
          result.delta = {};
          result.delta[key] = curValue;
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

            if (!keys(rollbackData).length)
              this.modified = null;
          }
        }


        // fire events for not silent mode
        if (!silent_ && result)
        {
          var update = result.key;
          var delta = result.delta || {};
          var rollbackDelta;

          if (result.rollback)
          {
            rollbackDelta = {};
            rollbackDelta[result.rollback.key] = result.rollback.value;
          }

          if (calc(this, delta, rollbackDelta))
            update = true;

          if (update)
          {
            // fire event
            this.emit_update(delta);
            result.delta = delta;
          }

          if (rollbackDelta)
            this.emit_rollbackUpdate(rollbackDelta);
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

          // calc
          if (calc(this, delta, rollbackDelta))
            update = true;

          // dispatch events

          if (update)
            this.emit_update(delta);

          if (rollbackUpdate)
            this.emit_rollbackUpdate(rollbackDelta);
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
          this.emit_rollbackUpdate(rollbackData);
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

          this.emit_rollbackUpdate(rollbackData);
        }
        this.setState(STATE.READY);
      },
      destroy: function(){
        // shortcut
        //var entityType = this.entityType;

        // unlink attached handlers
        for (var key in this.fieldHandlers_)
          if (this.fieldHandlers_[key])
            this.data[key].removeHandler(fieldDestroyHandlers[key], this);

        this.fieldHandlers_ = NULL_INFO;

        // delete from index
        if (this.__id__ != null)
          updateIndex(this, this.__id__, null);

        // inherit
        DataObject.prototype.destroy.call(this);

        // delete from all entity type list (is it right order?)
        all.emit_itemsChanged({
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
  function createType(configOrName, fields){
    var config = configOrName || {};

    if (typeof configOrName == 'string')
    {
      config = {
        name: config,
        fields: fields || {}
      };
    }
    else
    {
      if (fields)
        config = basis.object.merge(config, {
          fields: fields
        });
    }

    return new EntityTypeWrapper(config);
  }
  function createSetType(config){
    return new EntitySetWrapper(config);
  }  

  //
  // export names
  //

  module.exports = {
    isEntity: isEntity,
    createType: createType,
    createSetType: createSetType,

    NumericId: NumericId,
    NumberId: NumberId,
    IntId: IntId,
    StringId: StringId,
    Index: Index,
    CalculateField: CalculateField,
    calc: CalculateField,

    EntityType: EntityTypeWrapper,
    Entity: Entity,
    BaseEntity: BaseEntity,

    EntitySetType: EntitySetWrapper,
    EntitySet: EntitySet,
    ReadOnlyEntitySet: ReadOnlyEntitySet,
    Collection: EntityCollection,
    Grouping: EntityGrouping
  };
