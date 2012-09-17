
 /**
  * @namespace basis.ua.visibility
  */
  
  var namespace = this.path;


  //
  // Main part
  //

  var visibilityPrefix;
  var supported = false;
  var inited = false;
  var handlers = [];


  //
  // Check visibility support and get prefix
  //

  var prefixes = [ 'webkit', 'moz', 'o', 'ms' ]; 
  if (document.visibilityState != undefined)
    visibilityPrefix = '';
  else
  {
    for (var i = 0, prefix; prefix = prefixes[i]; i++)
      if (document[prefix + 'VisibilityState'])
        visibilityPrefix = prefix;
  }

  supported = visibilityPrefix !== undefined;


  //
  // addHandler/removeHandler 
  //

  function addHandler(handler, thisObject){
    if (!supported)
      return false;

    addGlobalHandler();

    for (var i = handlers.length, item; i-- > 0;)
    {
      item = handlers[i];
      if (item.handler === handler && item.thisObject === thisObject)
        return false;
    }

    return !!handlers.push({ 
      handler: handler,
      thisObject: thisObject
    });

  }

  function removeHandler(handler, thisObject){
    if (!supported)
      return false;

    for (var i = handlers.length, item; i-- > 0;)
    {
      item = handlers[i];
      if (item.handler === handler && item.thisObject === thisObject)
        return !!handlers.splice(i, 1);
    }

    return false;
  }

  function addGlobalHandler(){
    document.addEventListener(visibilityPrefix + 'visibilitychange', onVisibilityChangedHandler, false);
    addGlobalHandler = Function.$undef;
  }

  //
  // global handler
  // 
  function onVisibilityChangedHandler(){
    var visibilityState = getState();

    for (var i = 0, handler; handler = handlers[i]; i++)
    {
      for (var j in handler.handler)
      {
        if (j == visibilityState)
          handler.handler[j].call(handler.thisObject);
      }
    }
  }

  function getState(){
    return document[visibilityPrefix ? visibilityPrefix + 'VisibilityState' : 'visibilityState'] || 'visible';
  }


  //
  // export names
  //

  module.exports = {
    addHandler: addHandler,
    removeHandler: removeHandler,
    getState: getState
  };
