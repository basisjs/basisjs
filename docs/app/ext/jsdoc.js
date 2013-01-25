
  basis.require('app.core');

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
    template: resource('jsdoc/template/jsdocPanel.tmpl'),

    event_update: function(delta){
      basis.ui.Node.prototype.event_update.call(this, delta);
      this.parse();
    },
    event_targetChanged: function(oldTarget){
      basis.ui.Node.prototype.event_targetChanged.call(this, oldTarget);
      this.parse();
    },

    parse: function(){
      var newData = this.data;

      DOM.clear(this.tmpl.content);

      if (newData.file)
      {
        var filename = basis.path.relative(newData.file);
        DOM.insert(this.tmpl.content,
          DOM.createElement('A.location[href="source_viewer.html?file={0}#{1}"][target="_blank"]'.format(filename, newData.line),
            filename.split('src/basis/').pop() + ':' + newData.line
          )
        );
      }

      if (newData.tags)
      {
        var tags = DOM.wrap(Object.keys(Object.slice(newData.tags, tagLabels)), { 'SPAN.tag': basis.fn.$true });
        if (tags.length)
          DOM.insert(this.tmpl.content, DOM.createElement('.tags', tags));
        
        if (newData.tags.description)
        {
          if (!newData.tags.description_)
          {
            newData.tags.description_ = parseDescription(newData.tags.description);
          }
          
          DOM.insert(DOM.clear(this.tmpl.description), newData.tags.description_);
          DOM.insert(this.tmpl.content, this.tmpl.description);
        }

        if (newData.tags.see && newData.tags.see.length)
        {
          if (!this.linksPanel)
            this.linksPanel = new JsDocLinksPanel();

          this.linksPanel.setChildNodes(newData.tags.see.map(app.core.resolveUrl).map(app.core.JsDocLinkEntity));
          DOM.insert(this.tmpl.content, this.linksPanel.element);
        }
        
        if (newData.tags.param)
        {
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Parameters:'),
            DOM.createElement('UL',
              Object.iterate(newData.tags.param, function(key, value){
                var types = value.type.replace(/=$/, '');
                var isOptional = types != value.type;
                return DOM.createElement('LI.param' + (isOptional ? '.optional' : ''),
                  DOM.createElement('SPAN.name', key),
                  //DOM.createElement('SPAN.types', DOM.wrap(types.split(/\s*(\|)\s*/), { 'SPAN.splitter': function(value, idx){ return idx % 2 } })),
                  DOM.createElement('SPAN.types', parseTypes(types)),
                  (isOptional ? ' (optional)' : ''),
                  parseDescription(value.description || '')
                  //DOM.createElement('P', value.description)
                );
              })
            )
          ]);
        }

        if (newData.tags.returns)
        {
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Returns:'),
            DOM.createElement('UL',
              Object.iterate({ ret: newData.tags.returns }, function(key, value){
                var types = value.type.replace(/=$/, '');
                return DOM.createElement('LI.param',
                  //DOM.createElement('SPAN.types', DOM.wrap(types.split(/\s*(\|)\s*/), { 'SPAN.splitter': function(value, idx){ return idx % 2 } })),
                  DOM.createElement('SPAN.types', parseTypes(types)),
                  parseDescription(value.description || '')
                  //DOM.createElement('P', value.description)
                );
              })
            )
          ]);
        }

        if (newData.tags.example)
        {
          var code;
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Example:'),
            code = DOM.createElement('PRE.Basis-SyntaxHighlight')
          ]);
          code.innerHTML = basis.format.highlight.highlight(newData.tags.example, 'js');
        }
      }

      //cssom.display(this.element, !!newData.text)
    },

    destroy: function(){
      if (this.data.tags && this.data.tags.description_)
        delete this.data.tags.description_;

      if (this.linksPanel)
      {
        this.linksPanel.destroy();
        delete this.linksPanel;
      }

      basis.ui.Node.prototype.destroy.call(this);
    }
  });

  var PrototypeJsDocPanel = JsDocPanel.subclass({
    event_update: function(delta){
      JsDocPanel.prototype.event_update.call(this, delta);

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
    var lines = text.trimRight().split(/(?:\r\n?|\n\r?){2,}|((?:\r\n?|\n\r?)\s*\-\s+)/).map(function(line, idx){
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
          parts[i] = DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr.data), descr.data.title);
        else
          parts[i] = parts[i].quote('{');
      }

      return DOM.createElement(listItem ? 'LI' : 'P', h, parts);
    }).filter(basis.fn.$isNotNull).flatten();

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

  //
  // exports
  //
  module.exports = {
    JsDocPanel: JsDocPanel,
    PrototypeJsDocPanel: PrototypeJsDocPanel
  };
