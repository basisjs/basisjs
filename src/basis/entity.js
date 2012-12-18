
  basis.require('basis.event');
  basis.require('basis.data');
  basis.require('basis.data.dataset');


 /**
  * @namespace basis.entity
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;

  var keys = Object.keys;
  var extend = Object.extend;
  var complete = Object.complete;
  var arrayFrom = Array.from;
  var $self = Function.$self;
  var getter = Function.getter;
  var arrayFrom = basis.array.from;

  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;

  var AbstractDataset = nsData.AbstractDataset;
  var Dataset = nsData.Dataset;
  var Collection = nsData.dataset.Subset;
  var Grouping = nsData.dataset.Split;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;

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

    init: function(normalize){
      var index = this.index = {};

      this.normalize = normalize;
      this.valueWrapper = function(newValue, oldValue){
        // normalize new value
        var value = normalize(newValue, oldValue);

        if (value !== oldValue && index[value])
        {
          ;;;basis.dev.warn('Duplicate value for index ' + oldValue + ' => ' + newValue);
          return oldValue;  // no changes
        }

        return value;
      };
      this.calcWrapper = function(newValue, oldValue){
        // normalize new value
        var value = normalize(newValue, oldValue);

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
    }
  });


  function CalculateField(){
    var args = arrayFrom(arguments);
    var func = args.pop();

    ;;;if (typeof func != 'function') basis.dev.warn('Last argument for calculate field constructor must be a function');

    var cond = [];
    var calcArgs = [];
    for (var i = 0, name; i < args.length; i++)
    {
      name = args[i].quote('"');
      cond.push(name + ' in delta');
      calcArgs.push('data[' + name + ']');
    }

    var result = new Function('calc',
      'return function(delta, data, oldValue){' +
        (cond.length ? 'if (' + cond.join(' || ') + ')' : '') +
        'return calc(' + calcArgs.join(', ') + ');' +
        (cond.length ? 'return oldValue;' : '') +
      '}'
    )(func);
    result.args = args;
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
      /*if (config)
      {
        this.name = config.name || getUntitledName(name);
        this.wrapper = config.wrapper;
      }
      else
        this.name = getUntitledName(name);*/

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
            if (entityType.compositeKey)
              idValue = entityType.compositeKey(data, data);
            else
              if (idField)
                idValue = data[idField];
              else
              {
                if (isSingleton)
                {
                  entity = entityType.singleton;
                  if (!entity)
                    return new entityClass(data);
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
  ;;;EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

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

      var entityClass__;

      this.index__ = config.index;
      this.idFields = {};

      ;;;if (entityTypes.search(this.name, getter('name'))) basis.dev.warn('Dublicate entity type name: ', this.name);
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

      Object.iterate(config.fields, this.addField, this);
      if (config.constrains)
        config.constrains.forEach(function(item){
          this.addCalcField(null, item);
        }, this);

      if (this.isSingleton)
        this.get = getSingleton;

      if (config.aliases)
        Object.iterate(config.aliases, this.addAlias, this);

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

      ;;;if (config.reflections) basis.dev.warn('Reflections are deprecated');

      entityClass__ = this.entityClass = Entity(this, this.all, this.index__, this.slot_, this.fields, this.defaults, this.getters).extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        getId: function(){
          return this.__id__;
        }
      });

      if (config.state)
        entityClass__.extend({ state: config.state });
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
        /** @cut */else basis.dev.warn('Alias `{0}` already exists'.format(alias));
      }
      /** @cut */else basis.dev.warn('Can\'t add alias `{0}` for non-exists field `{1}`'.format(alias, key));
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

        //calcWrapper = this.index__.calcWrapper;
        //wrapper = this.index__.valueWrapper;
      }

      if (config.calc)
        this.addCalcField(key, config.calc);
      else
        this.fields[key] = wrapper;

      this.defaults[key] = 'defValue' in config ? config.defValue : wrapper();

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
    addCalcField: function(key, wrapper, valueWrapper){
      if (key && this.fields[key])
      {
        ;;;basis.dev.warn('Field `{0}` had defined already'.format(key));
        return;
      }

      if (!this.calcs)
        this.calcs = [];

      var calcConfig = {
        args: wrapper.args || [],
        wrapper: !valueWrapper ? wrapper : function(delta, data, oldValue){
          return valueWrapper(wrapper(delta, data, oldValue));
        }
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
        var slot = this.slot_[id];
        if (!slot)
        {
          if (isKeyType[typeof data])
          {
            var tmp = {};
            if (this.idField && !this.compositeKey)
              tmp[this.idField] = data;
            data = tmp;
          }

          slot = this.slot_[id] = new DataObject({
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
    ;;;basis.dev.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.basisObjectId + ': ' + message, entity); 
  }

 /**
  * @class
  */
  var BaseEntity = Class(DataObject, {
    className: namespace + '.BaseEntity',
    init: EventObject.prototype.init,
    event_rollbackUpdate: createEvent('rollbackUpdate')
  });

 /**
  * @class
  */
  var Entity = function(entityType, all, index__, typeSlot, fields, defaults, getters){

    var idField = entityType.idField;

    function rollbackChanges(entity, delta, rollbackDelta){
      for (var key in delta)
        entity.data[key] = delta[key];

      if (rollbackDelta && !entity.modified)
        for (var key in rollbackDelta)
        {
          entity.modified = rollbackDelta;
          break;
        }
    }

    function calc(entity, delta, rollbackDelta){
      var update = false;
      var calcs = entityType.calcs;
      var id = entity.__id__;

      var data = entity.data;
      try {
        if (calcs)
        {
          for (var i = 0, calc; calc = calcs[i++];)
          {
            var key = calc.key;
            if (key)
            {
              var oldValue = data[key];
              data[key] = calc.wrapper(delta, data, data[key]);
              if (data[key] !== oldValue)
              {
                delta[key] = oldValue;
                update = true;
              }
            }
            else
              calc.wrapper(delta, data);
          }
        }

        if (entityType.compositeKey)
          entity.__id__ = entityType.compositeKey(delta, data, entity.__id__);
        else
          if (idField && idField in delta)
            entity.__id__ = data[idField];

        if (entity.__id__ !== id)
          entityType.index__.calcWrapper(entity.__id__);

      } catch(e) {
        ;;;basis.dev.warn('Exception on field calc');
        entity.__id__ = id;
        rollbackChanges(entity, delta, rollbackDelta);
        update = false;
      }

      if (entity.__id__ !== id)
        updateIndex(entity, id, entity.__id__);

      return update;      
    }

    function updateIndex(entity, curValue, newValue){
      // if current value is not null, remove old value from index first
      if (curValue != null)
      {
        index__.remove(curValue, entity);
        if (typeSlot[curValue])
          typeSlot[curValue].setDelegate();
      }

      // if new value is not null, add new value to index
      if (newValue != null)
      {
        index__.add(newValue, entity);
        if (typeSlot[newValue])
          typeSlot[newValue].setDelegate(entity);
      }
    }

    return Class(BaseEntity, getters, {
      className: namespace + '.Entity',

      canHaveDelegate: false,
      //index: index__,

      modified: null,
      isTarget: true,

      extendConstructor_: false,
      init: function(data){
        //var entityType = this.entityType;

        // inherit
        BaseEntity.prototype.init.call(this);

        // set up some properties
        this.fieldHandlers_ = {};
        this.data = {};//new entityType.xdefaults;//{};
        this.root = this;
        this.target = this;

        ;;;for (var key in data) if (!fields[key]) entityWarn(this, 'Set value for "' + key + '" property is ignored.');

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

          if (value && value !== this && value instanceof EventObject)
          {
            if (value.addHandler(fieldDestroyHandlers[key], this))
              this.fieldHandlers_[key] = true;
          }

          this.data[key] = value;
        }

        calc(this, delta);

        // reg entity in all entity type instances list
        all.event_datasetChanged({
          inserted: [this]
        });

        if (entityType.isSingleton)
          entityType.singleton = this;
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      get: function(key){
        return this.data[key];
      },
      set: function(key, value, rollback, silent_){
        // get value wrapper
        var valueWrapper = fields[key];

        if (!valueWrapper)
        {
          // exit if no new fields allowed
          if (!entityType.extensible)
          {
            ;;;entityWarn(this, 'Set value for "' + key + '" property is ignored.');
            return false;
          }

          // emulate field wrapper
          valueWrapper = $self;
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
        // - attach/detach handlers on object destroy (for EventObjects)
        // - registrate changes to rollback data if neccessary
        // - fire 'change' event for not silent mode
        if (valueChanged) updateField:
        {
          result = {};

          // NOTE: rollback is not allowed for id field
          if (key != idField)
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
            this.event_update(delta);
            result.delta = delta;
          }

          if (rollbackDelta)
            this.event_rollbackUpdate(rollbackDelta);
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
            this.event_update(delta);

          if (rollbackUpdate)
            this.event_rollbackUpdate(rollbackDelta);
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
          this.event_rollbackUpdate(rollbackData);
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

          this.event_rollbackUpdate(rollbackData);
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
        all.event_datasetChanged({
          deleted: [this]
        });

        if (entityType.isSingleton)
          entityType.singleton = null;

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

  module.exports = {
    isEntity: isEntity,

    NumericId: NumericId,
    NumberId: NumberId,
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
  };
