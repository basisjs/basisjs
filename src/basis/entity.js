
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

  var entityTypes = [];
  var isKeyType = {
    string: true,
    number: true
  };

  // buildin indexes
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

  // name generator
  var untitledNames = {};
  function getUntitledName(name){
    untitledNames[name] = untitledNames[name] || 0;
    return name + (untitledNames[name]++);
  }

  // types map
  var namedTypes = {};
  var deferredTypeDef = {};
  var TYPE_DEFINITION_PLACEHOLDER = function TYPE_DEFINITION_PLACEHOLDER(){};

  function resolveType(typeName, type){
    var list = deferredTypeDef[typeName];

    if (list)
    {
      for (var i = 0, def; def = list[i]; i++)
      {
        var typeClass = def[0];
        var fieldName = def[1];

        typeClass[fieldName] = type;
      }

      delete deferredTypeDef[typeName];
    }

    namedTypes[typeName] = type;
  }

  function getTypeByName(typeName, typeClass, field){
    if (namedTypes[typeName])
      return namedTypes[typeName];

    var list = deferredTypeDef[typeName];

    if (!list)
      list = deferredTypeDef[typeName] = [];

    list.push([typeClass, field]);

    return TYPE_DEFINITION_PLACEHOLDER;
  }

  function validateScheme(){
    for (var typeName in deferredTypeDef)
      basis.dev.warn(namespace + ': type `' + typeName + '` is not defined, but used by ' + deferredTypeDef[typeName].length + ' type(s)');
  }

  //
  // Index
  //

  var Index = basis.Class(null, {
    className: namespace + '.Index',

    items: null,
    fn: String,

    init: function(fn){
      this.items = {};
      if (typeof fn == 'function')
        this.fn = fn;
    },
    calcWrapper: function(newValue, oldValue){
      var value = this.fn(newValue, oldValue);

      if (value !== oldValue && this.items[value])
        throw 'Duplicate value for index [' + oldValue + ' -> ' + newValue + ']';

      return value;
    },
    get: function(value, checkType){
      var item = this.items[value];
      if (!checkType || item instanceof checkType)
        return item;
    },
    add: function(value, item){
      var cur = this.items[value];
      if (item && (!cur || cur === item))
      {
        this.items[value] = item;
        return true;
      }
    },
    remove: function(value, item){
      if (this.items[value] === item)
      {
        delete this.items[value];
        return true;
      }
    },
    destroy: function(){
      this.items = null;
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
    /** @cut */ result = Function('calcFn', 'names', 'return ' + result.toString()
    /** @cut */   .replace(/(foo|bar|baz)/g, function(m, w){
    /** @cut */      return '"' + names[w == 'foo' ? 0 : (w == 'bar' ? 1 : 2)] + '"';
    /** @cut */    })
    /** @cut */   .replace(/\[\"([^"]+)\"\]/g, '.$1'))(calcFn, names);

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
    return function(data){
      var destroyItems = basis.object.slice(this.items_);
      var inserted = [];

      if (data)
      {
        Dataset.setAccumulateState(true);
        for (var i = 0; i < data.length; i++)
        {
          var entity = this.wrapper(data[i]);
          if (entity)
            destroyItems[entity.basisObjectId] = false;
        }
        Dataset.setAccumulateState(false);
      }

      for (var key in this.items_)
        if (key in destroyItems == false)
          inserted.push(this.items_[key]);

      Dataset.setAccumulateState(true);
      for (var key in destroyItems)
        if (destroyItems[key])
          destroyItems[key].destroy();
      Dataset.setAccumulateState(false);

      return inserted.length ? inserted : null;
    };
  };

 /**
  * @class
  */
  var EntitySet = Class(Dataset, {
    className: namespace + '.EntitySet',

    name: null,
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

    name: null,

    init: ENTITYSET_INIT_METHOD(Subset, 'EntityCollection'),
    sync: ENTITYSET_SYNC_METHOD(Subset)
  });

  //
  // Entity grouping
  //

 /**
  * @class
  */
  var EntityGrouping = Class(Split, {
    className: namespace + '.EntityGrouping',

    name: null,

    subsetClass: ReadOnlyEntitySet,

    init: ENTITYSET_INIT_METHOD(Split, 'EntityGrouping'),
    sync: ENTITYSET_SYNC_METHOD(Split),

    getSubset: function(object, autocreate){
      var group = Split.prototype.getSubset.call(this, object, autocreate);

      if (group && group.dataset)
        group.dataset.wrapper = this.wrapper;

      return group;
    }
  });

  //
  // EntitySetWrapper
  //

  var EntitySetWrapper = function(wrapper, name){
    if (this instanceof EntitySetWrapper)
    {
      if (!wrapper)
        wrapper = $self;

      if (!name || namedTypes[name])
      {
        /** @cut */ if (namedTypes[name]) basis.dev.warn(namespace + ': Duplicate entity set type name `' + this.name + '`, name ignored');
        name = getUntitledName('UntitledEntitySetType');
      }

      var entitySetType = new EntitySetConstructor({
        entitySetClass: {
          /** @cut */ name: 'Set of {' + (typeof wrapper == 'string' ? wrapper : (wrapper.entityType || wrapper).name || 'UnknownType') + '}',
          wrapper: wrapper
        }
      });

      var entitySetClass = entitySetType.entitySetClass;
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

      // if wrapper is string resolve it by named type map
      if (typeof wrapper == 'string')
        entitySetClass.prototype.wrapper = getTypeByName(wrapper, entitySetClass.prototype, 'wrapper');

      // resolve type name
      resolveType(name, result);

      // extend result with additional properties
      extend(result, {
        type: entitySetType,
        typeName: name,

        toString: function(){
          return this.typeName + '()';
        },

        entitySetType: entitySetType,
        extend: function(){
          return entitySetClass.extend.apply(entitySetClass, arguments);
        },
        reader: function(data){
          if (Array.isArray(data))
          {
            var wrapper = entitySetClass.prototype.wrapper;
            return data.map(wrapper.reader || wrapper);
          }

          return data;
        }
      });

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
              {
                /** @cut */ if (entityType.compositeKey)
                /** @cut */   basis.dev.warn('basis.entity: Entity type `' + entityType.name + '` wrapper was invoked with ' + typeof(data) + ' value as index, but entity type index is composite and consists of [' + keys(entityType.idFields).join(', ') + '] fields');
                /** @cut */ else
                /** @cut */   basis.dev.warn('basis.entity: Entity type `' + entityType.name + '` wrapper was invoked with ' + typeof(data) + ' value as index, but entity type has no index');

                return;
              }

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

            if (idValue != null)
              entity = entityType.index.get(idValue, entityType.entityClass);

            if (entity && entity.entityType === entityType)
              entity.update(data);
            else
              entity = new entityClass(data);

            return entity;
          }
        };

      var entityType = new EntityTypeConstructor(config || {}, result);
      var entityClass = entityType.entityClass;

      // resolve type by name
      resolveType(entityType.name, result);

      // extend result with additional properties
      extend(result, {
        all: entityType.all,

        type: entityType,
        typeName: entityType.name,
        entityType: entityType,  // ?? deprecated

        toString: function(){
          return this.typeName + '()';
        },

        reader: function(data){
          return entityType.reader(data);
        },
        addField: function(key, wrapper){
          entityType.addField(key, wrapper);
        },
        addCalcField: function(key, wrapper){
          entityType.addCalcField(key, wrapper);
        },

        get: function(data){
          return entityType.get(data);
        },
        getSlot: function(id, defaults){
          return entityType.getSlot(id, defaults);
        },

        extend: function(){
          return entityClass.extend.apply(entityClass, arguments);
        }
      });

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

  function chooseArray(newArray, oldArray){
    if (!Array.isArray(newArray))
      return null;

    if (!Array.isArray(oldArray) || newArray.length != oldArray.length)
      return newArray || null;

    for (var i = 0; i < newArray.length; i++)
      if (newArray[i] !== oldArray[i])
        return newArray;

    return oldArray;
  }

  function addField(entityType, key, config){
    if (entityType.all.itemCount)
    {
      ;;;basis.dev.warn('EntityType ' + entityType.name + ': Field wrapper for `' + key + '` field is not added, you must destroy all existed entity first.');
      return;
    }

    // registrate alias
    entityType.aliases[key] = key;

    // normalize config
    if (typeof config == 'string'
        || Array.isArray(config)
        || (typeof config == 'function' && config.calc !== config))
    {
      config = {
        type: config
      };
    }
    else
    {
      // make a copy of config to avoid side effect
      config = basis.object.slice(config);
    }

    // process type in config
    if ('type' in config)
    {
      if (typeof config.type == 'string')
        config.type = getTypeByName(config.type, entityType.fields, key);

      // if type is array convert it into enum
      if (Array.isArray(config.type))
      {
        var values = config.type.slice(); // make copy of array to make it stable

        /** @cut */ if (!values.length)
        /** @cut */   basis.dev.warn('Empty array set as type definition for ' + entityType.name + '#field.' + key + ', is it a bug?');

        config.type = function(value, oldValue){
          var exists = values.indexOf(value) != -1;

          /** @cut */ if (!exists)
          /** @cut */   basis.dev.warn('Set value that not in list for ' + entityType.name + '#field.' + key + ', new value ignored.');

          return exists ? value : oldValue;
        };

        config.defValue = values.indexOf(config.defValue) != -1 ? config.defValue : values[0];
      }

      if (config.type === Array)
        config.type = chooseArray;

      // if type still is not a function - ignore it
      if (typeof config.type != 'function')
      {
        ;;;basis.dev.warn('EntityType ' + entityType.name + ': Field wrapper for `' + key + '` field is not a function. Field wrapper has been ignored. Wrapper: ', config.type);
        config.type = $self;
      }
    }

    var wrapper = config.type || $self;

    if ([NumericId, NumberId, IntId, StringId].indexOf(wrapper) != -1)
      config.id = true;

    if (config.id)
    {
      if (!entityType.index)
        entityType.index = new Index(String);

      entityType.idFields[key] = true;

      if (entityType.idField || entityType.compositeKey)
      {
        entityType.idField = null;
        entityType.compositeKey = ConcatString.apply(null, keys(entityType.idFields));
      }
      else
      {
        entityType.idField = key;
      }
    }

    if (config.calc)
      addCalcField(entityType, key, config.calc);
    else
      entityType.fields[key] = wrapper;

    entityType.defaults[key] = 'defValue' in config ? config.defValue : wrapper();

    entityType.entityClass.prototype['get_' + key] = function(real){
      if (real && this.modified && key in this.modified)
        return this.modified[key];

      return this.data[key];
    };

    entityType.entityClass.prototype['set_' + key] = function(value, rollback){
      return this.set(key, value, rollback);
    };

    if (!fieldDestroyHandlers[key])
      fieldDestroyHandlers[key] = {
        destroy: function(){
          this.set(key, null);
        }
      };
  }

  function addFieldAlias(entityType, alias, key){
    if (key in entityType.fields)
    {
      if (alias in entityType.aliases == false)
        entityType.aliases[alias] = key;
      else
      {
        ;;;basis.dev.warn('Alias `' + alias + '` already exists');
      }
    }
    else
    {
      ;;;basis.dev.warn('Can\'t add alias `' + alias + '` for non-exists field `' + key + '`');
    }
  }

  function addCalcField(entityType, key, wrapper){
    if (key && entityType.fields[key])
    {
      ;;;basis.dev.warn('Field `' + key + '` had defined already');
      return;
    }

    if (!entityType.calcs)
      entityType.calcs = [];

    var calcs = entityType.calcs;
    var deps = entityType.deps;
    var calcArgs = wrapper.args || [];
    var calcConfig = {
      args: calcArgs,
      wrapper: wrapper
    };

    // NOTE: simple dependence calculation
    // TODO: check, is algoritm make real check for dependencies or not?
    var before = entityType.calcs.length;
    var after = 0;

    if (calcArgs)
      for (var i = 0, calc; calc = calcs[i]; i++)
        if (calcArgs.indexOf(calc.key) != -1)
          after = i + 1;

    if (key)
    {
      // natural calc field
      calcConfig.key = key;
      for (var i = 0, calc; calc = calcs[i]; i++)
        if (calc.args.indexOf(key) != -1)
        {
          before = i;
          break;
        }

      if (after > before)
      {
        ;;;basis.dev.warn('Can\'t add calculate field `' + key + '`, because recursion');
        return;
      }

      if (entityType.idField && key == entityType.idField)
        entityType.compositeKey = wrapper;

      // resolve calc dependencies
      deps[key] = calcArgs.reduce(function(res, ref){
        var items = deps[ref] || [ref];
        for (var i = 0; i < items.length; i++)
          basis.array.add(res, items[i]);
        return res;
      }, []);

      // update other registered calcs dependencies
      for (var ref in deps)
      {
        var idx = deps[ref].indexOf(key);
        if (idx != -1)
          Array.prototype.splice.apply(deps[ref], [idx, 1].concat(deps[key]));
      }

      // reg as field
      entityType.fields[key] = function(value, oldValue){
        ;;;basis.dev.log('Calculate fields are readonly');
        return oldValue;
      };
    }
    else
    {
      // constrain
      before = after;
    }

    calcs.splice(Math.min(before, after), 0, calcConfig);
  }


 /**
  * @class
  */
  var EntityTypeConstructor = Class(null, {
    className: namespace + '.EntityType',

    wrapper: null,
    all: null,

    fields: null,
    idFields: null,
    defaults: null,

    aliases: null,
    slots: null,

    singleton: false,
    index: null,
    entityClass: null,

    init: function(config, wrapper){
      // process name
      this.name = config.name;
      if (!this.name || namedTypes[this.name])
      {
        /** @cut */ if (namedTypes[this.name]) basis.dev.warn(namespace + ': Duplicate type name `' + this.name + '`, name ignored');
        this.name = getUntitledName('UntitledEntityType');
      }

      // init properties
      this.fields = {};
      this.deps = {};
      this.idFields = {};
      this.defaults = {};
      this.aliases = {};
      this.slots = {};

      // init index
      var index = config.index;
      if (index)
      {
        if (index instanceof Index)
          this.index = index;
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

      // create entity class
      this.entityClass = createEntityClass(this, this.all, this.fields, this.defaults, this.slots);
      this.entityClass.extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        state: config.state || this.entityClass.prototype.state
      });

      // define fields, aliases and constrains
      for (var key in config.fields)
        addField(this, key, config.fields[key]);

      for (var key in config.aliases)
        addFieldAlias(this, key, config.aliases[key]);

      if (config.constrains)
        config.constrains.forEach(function(item){
          addCalcField(this, null, item);
        }, this);

      // reg entity type
      entityTypes.push(this);
    },
    reader: function(data){
      var result = {};

      // key type value
      if (isKeyType[typeof data])
        return this.idField ? data : null;

      // return null id data is not an object
      if (!data || data == null)
        return null;

      // map data
      for (var key in data)
      {
        var fieldKey = this.aliases[key];
        if (fieldKey)
        {
          var reader = this.fields[fieldKey].reader;
          result[fieldKey] = reader ? reader(data[key]) : data[key];
        }
      }

      return result;
    },
    get: function(entityOrData){
      var id = this.getId(entityOrData);
      if (id != null)
        return this.index.get(id, this.entityClass);
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

    target: true,
    setDelegate: function(){
      // entity can't has a delegate
    },

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
          entityType.index.calcWrapper(newId, curId);

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
      var index = entityType.index;

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

        /** @cut */ for (var key in data)
        /** @cut */   if (key in fields == false)
        /** @cut */     entityWarn(this, 'Field "' + key + '" is not defined, value has been ignored.');

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
            delta[key] = undefined;
            value = defaults[key];

            if (typeof value == 'function')
              value = value(data);
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
      get: function(key, real){
        if (real && this.modified && key in this.modified)
          return this.modified[key];

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

        if (valueWrapper === chooseArray && rollbackData && key in rollbackData)
          value = chooseArray(value, rollbackData[key]);

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

          // NOTE: rollback is not allowed for id fields
          if (!entityType.idFields[key])
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
        var update = false;
        var delta = {};

        if (data)
        {
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
        var rollbackData = this.modified;

        this.modified = null;

        if (data)
          this.update(data);

        if (rollbackData)
          this.emit_rollbackUpdate(rollbackData);
      },
      rollback: function(keys){
        var rollbackData = this.modified;

        if (rollbackData && keys)
        {
          if (!Array.isArray(keys))
            keys = [keys];

          rollbackData = basis.object.slice(rollbackData, keys.reduce(function(res, item){
            return res.concat(entityType.deps[item] || item);
          }, []));
        }

        // rollback
        this.update(rollbackData, true);
      },
      destroy: function(){
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
    return value && value instanceof BaseEntity;
  }

  function createType(configOrName, fields){
    /** @cut */ if (this instanceof createType)
    /** @cut */   basis.dev.warn('`new` operator was used with basis.entity.createType, it\'s a mistake');

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

  function createSetType(nameOrWrapper, wrapper){
    /** @cut */ if (this instanceof createSetType)
    /** @cut */   basis.dev.warn('`new` operator was used with basis.entity.createSetType, it\'s a mistake');

    return arguments.length > 1
      ? new EntitySetWrapper(wrapper, nameOrWrapper)
      : new EntitySetWrapper(nameOrWrapper);
  }

  //
  // export names
  //

  module.exports = {
    isEntity: isEntity,
    createType: createType,
    createSetType: createSetType,
    validate: validateScheme,
    getTypeByName: function(typeName){
      return namedTypes[typeName];
    },

    NumericId: NumericId,
    NumberId: NumberId,
    IntId: IntId,
    StringId: StringId,
    Index: Index,
    CalculateField: CalculateField,
    calc: CalculateField,

    EntityType: EntityTypeWrapper,
    Entity: createEntityClass,
    BaseEntity: BaseEntity,

    EntitySetType: EntitySetWrapper,
    EntitySet: EntitySet,
    ReadOnlyEntitySet: ReadOnlyEntitySet,
    Collection: EntityCollection,
    Grouping: EntityGrouping
  };
