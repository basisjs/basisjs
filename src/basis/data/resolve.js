var NULL_OBJECT = {};

function resolveAdapterProxy(){
  this.fn.call(this.context, this.source);
}

/**
* @class
*/
var ResolveAdapter = function(context, fn, source, handler){
  this.context = context;
  this.fn = fn;
  this.source = source;
  this.handler = handler;
};

ResolveAdapter.prototype = {
  context: null,
  fn: null,
  source: null,
  handler: null,
  next: null,
  attach: function(){
    this.source.addHandler(this.handler, this);
  },
  detach: function(){
    this.source.removeHandler(this.handler, this);
  }
};

/**
* Binding bridge resolve adapter
* @class
*/
var BBResolveAdapter = function(){
  ResolveAdapter.apply(this, arguments);
};
BBResolveAdapter.prototype = new ResolveAdapter();
BBResolveAdapter.prototype.attach = function(destroyCallback){
  this.source.bindingBridge.attach(this.source, this.handler, this, destroyCallback);
};
BBResolveAdapter.prototype.detach = function(){
  this.source.bindingBridge.detach(this.source, this.handler, this);
};

//
// adapter handlers
//

var DEFAULT_CHANGE_ADAPTER_HANDLER = function(){
  this.fn.call(this.context, this.source);
};
var DEFAULT_DESTROY_ADAPTER_HANDLER = function(){
  this.fn.call(this.context, null);
};
var RESOLVEVALUE_DESTROY_ADAPTER_HANDLER = function(){
  this.fn.call(this.context, resolveValue(NULL_OBJECT, null, this.source.bindingBridge.get(this.source)));
};

/**
* Class instance resolve function factory
*/
function createResolveFunction(Class){
  return function resolve(context, fn, source, property, factoryContext){
    var oldAdapter = context[property] || null;
    var newAdapter = null;

    if (fn !== resolveAdapterProxy && typeof source == 'function')
      source = source.call(factoryContext || context, factoryContext || context);

    if (source && source.bindingBridge)
    {
      if (!oldAdapter || oldAdapter.source !== source)
        newAdapter = new BBResolveAdapter(context, fn, source, DEFAULT_CHANGE_ADAPTER_HANDLER);
      else
        newAdapter = oldAdapter;

      source = resolve(newAdapter, resolveAdapterProxy, source.bindingBridge.get(source), 'next');
    }

    // try to unwrap transpiled es6 module (__esModule - is a marker that babel inserts for es6 modules)
    if (source && source.__esModule && source.default)
      source = source.default;

    if (source instanceof Class == false)
      source = null;

    if (property && oldAdapter !== newAdapter)
    {
      var cursor = oldAdapter;

      // drop old adapter chain
      while (cursor)
      {
        var adapter = cursor;
        adapter.detach();
        cursor = adapter.next;
        adapter.next = null;
      }

      if (newAdapter)
        newAdapter.attach(DEFAULT_DESTROY_ADAPTER_HANDLER);

      context[property] = newAdapter;
    }

    return source;
  };
}

/**
* Resolve value from source.
*/
function resolveValue(context, fn, source, property, factoryContext){
  var oldAdapter = context[property] || null;
  var newAdapter = null;

  // as functions could be a value, invoke only functions with factory property
  // i.e. source -> function(){ /* factory code */ }).factory === FACTORY
  // apply only for top-level resolveValue() invocation
  if (source && fn !== resolveAdapterProxy && basis.fn.isFactory(source))
    source = source.call(factoryContext || context, factoryContext || context);

  if (source && source.bindingBridge)
  {
    if (!oldAdapter || oldAdapter.source !== source)
      newAdapter = new BBResolveAdapter(context, fn, source, DEFAULT_CHANGE_ADAPTER_HANDLER);
    else
      newAdapter = oldAdapter;

    source = resolveValue(newAdapter, resolveAdapterProxy, source.bindingBridge.get(source), 'next');
  }

  if (property && oldAdapter !== newAdapter)
  {
    var cursor = oldAdapter;

    // drop old adapter chain
    while (cursor)
    {
      var adapter = cursor;
      adapter.detach();
      cursor = adapter.next;
      adapter.next = null;
    }

    if (newAdapter)
      newAdapter.attach(RESOLVEVALUE_DESTROY_ADAPTER_HANDLER);

    context[property] = newAdapter;
  }

  return source;
}

module.exports = {
  DEFAULT_CHANGE_ADAPTER_HANDLER: DEFAULT_CHANGE_ADAPTER_HANDLER,
  DEFAULT_DESTROY_ADAPTER_HANDLER: DEFAULT_DESTROY_ADAPTER_HANDLER,

  ResolveAdapter: ResolveAdapter,
  BBResolveAdapter: BBResolveAdapter,

  createResolveFunction: createResolveFunction,
  resolveValue: resolveValue
};
