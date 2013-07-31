
  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - {basis.data.value.BindValue}
  * - {basis.data.value.Property}
  * - {basis.data.value.ObjectSet} (alias basis.data.value.DataObjectSet, but it's deprecate)
  * - {basis.data.value.Expression}
  *
  * @see ./demo/data/basic.html
  *
  * @namespace basis.data.value
  */

  var namespace = this.path;


  // import names

  var getter = basis.getter;
  var cleaner = basis.cleaner;
  var Emitter = basis.event.Emitter;
  var AbstractData = basis.data.AbstractData;
  var Value = basis.data.Value;
  var STATE = basis.data.STATE;

  var instanceMap = {};


  //
  // BindValue
  //

  var EMMITER_HANDLER = { 
    destroy: function(object){
      this.removeLink(object); 
    }
  };

 /**
  * @class
  */
  var BindValue = Value.subclass({
    className: namespace + '.BindValue',

   /**
    * @type {Array.<object>}
    * @private
    */
    links_: null,

   /**
    * Settings for bindings.
    */
    bindingBridge: {
      attach: function(property, handler, context){
        return property.addLink(context, handler);
      },
      detach: function(property, handler, context){
        return property.removeLink(context, handler);
      },
      get: function(property){
        return property.value;
      }
    },

   /**
    * @event
    */
    emit_change: function(value, oldValue){
      Value.prototype.emit_change.call(this, value, oldValue);

      if (cleaner.globalDestroy)
        return;

      var cursor = this;
      while (cursor = cursor.links_)
        this.apply_(cursor, oldValue);
    },

   /**
    * @constructor
    */
    init: function(){
      Value.prototype.init.call(this);

      instanceMap[this.basisObjectId] = this;
    },

   /**
    * Adds link to object property or method. Optional parameter `format` using for
    * value convertation to another value or type.
    * If object is instance of {basis.event.Emitter}, BindValue attach handler which
    * removes property links on object destroy.
    *
    * @example
    *
    *   var value = new basis.data.value.BindValue({ ... });
    *
    *   value.addLink(object, 'property');          // object.property = value;
    *   value.addLink(object, 'property', '[{0}]'); // object.property = '[{0}]'.format(value, oldValue);
    *   value.addLink(object, 'property', Number);  // object.property = Number(value, oldValue);
    *   value.addLink(object, 'property', { a: 1, b: 2});  // object.property = { a: 1, b: 2 }[value];
    *   value.addLink(object, object.method);       // object.method(value, oldValue);
    *
    *   value.addLink(object, function(value, oldValue){ // {function}.call(object, value, oldValue);
    *     // some code
    *     // `this` refer to object
    *   });
    *
    *   // Trace property changes
    *   var historyOfChanges = new Array();
    *   var value = new basis.data.value.BindValue({ value: 1 });
    *   value.addLink(historyOfChanges, historyOfChanges.push);  // historyOfChanges -> [1]
    *   value.set(2);  // historyOfChanges -> [1, 2]
    *   value.set(3);  // historyOfChanges -> [1, 2, 3]
    *   value.set(3);  // property didn't change self value
    *                     // historyOfChanges -> [1, 2, 3]
    *   value.set(1);  // historyOfChanges -> [1, 2, 3, 1]
    *
    *   // Use console for log value changes
    *   value.addLink(console, console.log, 'new value is {0}');
    *
    * @param {object} object Target object.
    * @param {string|function} field Field or method of target object.
    * @param {string|function|object=} format Value modificator.
    * @return {object} Returns object.
    */
    addLink: function(object, field, format){
      // process format argument
      if (typeof format != 'function')
        format = getter(basis.fn.$self, format);

      // check for duplicates
      /** @cut */ var cursor = this;
      /** @cut */ while (cursor = cursor.links_)
      /** @cut */   if (cursor.object === object && cursor.field == field)
      /** @cut */   {
      /** @cut */     basis.dev.warn(this.constructor.className + '#addLink: Duplicate link for property');
      /** @cut */     break;
      /** @cut */   }

      // create link
      this.links_ = { 
        object: object,
        field: field,
        format: format,
        links_: this.links_
      };
      
      // add handler if object is basis.event.Emitter
      if (object instanceof Emitter)
        object.addHandler(EMMITER_HANDLER, this);

      // make effect on object
      this.apply_(this.links_);

      return object;
    },

   /**
    * Removes link from object. Parameters must be the same
    * as for addLink method. If field omited all links are remove.
    *
    * @example
    *   var value = new basis.data.value.BindValue();
    *   // add links
    *   value.addLink(object, 'field');
    *   value.addLink(object, object.method);
    *   // remove links
    *   value.removeLink(object, 'field');
    *   value.removeLink(object, object.method);
    *   // or remove all links for object
    *   value.removeLink(object);
    *
    *   // incorrect usage
    *   value.addLink(object, function(value){ this.field = value * 2; });
    *   ...
    *   value.removeLink(object, function(value){ this.field = value * 2; });
    *   // link to object will not removed
    *
    *   // right way
    *   var linkHandler = function(value){ this.field = value * 2; };
    *   value.addLink(object, linkHandler);
    *   ...
    *   value.removeLink(object, linkHandler);
    *
    *   // for cases when object is instance of {basis.event.Emitter} removing link on destroy is not required
    *   var emitterInstance = new basis.event.Emitter();
    *   value.addLink(emitterInstance, 'title');
    *   ...
    *   emitterInstance.destroy();    // links to emitterInstance will be removed
    *
    * @param {object} object
    * @param {string|function=} field
    */
    removeLink: function(object, field){
      var cursor = this;
      var prev;

      while (prev = cursor, cursor = cursor.links_)
        if (cursor.object === object && (!field || field == cursor.field))
        {
          // prevent apply new values
          cursor.field = null;

          // delete link
          prev.links_ = cursor.links_;

          // remove handler if object is basis.event.Emitter
          if (cursor.object instanceof Emitter)
            cursor.object.removeHandler(EMMITER_HANDLER, this);
        }
    },

   /**
    * Removes all property links to objects.
    */
    clear: function(){
      var cursor = this;

      // remove event handlers from basis.event.Emitter instances
      while (cursor = cursor.links_)
        if (cursor.object instanceof Emitter)
          cursor.object.removeHandler(EMMITER_HANDLER, this);

      // clear links
      this.links_ = null;
    },

   /**
    * @param {object} link
    * @param {*} oldValue Object value before changes.
    * @private
    */
    apply_: function(link, oldValue){
      var field = link.field;

      // field specified
      if (field != null)
      {
        var value = link.format(this.value);
        var object = link.object;

        if (typeof field == 'function')
          field.call(object, value, arguments.length < 2 ? value : link.format(oldValue));
        else
          object[field] = value;
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.clear();

      Value.prototype.destroy.call(this);

      this.links_ = null;
      delete instanceMap[this.basisObjectId];
    }
  });


 /**
  * @class
  */
  var Property = BindValue.subclass({
    className: namespace + '.Property',

    // use custom constructor
    extendConstructor_: false,

   /**
    * @param {object} initValue Initial value for object.
    * @param {object=} handler
    * @param {function()=} proxy
    * @constructor
    */
    init: function(initValue, handler, proxy){
      this.value = initValue;
      this.handler = handler;
      this.proxy = proxy;

      BindValue.prototype.init.call(this);
    }
  });


  //
  //  Object set
  //
                                       // priority: lowest -------------------------------------------------------------> highest
  var OBJECTSET_STATE_PRIORITY = STATE.priority; //[STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING];
  var OBJECTSET_HANDLER = {
    stateChanged: function(){
      this.fire(false, true);
    },
    update: function(){
      this.fire(true);
    },
    change: function(){
      this.fire(true);
    },
    destroy: function(object){
      this.remove(object);
    }
  };

 /**
  * @class
  */    
  var ObjectSet = BindValue.subclass({
    className: namespace + '.ObjectSet',

   /**
    * @type {Array.<basis.data.Object>}
    */
    objects: null,

   /**
    * @inheritDoc
    */
    value: 0,

   /**
    * @type {boolean}
    * @private
    */
    valueChanged_: false,

   /**
    * @type {function}
    */
    calculateValue: function(){
      return this.value + 1;
    },

   /**
    * @type {boolean}
    */
    calculateOnInit: false,

   /**
    * @type {Array.<basis.data.STATE>}
    */ 
    statePriority: OBJECTSET_STATE_PRIORITY,

   /**
    * @type {boolean}
    * @private
    */
    stateChanged_: true,

   /**
    * @type {number}
    * @private
    */
    timer_: false,

   /**
    * @constructor
    */
    init: function(){
      BindValue.prototype.init.call(this);

      var objects = this.objects;
      this.objects = [];

      if (objects && Array.isArray(objects))
      {
        this.lock();
        this.add.apply(this, objects);
        this.unlock();
      }

      this.valueChanged_ = this.stateChanged_ = !!this.calculateOnInit;
      this.update();
    },

   /**
    * Adds one or more AbstractData instances to objects collection.
    * @param {...basis.data.AbstractData}
    */
    add: function(/* dataObject1 .. dataObjectN */){
      for (var i = 0, len = arguments.length; i < len; i++)
      {
        var object = arguments[i];
        if (object instanceof AbstractData)
        {
          if (this.objects.add(object))
            object.addHandler(OBJECTSET_HANDLER, this);
        }
        else
          throw this.constructor.className + '#add: Instance of AbstractData required';
      }

      this.fire(true, true);
    },

   /**
    * Removes AbstractData instance from objects collection.
    * @param {basis.data.AbstractData} object
    */
    remove: function(object){
      if (this.objects.remove(object))
        object.removeHandler(OBJECTSET_HANDLER, this);

      this.fire(true, true);
    },

   /**
    * Removes all AbstractData instances from objects collection.
    */
    clear: function(){
      for (var i = 0, object; object = this.objects[i]; i++)
        object.removeHandler(OBJECTSET_HANDLER, this);

      this.objects.clear();

      this.fire(true, true);
    },

   /**
    * @param {boolean=} valueChanged
    * @param {boolean=} stateChanged
    */
    fire: function(valueChanged, stateChanged){
      if (!this.locked)
      {
        this.valueChanged_ = this.valueChanged_ || !!valueChanged;
        this.stateChanged_ = this.stateChanged_ || !!stateChanged;

        if (!this.timer_ && (this.valueChanged_ || this.stateChanged_))
          this.timer_ = basis.timer.setImmediate(this.update.bind(this));
      }
    },

   /**
    * Makes object not sensitive for attached AbstractData changes.
    */
    lock: function(){
      this.locked = true;
    },

   /**
    * Makes object sensitive for attached AbstractData changes.
    */
    unlock: function(){
      this.locked = false;
    },
    
   /**
    * @private
    */
    update: function(){
      var valueChanged = this.valueChanged_;
      var stateChanged = this.stateChanged_;

      this.valueChanged_ = false;
      this.stateChanged_ = false;

      this.timer_ = basis.timer.clearImmediate(this.timer_);

      if (!cleaner.globalDestroy)
      {
        if (valueChanged)
          this.set(this.calculateValue());

        if (stateChanged)
        {
          var len = this.objects.length;
          if (!len)
            this.setState(STATE.UNDEFINED);
          else
          {
            var maxWeight = -2;
            var curObject;

            for (var i = 0; i < len; i++)
            {
              var object = this.objects[i];
              var weight = this.statePriority.indexOf(String(object.state));
              if (weight > maxWeight)
              {
                curObject = object;
                maxWeight = weight;
              }
            }

            if (curObject)
              this.setState(curObject.state, curObject.state.data);
          }
        }
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.lock();
      this.clear();
      if (this.timer_)
        basis.timer.clearImmediate(this.timer_);

      BindValue.prototype.destroy.call(this);
    }
  });


  //
  // Expression
  //

 /**
  * @class
  */
  var Expression = Property.subclass({
    className: namespace + '.Expression',

    init: function(args, calc){
      BindValue.prototype.init.call(this);

      var args = basis.array(arguments);
      var calc = args.pop();

      if (typeof calc != 'function')
      {
        ;;;basis.dev.warn(this.constructor.className + ': last argument of constructor must be a function');
        calc = basis.fn.$undef;
      }

      if (args.length == 1)
      {
        args[0].addLink(this, function(value){
          this.set(calc.call(this, value));
        });
      }

      if (args.length > 1)
      {
        var changeWatcher = new ObjectSet({
          objects: args,
          calculateOnInit: true,
          calculateValue: function(){
            return calc.apply(this, args.map(function(item){
              return item.value;
            }));
          }
        });

        changeWatcher.addLink(this, this.set);

        this.addHandler({
          destroy: function(){
            if (!cleaner.globalDestroy)
              changeWatcher.destroy();
          }
        });
      }
    }
  });


  //
  // clean up instances
  //

  cleaner.add(function(){
    for (var key in instanceMap)
      instanceMap[key].destroy();

    instanceMap = null;
  });


  //
  // export names
  //

  module.exports = {
    BindValue: BindValue,
    Property: Property,
    ObjectSet: ObjectSet,
    Expression: Expression
  };

  // deprecated
  module.exports.DataObjectSet = ObjectSet;
