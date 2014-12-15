
 /**
  * @namespace basis.app
  */

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
    oldChild.parentNode.replaceChild(newChild, oldChild);
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
        var newAppEl = resolveNode(el);

        if (appEl == newAppEl)
          return;

        if (appEl)
        {
          replaceNode(appEl, newAppEl);
          return;
        }
        else
          appEl = newAppEl;

        if (!appInjectPoint)
          appInjectPoint = {
            type: 'append',
            node: document.body
          };

        var node = resolveNode(appInjectPoint.node);

        if (!node)
          return;

        if (appInjectPoint.type == 'append')
          node.appendChild(appEl);
        else
          replaceNode(node, appEl);
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

      if (insertEl && insertEl.bindingBridge)
      {
        insertEl.bindingBridge.attach(insertEl, function(value){
          app.setElement((value && value.element) || value);
        });
        insertEl = insertEl.bindingBridge.get(insertEl);
      }

      if (insertEl && insertEl.element)
        insertEl = insertEl.element;

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
