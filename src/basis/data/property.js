
  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - {basis.data.property.Property}
  * - {basis.data.property.DataObjectSet}
  * - {basis.data.property.Expression}
  *
  * @namespace basis.data.property
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var getter = basis.getter;
  var cleaner = basis.cleaner;

  var TimeEventManager = basis.timer.TimeEventManager;
  var Emitter = basis.event.Emitter;

  var DOM = basis.dom;
  var AbstractData = basis.data.AbstractData;
  var Value = basis.data.Value;
  var STATE = basis.data.STATE;


  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_ABSTRACTDATA_REQUIRED = namespace + ': Instance of AbstractData required';
  /** @const */ var EXCEPTION_BAD_OBJECT_LINK = namespace + ': Link to undefined object ignored';


  //
  //  PROPERTY
  //

  var EMMITER_HANDLER = { 
    destroy: function(object){
      this.removeLink(object); 
    } 
  };

  var DOM_INSERT_HANDLER = function(value){
    DOM.insert(DOM.clear(this), value);
  };

  function getFieldHandler(object){
    // property
    if (object instanceof Property)
      return object.set;

    // DOM
    var nodeType = object.nodeType;
    if (isNaN(nodeType) == false)
      if (nodeType == 1)
        return DOM_INSERT_HANDLER;
      else
        return 'nodeValue';
  }

 /**
  * @class
  */
  var Property = Class(Value, {
    className: namespace + '.Property',

    // use custom constructor
    extendConstructor_: false,

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

      if (!this.links_.length || cleaner.globalDestroy)
        return;

      for (var i = 0, link; link = this.links_[i++];)
        this.apply_(link, oldValue);
    },

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

      Value.prototype.init.call(this);

      this.links_ = [];

      cleaner.add(this);
    },

   /**
    * Adds link to object property or method. Optional parameter format using to
    * convert value to another value or type.
    * If object instance of {basis.event.Emitter}, property attached handler. This handler
    * removes property links to object, when object destroy.
    * @example
    *
    *   var property = new Property();
    *   property.addLink(htmlElement);  // property.set(value) -> DOM.insert(DOM.clear(htmlElement), value);
    *   property.addLink(htmlTextNode); // shortcut for property.addLink(htmlTextNode, 'nodeValue')
    *                                   // property.set(value) -> htmlTextNode.nodeValue = value;
    *
    *   property.addLink(htmlTextNode, null, '[{0}]'); // htmlTextNode.nodeValue = '[{0}]'.format(value, oldValue);
    *   property.addLink(htmlTextNode, null, convert); // htmlTextNode.nodeValue = convert(value);
    *
    *   property.addLink(object, 'property');          // object.property = value;
    *   property.addLink(object, 'property', '[{0}]'); // object.property = '[{0}]'.format(value, oldValue);
    *   property.addLink(object, 'property', Number);  // object.property = Number(value, oldValue);
    *   property.addLink(object, 'property', { a: 1, b: 2});  // object.property = { a: 1, b: 2 }[value];
    *   property.addLink(object, object.method);       // object.method(value, oldValue);
    *
    *   property.addLink(object, function(value, oldValue){ // {function}.call(object, value, oldValue);
    *     // some code
    *     // (`this` is object property attached to)
    *   });
    *
    *   // Trace property changes
    *   var historyOfChanges = new Array();
    *   var property = new Property(1);
    *   property.addLink(historyOfChanges, historyOfChanges.push);  // historyOfChanges -> [1]
    *   property.set(2);  // historyOfChanges -> [1, 2]
    *   property.set(3);  // historyOfChanges -> [1, 2, 3]
    *   property.set(3);  // property didn't change self value
    *                     // historyOfChanges -> [1, 2, 3]
    *   property.set(1);  // historyOfChanges -> [1, 2, 3, 1]
    *
    *   // Another one
    *   property.addLink(console, console.log, 'new value of property is {0}');
    *
    * @param {object} object Target object.
    * @param {string|function=} field Field or method of target object.
    * @param {string|function|object=} format Value modificator.
    * @return {object} Returns object.
    */
    addLink: function(object, field, format){
      // process field name
      if (field == null)
      {
        // object must be an Object
        // IE HtmlNode isn't instanceof Object, therefore additionaly used typeof
        if (typeof object != 'object' && object instanceof Object == false)
          throw EXCEPTION_BAD_OBJECT_LINK;

        field = getFieldHandler(object);
      }

      // process format argument
      if (typeof format != 'function')
        format = getter(basis.fn.$self, format);

      // create link
      var link = { 
        object: object,
        format: format,
        field: field,
        isEmitter: object instanceof Emitter 
      };

      // add link
      ;;;if (this.links_.some(function(link){ return link.object == object && link.field == field; })) basis.dev.warn('Property.addLink: Duplicate link for property');
      this.links_.push(link);
      
      if (link.isEmitter)
        object.addHandler(EMMITER_HANDLER, this); // add unlink handler on object destroy

      // make effect on object
      this.apply_(link);

      return object;
    },

   /**
    * Removes link or all links from object if exists. Parameters must be the same
    * as for addLink method. If field omited all links removes.
    * @example
    *   // add links
    *   property.addLink(object, 'field');
    *   property.addLink(object, object.method);
    *   // remove links
    *   property.removeLink(object, 'field');
    *   property.removeLink(object, object.method);
    *   // or remove all links from object
    *   property.removeLink(object);
    *
    *   // incorrect usage
    *   property.addLink(object, function(value){ this.field = value * 2; });
    *   ...
    *   property.removeLink(object, function(value){ this.field = value * 2; });
    *   // link property to object still present
    *
    *   // right way
    *   var linkHandler = function(value){ this.field = value * 2; };
    *   property.addLink(object, linkHandler);
    *   ...
    *   property.removeLink(object, linkHandler);
    *
    *   // for cases when object is instance of {basis.event.Emitter} removing link on destroy is not required
    *   var node = new Node();
    *   property.addLink(node, 'title');
    *   ...
    *   node.destroy();       // links will be removed automatically
    * @param {object} object
    * @param {string|function=} field
    */
    removeLink: function(object, field){
      if (this.links_ == null) // property destroyed
        return;

      var deleteAll = arguments.length < 2;

      // process field name
      if (!deleteAll && field == null)
        field = getFieldHandler(object);

      // delete link
      var k = 0;
      for (var i = 0, link; link = this.links_[i]; i++)
      {
        if (link.object === object && (deleteAll || field == link.field))
        {
          if (link.isEmitter)
            link.object.removeHandler(EMMITER_HANDLER, this); // remove unlink handler on object destroy
        }
        else
          this.links_[k++] = link;
      }
      this.links_.length = k;
    },

   /**
    * Removes all property links to objects.
    */
    clear: function(){
      // destroy links
      for (var i = 0, link; link = this.links_[i]; i++)
        if (link.isEmitter)
          link.object.removeHandler(EMMITER_HANDLER, this); // remove unlink on object destroy

      // clear links array
      this.links_.clear();
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
      cleaner.remove(this);
    }
  });

  //
  //  Property Set
  //
                       // priority: lowest  ------------------------------------------------------------> highest
  var DataObjectSetStatePriority = STATE.priority; //[STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING];
  var DataObjectSetHandlers = {
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
  var DataObjectSet = Class(Property, {
    className: namespace + '.DataObjectSet',

    statePriority: DataObjectSetStatePriority,
    
   /**
    * @type {function}
    */
    calculateValue: function(){
      return this.value + 1;
    },

   /**
    * @type {Array.<basis.data.Object>}
    */
    objects: null,

   /**
    * @type {boolean}
    * @private
    */
    timer_: false,

   /**
    * @type {boolean}
    * @private
    */
    valueChanged_: false,

   /**
    * @type {boolean}
    * @private
    */
    stateChanged_: true,

   /**
    * Default state is UNDEFINED
    */
    state: STATE.UNDEFINED,

   /**
    * use extend constructor
    */
    extendConstructor_: true,

   /**
    * @constructor
    */
    init: function(){
      var handlers = this.handler;
      this.handler = null;

      Property.prototype.init.call(this, this.value || 0, handlers, this.proxy);

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
            object.addHandler(DataObjectSetHandlers, this);
        }
        else
          throw EXCEPTION_ABSTRACTDATA_REQUIRED;
      }

      this.fire(true, true);
    },

   /**
    * Removes AbstractData instance from objects collection.
    * @param {basis.data.AbstractData} object
    */
    remove: function(object){
      if (this.objects.remove(object))
        object.removeHandler(DataObjectSetHandlers, this);

      this.fire(true, true);
    },

   /**
    * Removes all AbstractData instances from objects collection.
    */
    clear: function(){
      for (var i = 0, object; object = this.objects[i]; i++)
        object.removeHandler(DataObjectSetHandlers, this);
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
        {
          this.timer_ = true;
          TimeEventManager.add(this, 'update', Date.now());
        }
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

      this.timer_ = false;
      TimeEventManager.remove(this, 'update');

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
      TimeEventManager.remove(this, 'update');

      Property.prototype.destroy.call(this);
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
      Property.prototype.init.call(this);

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
        var changeWatcher = new DataObjectSet({
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
            changeWatcher.destroy();
          }
        });
      }
    }
  });


  //
  // export names
  //

  module.exports = {
    Property: Property,
    DataObjectSet: DataObjectSet,
    Expression: Expression
  };
