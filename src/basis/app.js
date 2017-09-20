
 /**
  * @namespace basis.app
  */

  var resolveValue = require('./data.js').resolveValue;
  var document = global.document || {
    title: 'unknown'
  };


  //
  // main part
  //

  var appTitle = document.title;
  var appInit = basis.fn.$undef;
  var appInjectPoint;
  var appEl;

  function updateTitle(value){
    document.title = value;
  }

  function resolveNode(ref){
    return typeof ref == 'string' ? document.getElementById(ref) : ref;
  }

  function replaceNode(oldChild, newChild){
    try {
      oldChild.parentNode.replaceChild(newChild, oldChild);
      return newChild;
    } catch(e) {
      return oldChild;
    }
  }

  function appendNode(container, newChild){
    try {
      return container.appendChild(newChild);
    } catch(e) {
      return container.appendChild(document.createComment(''));
    }
  }

  var createApp = basis.fn.lazyInit(function(config){
    var readyHandlers = [];
    var inited = false;
    var app = {
      inited: false,
      setTitle: function(title){
        if (title != appTitle)
        {
          if (appTitle instanceof basis.Token)
            appTitle.detach(updateTitle);

          if (title instanceof basis.Token)
          {
            title.attach(updateTitle);
            updateTitle(title.get());
          }
          else
            updateTitle(title);

          appTitle = title;
        }
      },
      setElement: function(el){
        el = resolveValue(app, app.setElement, el, 'elementRA_');

        if (el && el.element)
          el = el.element;

        var newAppEl = resolveNode(el);

        if (appEl === newAppEl)
          return;

        if (appEl)
        {
          appEl = replaceNode(appEl, newAppEl);
          return;
        }

        if (!appInjectPoint)
          appInjectPoint = {
            type: 'append',
            node: document.body
          };

        var node = resolveNode(appInjectPoint.node);
        appEl = newAppEl;

        if (!node)
          return;

        if (appInjectPoint.type == 'append')
          appEl = appendNode(node, appEl);
        else
          appEl = replaceNode(node, appEl);
      },
      ready: function(fn, context){
        if (inited)
          fn.call(context, app);
        else
          readyHandlers.push({
            fn: fn,
            context: context
          });
      }
    };

    if (typeof config === 'function' && !basis.fn.isFactory(config))
      config = {
        init: config
      };
    else if (config.constructor !== Object)
      config = {
        element: config
      };

    for (var key in config)
    {
      var value = config[key];
      switch (key)
      {
        case 'title':
          app.setTitle(value);
          break;

        case 'container':
          appInjectPoint = {
            type: 'append',
            node: value
          };
          break;

        case 'replace':
          appInjectPoint = {
            type: 'replace',
            node: value
          };
          break;

        case 'element':
          appEl = value;
          break;

        case 'init':
          appInit = typeof value == 'function' ? value : appInit;
          break;

        default:
          /** @cut */ basis.dev.warn('Unknown config property `' + key + '` for app, value:', value);
      }
    }

    basis.doc.body.ready(function(){
      var insertEl = appEl;
      var initResult = appInit.call(app);

      if (initResult)
        insertEl = initResult;

      appEl = null;
      app.setElement(insertEl);

      // mark app as inited
      inited = true;
      app.inited = true;

      // invoke ready handler
      var handler;
      while (handler = readyHandlers.shift())
        handler.fn.call(handler.context, app);
    });

    return app;
  });


  //
  // export names
  //

  module.exports = {
    create: createApp
  };
