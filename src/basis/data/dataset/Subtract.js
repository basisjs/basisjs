var createEvent = require('basis.event').create;
var resolveDataset = require('basis.data').resolveDataset;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;
var getDelta = require('./getDelta.js');
var SUBSCRIPTION = require('../subscription.js');


SUBSCRIPTION.addProperty('minuend');
SUBSCRIPTION.addProperty('subtrahend');

var datasetAbsentFilter = function(item){
  return !this.has(item);
};

var SUBTRACTDATASET_MINUEND_HANDLER = {
  itemsChanged: function(dataset, delta){
    if (!this.subtrahend)
      return;

    var newDelta = getDelta(
      /* inserted */ delta.inserted && delta.inserted.filter(datasetAbsentFilter, this.subtrahend),
      /* deleted */  delta.deleted  && delta.deleted.filter(this.has, this)
    );

    if (newDelta)
      this.emit_itemsChanged(newDelta);
  },
  destroy: function(){
    if (!this.minuendRA_)
      this.setMinuend(null);
  }
};

var SUBTRACTDATASET_SUBTRAHEND_HANDLER = {
  itemsChanged: function(dataset, delta){
    if (!this.minuend)
      return;

    var newDelta = getDelta(
      /* inserted */ delta.deleted  && delta.deleted.filter(this.minuend.has, this.minuend),
      /* deleted */  delta.inserted && delta.inserted.filter(this.has, this)
    );

    if (newDelta)
      this.emit_itemsChanged(newDelta);
  },
  destroy: function(){
    if (!this.subtrahendRA_)
      this.setSubtrahend(null);
  }
};


/**
* @class
*/
module.exports = ReadOnlyDataset.subclass({
  className: 'basis.data.dataset.Subtract',

  propertyDescriptors: {
    minuend: 'minuendChanged',
    subtrahend: 'subtrahendChanged'
  },

  active: basis.PROXY,
  subscribeTo: SUBSCRIPTION.MINUEND + SUBSCRIPTION.SUBTRAHEND,

 /**
  * @type {basis.data.ReadOnlyDataset}
  */
  minuend: null,

 /**
  * Minuend wrapper
  * @type {basis.data.ResolveAdapter}
  */
  minuendRA_: null,

 /**
  * Fires when minuend changed.
  * @param {basis.data.ReadOnlyDataset} oldMinuend Value of {basis.data.dataset.Subtract#minuend} before changes.
  * @event
  */
  emit_minuendChanged: createEvent('minuendChanged', 'oldMinuend'),

 /**
  * @type {basis.data.ReadOnlyDataset}
  */
  subtrahend: null,

 /**
  * Subtrahend wrapper
  * @type {basis.data.ResolveAdapter}
  */
  subtrahendRA_: null,

 /**
  * Fires when subtrahend changed.
  * @param {basis.data.ReadOnlyDataset} oldSubtrahend Value of {basis.data.dataset.Subtract#subtrahend} before changes.
  * @event
  */
  emit_subtrahendChanged: createEvent('subtrahendChanged', 'oldSubtrahend'),

 /**
  * @inheritDoc
  */
  listen: {
    minuend: SUBTRACTDATASET_MINUEND_HANDLER,
    subtrahend: SUBTRACTDATASET_SUBTRAHEND_HANDLER
  },

 /**
  * @constructor
  */
  init: function(){
    // inherit
    ReadOnlyDataset.prototype.init.call(this);

    // init part
    var minuend = this.minuend;
    var subtrahend = this.subtrahend;

    this.minuend = null;
    this.subtrahend = null;

    if (minuend || subtrahend)
      this.setOperands(minuend, subtrahend);
  },

 /**
  * Set new minuend & subtrahend.
  * @param {basis.data.ReadOnlyDataset=} minuend
  * @param {basis.data.ReadOnlyDataset=} subtrahend
  * @return {object|boolean} Delta if changes happend
  */
  setOperands: function(minuend, subtrahend){
    var delta;
    var operandsChanged = false;
    var oldMinuend = this.minuend;
    var oldSubtrahend = this.subtrahend;

    minuend = resolveDataset(this, this.setMinuend, minuend, 'minuendRA_');
    subtrahend = resolveDataset(this, this.setSubtrahend, subtrahend, 'subtrahendRA_');

    // set new minuend if changed
    if (oldMinuend !== minuend)
    {
      operandsChanged = true;
      this.minuend = minuend;

      var listenHandler = this.listen.minuend;
      if (listenHandler)
      {
        if (oldMinuend)
          oldMinuend.removeHandler(listenHandler, this);

        if (minuend)
          minuend.addHandler(listenHandler, this);
      }

      this.emit_minuendChanged(oldMinuend);
    }

    // set new subtrahend if changed
    if (oldSubtrahend !== subtrahend)
    {
      operandsChanged = true;
      this.subtrahend = subtrahend;

      var listenHandler = this.listen.subtrahend;
      if (listenHandler)
      {
        if (oldSubtrahend)
          oldSubtrahend.removeHandler(listenHandler, this);

        if (subtrahend)
          subtrahend.addHandler(listenHandler, this);
      }

      this.emit_subtrahendChanged(oldSubtrahend);
    }

    if (!operandsChanged)
      return false;

    // apply changes
    if (!minuend || !subtrahend)
    {
      if (this.itemCount)
        this.emit_itemsChanged(delta = {
          deleted: this.getItems()
        });
    }
    else
    {
      var deleted = [];
      var inserted = [];

      for (var key in this.items_)
        if (!minuend.items_[key] || subtrahend.items_[key])
          deleted.push(this.items_[key]);

      for (var key in minuend.items_)
        if (!this.items_[key] && !subtrahend.items_[key])
          inserted.push(minuend.items_[key]);

      if (delta = getDelta(inserted, deleted))
        this.emit_itemsChanged(delta);
    }

    return delta;
  },

 /**
  * @param {basis.data.ReadOnlyDataset} minuend
  * @return {Object} Delta if changes happend
  */
  setMinuend: function(minuend){
    return this.setOperands(
      minuend,
      this.subtrahendRA_ ? this.subtrahendRA_.source : this.subtrahend
    );
  },

 /**
  * @param {basis.data.ReadOnlyDataset} subtrahend
  * @return {Object} Delta if changes happend
  */
  setSubtrahend: function(subtrahend){
    return this.setOperands(
      this.minuendRA_ ? this.minuendRA_.source : this.minuend,
      subtrahend
    );
  },

 /**
  * @inheritDoc
  */
  destroy: function(){
    this.setOperands();

    ReadOnlyDataset.prototype.destroy.call(this);
  }
});
