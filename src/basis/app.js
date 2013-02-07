
  //
  // inport names
  //

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
    var app = {
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
            type: 'container',
            node: document.body
          };

        var node = resolveNode(appInjectPoint.node);

        if (!node)
          return;

        if (appInjectPoint.type == 'container')
          node.appendChild(appEl)
        else
          replaceNode(node, appEl);      
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
            type: 'insert',
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
          ;;;basis.dev.warn('Unknown config property `' + key + '` for app, value:', value);
      }
    }

    basis.ready(function(){
      var tmpEl = appEl;
      appEl = null;
      app.setElement(appInit.call(app) || tmpEl);
    });

    return app;
  });


  //
  // export names
  //

  module.setWrapper(createApp);
  module.exports = {
    create: createApp
  };
