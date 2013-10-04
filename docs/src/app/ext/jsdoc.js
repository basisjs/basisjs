
  basis.require('app.core');
  basis.require('basis.utils.highlight');

  var classList = basis.cssom.classList;
  var DOM = basis.dom;
  var mapDO = app.core.mapDO;

  var tagLabels = ['readonly', 'private'];

  //
  // Classes
  //
  var JsDocLinksPanel = basis.ui.Node.subclass({
    template: resource('jsdoc/template/jsdocLinksPanel.tmpl'),

    childClass: {
      template: resource('jsdoc/template/jsdocLinksPanelItem.tmpl'),

      binding: {
        title: {
          events: 'update',
          getter: function(node){
            return node.data.title || node.data.url;
          }
        },
        url: 'data:'
      }
    }
  });

  var JsDocPanel = basis.ui.Node.subclass({
    className: module.path + '.JsDocPanel',
    active: true,
    codeElement: null,

    template: resource('jsdoc/template/jsdocPanel.tmpl'),
    binding: {
      codeElement: 'codeElement'
    },

    emit_update: function(delta){
      basis.ui.Node.prototype.emit_update.call(this, delta);
      this.parse();
    },
    emit_targetChanged: function(oldTarget){
      basis.ui.Node.prototype.emit_targetChanged.call(this, oldTarget);
      this.parse();
    },

    parse: function(){
      var newData = this.data;
      var result = DOM.createFragment();

      if (newData.file)
      {
        var filename = basis.path.relative(newData.file);
        result.appendChild(
          DOM.createElement(basis.string.format('A.location[href="source_viewer.html?file={0}#{1}"][target="_blank"]', filename, newData.line),
            basis.path.basename(filename) + ':' + newData.line
          )
        );
      }

      if (newData.tags)
      {
        var tags = DOM.wrap(basis.object.keys(basis.object.slice(newData.tags, tagLabels)), { 'SPAN.tag': basis.fn.$true });
        if (tags.length)
          result.appendChild(DOM.createElement('.tags', tags));
        
        if (newData.tags.description)
        {
          if (!newData.tags.description_)
            newData.tags.description_ = parseDescription(newData.tags.description);
          
          result.appendChild(DOM.createElement('.description', newData.tags.description_));
        }

        if (newData.tags.see && newData.tags.see.length)
        {
          if (!this.linksPanel)
            this.linksPanel = new JsDocLinksPanel();

          this.linksPanel.setChildNodes(newData.tags.see.map(app.core.resolveUrl).map(app.core.JsDocLinkEntity));
          result.appendChild(this.linksPanel.element);
        }
        
        if (newData.tags.param)
        {
          DOM.insert(result, [
            DOM.createElement('DIV.label', 'Parameters:'),
            DOM.createElement('UL',
              basis.object.iterate(newData.tags.param, function(key, value){
                var types = value.type.replace(/=$/, '');
                var isOptional = types != value.type;

                return DOM.createElement('LI.param' + (isOptional ? '.optional' : ''),
                  DOM.createElement('SPAN.name', key),
                  DOM.createElement('SPAN.types', parseTypes(types)),
                  (isOptional ? ' (optional)' : ''),
                  parseDescription(value.description || '')
                );
              })
            )
          ]);
        }

        if (newData.tags.returns)
        {
          DOM.insert(result, [
            DOM.createElement('DIV.label', 'Returns:'),
            DOM.createElement('UL',
              basis.object.iterate({ ret: newData.tags.returns }, function(key, value){
                var types = value.type.replace(/=$/, '');
                return DOM.createElement('LI.param',
                  DOM.createElement('SPAN.types', parseTypes(types)),
                  parseDescription(value.description || '')
                );
              })
            )
          ]);
        }

        if (newData.tags.example)
        {
          var code;
          DOM.insert(result, [
            DOM.createElement('DIV.label', 'Example:'),
            code = DOM.createElement('PRE.Basis-SyntaxHighlight')
          ]);
          code.innerHTML = basis.utils.highlight.highlight(newData.tags.example, 'js');
        }
      }

      var codeElement = this.codeElement;

      if (!codeElement)
      {
        codeElement = this.codeElement = DOM.createElement();
        this.updateBind('codeElement');
      }
      else
        DOM.clear(codeElement);

      codeElement.appendChild(result);
    },

    destroy: function(){
      if (this.data.tags && this.data.tags.description_)
        this.data.tags.description_ = null;

      if (this.linksPanel)
      {
        this.linksPanel.destroy();
        this.linksPanel = null;
      }

      basis.ui.Node.prototype.destroy.call(this);
    }
  });

  var PrototypeJsDocPanel = JsDocPanel.subclass({
    emit_update: function(delta){
      JsDocPanel.prototype.emit_update.call(this, delta);

      var owner = this.owner;
      var tags = this.data.tags;
      if (tags)
      {
        classList(owner.element).add('hasJsDoc');
        var type = tags.type || (tags.returns && tags.returns.type);
        if (type)
        {
          DOM.insert(owner.tmpl.types, [
            DOM.createElement('SPAN.splitter', ':'),
            parseTypes(type.replace(/^\s*\{|\}\s*$/g, ''))
          ]);
        }
      }
    }
  });

  //
  // functions
  //
  function parseDescription(text){
    var listItem = false;
    var lines = basis.array.flatten(text.trimRight().split(/(?:\r\n?|\n\r?){2,}|((?:\r\n?|\n\r?)\s*\-\s+)/).map(function(line, idx){
      if (idx % 2)
      {
        listItem = !!line;
        return;
      }

      var m = line.match(/^\s*(.+):(\r\n?|\n\r?)/);
      var h;
      if (m)
      {
        h = DOM.createElement('SPAN.definition', m[1]);
        line = line.substr(m[0].length);
      }

      var parts = line.split(/\{([a-z0-9\_\.\#]+)\}/i);
      for (var i = 1; i < parts.length; i += 2)
      {
        var mapPath = parts[i].replace(/#/, '.prototype.');
        var descr = mapDO[mapPath];
        if (descr)
          parts[i] = DOM.createElement(basis.string.format('A[href=#{fullPath}].doclink-{kind}', descr.data), descr.data.title);
        else
          parts[i] = '{' + parts[i] + '}';
      }

      return DOM.createElement(listItem ? 'LI' : 'P', h, parts);
    }).filter(basis.fn.$isNotNull));

    var result = [];
    var listContext;
    for (var i = 0; i < lines.length; i++)
    {
      if (lines[i].tagName == 'LI')
      {
        if (!listContext)
        {
          listContext = DOM.createElement('UL');
          result.push(listContext);
        }
        listContext.appendChild(lines[i]);
      }
      else
      {
        listContext = null;
        result.push(lines[i]);
      }
    }
    return result;
  }

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
        node = DOM.createElement(basis.string.format('A[href=#{fullPath}].doclink-{kind}', descr.data), parts[i]);
      else
      {
        var m = parts[i].match(/^Array\.\<(.+)\>/);
        if (m && (descr = mapDO[m[1]]))
          node = DOM.createFragment('Array.<', DOM.createElement(basis.string.format('A[href=#{fullPath}].doclink-{kind}', descr.data), m[1]), '>');
        else
          node = DOM.createText(parts[i]);
      }

      result.appendChild(node);
    }
    return result;
  }

  //
  // exports
  //
  module.exports = {
    JsDocPanel: JsDocPanel,
    PrototypeJsDocPanel: PrototypeJsDocPanel
  };
