
  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.cssom');
  basis.require('basis.data');


 /**
  * Namespace overview:
  * - {basis.data.property.DataObjectSet}
  * - {basis.data.property.AbstractProperty}
  * - {basis.data.property.Property}
  * - {basis.data.property.PropertySet} as aliases for {basis.data.property.DataObjectSet}
  *
  * @namespace basis.data.property
  */

  var namespace = this.path;

  // import names

  var Class = basis.Class;
  var DOM = basis.dom;

  var cleaner = basis.cleaner;

  var getter = basis.getter;
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;

  var TimeEventManager = basis.timer.TimeEventManager;
  var EventObject = basis.event.EventObject;
  var createEvent = basis.event.create;

  var nsData = basis.data;
  var DataObject = nsData.DataObject;
  var STATE = nsData.STATE;

  //
  // Main part
  //

  // Module exceptions

  /** @const */ var EXCEPTION_DATAOBJECT_REQUIRED = namespace + ': Instance of DataObject required';
  /** @const */ var EXCEPTION_BAD_OBJECT_LINK = namespace + ': Link to undefined object ignored';

  //
  //  ABSTRACT PROPERTY
  //
  
 /**
  * @class
  */
  var AbstractProperty = Class(DataObject, {
    className: namespace + '.AbstractProperty',

    event_change: createEvent('change'),

   /**
    * Indicates that property is locked (don't fire event for changes).
    * @type {boolean}
    * @readonly
    */
    locked: false,

   /**
    * Value before property locked (passed as oldValue when property unlock).
    * @type {object}
    * @private
    */
    lockValue_: null,

   /** use custom constructor */
    extendConstructor_: false,

    updateCount: 0,

   /**
    * @param {object} initValue Initial value for object.
    * @param {object=} handlers
    * @param {function()=} proxy
    * @constructor
    */
    init: function(initValue, handlers, proxy){
      DataObject.prototype.init.call(this, {});
      if (handlers)
        this.addHandler(handlers);

      this.proxy = typeof proxy == 'function' ? proxy : basis.fn.$self;
      this.initValue = this.value = this.proxy(initValue);
    },

   /**
    * Sets new value for property, only when data not equivalent current
    * property's value. In causes when value was changed or forceEvent
    * parameter was true event 'change' dispatching.
    * @param {object} data New value for property.
    * @param {boolean=} forceEvent Dispatch 'change' event even value not changed.
    * @return {boolean} Whether value was changed.
    */
    set: function(data, forceEvent){
      var oldValue = this.value;
      var newValue = this.proxy ? this.proxy(data) : data;
      var updated = false;

      if (newValue !== oldValue)
      {
        this.value = newValue;
        updated = true;
        this.updateCount += 1;
      }

      if (!this.locked && (updated || forceEvent))
        this.event_change(newValue, oldValue);

      return updated;
    },

   /**
    * Locks object for change event fire.
    */
    lock: function(){
      if (!this.locked)
      {
        this.lockValue_ = this.value;
        this.locked = true;
      }
    },

   /**
    * Unlocks object for change event fire. If value was changed during object
    * lock, than change event fires.
    */
    unlock: function(){
      if (this.locked)
      {
        this.locked = false;
        if (this.value !== this.lockValue_)
          this.event_change(this.value, this.lockValue_);
      }
    },

    update: function(newValue, forceEvent){
      return this.set(newValue, forceEvent);
    },

   /**
    * Sets init value for property.
    */
    reset: function(){
      this.set(this.initValue);
    },

   /**
    * Returns object value.
    * @return {object}
    */
    /*toString: function(){
      return this.value != null && this.value.constructor == Object ? String(this.value) : this.value;
    },*/

   /**
    * @destructor
    */
    destroy: function(){
      DataObject.prototype.destroy.call(this);

      delete this.initValue;
      delete this.proxy;
      delete this.lockValue_;
      delete this.value;
    }
  });

  //
  //  PROPERTY
  //

  var PropertyObjectDestroyAction = { 
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
  var Property = Class(AbstractProperty, {
    className: namespace + '.Property',

   /**
    * @type {object}
    * @private
    */
    links_: null,

   /**
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
    event_change: function(value, oldValue){
      AbstractProperty.prototype.event_change.call(this, value, oldValue);

      if (!this.links_.length || cleaner.globalDestroy)
        return;

      for (var i = 0, link; link = this.links_[i++];)
        this.apply_(link, oldValue);
    },

   /**
    * @inheritDoc
    * @constructor
    */
    init: function(initValue, handlers, proxy){
      AbstractProperty.prototype.init.call(this, initValue, handlers, proxy);
      this.links_ = [];

      cleaner.add(this);
    },

   /**
    * Adds link to object property or method. Optional parameter format using to
    * convert value to another value or type.
    * If object instance of {basis.event.EventObject}, property attached handler. This handler
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
          throw new Error(EXCEPTION_BAD_OBJECT_LINK);

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
        isEventObject: object instanceof EventObject 
      };

      // add link
      ;;;if (this.links_.some(function(link){ return link.object == object && link.field == field; })) basis.dev.warn('Property.addLink: Duplicate link for property');
      this.links_.push(link);  // !!! TODO: check for object-field duplicates
      
      if (link.isEventObject)
        object.addHandler(PropertyObjectDestroyAction, this); // add unlink handler on object destroy

      // make effect on object
      this.apply_(link);

      return object;
    },

   /**
    * Add link to object in simpler way.
    * @example
    *   // add custom class name to element (class name looks like "state-property.value")
    *   property.addLinkShortcut(element, 'className', 'state-{0}');
    *   // add 'loading' class name to element, when property is true
    *   property.addLinkShortcut( element, 'className', { true: 'loading' });
    *   // switch style.display property (using cssom.show/cssom.hide)
    *   property.addLinkShortcut(element, 'show', { ShowValue: true });
    *   property.addLinkShortcut(element, 'show', function(value){ return value == 'ShowValue' });  // the same
    *   property.addLinkShortcut(element, 'hide', { 'HideValue': true } });  // variation
    * @param {object} element Target object.
    * @param {string} shortcutName Name of shortcut.
    * @param {string|function|object=} format Value modificator.
    * @return {object} Returns object.
    */
    addLinkShortcut: function(element, shortcutName, format){
      return this.addLink(element, Property.shortcut[shortcutName], format);
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
    *   // for cases when object is instance of {basis.event.EventObject} removing link on destroy is not required
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
          if (link.isEventObject)
            link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink handler on object destroy
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
        if (link.isEventObject)
          link.object.removeHandler(PropertyObjectDestroyAction, this); // remove unlink on object destroy

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

      AbstractProperty.prototype.destroy.call(this);

      this.links_ = null;
      cleaner.remove(this);
    }
  });

  Property.shortcut = {
    className: function(newValue, oldValue){
      classList(this).replace(oldValue, newValue);
    },
    show: function(newValue){
      cssom.display(this, !!newValue);
    },
    hide: function(newValue){
      cssom.display(this, !newValue);
    },
    disable: function(newValue){
      this.disabled = !!newValue;
    },
    enable: function(newValue){
      this.disabled = !newValue;
    }
  };

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
    * @type {Array.<basis.data.DataObject>}
    */
    objects: null,

   /**
    * @type {number}
    * @private
    */
    timer_: null,

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
    * Adds one or more DataObject instances to objects collection.
    * @param {...basis.data.DataObject}
    */
    add: function(/* dataObject1 .. dataObjectN */){
      for (var i = 0, len = arguments.length; i < len; i++)
      {
        var object = arguments[i];
        if (object instanceof DataObject)
        {
          if (this.objects.add(object))
            object.addHandler(DataObjectSetHandlers, this);
        }
        else
          throw new Error(EXCEPTION_DATAOBJECT_REQUIRED);
      }

      this.fire(true, true);
    },

   /**
    * Removes DataObject instance from objects collection.
    * @param {basis.data.DataObject} object
    */
    remove: function(object){
      if (this.objects.remove(object))
        object.removeHandler(DataObjectSetHandlers, this);

      this.fire(true, true);
    },

   /**
    * Removes all DataObject instances from objects collection.
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
    * Makes object not sensitive for attached DataObject changes.
    */
    lock: function(){
      this.locked = true;
    },

   /**
    * Makes object sensitive for attached DataObject changes.
    */
    unlock: function(){
      this.locked = false;
    },
    
   /**
    * @private
    */
    update: function(){
      delete this.timer_;
      TimeEventManager.remove(this, 'update');

      if (!cleaner.globalDestroy)
      {
        if (this.valueChanged_)
          this.set(this.calculateValue());

        if (this.stateChanged_)
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

      this.valueChanged_ = false;
      this.stateChanged_ = false;
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
  // export names
  //

  module.exports = {
    DataObjectSet: DataObjectSet,
    AbstractProperty: AbstractProperty,
    Property: Property,
    PropertySet: DataObjectSet
  };
