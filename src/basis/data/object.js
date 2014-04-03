
  basis.require('basis.data');


 /**
  * @namespace basis.data.object
  */

  var namespace = this.path;


  //
  // import names
  //

  var DataObject = basis.data.Object;


 /**
  * Getter generator for quick field values fetch from source object.
  * TODO: cache?
  */
  function generateGetData(names, sourceNames){
    return new Function('data', 'return {' +
      names.map(function(name, idx){
        var ownName = name.replace(/"/g, '\\"');
        var sourceName = ((sourceNames && sourceNames[idx]) || name).replace(/"/g, '\\"');
        return '"' + ownName + '": data["' + sourceName + '"]';
      }) +
    '}');
  }

 /**
  * Handler for sources of Merge instances.
  */
  var MERGE_SOURCE_HANDLER = {
    update: function(sender, senderDelta){
      var data = {};

      if (this.name == this.host.fields.defaultSource)
      {
        for (var key in senderDelta)
          if (key in this.host.fields.sourceField == false)
            data[key] = sender.data[key];
      }
      else
      {
        for (var key in senderDelta)
          if (this.host.fields.sourceField[key] == this.name)
            data[key] = sender.data[key];
      }

      for (var key in data)
        return this.host.update(data);
    },
    destroy: function(){
      this.host.setSource(this.name, null);
    }
  };


 /**
  * Extend function for basis.data.object.Merge#fields.
  * It builds field to source map and possible source list.
  */
  var fieldsExtend = function(fields){
    var sources = {};
    var result = {
      defaultSource: false,
      sourceField: {},
      sources: {},
      __extend__: fieldsExtend
    };

    // default source is a source that defined for star rule
    if (fields['*'])
      result.defaultSource = fields['*'];

    // process fields from definition
    for (var field in fields)
    {
      var sourceName = fields[field];

      if (sourceName == result.defaultSource)
      {
        /** @cut */ if (field != '*')
        /** @cut */   basis.dev.warn('basis.data.object.Merge: source `' + sourceName + '` has already defined for any field (star rule), definition this source for `' + field + '` field is superfluous.');
        continue;
      }

      if (!sources[sourceName])
        sources[sourceName] = [];

      sources[sourceName].push(field);
      result.sourceField[field] = sourceName;
    }

    // generate source values getters
    for (var sourceName in sources)
      result.sources[sourceName] = generateGetData(sources[sourceName]);

    // generate values getter for default source
    if (result.defaultSource)
      result.sources[result.defaultSource] = function(data){
        var res = {};
        for (var key in data)
          if (key in result.sourceField == false)
            res[key] = data[key];
        return res;
      };

    return result;
  };


 /**
  * @class
  * TODO:
  *   - subscription for sources
  *   - listen for sources (named listens 'source:foo')
  *   - field name in source (i.e. foo: 'bar:baz'), may be useful, when required
  *     to get fields with the same name from different sources
  */
  var Merge = DataObject.subclass({
    className: namespace + '.Merge',

   /**
    * Emit when one of source reference changes.
    * @param {string} name Name of source.
    * @param {DataObject} oldSource Value of source reference before changes.
    * @event
    */
    emit_sourceChanged: basis.event.create('sourceChanged', 'name', 'oldSource'),

   /**
    * Field source association map. Key is field name, and value is source name.
    * Based on this map, instance build list of possible sources. This property could
    * be set on subclass definition or instance creation, but not during instance
    * life cycle.
    *
    * If star used for field name, it means that all non-specified field names should
    * map on specified source. If dash ('-') used as source name, it means this field
    * is own instance data property.
    *
    * By default, all fields are own instance data properties, and instance behave as
    * regular `DataObject` instance.
    */
    fields: fieldsExtend({
      '*': '-'
    }),

   /**
    * Source references map.
    * @type {object}
    */
    sources: null,

   /**
    * Source handler context map.
    * @type {object}
    */
    sourcesContext_: null,

   /**
    * Temporary delta storage, that using during update transaction.
    * @type {object}
    */
    delta_: null,

   /**
    * @constrcutor
    */
    init: function(){
      var data = this.data;
      var sources = this.sources;

      /** @cut */ if (this.delegate)
      /** @cut */   basis.dev.warn(this.constructor.className + ' can\'t has a delegate');

      this.data = {};       // reset data, as instance can has fields according to config
      this.delegate = null; // instance can't has delegate

      // inherit
      DataObject.prototype.init.call(this);

      // if data present in config, apply values but only for own properties
      for (var key in data)
      {
        var name = this.fields.sourceField[key] || this.fields.defaultSource;
        if (name == '-')
          this.data[key] = data[key];
      }

      // init sources maps
      this.sources = {};
      this.sourcesContext_ = {};

      // add sources if any
      if (sources)
        this.setSources(sources);
    },

   /**
    * @inheritDocs
    */
    update: function(data){
      // inside transation
      if (this.delta_)
      {
        for (var key in data)
        {
          var name = this.fields.sourceField[key] || this.fields.defaultSource;

          if (!name)
          {
            /** @cut */ basis.dev.warn('Unknown source for field `' + key + '`');
            continue;
          }

          var value = this.sources[name].data[key];
          if (value !== this.data[key])
          {
            // add to delta only new keys
            if (key in this.delta_ == false)
            {
              this.delta_[key] = this.data[key];
            }
            else
            {
              // if new value the same as delta has, remove it from delta
              if (this.delta_[key] === value)
                delete this.delta_[key];
            }

            // but update value in data for latest value
            this.data[key] = value;
          }
        }

        return;
      }

      // outside transaction
      var sourceDelta;
      var delta = {};

      // init transaction
      this.delta_ = delta;

      // process values
      for (var key in data)
      {
        var name = this.fields.sourceField[key] || this.fields.defaultSource;

        // check is any source associate with field
        if (!name)
        {
          /** @cut */ basis.dev.warn('Unknown source for field `' + key + '`');
          continue;
        }

        // own property change
        if (name == '-')
        {
          delta[key] = this.data[key];
          this.data[key] = data[key];
          continue;
        }

        // check source is attached
        if (this.sources[name])
        {
          if (this.sources[name].data[key] !== data[key])
          {
            if (!sourceDelta)
              sourceDelta = {};

            if (name in sourceDelta == false)
              sourceDelta[name] = {};

            sourceDelta[name][key] = data[key];
          }
          else
          {
            if (this.data[key] !== data[key])
            {
              delta[key] = this.data[key];
              this.data[key] = data[key];
            }
          }
        }
      }

      // trigger updates in sources
      if (sourceDelta)
        for (var key in sourceDelta)
          this.sources[key].update(sourceDelta[key]);

      // close trasaction and emit update event if any changes
      this.delta_ = null;
      for (var key in delta)
      {
        this.emit_update(delta);
        return delta;
      }

      // no changes
      return false;
    },

   /**
    * @inheritDocs
    */
    setDelegate: function(){
      /** @cut */ basis.dev.warn(namespace + '.Merge can\'t has a delegate');
    },

   /**
    * Set new value for some source name.
    * @param {string} name Source name.
    * @param {DataObject} source Value for source name.
    */
    setSource: function(name, source){
      var oldSource = this.sources[name];

      if (name in this.fields.sources == false)
      {
        /** @cut */ basis.dev.warn('basis.data.object.Merge#setSource: can\'t set source with name `' + name + '` as it not specified by fields configuration');
        return;
      }

      if (source instanceof DataObject == false)
        source = null;

      if (oldSource !== source)
      {
        // remove handler from old source if present
        if (oldSource)
          oldSource.removeHandler(MERGE_SOURCE_HANDLER, this.sourcesContext_[name]);

        // set new source value
        this.sources[name] = source;

        // add handler to new source
        if (source)
        {
          if (name in this.sourcesContext_ == false)
            this.sourcesContext_[name] = {
              host: this,
              name: name
            };

          source.addHandler(MERGE_SOURCE_HANDLER, this.sourcesContext_[name]);

          // apply new source data
          this.update(this.fields.sources[name](source.data));
        }

        this.emit_sourceChanged(name, oldSource);
      }
    },

   /**
    * Set new source objects. If no value for some source in `sources`,
    * it removes from sources. If `sources` is not an object, remove all
    * sources.
    * TODO: aggregate changes
    *
    * @param {object} sources Object that contains new values for sources.
    */
    setSources: function(sources){
      if (!sources)
        sources = {};

      for (var name in this.fields.sources)
        this.setSource(name, sources[name]);
    },

   /**
    * @inheritDocs
    */
    destroy: function(){
      // reset sources
      this.setSources();
      this.sources = null;
      this.sourcesContext_ = null;

      // inherit
      DataObject.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Merge: Merge
  };
