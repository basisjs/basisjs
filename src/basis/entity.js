
 /**
  * @namespace basis.entity
  */

  var namespace = 'basis.entity';


  //
  // import names
  //

  var Class = basis.Class;

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var keys = basis.object.keys;
  var extend = basis.object.extend;
  var $self = basis.fn.$self;
  var arrayFrom = basis.array.from;

  var basisEvent = require('basis.event');
  var Emitter = basisEvent.Emitter;
  var createEvent = basisEvent.create;

  var basisData = require('basis.data');
  var DataObject = basisData.Object;
  var Slot = basisData.Slot;
  var Dataset = basisData.Dataset;
  var ReadOnlyDataset = basisData.ReadOnlyDataset;
  var basisDataset = require('basis.data.dataset');
  var Filter = basisDataset.Filter;
  var Split = basisDataset.Split;
  var setAccumulateState = Dataset.setAccumulateState;

  var basisType = require('basis.type');
  var defineType = basisType.defineType;
  var getTypeByName = basisType.getTypeByName;
  var getTypeByNameIfDefined = basisType.getTypeByNameIfDefined;
  var validateScheme = basisType.validate;
  var nullableArray = basisType.array.nullable;
  var nullableDate = basisType.date.nullable;
  var typeEnum = basisType['enum'];

  var NULL_INFO = {};

  var entityTypes = [];
  var isKeyType = {
    string: true,
    number: true
  };

  // buildin indexes
  var NumericId = function(value){
    return value == null || isNaN(value) ? null : Number(value);
  };
  var NumberId = function(value){
    return value == null || isNaN(value) ? null : Number(value);
  };
  var IntId = function(value){
    return value == null || isNaN(value) ? null : parseInt(value, 10);
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

  // indexes map
  var namedIndexes = {};

  //
  // Index
  //

  var Index = Class(null, {
    className: namespace + '.Index',

    items: null,

    init: function(){
      this.items = {};
    },
    get: function(value, checkType){
      var item = hasOwnProperty.call(this.items, value) && this.items[value];

      if (item && (!checkType || item.entityType === checkType))
        return item;
    },
    add: function(value, newItem){
      if (newItem)
      {
        var curItem = this.get(value);

        if (!curItem)
        {
          this.items[value] = newItem;
          return true;
        }

        if (curItem !== newItem)
          throw 'basis.entity: Value `' + value + '` for index is already occupied';
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

  function ConcatStringField(name){
    if (arguments.length == 1)
      return function(delta, data, oldValue){
        if (name in delta)
          return data[name] != null ? String(data[name]) : null;
        return oldValue;
      };

    return CalculateField.apply(null, arrayFrom(arguments).concat(function(){
      for (var i = arguments.length - 1; i >= 0; i--)
        if (arguments[i] == null)
          return null;
      return Array.prototype.join.call(arguments, '-');
    }));
  }


  //
  // EntitySets
  //

 /**
  * Returns delta object
  * @return {object|undefined}
  */
  function getDelta(inserted, deleted){
    var delta = {};
    var result;

    if (inserted && inserted.length)
      result = delta.inserted = inserted;

    if (deleted && deleted.length)
      result = delta.deleted = deleted;

    if (result)
      return delta;
  }


  function setAndDestroyRemoved(data){
    var itemsToDelete = basis.object.slice(this.items_);
    var itemsToInsert = {};
    var autoInserted = [];
    var inserted = [];
    var deleted = [];
    var delta;
    var entity;

    data = arrayFrom(data);

    setAccumulateState(true);
    for (var i = 0, item; item = data[i]; i++)
    {
      entity = this.wrapper(item);
      if (entity)
      {
        if (itemsToDelete[entity.basisObjectId])
          itemsToDelete[entity.basisObjectId] = null;
        else
          itemsToInsert[entity.basisObjectId] = entity;
      }
    }
    setAccumulateState(false);

    for (var basisObjectId in itemsToInsert)
      if (this.items_[basisObjectId])
        autoInserted.push(itemsToInsert[basisObjectId]);
      else
        inserted.push(itemsToInsert[basisObjectId]);

    for (var basisObjectId in itemsToDelete)
      if (itemsToDelete[basisObjectId])
        deleted.push(itemsToDelete[basisObjectId]);

    if (delta = getDelta(inserted, deleted))
    {
      if (this instanceof EntitySet)
      {
        var listenHandler = this.listen.item;
        if (listenHandler)
        {
          if (delta.inserted)
            for (var i = 0, item; item = delta.inserted[i]; i++)
              item.addHandler(listenHandler, this);

          if (delta.deleted)
            for (var i = 0, item; item = delta.deleted[i]; i++)
              item.removeHandler(listenHandler, this);
        }
      }

      this.emit_itemsChanged(delta);
    }

    if (deleted.length)
    {
      setAccumulateState(true);
      for (var i = 0, item; item = deleted[i]; i++)
        item.destroy();
      setAccumulateState(false);
    }

    inserted = inserted.concat(autoInserted);
    return inserted.length ? inserted : null;
  };


 /**
  * @mixin
  */
  var EntitySetMixin = function(super_){
    return {
      name: null,
      wrapper: $self,

      setAndDestroyRemoved: setAndDestroyRemoved,

      destroy: function(){
        super_.destroy.call(this);

        this.name = null;
        this.wrapper = null;
      }
    };
  };


  var WRAPPED_MARKER = 'wrapped' + basis.genUID();
  var ENTITYSET_WRAP_METHOD = function(superClass, method){
    return function(data){
      if (data && !Array.isArray(data))
        data = [data];

      var needToWrap = data && !data[WRAPPED_MARKER];
      if (needToWrap)
      {
        if (this.localId)
        {
          var items = this.getItems().slice();
          data = data.map(function(newItem){
            for (var i = 0; i < items.length; i++)
              if (this.localId(newItem, items[i]))
                return this.wrapper(newItem, items[i]);

            newItem = this.wrapper(newItem);
            items.push(newItem);

            return newItem;
          }, this);
        }
        else
        {
          data = data.map(this.wrapper);
        }

        data[WRAPPED_MARKER] = true;
      }

      var delta = superClass.prototype[method].call(this, data);

      if (needToWrap)
      {
        data[WRAPPED_MARKER] = false;

        if (this.localId && delta && delta.deleted)
        {
          // TODO: make it deferred
          setAccumulateState(true);
          for (var i = 0, item; item = delta.deleted[i]; i++)
            if (item.root) // it's a hack to prevent double object destroy
              item.destroy();
          setAccumulateState(false);
        }
      }

      return delta;
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


  //
  // Read only EntitySet
  //

 /**
  * @class
  */
  var ReadOnlyEntitySet = Class(ReadOnlyDataset, EntitySetMixin, {
    className: namespace + '.ReadOnlyEntitySet',

    init: ENTITYSET_INIT_METHOD(ReadOnlyDataset, 'ReadOnlyEntitySet')
  });


  //
  // EntitySet
  //

 /**
  * @class
  */
  var EntitySet = Class(Dataset, EntitySetMixin, {
    className: namespace + '.EntitySet',

    init: ENTITYSET_INIT_METHOD(Dataset, 'EntitySet'),
    add: ENTITYSET_WRAP_METHOD(Dataset, 'add'),
    remove: ENTITYSET_WRAP_METHOD(Dataset, 'remove'),
    set: ENTITYSET_WRAP_METHOD(Dataset, 'set'),
    setAndDestroyRemoved: function(data){
      if (this.localId)
        return this.set(data);

      if (!this.itemCount)
        return this.add(data);

      if (!data || !data.length)
        return this.clear();

      return setAndDestroyRemoved.call(this, data);
    },
    clear: function(){
      var delta = Dataset.prototype.clear.call(this);

      if (this.localId && delta && delta.deleted)
      {
        // TODO: make it deferred
        setAccumulateState(true);
        for (var i = 0, item; item = delta.deleted[i]; i++)
          item.destroy();
        setAccumulateState(false);
      }

      return delta;
    }
  });


  //
  // Entity collection
  //

 /**
  * @class
  */
  var EntityCollection = Class(Filter, EntitySetMixin, {
    className: namespace + '.EntityCollection',

    init: ENTITYSET_INIT_METHOD(Filter, 'EntityCollection')
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

  var EntitySetWrapper = function(wrapper, name, options){
    function createLocalId(id){
      if (typeof id == 'string')
        return function(data, item){
          return data[id] == item.data[id];
        };

      if (typeof id == 'function')
        return id;
    }

    if (this instanceof EntitySetWrapper)
    {
      if (!wrapper)
        wrapper = $self;

      if (!name || getTypeByNameIfDefined(name))
      {
        /** @cut */ if (getTypeByNameIfDefined(name)) basis.dev.warn(namespace + ': Duplicate entity set type name `' + this.name + '`, name ignored');
        name = getUntitledName('UntitledEntitySetType');
      }

      var entitySetType = new EntitySetConstructor({
        entitySetClass: {
          /** @cut */ className: namespace + '.EntitySet(' + (typeof wrapper == 'string' ? wrapper : (wrapper.type || wrapper).name || 'UnknownType') + ')',
          /** @cut */ name: 'Set of {' + (typeof wrapper == 'string' ? wrapper : (wrapper.type || wrapper).name || 'UnknownType') + '}',
          wrapper: wrapper,
          localId: createLocalId(options && options.localId)
        }
      });

      var EntitySetClass = entitySetType.entitySetClass;
      var result = function(data, entitySet){
        if (data != null)
        {
          if (entitySet instanceof EntitySet == false)
            entitySet = entitySetType.createEntitySet();

          entitySet.set(data instanceof Dataset ? data.getItems() : arrayFrom(data));

          return entitySet;
        }
        else
          return null;
      };

      // if wrapper is string resolve it by named type map
      if (typeof wrapper == 'string')
        EntitySetClass.prototype.wrapper = getTypeByName(wrapper, EntitySetClass.prototype, 'wrapper');

      // resolve type name
      defineType(name, result);

      // extend result with additional properties
      extend(result, {
        type: entitySetType,
        typeName: name,

        toString: function(){
          return name + '()';
        },

        reader: function(data){
          if (Array.isArray(data))
          {
            var wrapper = EntitySetClass.prototype.wrapper;
            return data.map(wrapper.reader || wrapper);
          }

          return data;
        },

        extendClass: function(source){
          EntitySetClass.extend.call(EntitySetClass, source);
          return result;
        },
        extendReader: function(extReader){
          var reader = result.reader;

          result.reader = function(data){
            if (Array.isArray(data))
              extReader(data);
            return reader(data);
          };

          return result;
        },

        // deprecated in 1.3.0
        entitySetType: entitySetType,
        extend: function(){
          /** @cut */ basis.dev.warn('basis.entity: EntitySetType.extend() is deprecated, use EntitySetType.extendClass() instead.');
          return EntitySetClass.extend.apply(EntitySetClass, arguments);
        }
      });

      // deprecated in 1.3.0
      /** @cut */ basis.dev.warnPropertyAccess(result, 'entitySetType', entitySetType,
      /** @cut */   'basis.entity: EntitySetType.entitySetType is deprecated, use EntitySetType.type instead.'
      /** @cut */ );

      return result;
    }
  };
  /** @cut */ EntitySetWrapper.className = namespace + '.EntitySetWrapper';

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

            /** @cut */ entity = basisData.devWrap(entity);
          }
          else
            entity = new EntityClass(data || {});

          return entity;
        };
      else
        result = function(data, entity){
          // newData - data for target EntityType instance
          // entity - current instance of target EntityType

          if (data != null)
          {
            // make sure second argument is correct entityType instance or ignore it
            if (!entity || entity.entityType !== entityType)
              entity = null;

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

              if (entity = entityType.index.get(data, entityType))
                return entity;

              idValue = data;
              data = {};
              data[idField] = idValue;
            }
            else
            {
              if (entityType.compositeKey)
                idValue = entityType.compositeKey(data, data);

              if (idValue != null)
                entity = entityType.index.get(idValue, entityType);
            }

            if (entity && entity.entityType === entityType)
            {
              entity.update(data);
              /** @cut */ entity = basisData.devWrap(entity);
            }
            else
              entity = new EntityClass(data);

            return entity;
          }
        };

      var entityType = new EntityTypeConstructor(config || {}, result);
      var EntityClass = entityType.entityClass;
      var name = entityType.name;

      // resolve type by name
      defineType(name, result);

      // extend result with additional properties
      extend(result, {
        all: entityType.all,

        type: entityType,
        typeName: name,

        toString: function(){
          return name + '()';
        },

        get: function(data){
          return entityType.get(data);
        },
        getSlot: function(id, defaults){
          return entityType.getSlot(id, defaults);
        },

        reader: function(data){
          return entityType.reader(data);
        },
        readList: function(value, map){
          if (!value)
            return [];

          if (!Array.isArray(value))
            value = [value];

          if (typeof map != 'function')
            map = $self;

          for (var i = 0; i < value.length; i++)
            value[i] = result(result.reader(map(value[i], i)));

          return value;
        },

        extendClass: function(source){
          EntityClass.extend.call(EntityClass, source);
          return result;
        },
        extendReader: function(extReader){
          var reader = result.reader;

          result.reader = function(data){
            if (data && typeof data == 'object')
              extReader(data);
            return reader(data);
          };

          return result;
        },

        // deprecated in 1.3.0
        entityType: entityType,
        extend: function(){
          /** @cut */ basis.dev.warn('basis.entity: EntityType.extend() is deprecated, use EntityType.extendClass() instead.');
          return EntityClass.extend.apply(EntityClass, arguments);
        }
      });

      // deprecated in 1.3.0
      /** @cut */ basis.dev.warnPropertyAccess(result, 'entityType', entityType,
      /** @cut */   'basis.entity: EntityType.entityType is deprecated, use EntityType.type instead.'
      /** @cut */ );

      return result;
    }
    //else
    //  return namedEntityTypes.get(config);
  };
  /** @cut */ EntityTypeWrapper.className = namespace + '.EntityTypeWrapper';

  //
  // Entity type constructor
  //

  var fieldDestroyHandlers = {};
  var dataBuilderFactory = {};
  var calcFieldWrapper = function(value, oldValue){
    /** @cut */ basis.dev.warn('Calculate fields are readonly');
    return oldValue;
  };
  /** @cut */ var warnCalcReadOnly = function(name){
  /** @cut */   basis.dev.warn('basis.entity: Attempt to set value for `' + name + '` field was ignored as field is calc (read only)');
  /** @cut */ };

  function getDataBuilder(defaults, fields, calcs){
    var args = ['has'];
    var values = [hasOwnProperty];
    var obj = [];

    // warn on set value for calc field in dev mode
    /** @cut */ args.push('warnCalcReadOnly');
    /** @cut */ values.push(warnCalcReadOnly);

    for (var key in defaults)
      if (hasOwnProperty.call(defaults, key))
      {
        var escapedKey = '"' + key.replace(/"/g, '\"') + '"';

        if (hasOwnProperty.call(calcs, key))
        {
          // calcs are read only and always undefined by default
          obj.push(escapedKey + ':' +
            // warn on set value for calc field in dev mode
            /** @cut */ 'has.call(data,' + escapedKey + ')' + '?' + 'warnCalcReadOnly(' + escapedKey + ')' + ':' +
            'undefined');
          continue;
        }

        var name = 'v' + obj.length;
        var fname = 'f' + obj.length;
        var defValue = defaults[key];

        args.push(name, fname);
        values.push(defValue, fields[key]);

        var newValueArgument =
          'has.call(data,' + escapedKey + ')' +
            '?' + 'data[' + escapedKey + ']' +
            ':' + name + (typeof defValue == 'function' ? '(data)' : '');
        var oldValueArgument = defValue !== undefined && typeof defValue !== 'function' ? ',' + name : '';

        obj.push(escapedKey + ':' +
          fname + '(' + newValueArgument + oldValueArgument + ')'
        );
      }

    var code = obj.sort().join(',');
    var fn = dataBuilderFactory[code];

    if (!fn)
      fn = dataBuilderFactory[code] = new Function(args,
        'return function(data){' +
          'return {' +
            code +
          '};' +
        '};'
      );

    return fn.apply(null, values);
  }

  function addField(entityType, name, config){
    // normalize config
    if (typeof config == 'string' ||
        Array.isArray(config) ||
        (typeof config == 'function' && config.calc !== config))
    {
      config = {
        type: config
      };
    }
    else
    {
      // make a copy of config to avoid side effect
      config = config ? basis.object.slice(config) : {};
    }

    // process type in config
    if ('type' in config)
    {
      if (typeof config.type == 'string')
        config.type = getTypeByName(config.type, entityType.fields, name);

      // if type is array convert it into enum
      if (Array.isArray(config.type))
      {
        var values = config.type.slice(); // make copy of array to make it stable

        config.type = typeEnum(values);
        if (values.indexOf(config.defValue) == -1)
          config.defValue = config.type.DEFAULT_VALUE;
      }

      if (config.type === Array)
      {
        config.type = nullableArray;
        config.defValue = null;
      }

      if (config.type === Date)
      {
        config.type = nullableDate;
        config.defValue = null;
      }

      // if type still is not a function - ignore it
      if (typeof config.type != 'function')
      {
        /** @cut */ basis.dev.warn('EntityType ' + entityType.name + ': Field wrapper for `' + name + '` field is not a function. Field wrapper has been ignored. Wrapper: ', config.type);
        config.type = null;
      }
    }

    var wrapper = config.type || $self;

    if (config.id || config.index || [NumericId, NumberId, IntId, StringId].indexOf(wrapper) != -1)
      entityType.idFields[name] = config;

    if (config.calc)
    {
      addCalcField(entityType, name, config.calc);
      entityType.fields[name] = calcFieldWrapper;
    }
    else
    {
      entityType.fields[name] = wrapper;

      // registrate alias only for regular fields
      entityType.aliases[name] = name;
    }

    if (!('defValue' in config) && typeof config.type === 'function' && 'DEFAULT_VALUE' in config.type)
      config.defValue = config.type.DEFAULT_VALUE;

    if ('defValue' in config)
      entityType.defaults[name] = config.defValue;
    else if ('DEFAULT_VALUE' in wrapper)
      entityType.defaults[name] = wrapper.DEFAULT_VALUE;
    else
      entityType.defaults[name] = wrapper();

    if (!fieldDestroyHandlers[name])
      fieldDestroyHandlers[name] = {
        destroy: function(){
          this.set(name, null);
        }
      };
  }

  function addFieldAlias(entityType, alias, name){
    if (name in entityType.fields == false)
    {
      /** @cut */ basis.dev.warn('basis.entity: Can\'t add alias `' + alias + '` for non-exists field `' + name + '`');
      return;
    }

    if (name in entityType.calcMap)
    {
      /** @cut */ basis.dev.warn('basis.entity: Can\'t add alias `' + alias + '` for calc field `' + name + '`');
      return;
    }

    if (alias in entityType.aliases)
    {
      /** @cut */ basis.dev.warn('basis.entity: Alias `' + alias + '` already exists');
      return;
    }

    entityType.aliases[alias] = name;
  }

  function addCalcField(entityType, name, wrapper){
    var calcs = entityType.calcs;
    var deps = entityType.deps;
    var calcArgs = wrapper.args || [];
    var calcConfig = {
      args: calcArgs,
      wrapper: wrapper
    };

    // NOTE: simple calc dependency resolving
    // TODO: check, is algoritm make real check for dependencies or not?
    var before = entityType.calcs.length;
    var after = 0;

    if (calcArgs)
      for (var i = 0, calc; calc = calcs[i]; i++)
        if (calcArgs.indexOf(calc.key) != -1)
          after = i + 1;

    if (name)
    {
      // natural calc field
      calcConfig.key = name;
      entityType.calcMap[name] = calcConfig;

      for (var i = 0, calc; calc = calcs[i]; i++)
        if (calc.args.indexOf(name) != -1)
        {
          before = i;
          break;
        }

      if (after > before)
      {
        /** @cut */ basis.dev.warn('Can\'t add calculate field `' + name + '`, because recursion');
        return;
      }

      // resolve calc dependencies
      deps[name] = calcArgs.reduce(function(res, ref){
        var items = deps[ref] || [ref];
        for (var i = 0; i < items.length; i++)
          basis.array.add(res, items[i]);
        return res;
      }, []);

      // update other registered calcs dependencies
      for (var ref in deps)
      {
        var idx = deps[ref].indexOf(name);
        if (idx != -1)
          Array.prototype.splice.apply(deps[ref], [idx, 1].concat(deps[name]));
      }
    }
    else
    {
      // constrain
      before = after;
    }

    calcs.splice(Math.min(before, after), 0, calcConfig);
  }

  function getFieldGetter(name){
    return function(real){
      if (real && this.modified && name in this.modified)
        return this.modified[name];

      return this.data[name];
    };
  }

  function getFieldSetter(name){
    return function(value, rollback){
      return this.set(name, value, rollback);
    };
  }


 /**
  * @class
  */
  var EntityTypeConstructor = Class(null, {
    className: namespace + '.EntityType',

    wrapper: null,
    all: null,

    fields: null,
    idField: null,
    idFields: null,
    compositeKey: null,
    idProperty: null,
    defaults: null,
    calcs: null,
    calcMap: null,

    aliases: null,
    slots: null,

    singleton: false,
    index: null,
    indexes: null,
    entityClass: null,

    init: function(config, wrapper){
      // process name
      this.name = config.name;
      if (!this.name || getTypeByNameIfDefined(this.name))
      {
        /** @cut */ if (getTypeByNameIfDefined(this.name))
        /** @cut */   basis.dev.warn(namespace + ': Duplicate type name `' + this.name + '`, name ignored');
        this.name = getUntitledName('UntitledEntityType');
      }

      // init properties
      this.fields = {};
      this.calcs = [];
      this.calcMap = {};
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
        /** @cut */ else
        /** @cut */   basis.dev.warn('index must be instanceof basis.entity.Index');
      }

      // wrapper and all instances set
      this.wrapper = wrapper;
      if ('all' in config == false || config.all || config.singleton)
      {
        this.all = new ReadOnlyEntitySet(config.all);
        this.all.wrapper = wrapper;
        this.all.set = function(data){
          if (Array.isArray(data))
            data = data.map(function(item){
              return item instanceof EntityClass === false
                ? wrapper.reader(item)
                : item;
            });

          return setAndDestroyRemoved.call(this, data);
        }.bind(this.all);
      }

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

      // define fields, aliases and constrains
      for (var key in config.fields)
        addField(this, key, config.fields[key]);

      for (var key in config.aliases)
        addFieldAlias(this, key, config.aliases[key]);

      if (config.constrains)
        config.constrains.forEach(function(item){
          addCalcField(this, null, item);
        }, this);

      // reset calcs if no one
      if (!this.calcs.length)
        this.calcs = null;

      // process id and indexes
      var idFields = keys(this.idFields);
      var indexes = {};
      if (idFields.length)
      {
        for (var field in this.idFields)
        {
          var fieldCfg = this.idFields[field];
          var index = fieldCfg.index;
          var indexDescriptor;

          // resolve index
          if (!index || index instanceof Index == false)
          {
            if (typeof index == 'string')
            {
              if (index in namedIndexes == false)
                namedIndexes[index] = new Index();
              index = namedIndexes[index];
            }
            else
            {
              if (!this.index)
                this.index = new Index();
              index = this.index;
            }
          }

          indexDescriptor = indexes[index.basisObjectId];
          if (!indexDescriptor)
            indexDescriptor = indexes[index.basisObjectId] = {
              index: index,
              fields: []
            };

          // reg id field
          indexDescriptor.fields.push(field);
          this.idFields[field] = indexDescriptor;
        }

        if (this.index && this.index.basisObjectId in indexes == false)
        {
          /** @cut */ basis.dev.warn('basis.entity: entity index is not used for any field, index ignored');
          this.index = null;
        }

        // process indexes
        for (var id in indexes)
        {
          var indexDescriptor = indexes[id];
          indexDescriptor.property = '__id__' + id;
          indexDescriptor.compositeKey = ConcatStringField.apply(null, indexDescriptor.fields);
          if (indexDescriptor.fields.length == 1)
            indexDescriptor.idField = indexDescriptor.fields[0];
        }

        // choose primary key
        var indexesKeys = keys(indexes);
        var primaryIndex = indexes[this.index ? this.index.basisObjectId : indexesKeys[0]];

        // set primary and id fields
        this.index = primaryIndex.index;
        this.idField = primaryIndex.idField;
        this.compositeKey = primaryIndex.compositeKey;
        this.idProperty = primaryIndex.property;

        this.indexes = indexes;
      }
      else
      {
        if (this.index)
        {
          /** @cut */ basis.dev.warn('basis.entity: entity has no any id field, index ignored');
          this.index = null;
        }
      }

      // create initDelta
      var initDelta = {};
      for (var key in this.defaults)
        initDelta[key] = undefined;

      // basis.js 1.4
      /** @cut */ if (hasOwnProperty.call(config, 'state'))
      /** @cut */   basis.dev.warn('basis.entity: default instance state can\'t be defined via type config anymore, use Type.extendClass({ state: .. }) instead');

      // create entity class
      var EntityClass = createEntityClass(this, this.all, this.fields, this.slots);
      this.entityClass = EntityClass;
      EntityClass.extend({
        entityType: this,
        type: wrapper,
        typeName: this.name,
        generateData: getDataBuilder(this.defaults, this.fields, this.calcMap),
        initDelta: initDelta
      });

      for (var name in this.fields)
      {
        EntityClass.prototype['get_' + name] = getFieldGetter(name);
        if (this.fields[name] !== calcFieldWrapper)
          EntityClass.prototype['set_' + name] = getFieldSetter(name);
      }

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
      if (this.index && id != null)
        return this.index.get(id, this);
    },
    getId: function(entityOrData){
      if (this.compositeKey && entityOrData != null)
      {
        if (isKeyType[typeof entityOrData])
          return entityOrData;

        if (entityOrData && entityOrData.entityType === this)
          return entityOrData[this.idProperty];

        if (entityOrData instanceof DataObject)
          entityOrData = entityOrData.data;

        if (this.compositeKey)
          return this.compositeKey(entityOrData, entityOrData);
      }
    },
    getSlot: function(data){
      var id = this.getId(data);
      if (id != null)
      {
        var slot = hasOwnProperty.call(this.slots, id) && this.slots[id];
        if (!slot)
        {
          if (isKeyType[typeof data])
          {
            var tmp = {};
            if (this.idField)
              tmp[this.idField] = data;
            data = tmp;
          }

          slot = this.slots[id] = new Slot({
            delegate: this.get(id) || null,
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

  /** @cut */ function entityWarn(entity, message){
  /** @cut */   basis.dev.warn('[basis.entity ' + entity.entityType.name + '#' + entity.basisObjectId + '] ' + message, entity);
  /** @cut */ }

 /**
  * @class
  */
  var BaseEntity = Class(DataObject, {
    className: namespace + '.BaseEntity',

    target: true,
    setDelegate: function(){
      // entity can't has a delegate
    },

    extendConstructor_: false,
    fieldHandlers_: null,

    propertyDescriptors: {
      modified: {
        nested: true,
        events: 'rollbackUpdate'
      }
    },

    modified: null,
    emit_rollbackUpdate: createEvent('rollbackUpdate')
  });


 /**
  * @class
  */
  var createEntityClass = function(entityType, all, fields, slots){

    function calc(entity, delta, rollbackDelta){
      var calcs = entityType.calcs;
      var data = entity.data;
      var updated = false;

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
              delta[key] = oldValue;
              data[key] = newValue;
              updated = true;
            }
          }
        }

        for (var id in entityType.indexes)
        {
          var indexDescriptor = entityType.indexes[id];
          var curId = entity[indexDescriptor.property];
          var newId = curId;

          if (indexDescriptor.compositeKey)
            newId = indexDescriptor.compositeKey(delta, data, curId);

          if (newId !== curId)
          {
            // TODO: correct rollback if one of indexes updated
            // and than exception occured
            updateIndex(indexDescriptor.index, entity, curId, newId);
            entity[indexDescriptor.property] = newId;
          }
        }

        return updated;
      } catch(e) {
        /** @cut */ entityWarn(entity, '(rollback changes) Exception on field calcs: ' + (e && e.message || e));

        // rollback all changes
        for (var key in delta)
          entity.data[key] = delta[key];

        if (rollbackDelta && !entity.modified)
          entity.modified = rollbackDelta;
      }
    }

    function updateIndex(index, entity, curValue, newValue){
      // if new value is not null, add new value to index
      // NOTE: goes first as may cause to exception
      if (newValue != null)
      {
        index.add(newValue, entity);
        if (hasOwnProperty.call(slots, newValue))
          slots[newValue].setDelegate(entity);
      }

      // if current value is not null, remove old value from index first
      if (curValue != null)
      {
        index.remove(curValue, entity);
        if (hasOwnProperty.call(slots, curValue))
          slots[curValue].setDelegate();
      }
    }

    return Class(BaseEntity, {
      className: entityType.name,

      syncEvents: {
        update: true,
        stateChanged: true,
        subscribersChanged: true
      },
      isSyncRequired: function(){
        return DataObject.prototype.isSyncRequired.call(this) && (!entityType.idProperty || this[entityType.idProperty] != null);
      },

      init: function(data){
        // ignore delegate and data
        this.delegate = null;
        this.data = this.generateData(data);

        // inherit
        BaseEntity.prototype.init.call(this);

        /** @cut */ for (var key in data)
        /** @cut */   if (key in fields == false)
        /** @cut */     entityWarn(this, 'Field "' + key + '" is not defined, value has been ignored.');

        // copy default values
        var value;
        for (var key in this.data)
        {
          value = this.data[key];

          if (value && value !== this && value instanceof Emitter)
          {
            value.addHandler(fieldDestroyHandlers[key], this);
            if (!this.fieldHandlers_)
              this.fieldHandlers_ = {};
            this.fieldHandlers_[key] = true;
          }
        }

        calc(this, this.initDelta);

        // reg entity in all entity type instances list
        if (all)
          all.emit_itemsChanged({
            inserted: [this]
          });
      },
      toString: function(){
        return '[object ' + this.constructor.className + '(' + this.entityType.name + ')]';
      },
      getId: function(){
        return this[entityType.idProperty];
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
          /** @cut */ entityWarn(this, 'Field "' + key + '" is not defined, value has been ignored.');
          return false;
        }

        // main part
        var result;
        var rollbackData = this.modified;

        if (valueWrapper === nullableArray && rollbackData && key in rollbackData)
          value = nullableArray(value, rollbackData[key]);

        var newValue = valueWrapper(value, this.data[key]);
        var curValue = this.data[key];  // NOTE: value can be modify by valueWrapper,
                                        // that why we fetch it again after valueWrapper call

        var valueChanged = newValue !== curValue &&
                           // date comparison:
                           (!newValue ||
                            !curValue ||
                             newValue.constructor !== Date ||
                             curValue.constructor !== Date ||
                             +newValue !== +curValue);

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
          if (this.fieldHandlers_ && this.fieldHandlers_[key])
          {
            curValue.removeHandler(fieldDestroyHandlers[key], this);
            this.fieldHandlers_[key] = false;
          }

          // add new handler if object is instance of basis.event.Emitter
          // newValue !== this prevents recursion for self update
          if (newValue && newValue !== this && newValue instanceof Emitter)
          {
            newValue.addHandler(fieldDestroyHandlers[key], this);
            if (!this.fieldHandlers_)
              this.fieldHandlers_ = {};
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
          var rollbackDelta;
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
                if (!rollbackDelta)
                  rollbackDelta = {};
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

          if (rollbackDelta)
            this.emit_rollbackUpdate(rollbackDelta);
        }

        return update ? delta : false;
      },
      read: function(data){
        return this.update(this.type.reader(data));
      },
      generateData: function(){ // will be overrided
        return {};
      },
      reset: function(){
        this.update(this.generateData({}));
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
        if (this.fieldHandlers_)
        {
          for (var key in this.fieldHandlers_)
            if (this.fieldHandlers_[key])
              this.data[key].removeHandler(fieldDestroyHandlers[key], this);

          this.fieldHandlers_ = null;
        }

        // delete from indexes
        for (var key in entityType.indexes)
        {
          var indexDescriptor = entityType.indexes[key];
          var id = this[indexDescriptor.property];
          if (id != null)
            updateIndex(indexDescriptor.index, this, id, null);
        }

        // delete from all entity type list (is it right order?)
        if (all && all.has(this))
          all.emit_itemsChanged({
            deleted: [this]
          });

        // inherit
        DataObject.prototype.destroy.call(this);

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

  function createSetType(name, type, options){
    /** @cut */ if (this instanceof createSetType)
    /** @cut */   basis.dev.warn('`new` operator was used with basis.entity.createSetType, it\'s a mistake');

    switch (arguments.length)
    {
      case 0:
      case 1:
        if (name && name.constructor === Object)
        {
          options = basis.object.slice(name);
          type = basis.object.splice(options).type;
          name = basis.object.splice(options).name;
        }
        else
        {
          type = name;
          name = undefined;
        }

        break;

      case 2:
        if (type && type.constructor === Object)
        {
          options = type;
          type = name;
          name = undefined;
        }
        break;
    }

    return new EntitySetWrapper(type, name, options);
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
      return getTypeByNameIfDefined(typeName);
    },
    getIndexByName: function(name){
      return namedIndexes[name];
    },

    is: function(value, type){
      var EntityClass;

      if (typeof type == 'string')
        type = getTypeByNameIfDefined(type);

      EntityClass = type && type.type && type.type.entityClass;

      return value && EntityClass ? value instanceof EntityClass : false;
    },
    get: function(typeName, value){      // works like Type.get(value)
      var Type = getTypeByNameIfDefined(typeName);
      if (Type)
        return Type.get(value);
    },
    resolve: function(typeName, value){  // works like Type(value)
      var Type = getTypeByNameIfDefined(typeName);
      if (Type)
        return Type(value);
    },
    getByIndex: function(indexName, id){
      if (indexName in namedIndexes)
        return namedIndexes[indexName].get(id);
      /** @cut */ else
      /** @cut */   basis.dev.warn('basis.entity: index with name `' + indexName + '` doesn\'t exists');
    },

    NumericId: NumericId,
    NumberId: NumberId,
    IntId: IntId,
    StringId: StringId,
    Index: Index,
    CalculateField: CalculateField,
    ConcatStringField: ConcatStringField,
    calc: CalculateField,
    arrayField: nullableArray,
    dateField: nullableDate,

    EntityType: EntityTypeWrapper,
    Entity: createEntityClass,
    BaseEntity: BaseEntity,

    EntitySetType: EntitySetWrapper,
    EntitySet: EntitySet,
    ReadOnlyEntitySet: ReadOnlyEntitySet,
    Collection: EntityCollection,
    Grouping: EntityGrouping
  };

  // deprecated in 1.4.0
  /** @cut */ basis.resource(__filename).ready(function(){
  /** @cut */   basis.dev.warnPropertyAccess(module.exports, 'Collection', EntityCollection,
  /** @cut */     'basis.entity: Collection class is deprecated, use basis.data.dataset.Filter instead.'
  /** @cut */   );
  /** @cut */   basis.dev.warnPropertyAccess(module.exports, 'Grouping', EntityGrouping,
  /** @cut */     'basis.entity: Grouping class is deprecated, use basis.data.dataset.Split instead.'
  /** @cut */   );
  /** @cut */ });
