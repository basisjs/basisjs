basis.require('basis.data');

var namespace = this.path;

function generateGetData(names, sourceNames){
  return new Function('data', 'return {' +
    names.map(function(name, idx){
      var ownName = name.replace(/"/g, '\\"');
      var sourceName = ((sourceNames && sourceNames[idx]) || name).replace(/"/g, '\\"');
      return '"' + ownName + '": data["' + sourceName + '"]';
    }) +
  '}');
}

var MERGER_SOURCE_HANDLER = {
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

var fieldsExtend = function(fields){
  var sources = {};
  var result = {
    defaultSource: false,
    sourceField: {},
    sources: {},
    __extend__: fieldsExtend
  };

  if (fields['*'])
    result.defaultSource = fields['*'];

  for (var field in fields)
  {
    var name = fields[field];

    if (name == result.defaultSource)
    {
      if (field != '*')
        basis.dev.warn('*');
      continue;
    }

    if (!sources[name])
      sources[name] = [];

    sources[name].push(field);
    result.sourceField[field] = name;
  }

  for (var name in sources)
    result.sources[name] = generateGetData(sources[name]);

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
*/
var Merge = basis.data.Object.subclass({
  className: namespace + '.Merge',

  fields: fieldsExtend({
    '*': '-'
  }),

  emit_sourceChanged: basis.event.create('sourceChanged', 'name', 'oldSource'),
  delta_: null,

  sources: null,
  handlers: null,

  init: function(){
    var data = this.data;
    var sources = this.sources;

    /** @cut */ if (this.delegate)
    /** @cut */   basis.dev.warn(this.constructor.className + ' can\'t has a delegate');

    this.data = {};
    this.delegate = null;

    basis.data.Object.prototype.init.call(this);

    if (data)
      for (var key in data)
      {
        var name = this.fields.sourceField[key] || this.fields.defaultSource;
        if (name == '-')
          this.data[key] = data[key];
      }

    this.sources = {};
    this.handlers = {};

    if (sources)
      this.setSources(sources);
  },

 /**
  * @inheritDocs {object} data
  */
  update: function(data){
    if (this.delta_)
    {
      for (var key in data)
      {
        var name = this.fields.sourceField[key] || this.fields.defaultSource;

        if (!name)
        {
          basis.dev.warn('Unknown source for field `' + key + '`');
          continue;
        }

        var value = this.sources[name].data[key];
        if (value !== this.data[key])
        {
          if (key in this.delta_ == false)
            this.delta_[key] = this.data[key];

          this.data[key] = value;
        }
      }

      return;
    }

    var sourceDelta;
    var delta = {};

    this.delta_ = delta;

    for (var key in data)
    {
      var name = this.fields.sourceField[key] || this.fields.defaultSource;

      if (name == '-')
      {
        delta[key] = this.data[key];
        this.data[key] = data[key];
        continue;
      }

      if (!name)
      {
        basis.dev.warn('Unknown source for field `' + key + '`');
        continue;
      }

      if (this.sources[name])
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

    if (sourceDelta)
      for (var key in sourceDelta)
        this.sources[key].update(sourceDelta[key]);

    this.delta_ = null;
    for (var key in delta)
    {
      this.emit_update(delta);
      return delta;
    }

    return false;
  },

 /**
  * @inheritDocs
  */
  setDelegate: function(){
    basis.dev.warn(namespace + '.Merge can\'t has a delegate');
  },

 /**
  * @param {string} name
  * @param {basis.data.Object} source
  */
  setSource: function(name, source){
    var oldSource = this.sources[name];

    if (source instanceof basis.data.Object == false)
      source = null;

    if (oldSource !== source)
    {
      if (oldSource)
      {
        oldSource.removeHandler(MERGER_SOURCE_HANDLER, this.handlers[name]);
      }

      this.sources[name] = source;

      if (source)
      {
        if (name in this.handlers == false)
          this.handlers[name] = {
            host: this,
            name: name
          };

        source.addHandler(MERGER_SOURCE_HANDLER, this.handlers[name]);

        // apply new source data
        this.update(this.fields.sources[name](source.data));
      }

      this.emit_sourceChanged(name, oldSource);
    }
  },

 /**
  * @param {object} sources
  */
  setSources: function(sources){
    if (!sources)
      sources = {};

    for (var name in this.fields.sources)
      this.setSource(name, sources[name]);
  },

  destroy: function(){
    this.setSources();
    this.sources = null;
    this.handlers = null;
    basis.data.Object.prototype.destroy.call(this);
  }
});

module.exports = {
  Merge: Merge
};
