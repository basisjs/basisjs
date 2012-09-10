
  basis.require('basis.dom.wrapper');
  basis.require('app.core');

  var DOM = basis.dom;
  var mapDO = app.core.mapDO;

  //
  // functions
  //
  var namespace = module.path;

  var typeSplitter = basis.dom.createElement('SPAN.splitter', '|');

  function parseTypes(text){
    var parts = (text || '').split(/\s*\|\s*/);
    var result = DOM.createFragment();
    var node;
    for (var i = 0; i < parts.length; i++)
    {
      if (i)
        result.appendChild(typeSplitter.cloneNode(true));

      var descr = mapDO[parts[i]];
      if (descr)
        node = DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr.data), parts[i]);
      else
      {
        var m = parts[i].match(/^Array\.\<(.+)\>/);
        if (m && (descr = mapDO[m[1]]))
          node = DOM.createFragment('Array.<', DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr.data), m[1]), '>');
        else
          node = DOM.createText(parts[i]);
      }

      result.appendChild(node);
    }
    return result;
  }

  function resolveFunction(fn){
    function resolveGetter(getter){
      if (getter.basisGetterId_ > 0)
      {
        var result = 'getter(';

        if (typeof getter.base == 'string')
          result += '"' + getter.base.replace(/"/g, '\\"') + '"';
        else
        {
          if (!getter.mod)
            return resolveGetter(getter.base);
          else
            result += resolveGetter(getter.base);
        }

        if (getter.mod)
        {
          if (typeof getter.mod == 'string')
            result += ', "' + getter.mod.replace(/"/g, '\\"') + '"';
          else
            result += ', ' + resolveGetter(getter.mod);
        }

        return result + ')';
      }
      else
        return getter.toString();
    }

    var result = { asIs: fn.toString() };
    var getter = resolveGetter(fn);

    if (result.asIs != getter)
      result.getter = getter;

    return result;
  };


  //
  // classes
  //

  var View = basis.ui.Node.subclass({
    className: namespace + '.View',
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
    isAcceptableObject: Function.$true,
    binding: {
      title: 'title',
      viewOptions: 'satellite:'
    },
    action: {
      scrollTo: function(){
        if (this.parentNode)
          this.parentNode.scrollTo(this.element);
      }
    }
  });

  var ViewList = View.subclass({
    className: namespace + '.ViewList',
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var ViewOption = basis.ui.Node.subclass({
    className: namespace + '.ViewOption',

    template:
      '<span class="option {selected}" event-click="select">' +
        '{title}' +
      '</span>',

    binding: {
      title: 'title'
    },

    action: {
      select: function(event){
        this.select();
      }
    }
  });

  var ViewOptions = basis.ui.Node.subclass({
    className: namespace + '.ViewOptions',

    childClass: ViewOption,

    template:
      '<div class="viewOptions">' +
        '<span class="title">{title}:</span>' +
        '<span{childNodesElement} class="options"/>' +
      '</div>',

    binding: {
      title: 'title'
    },

    selection: {
      handler: {
        datasetChanged: function(){
          var node = this.pick();

          if (node && node.handler)
            node.handler();
        }
      }
    }
  });


  //
  // exports
  //
  module.exports = {
    parseTypes: parseTypes,
    resolveFunction: resolveFunction,

    View: View,
    ViewList: ViewList,
    ViewOptions: ViewOptions
  }
