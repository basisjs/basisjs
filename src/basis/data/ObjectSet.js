var cleaner = basis.cleaner;
var basisData = require('basis.data');
var AbstractData = basisData.AbstractData;
var Value = basisData.Value;
var STATE = basisData.STATE;
                                     // priority: lowest ---------------------------------------------------------------> highest
var OBJECTSET_STATE_PRIORITY = STATE.priority; // [STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING]
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

var updateQueue = basis.asap.schedule(function(object){
  object.update();
});

/**
* @class
*/
module.exports = Value.subclass({
  className: 'basis.data.value.ObjectSet',

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
  * @constructor
  */
  init: function(){
    Value.prototype.init.call(this);

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
  * @param {...basis.data.AbstractData} objects
  */
  add: function(/* dataObject1 .. dataObjectN */){
    for (var i = 0, len = arguments.length; i < len; i++)
    {
      var object = arguments[i];
      if (object instanceof AbstractData)
      {
        if (basis.array.add(this.objects, object))
          object.addHandler(OBJECTSET_HANDLER, this);
      }
      else
      {
        /** @cut */ basis.dev.warn(this.constructor.className + '#add: Instance of AbstractData required');
      }
    }

    this.fire(true, true);
  },

 /**
  * Removes AbstractData instance from objects collection.
  * @param {basis.data.AbstractData} object
  */
  remove: function(object){
    if (basis.array.remove(this.objects, object))
      object.removeHandler(OBJECTSET_HANDLER, this);

    this.fire(true, true);
  },

 /**
  * Removes all AbstractData instances from objects collection.
  */
  clear: function(){
    for (var i = 0, object; object = this.objects[i]; i++)
      object.removeHandler(OBJECTSET_HANDLER, this);

    this.objects.length = 0;

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

      if (this.valueChanged_ || this.stateChanged_)
        updateQueue.add(this);
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

    updateQueue.remove(this);

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

    updateQueue.remove(this);

    Value.prototype.destroy.call(this);
  }
});
