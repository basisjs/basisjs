(function(){

  var namespace = 'BasisDoc.View';

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var Template = basis.html.Template;
  var nsHighlight = basis.format.highlight;
  var nsData = basis.data;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var nsWrappers = basis.dom.wrapper;
  var nsTree = basis.ui.tree;
  var nsCore = BasisDoc.Core;
  var nsScroller = basis.ui.scroller;

  var ui = basis.ui;
  var uiNode = basis.ui.Node;
  var uiContainer = basis.ui.Container;
  var uiControl = basis.ui.Control;

  //
  // functions
  //

  var BASE_URL_RX = new RegExp(location.href.replace(/docs\/index\.html(#.*)?$/i, '').forRegExp(), 'i');
  var typeSplitter = DOM.createElement('SPAN.splitter', '|');

  function parseTypes(text){
    var parts = (text || '').split(/\s*\|\s*/);
    var result = DOM.createFragment();
    var node;
    for (var i = 0; i < parts.length; i++)
    {
      if (i)
        result.appendChild(typeSplitter.cloneNode(true));

      var descr = map[parts[i]];
      if (descr)
        node = DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr), parts[i]);
      else
      {
        var m = parts[i].match(/^Array\.\<(.+)\>/);
        if (m && (descr = map[m[1]]))
          node = DOM.createFragment('Array.<', DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr), m[1]), '>');
        else
          node = DOM.createText(parts[i]);
      }

      result.appendChild(node);
    }
    return result;
  }

  function htmlHeader(title){
    return '<h3 class="Content-Header" event-click="scrollTo">' +
             '<span>' + title + '</span>' +
           '</h3>';
  }

  //
  // View
  //

 /**
  * @class
  */
  var ViewOption = Class(uiNode, {
    className: namespace + '.ViewOption',

    template:
      '<span class="option" event-click="select">' +
        '{title}' +
      '</span>',

    templateUpdate: function(tmpl){
      tmpl.title.nodeValue = this.title;
    },

    action: {
      select: function(){
        this.select();
      }
    },

    event_select: function(){
      uiNode.prototype.event_select.call(this);

      if (this.handler)
        this.handler();
    }
  });

 /**
  * @class
  */
  var ViewOptions = Class(uiContainer,
    basis.ui(
      '<div{element} class="viewOptions">' +
        '<span class="title">{this_title}:</span>' +
        '<span{childNodesElement} class="options"/>' +
      '</div>'
    ),
    {
      className: namespace + '.ViewOptions',
      childClass: ViewOption,
      selection: true
    }
  );

 /**
  * @class
  */
  var View = Class(uiContainer, {
    className: namespace + '.View',
    autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
    isAcceptableObject: Function.$true,
    action: {
      scrollTo: function(){
        if (this.parentNode)
          this.parentNode.scrollTo(this.element);
      }
    }
  });

  var tagLabels = ['readonly', 'private'];
  var JsDocPanel = Class(uiNode, {
    className: namespace + '.JsDocPanel',
    active: true,
    template: new Template(
      '<div{element|content} class="jsDocs">' +
        '<div{description} class="description"/>' +
        '<div{link} class="links"/>' +
      '</div>'
    ),
    event_update: function(object, delta){
      uiNode.prototype.event_update.call(this, object, delta);
      
      var newData = this.data;

      DOM.clear(this.tmpl.content);

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
            var descr = map[mapPath];
            if (descr)
              parts[i] = DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr), descr.title);
            else
              parts[i] = parts[i].quote('{');
          }

          return DOM.createElement(listItem ? 'LI' : 'P', h, parts);
        }).filter(Function.$isNotNull).flatten();

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

      if (newData.file)
      {
        var filename = newData.file.replace(BASE_URL_RX, '');
        DOM.insert(this.tmpl.content,
          DOM.createElement('A.location[href="source_viewer.html?file={0}#{1}"][target="_blank"]'.format(filename, newData.line),
            filename + ':' + newData.line
            /*DOM.createElement('SPAN.file', filename),
            DOM.createElement('SPAN.splitter', ':'),
            DOM.createElement('SPAN.line', newData.line)*/
          )
        );
      }

      if (newData.tags)
      {
        var tags = DOM.wrap(Object.keys(Object.slice(newData.tags, tagLabels)), { 'SPAN.tag': Function.$true });
        /*Object.iterate(Object.slice(newData.tags, tagLabels), function(key, value){
          tags.push(DOM.createElement('SPAN.tag', key));
        });*/
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

          this.linksPanel.setChildNodes(newData.tags.see.map(nsCore.resolveUrl).map(nsCore.JsDocLinkEntity));
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
          ])
        }

        if (newData.tags.example)
        {
          var code;
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Example:'),
            code = DOM.createElement('PRE.Basis-SyntaxHighlight')
          ]);
          code.innerHTML = nsHighlight.highlight(newData.tags.example);
          //code.className = 'brush: javascript';
          //SyntaxHighlighter.highlight({}, code);
        }
      }

      DOM.display(this.element, !!newData.text)
    },
    destroy: function(){
      if (this.data.tags && this.data.tags.description_)
      {
        delete this.data.tags.description_;
      }

      if (this.linksPanel)
      {
        this.linksPanel.destroy();
        delete this.linksPanel;
      }

      uiNode.prototype.destroy.call(this);
    }
  });

  var JsDocView = Class(View, {
    className: namespace + '.JsDocView',
    viewHeader: 'Description',
    template: new Template(
      '<div{element} class="view viewJsDoc">' +
        htmlHeader('Description') +
        '<div{content} class="content">' +
          '<!-- {contentPanel} -->' +
        '</div>' +
      '</div>'
    ),
    satelliteConfig: {
      contentPanel: {
        existsIf: getter('data.fullPath'),
        delegate: getter('data.fullPath', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    }
  });

  //
  // Template View
  //

 /**
  * @class
  */
  var TemplateTreeNode = uiContainer.subclass({
    childFactory: null,
    className: namespace + '.TemplateTreeNode',
    selectable: false,
    templateUpdate: function(tmpl){
      if (this.data.ref)
      {
        //DOM.insert(this.element, [DOM.createElement('SPAN.refList', DOM.wrap(this.data.ref, { 'span.ref': Function.$true }))], 0);
        classList(this.element).add('hasRefs');
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Attribute = Class(TemplateTreeNode, 
    basis.ui(
      '<span{element} class="Doc-TemplateView-Node Doc-TemplateView-Attribute">' +
        '<span>{this_data_nodeName}<span class="refList"><b>{</b>{this_data_ref}<b>}</b></span>="{this_data_nodeValue}"</span>' + 
      '</span>'
    ),
    {
      className: namespace + '.TemplateTreeNode.Attribute'
    }
  );

 /**
  * @class
  */
  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode,
    basis.ui(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Element">' + 
        '<span><{this_data_nodeName}<span class="refList"><b>{</b>{this_data_ref}<b>}</b></span><!--{attributes}-->/></span>' + 
      '</div>'
    ),
    {
      className: namespace + '.TemplateTreeNode.EmptyElement',
      satelliteConfig: {
        attributes: {
          existsIf: getter('data.attrs'),
          dataSource: function(node){
            return new nsData.Dataset({ items: node.data.attrs });
          },
          instanceOf: Class(uiContainer,
            {
              template: '<span/>',
              childClass: TemplateTreeNode.Attribute
            }
          )
        }
      }
    }
  );

 /**
  * @class
  */
  TemplateTreeNode.Element = Class(TemplateTreeNode.EmptyElement, 
    basis.ui(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Element">' + 
        '<span><{this_data_nodeName}<span class="refList"><b>{</b>{this_data_ref}<b>}</b></span><!--{attributes}-->></span>' + 
        '<div{childNodesElement} class="Doc-TemplateView-NodeContent"></div>' + 
        '<span></{this_data_nodeName2}></span>' +
      '</div>'
    ),
    {
      className: namespace + '.TemplateTreeNode.Element'
    }
  );

 /**
  * @class
  */
  TemplateTreeNode.Text = Class(TemplateTreeNode,
    basis.ui(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Text">' + 
        '<span><span class="refList">{{this_data_ref}} </span>{this_data_nodeValue}</span>' + 
      '</div>'
    ),
    {
      className: namespace + '.TemplateTreeNode.Text'
    }
  );

 /**
  * @class
  */
  TemplateTreeNode.Comment = Class(TemplateTreeNode,
    basis.ui(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Comment">' + 
        '<--<span>{this_data_nodeValue}</span>-->' + 
      '</div>'
    ),
    {
      className: namespace + '.TemplateTreeNode.Comment'
    }
  );

 /**
  * @class
  */
  var TemplatePanel = uiControl.subclass({
    childFactory: function(config){
      switch (config.data.nodeType)
      {
        case DOM.ELEMENT_NODE:
          childClass = config.childNodes.length ? TemplateTreeNode.Element : TemplateTreeNode.EmptyElement;
        break;
        case DOM.TEXT_NODE:
          childClass = TemplateTreeNode.Text;
        break;
        default:
          childClass = TemplateTreeNode.Comment;
      }

      return new childClass(config);
    },
    templateUpdate: function(tmpl, object, oldDelegate){
      function findRefs(map, node){
        var result = [];

        for (var key in map)
          if (map[key] === node)
            result.push(key);

        return result.length ? result.join(' | ') : null;
      }

      var rootCfg = {};

      var template = this.data.obj.prototype.template;
      if (template)
      {
        rootCfg.childNodes = template.docsCache_;

        if (!rootCfg.childNodes)
        {
          rootCfg.childNodes = [];

          var map = template.createInstance();
          
          var root = map.element.parentNode;
          var dw = new DOM.TreeWalker(root);
          var node = root;
          node.c = rootCfg;

          do
          {
            if ([DOM.ELEMENT_NODE, DOM.TEXT_NODE, DOM.COMMENT_NODE].has(node.nodeType))
            {
              var attrs = [];
              var nodeName = '';
              var nodeValue = '';

              if (node.nodeType == DOM.ELEMENT_NODE)
              {
                nodeName = node.tagName.toLowerCase();
                for (var i = 0, attr; attr = node.attributes[i]; i++)
                {
                  attrs.push(new nsData.DataObject({
                    data: {
                      nodeName: attr.nodeName,
                      nodeValue: attr.nodeValue,
                      ref: findRefs(map, attr)
                    }
                  }));
                }
              }
              else
                nodeValue = node.nodeValue;

              var cfg = {
                childFactory: this.childFactory,
                data: {
                  nodeName: nodeName,
                  nodeName2: nodeName,
                  nodeType: node.nodeType,
                  nodeValue: nodeValue,
                  ref: findRefs(map, node),
                  attrs: attrs.length ? attrs : null
                },
                childNodes: []
              };

              if (node.parentNode && node.parentNode.c)
                node.parentNode.c.childNodes.push(cfg);

              if (node.nodeType == DOM.ELEMENT_NODE)
                node.c = cfg;
            }
          }
          while (node = dw.next());
        }
      }

      this.setChildNodes(rootCfg.childNodes || [], true);

      if (template)
        template.docsCache_ = Array.from(this.childNodes);
    }
  });

 /**
  * @class
  */
  var ViewTemplate = Class(View, {
    className: namespace + '.ViewTemplate',
    viewHeader: 'Template',
    isAcceptableObject: function(data){
      return !!(data.obj.prototype && data.obj.prototype.template);
    },

    template: 
      '<div class="view viewTemplate">' +
        htmlHeader('Template') +
        '<!-- {viewOptions} -->' +
        '<div{content} class="content">' +
          '<!-- {template} -->' +
        '</div>' +
      '</div>',

    satelliteConfig: {
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          var contentClassList = classList(owner.tmpl.content);

          return {
            title: 'References',
            childNodes: [
              {
                title: 'Schematic',
                selected: true,
                handler: function(){
                  contentClassList.add('show-references');
                  contentClassList.remove('show-realReferences');
                }
              },
              {
                title: 'Highlight',
                handler: function(){
                  contentClassList.remove('show-references');
                  contentClassList.add('show-realReferences');
                }
              },
              {
                title: 'Hide',
                handler: function(){
                  contentClassList.remove('show-references');
                  contentClassList.remove('show-realReferences');
                }
              }
            ]
          }
        }
      },
      template: {
        existsIf: function(node){
          return node.data.obj && node.data.obj.prototype && node.data.obj.prototype.template;
        },
        delegate: getter('delegate'),
        instanceOf: TemplatePanel
      }
    }
  });

  var ViewList = Class(View, {
    className: namespace + '.ViewList',
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var InheritanceItem = Class(uiNode, {
    className: namespace + '.InheritanceItem',
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title"><a href{refAttr}="#">{classNameText}</a></div>' +
        '<span class="namespace">{namespaceText}</span>' +
        '<ul{childNodesElement}></ul>' +
      '</li>'
    ),
    templateUpdate: function(tmpl, event, delta){
      tmpl.classNameText.nodeValue = this.data.title;
      tmpl.namespaceText.nodeValue = this.data.namespace;
      tmpl.refAttr.nodeValue = '#' + this.data.fullPath;
      
      if (this.data.tag)
        DOM.insert(tmpl.content, DOM.createElement('SPAN.tag.tag-' + this.data.tag, this.data.tag));
    },
    event_match: function(){
      classList(this.tmpl.content).remove('absent');
    },
    event_unmatch: function(){
      classList(this.tmpl.content).add('absent');
    }
  });

  var viewInheritance = new ViewList({
    viewHeader: 'Inheritance',
    childClass: InheritanceItem,

    template:
      '<div{element} class="view viewInheritance">' +
        htmlHeader('Inheritance') +
        '<!-- {viewOptions} -->' +
        '<ul{content} class="content">' +
          '<!-- {childNodesHere} -->' +
        '</ul>' +
      '</div>',

    localGroupingClass: {
      childClass: {
        template:
          '<div class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '<a href{hrefAttr}="#">{titleText}</a>' +
            '</div>' +
            '<div class="Basis-PartitionNode-Content">' +
              '<!--{childNodesHere}-->' +
            '</div>' +
          '</div>',

        templateUpdate: function(tmpl){
          tmpl.titleText.nodeValue = this.data.title;
          tmpl.hrefAttr.nodeValue = '#' + this.data.title;
        }
      }
    },

    matchFunction: function(node){
      return node.data.match;
    },

    handler: {
      localGroupingChanged: function(){
        classList(this.tmpl.content).bool('show-namespace', !this.localGrouping);
      },
      update: function(){
        this.clear();

        var key = this.data.key;
        if (key)
        {
          var isClass = this.data.kind == 'class';
          var cursor = isClass ? this.data.obj : (map[this.data.path.replace(/.prototype$/, '')] || { obj: null }).obj;
          var groupId = 0;
          var lastNamespace;
          var list = [];
          while (cursor)
          {
            var fullPath = cursor.className;
            var namespace = (fullPath || 'unknown').replace(/\.[^\.]+$|^[^\.]+$/, '');
            var proto = cursor.docsProto_ && cursor.docsProto_.hasOwnProperty(key) ? cursor.docsProto_[key] : null;

            if (namespace != lastNamespace)
            {
              lastNamespace = namespace;
              group = new nsData.DataObject({
                data: {
                  title: namespace,
                  namespace: namespace
                }
              })
              groupId++;
            }

            list.push(new nsData.DataObject({
              group: group,
              data: {
                match: isClass || (proto && proto.tag),
                cls: cursor,
                namespace: namespace,
                fullPath: fullPath,
                title: (fullPath || 'unknown').match(/[^\.]+$/)[0],
                tag: proto ? proto.tag : ''
              }
            }));

            cursor = cursor.superClass_;
          }

          this.setChildNodes(list.reverse());
        }
      }
    },

    satelliteConfig: {
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Namespace',
                selected: true,
                handler: function(){
                  owner.setLocalGrouping({
                    groupGetter: getter('delegate.group'),
                    titleGetter: getter('data.title')
                  });
                }
              },
              {
                title: 'None',
                handler: function(){
                  owner.setLocalGrouping();
                }
              }
            ]
          }
        }
      }
    }
  });


  //
  // Prototype view
  //

  var PROTOTYPE_ITEM_WEIGHT = {
    'event': 1,
    'property': 2,
    'method': 3
  };

  var PROTOTYPE_ITEM_TITLE = {
    'event': 'Events',
    'property': 'Properties',
    'method': 'Methods'
  };

 /**
  * @class
  */
  var PrototypeItem = Class(uiNode, {
    template: 
      '<div class="item property">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
        '<a{trigger} href="#" class="trigger">...</a>' +
      '</div>',

    templateUpdate: function(tmpl, event, delta){
      if (!event || 'fullPath' in delta)
      {
        var fullPath = this.data.host.fullPath + '.prototype.' + this.data.key;
        tmpl.titleText.nodeValue = this.data.obj.title;
        tmpl.refAttr.nodeValue = '#' + fullPath;
        
        this.jsDocPanel.setDelegate(nsCore.JsDocEntity(this.data.cls.className + '.prototype.' + this.data.key));
      }
    },

    /*satelliteConfig: {
      jsdocs: {
        instanceOf: JsDocPanel
      }
    }*/

    init: function(config){
      this.jsDocPanel = new JsDocPanel();
      this.jsDocPanel.addHandler({
        update: function(object, delta){
          var tags = object.data.tags;
          if (tags)
          {
            classList(this.element).add('hasJsDoc');
            var type = tags.type || (tags.returns && tags.returns.type);
            if (type)
            {
              DOM.insert(this.tmpl.types, [
                DOM.createElement('SPAN.splitter', ':'),
                parseTypes(type.replace(/^\s*\{|\}\s*$/g, ''))
              ]);
            }
          }
        }
      }, this)

      uiNode.prototype.init.call(this, config);

      DOM.insert(this.element, this.jsDocPanel.element)
    },
    destroy: function(){
      this.jsDocPanel.destroy();
      delete this.jsDocPanel;

      uiNode.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var PrototypeEvent = Class(PrototypeItem, {
    template:
      '<div class="item event">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span class="args">({argsText})</span><span{types} class="types"/>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, event, delta){
      PrototypeItem.prototype.templateUpdate.call(this, tmpl, event, delta);
      tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.data.obj.obj).args;
    }
  });
  
 /**
  * @class
  */
  var PrototypeMethod = Class(PrototypeItem, {
    template:
      '<div class="item method">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span class="args">({argsText})</span><span{types} class="types"/>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, event, delta){
      PrototypeItem.prototype.templateUpdate.call(this, tmpl, event, delta);

      tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.data.obj.obj).args;

      if (/^(init|destroy)$/.test(this.data.title))
        DOM.insert(tmpl.content, DOM.createElement('SPAN.method_mark', this.data.title == 'init' ? 'constructor' : 'destructor'), 0);
    }
  });

 /**
  * @class
  */
  var ViewPrototype = Class(ViewList, {
    viewHeader: 'Prototype',
    template:
      '<div class="view viewPrototype">' +
        htmlHeader('Prototype') +
        '<!-- {viewOptions} -->' +
        '<div{content|childNodesElement} class="content"/>' +
      '</div>',

    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      var newData = this.data;
      if (newData.obj)
      {
        this.setChildNodes(
          Object
            .values(mapDO[newData.fullPath].data.obj.docsProto_)
            .map(function(val){ return typeof val == 'object' ? { data: Object.extend({ host: this }, val) } : null }, newData)
            .filter(Boolean)
        );
      }
    },

    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass;

      switch (config.data.obj.kind){
        case 'event': childClass = PrototypeEvent; break;
        case 'method': childClass = PrototypeMethod; break;
        default:
          childClass = PrototypeItem
      };

      return new childClass(config);
    },

    localGroupingClass: {
      className: namespace + '.ViewPrototypeGroupingNode',
      childClass: {
        className: namespace + '.ViewPrototypePartitionNode',
        template:
          '<div{element} class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '{titleText}' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content"/>' +
          '</div>'
      }
    },

    satelliteConfig: {
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Type',
                selected: true,
                handler: function(){
                  classList(owner.tmpl.content).remove('classGrouping');
                  owner.setLocalSorting('data.obj.title');
                  owner.setLocalGrouping({
                    groupGetter: getter('data.obj.kind'),
                    titleGetter: getter('data.id', PROTOTYPE_ITEM_TITLE),
                    localSorting: getter('data.id', PROTOTYPE_ITEM_WEIGHT)
                  });
                }
              },
              {
                title: 'Implementation',
                handler: function(){
                  classList(owner.tmpl.content).add('classGrouping');
                  owner.setLocalSorting(function(node){
                    return (PROTOTYPE_ITEM_WEIGHT[node.data.kind] || 0) + '_' + node.data.title;
                  });
                  owner.setLocalGrouping({
                    groupGetter: function(node){
                      return mapDO[node.data.cls.className] || mapDO['basis.Class'];
                    },
                    titleGetter: getter('data.fullPath'),
                    localSorting: function(group){
                      return group.delegate && group.delegate.eventObjectId;
                    }
                  });
                }
              }
            ]
          }
        }
      }
    }
  });

  //
  // ===========================
  //

  var JsDocLinksPanel = uiContainer.subclass({
    template:
      '<div class="linksPanel">' +
        '<div class="label">Links:</div>' +
        '<ul{childNodesElement}/>' +
      '</div>',

    childClass: {
      template:
        '<li class="item">' +
          '<a{link} target="_blank">{titleText}</a>' +
        '</li>',

      templateUpdate: function(tmpl){
        tmpl.titleText.nodeValue = this.data.title || this.data.url;
        tmpl.link.href = this.data.url;
      }
    }
  });

  var viewConstructor = new JsDocView({
    viewHeader: 'Constructor',
    satelliteConfig: {
      contentPanel: {
        existsIf: getter('data.fullPath'),
        delegate: getter('data.fullPath + ".prototype.init"', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    }
  });

  var viewSourceCode = new View({
    viewHeader: 'Source code',
    template:
      '<div class="view viewSourceCode">' +
        htmlHeader('Source code') +
        '<div class="content">' +
          '<!--{sourceCode}-->' +
        '</div>' +
      '</div>',

    satelliteConfig: {
      sourceCode: {
        delegate: Function.$self,
        instanceOf: nsHighlight.SourceCodeNode.subclass({
          codeGetter: getter('data.obj || ""', String)
        })
      }
    }
  });


  //
  // Class map
  //

  var clsById = clsList.map(function(cls){
    return new nsData.DataObject({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    })
  });

  var clsSplitBySuper = new nsData.dataset.Split({
    source: new nsData.Dataset({
      items: clsById
    }),
    rule: function(object){
      return object.data.superClsId;
    }
  });

  var ClsNode = uiContainer.subclass({
    template:
      '<div class="ClassNode">' +
        '<div class="connector"/>' +
        '<div class="ClassNode-Wrapper">' +
          '<div class="ClassNode-Header">' +
            '<div class="ClassNode-Header-Title">{title}</div>' +
          '</div>' +
          '<div{container} class="ClassNode-SubClassList">' +
            '<div class="sub-connector"/>' +
            '<div{childNodesElement} class="ClassNode-SubClassList-Wrapper"/>' +
          '</div>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.title.nodeValue = this.data.className.split(/\./).pop();
      tmpl.title.parentNode.title = this.data.className;

      if (!eventName || 'clsId' in delta)
        this.setDataSource(clsSplitBySuper.getSubset(this.data.clsId));
    },
    event_childNodesModified: function(node, delta){
      uiContainer.prototype.event_childNodesModified.call(this, node, delta);
      classList(this.tmpl.container).bool('has-subclasses', !!this.childNodes.length);
    },

    localSorting: getter('data.className')
  });

  ClsNode.prototype.childClass = ClsNode;

  var viewClassMap = new View({
    viewHeader: 'ClassMap',
    template:
      '<div class="view ClassMap">' +
        htmlHeader('ClassMap') +
        '<div class="content" style="overflow: hidden; height: 400px; position: relative;padding: 25px">' +
          '<div{childNodesElement} style="position: absolute;"/>' +
        '</div>' +
      '</div>',

    dataSource: clsSplitBySuper.getSubset(0),
    childClass: ClsNode
  });

  new nsScroller.Scroller({
    targetElement: viewClassMap.childNodesElement
  });

  //
  //
  //

  var namespaceClassDS = new nsData.Dataset();
  namespaceClsSplitBySuper = new nsData.dataset.Split({
    source: namespaceClassDS,
    rule: function(object){
      console.log(object.part);
      return object.part != 'parent' ? object.data.superClsId : 0;
    }
  });

  var ViewNSNode = uiContainer.subclass({
    template:
      '<div class="ClassNode">' +
        '<div class="connector"/>' +
        '<div class="ClassNode-Wrapper">' +
          '<div{header} class="ClassNode-Header">' +
            '<div class="ClassNode-Header-Title">{title}</div>' +
          '</div>' +
          '<div{container} class="ClassNode-SubClassList">' +
            '<div class="sub-connector"/>' +
            '<div{childNodesElement} class="ClassNode-SubClassList-Wrapper"/>' +
          '</div>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.title.nodeValue = this.data.className.split(/\./).pop();
      classList(tmpl.header).add('side-' + this.delegate.part);

      if (!eventName || 'clsId' in delta)
        this.setDataSource(namespaceClsSplitBySuper.getSubset(this.data.clsId));
    },
    event_childNodesModified: function(node, delta){
      uiContainer.prototype.event_childNodesModified.call(this, node, delta);
      classList(this.tmpl.container).bool('has-subclasses', !!this.childNodes.length);
    },/*,
    event_update: function(object, delta){
      uiContainer.prototype.event_update.call(this, object, delta);
      console.log(this.data.docsUid_, namespaceClsSplitBySuper.getSubset(this.data.docsUid_));
      this.setDataSource(namespaceClsSplitBySuper.getSubset(this.data.clsId, true));
    }*/
  });
  ViewNSNode.prototype.childClass = ViewNSNode;

  var viewNamespaceMap = new View({
    handler: {
      delegateChanged: function(){

        var namespace = this.data.obj;
        if (namespace)
        {
          var clsList = namespace.names();
          var dsClsList = {};

          for (var cls in clsList)
          {
            cls = clsList[cls];
            if (Class.isClass(cls))
            {
              dsClsList[cls.docsUid_] = new nsData.DataObject({
                part: 'self',
                delegate: clsById[cls.docsUid_]
              });

              if (!dsClsList[cls.docsSuperUid_])
              {
                dsClsList[cls.docsSuperUid_] = new nsData.DataObject({
                  part: 'parent',
                  delegate: clsById[cls.docsSuperUid_]
                });
              }

              for (var i = 0; i < clsById.length; i++)
                if (clsById[i].data.superClsId === cls.docsUid_)
                  dsClsList[i] = new nsData.DataObject({
                    part: 'subclass',
                    delegate: clsById[i]
                  });
            }
          }

          namespaceClassDS.set(Object.values(dsClsList));

          /*
          var clsList = Object.values(namespace.names()).filter(basis.Class.isClass);

          namespaceClassDS.set(clsList.map(function(cls){ return [clsById[cls.docsUid_], clsById[cls.docsSuperUid_]] }).flatten());
          */
        }
      }
    },
    viewHeader: 'Namespace map',
    template:
      '<div class="view ClassMap">' +
        htmlHeader('Namespace map') +
        '<div class="content">' +
          '<div{childNodesElement} style="position: absolute;"/>' +
          '<!-- {classMap} -->' +
        '</div>' +
      '</div>',
    satelliteConfig: {
      classMap: {
        instanceOf: uiContainer.subclass({
          template: '<ul class="firstLevel"/>',
          dataSource: namespaceClsSplitBySuper.getSubset(0, true),
          childClass: ViewNSNode
        })
      }
    }
  });

  //
  // View instances
  //


  var viewJsDoc = new JsDocView();

  //var viewConstructor = new JsDocConstructorView();

  //var viewSourceCode = new SourceCodeView();

  var viewTemplate = new ViewTemplate();

  //var viewInheritance = new ViewInheritance();

  var viewPrototype = new ViewPrototype();

  //
  // export names
  //

  basis.namespace(namespace).extend({
    htmlHeader: htmlHeader,
    View: View,
    ViewTemplate: ViewTemplate,
    ViewList: ViewList,
    ViewPrototype: ViewPrototype,

    viewJsDoc: viewJsDoc,
    viewConstructor: viewConstructor,
    viewSourceCode: viewSourceCode,
    viewTemplate: viewTemplate,
    viewInheritance: viewInheritance,
    viewPrototype: viewPrototype,
    viewClassMap: viewClassMap,
    viewNamespaceMap: viewNamespaceMap
  });

})()