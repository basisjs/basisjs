var createEvent = require('basis.event').create;
var resolveDataset = require('basis.data').resolveDataset;
var ReadOnlyDataset = require('basis.data').ReadOnlyDataset;
var setAccumulateState = require('basis.data').Dataset.setAccumulateState;
var SUBSCRIPTION = require('../subscription.js');

SUBSCRIPTION.addProperty('source');

/**
* @class
*/
module.exports = ReadOnlyDataset.subclass({
  className: 'basis.data.dataset.SourceDataset',

  propertyDescriptors: {
    source: 'sourceChanged',
    subtrahend: 'subtrahendChanged'
  },

  active: basis.PROXY,
  subscribeTo: SUBSCRIPTION.SOURCE,

 /**
  * Data source.
  * @type {basis.data.ReadOnlyDataset}
  */
  source: null,

 /**
  * Fires when source changed.
  * @param {basis.data.ReadOnlyDataset} oldSource Previous value for source property.
  * @event
  */
  emit_sourceChanged: createEvent('sourceChanged', 'oldSource'),

 /**
  * Source wrapper
  * @type {basis.data.ResolveAdapter}
  */
  sourceRA_: null,

 /**
  * Map of source objects.
  * @type {object}
  * @private
  */
  sourceMap_: null,

 /**
  * @inheritDoc
  */
  listen: {
    source: {
      destroy: function(){
        if (!this.sourceRA_)
          this.setSource();
      }
    }
  },

 /**
  * @constructor
  */
  init: function(){
    var source = this.source;

    this.source = null;
    this.sourceMap_ = {};

    ReadOnlyDataset.prototype.init.call(this);

    if (source)
      this.setSource(source);
  },

 /**
  * Set new source dataset.
  * @param {basis.data.ReadOnlyDataset} source
  */
  setSource: function(source){
    source = resolveDataset(this, this.setSource, source, 'sourceRA_');

    // sync with source
    if (this.source !== source)
    {
      var oldSource = this.source;
      var listenHandler = this.listen.source;
      var itemsChangedHandler;

      // add/remove listen
      if (listenHandler)
      {
        itemsChangedHandler = listenHandler.itemsChanged;

        if (oldSource)
          oldSource.removeHandler(listenHandler, this);

        if (source)
          source.addHandler(listenHandler, this);
      }

      // change the source
      this.source = source;
      this.emit_sourceChanged(oldSource);

      /** @cut */ basis.dev.patchInfo(this, 'sourceInfo', {
      /** @cut */   source: source
      /** @cut */ });

      // sync items
      if (itemsChangedHandler)
      {
        setAccumulateState(true);

        if (oldSource)
          itemsChangedHandler.call(this, oldSource, {
            deleted: oldSource.getItems()
          });

        if (source)
          itemsChangedHandler.call(this, source, {
            inserted: source.getItems()
          });

        setAccumulateState(false);
      }
    }
  },

 /**
  * @inheritDoc
  */
  destroy: function(){
    this.setSource();

    // inherit
    ReadOnlyDataset.prototype.destroy.call(this);

    this.sourceMap_ = null;
  }
});
