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
    * Namespace overview:
    * - DataObjectSet
    * - AbstractProperty
    * - Property
    * - PropertySet as aliases for DataObjectSet
    *
    * @namespace Basis.Data.Property
    */

    var namespace = 'Basis.Data.Property';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    var Cleaner = Basis.Cleaner;

    var getter = Function.getter;
    var cssClass = Basis.CSS.cssClass;

    var EventObject = Basis.EventObject;
    var TimeEventManager = Basis.TimeEventManager;
    var event = EventObject.event;
    var createEvent = EventObject.createEvent;

    var nsData = Basis.Data;
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

     /**
      * Indicates that property is locked (don't fire event for changes).
      * @type {boolean}
      * @readonly
      */
      locked: false,

     /**
      * Value before property locked (passed as oldValue when property unlock).
      * @type {Object}
      * @private
      */
      lockValue_: null,

     /**
      * @param {Object} initValue Initial value for object.
      * @param {Object=} handlers
      * @param {function()=} proxy
      * @constructor
      */
      init: function(initValue, handlers, proxy){
        DataObject.prototype.init.call(this, {});
        if (handlers)
          this.addHandler(handlers);

        this.proxy = typeof proxy == 'function' ? proxy : Function.$self;
        this.initValue = this.value = this.proxy(initValue);
      },

     /**
      * Sets new value for property, only when data not equivalent current
      * property's value. In causes when value was changed or forceEvent
      * parameter was true event 'change' dispatching.
      * @param {Object} data New value for property.
      * @param {boolean=} forceEvent Dispatch 'change' event even value not changed.
      * @return {boolean} Whether value was changed.
      */
      set: function(data, forceEvent){
        var oldValue = this.value;
        var newValue = this.proxy ? this.proxy(data) : newValue;
        var updated = false;

        if (newValue !== oldValue)
        {
          this.value = newValue;
          updated = true;
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
      * @return {Object}
      */
      toString: function(){
        return this.value != null && this.value.constructor == Object ? String(this.value) : this.value;
      },

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
        this.removeLink(object) 
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

      event_change: createEvent('change') && function(value, oldValue){
        event.change.call(this, value, oldValue);

        if (!this.links_.length || Cleaner.globalDestroy)
          return;

        for (var i = 0, link; link = this.links_[i++];)
          this.power_(link, oldValue);
      },

     /**
      * @inheritDoc
      * @constructor
      */
      init: function(initValue, handlers, proxy){
        AbstractProperty.prototype.init.call(this, initValue, handlers, proxy);
        this.links_ = new Array();

        Cleaner.add(this);
      },

     /**
      * Adds link to object property or method. Optional parameter format using to
      * convert value to another value or type.
      * If object instance of {Basis.EventObject}, property attached handler. This handler
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
      * @param {Object} object Target object.
      * @param {String|Function=} field Field or method of target object.
      * @param {String|Function|Object=} format Value modificator.
      * @return {Object} Returns object.
      */
      addLink: function(object, field, format){
        // object must be an Object
        // IE HtmlNode isn't instanceof Object, therefore additionaly used typeof
        if (typeof object != 'object' && object instanceof Object == false)
          throw new Error(EXCEPTION_BAD_OBJECT_LINK);

        // process field name
        if (field == null)
          field = getFieldHandler(object);

        // process format argument
        if (typeof format != 'function')
          format = getter(Function.$self, format);

        // create link
        var link = { 
          object: object,
          format: format,
          field: field,
          isEventObject: object instanceof EventObject 
        };

        // add link
        ;;;if (typeof console != 'undefined' && this.links_.search(true, function(link){ return link.object == object && link.field == field })) console.warn('Property.addLink: Dublicate link for property');
        this.links_.push(link);  // !!! TODO: check for object-field duplicates
        
        if (link.isEventObject)
          object.addHandler(PropertyObjectDestroyAction, this); // add unlink handler on object destroy

        // make effect on object
        this.power_(link);

        return object;
      },

     /**
      * Add link to object in simpler way.
      * @example
      *   // add custom class name to element (class name looks like "state-property.value")
      *   property.addLinkShortcut(element, 'className', 'state-{0}');
      *   // add 'loading' class name to element, when property is true
      *   property.addLinkShortcut( element, 'className', { true: 'loading' });
      *   // switch style.display property (using DOM.show/DOM.hide)
      *   property.addLinkShortcut(element, 'show', { ShowValue: true });
      *   property.addLinkShortcut(element, 'show', function(value){ return value == 'ShowValue' });  // the same
      *   property.addLinkShortcut(element, 'hide', { 'HideValue': true } });  // variation
      * @param {object} element Target object.
      * @param {String} shortcutName Name of shortcut.
      * @param {String|Function|Object=} format Value modificator.
      * @return {Object} Returns object.
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
      *   // for cases when object is instance of {Basis.EventObject} removing link on destroy is not required
      *   var node = new Node();
      *   property.addLink(node, 'title');
      *   ...
      *   node.destroy();       // links will be removed automatically
      * @param {Object} object
      * @param {String|Function=} field
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
      * @param {Object} link
      * @param {Object} oldValue Object value before changes.
      * @private
      */
      power_: function(link, oldValue){
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
        Cleaner.remove(this);
      }
    });

    Property.shortcut = {
      className: function(newValue, oldValue){ cssClass(this).replace(oldValue, newValue) },
      show:      function(newValue){ DOM.display(this, !!newValue) },
      hide:      function(newValue){ DOM.display(this, !newValue) },
      disable:   function(newValue){ this.disabled = !!newValue },
      enable:    function(newValue){ this.disabled = !newValue }
    };

    //
    //  Property Set
    //
                         // priority: lowest  ------------------------------------------------------------> highest
    var DataObjectSetStatePriority = [STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING];
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
        this.remove(object)
      }
    };

   /**
    * @class
    */    
    var DataObjectSet = Class(Property, {
      className: namespace + '.DataObjectSet',
      
     /**
      * @type {Function}
      */
      calculateValue: function(){
        return this.value + 1;
      },

     /**
      * @type {Array.<Basis.Data.DataObject>}
      */
      objects: [],

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
      * @param {Object} config
      * @config {Object} value
      * @config {Object} handlers
      * @config {boolean} calculateOnInit
      * @config {function()} proxy
      * @config {function()} calculateValue
      * @config {Array.<Basis.Data.DataObject>} objects
      * @constructor
      */
      init: function(config){
        config = config || {};

        Property.prototype.init.call(this, 'value' in config ? config.value : 0, config.handlers, config.proxy);

        this.objects = new Array();

        if (typeof config.calculateValue == 'function')
          this.calculateValue = config.calculateValue;

        if (config.objects)
        {
          this.lock();
          this.add.apply(this, config.objects);
          this.unlock();
        }

        this.valueChanged_ = this.stateChanged_ = !!config.calculateOnInit;
        this.update();

        Cleaner.add(this);
      },

     /**
      * Adds one or more DataObject instances to objects collection.
      * @param {...Basis.Data.DataObject} args
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
      * @param {Basis.Data.DataObject} object
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
      * @param {boolean} valueChanged 
      * @param {boolean} stateChanged
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

        if (!Cleaner.globalDestroy)
        {
          if (this.valueChanged_)
            this.set(this.calculateValue());

          if (this.stateChanged_)
          {
            var stateMap = {};
            var len = this.objects.length;
            if (!len)
              this.setState(STATE.UNDEFINED)
            else
            {
              var maxWeight = -2;
              var curObject;

              for (var i = 0; i < len; i++)
              {
                var object = this.objects[i];
                var weight = DataObjectSetStatePriority.indexOf(String(object.state));
                if (weight > maxWeight)
                {
                  curObject = object;
                  maxWeight = weight;
                }
              }

              if (curObject)
                this.setState(curObject.state, curObject.state.data);
            }
            //this.setState();
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

    Basis.namespace(namespace).extend({
      DataObjectSet: DataObjectSet,
      AbstractProperty: AbstractProperty,
      Property: Property,
      PropertySet: DataObjectSet
    });

  })();
