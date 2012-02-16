(function(){

  var namespace = 'BasisDoc.View';

  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;
  var nsHighlight = basis.format.highlight;
  var nsData = basis.data;

  var getter = Function.getter;
  var classList = basis.cssom.classList;

  var nsWrappers = basis.dom.wrapper;
  var nsTree = basis.ui.tree;
  var nsCore = BasisDoc.Core;
  var nsScroller = basis.ui.scroller;
  var nsLayout = basis.layout;

  var DELEGATE = basis.dom.wrapper.DELEGATE;

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

  function htmlHeader(title){
    return '<h3 class="Content-Header" event-click="scrollTo">' +
             '<span>' + title + '</span>' +
           '</h3>';
  }

 /**
  * @class
  */
  var ViewOption = Class(uiNode, {
    className: namespace + '.ViewOption',

    template:
      '<span class="option" event-click="select">' +
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

 /**
  * @class
  */
  var ViewOptions = Class(uiContainer, {
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

 /**
  * @class
  */
  var View = Class(uiContainer, {
    className: namespace + '.View',
    autoDelegate: DELEGATE.PARENT,
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
    template:
      '<div{content} class="jsDocs">' +
        '<div{description} class="description"/>' +
        '<div{link} class="links"/>' +
      '</div>',

    event_update: function(object, delta){
      uiNode.prototype.event_update.call(this, object, delta);
      this.parse();
    },
    event_targetChanged: function(object, oldTarget){
      uiNode.prototype.event_targetChanged.call(this, object, oldTarget);
      this.parse();
    },

    parse: function(object, delta){
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
            var descr = mapDO[mapPath];
            if (descr)
              parts[i] = DOM.createElement('A[href=#{fullPath}].doclink-{kind}'.format(descr.data), descr.data.title);
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
            filename.split('src/basis/').pop() + ':' + newData.line
          )
        );
      }

      if (newData.tags)
      {
        var tags = DOM.wrap(Object.keys(Object.slice(newData.tags, tagLabels)), { 'SPAN.tag': Function.$true });
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
          code.innerHTML = nsHighlight.highlight(newData.tags.example, 'js');
        }
      }

      DOM.display(this.element, !!newData.text)
    },

    destroy: function(){
      if (this.data.tags && this.data.tags.description_)
        delete this.data.tags.description_;

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
    template:
      '<div class="view viewJsDoc">' +
        htmlHeader('Description') +
        '<div{content} class="content">' +
          '<!-- {contentPanel} -->' +
        '</div>' +
      '</div>',

    satelliteConfig: {
      contentPanel: {
        existsIf: getter('data.fullPath'),
        delegate: function(owner){
          return nsCore.JsDocEntity.getSlot(owner.data.fullPath);
        },
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
    className: namespace + '.TemplateTreeNode',
    satelliteConfig: {
      refList: {
        existsIf: getter('data.ref'),
        instanceOf: uiNode.subclass({
          template: 
            '<span class="refList"><b>{</b>{ref}<b>}</b></span>',

          binding: {
            ref: 'owner.data.ref'
          }
        })
      }
    },
    binding: {
      nodeName: 'data.nodeName',
      nodeValue: 'data.nodeValue',
      hasRefs: function(node){
        return node.data.ref ? 'hasRefs' : '';
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Attribute = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Attribute',
    template:
      '<span class="Doc-TemplateView-Node Doc-TemplateView-Attribute {hasRefs}">' +
        '<span>{nodeName}<!--{refList}-->="{nodeValue}"</span>' + 
      '</span>'
  });

 /**
  * @class
  */
  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.EmptyElement',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Element {hasRefs}">' + 
        '<span><{nodeName}<!--{refList}--><!--{attributes}-->/></span>' + 
      '</div>',

    satelliteConfig: {
      attributes: {
        existsIf: getter('data.attrs'),
        dataSource: getter('data.attrs'),
        instanceOf: uiContainer.subclass({
          childClass: TemplateTreeNode.Attribute,
          template: '<span/>'
        })
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Element = Class(TemplateTreeNode.EmptyElement, {
    className: namespace + '.TemplateTreeNode.Element',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Element {hasRefs}">' + 
        '<span><{nodeName}<!--{refList}--><!--{attributes}-->></span>' + 
        '<div{childNodesElement} class="Doc-TemplateView-NodeContent"></div>' + 
        '<span></{nodeName}></span>' +
      '</div>'
  });

 /**
  * @class
  */
  TemplateTreeNode.Text = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Text',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Text {hasRefs}">' + 
        '<span><span class="refList">{{nodeValue}}</span></span>' + 
      '</div>'
  });

 /**
  * @class
  */
  TemplateTreeNode.Comment = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Comment',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Comment {hasRefs}">' + 
        '<--<span>{nodeValue}</span>-->' + 
      '</div>'
  });

 /**
  * @class
  */
  var TemplatePanel = uiControl.subclass({
    template: '<div style="overflow-y: hidden"/>',
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
      function findRefs(refMap, node){
        var result = [];

        for (var key in map)
          if (refMap[key] === node)
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
                  nodeType: node.nodeType,
                  nodeValue: nodeValue,
                  ref: findRefs(map, node),
                  attrs: attrs.length ? new nsData.Dataset({ items: attrs }) : null
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


  var BindingsPanel = basis.ui.Container.subclass({
    templateUpdate: function(){
      var template = this.data.obj.prototype.template;
      var binding;
      if (template)
      {
        var matchBinding = template.getBinding(this.data.obj.prototype.binding);
        binding = Object.iterate(this.data.obj.prototype.binding, function(key, value){
          return typeof value == 'object' ? {
            name: key,
            getter: value.getter,
            events: value.events,
            used: matchBinding && matchBinding.names.indexOf(key) != -1
          } : null
        }).filter(Boolean);
      }

      this.setChildNodes(binding);
    },

    template: '<div class="bindingList" style="float: left;"/>',
    sorting: 'name',

    childClass: {
      template: 
        '<div class="binding {used}">{name} on {events} [{used}]</div>',
      binding: {
        name: 'name',
        events: 'events || ""',
        used: function(node){
          return node.used ? 'used' : '';
        }
      }
    }
  })


  function hasTemplate(node){
    return node.data.obj && node.data.obj.prototype && node.data.obj.prototype.template instanceof basis.html.Template;
  }

 /**
  * @class
  */
  var ViewTemplate = Class(View, {
    className: namespace + '.ViewTemplate',
    viewHeader: 'Template',
    isAcceptableObject: function(data){
      return hasTemplate({ data: data });
    },

    template: 
      '<div class="view viewTemplate">' +
        htmlHeader('Template') +
        '<!-- {viewOptions} -->' +
        '<div{content} class="content">' +
          '<!-- {bindings} -->' +
          '<!-- {template} -->' +
        '</div>' +
      '</div>',

    satelliteConfig: {
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          var contentClassList = classList(owner.tmpl.content, 'show');

          return {
            title: 'References',
            childNodes: [
              {
                title: 'Schematic',
                selected: true,
                handler: function(){
                  contentClassList.set('references');
                }
              },
              {
                title: 'Highlight',
                handler: function(){
                  contentClassList.set('realReferences');
                }
              },
              {
                title: 'Hide',
                handler: function(){
                  contentClassList.clear();
                }
              }
            ]
          }
        }
      },
      template: {
        existsIf: hasTemplate,
        delegate: Function.$self,
        instanceOf: TemplatePanel
      },
      bindings: {
        existsIf: hasTemplate,
        delegate: Function.$self,
        instanceOf: BindingsPanel
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
    template:
      '<li class="item">' +
        '<div{content} class="title">' +
          '<a href="#{fullPath}">{className}</a>' +
          '<span class="tag tag-{tag}">{tag}</span>' +
        '</div>' +
        '<span class="namespace">{namespace}</span>' +
        '<ul{childNodesElement}/>' +
      '</li>',

    binding: {
      className: 'data.title',
      namespace: 'data.namespace',
      fullPath: 'data.fullPath',
      tag: 'data.tag || "none"'
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
      '<div class="view viewInheritance">' +
        htmlHeader('Inheritance') +
        '<!-- {viewOptions} -->' +
        '<ul{childNodesElement|content} class="content"/>' +
      '</div>',

    groupingClass: {
      childClass: {
        template:
          '<div class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '<a href="#{title}">{title}</a>' +
            '</div>' +
            '<div class="Basis-PartitionNode-Content">' +
              '<!--{childNodesHere}-->' +
            '</div>' +
          '</div>',

        binding: {
          title: 'data.title'
        }
      }
    },

    matchFunction: function(node){
      return node.data.match;
    },

    handler: {
      groupingChanged: function(){
        classList(this.tmpl.content).bool('show-namespace', !this.grouping);
      },
      update: function(){
        this.clear();

        var key = this.data.key;
        if (key)
        {
          var isClass = this.data.kind == 'class';
          var cursor = isClass ? this.data.obj : (mapDO[this.data.path.replace(/.prototype$/, '')] || { data: { obj: null } }).data.obj;
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
                  owner.setGrouping({
                    groupGetter: getter('delegate.group'),
                    childClass: {
                      titleGetter: getter('data.title')
                    }
                  });
                }
              },
              {
                title: 'None',
                handler: function(){
                  owner.setGrouping();
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
    nodeType: 'property',
    template: 
      '<div class="item {nodeType}">' +
        '<div class="title">' +
          '<a href="#{path}">{title}</a><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
      '</div>',

    binding: {
      nodeType: 'nodeType',
      title: 'data.key.replace(/^event_/, "")',
      path: {
        events: 'update',
        getter: function(node){
          return node.host.data.fullPath + '.prototype.' + node.data.key;
        }
      }
    },

    satelliteConfig: {
      jsdocs: {
        delegate: function(owner){
          return nsCore.JsDocEntity.getSlot(owner.data.cls.docsProto_[owner.data.key].path);
        },
        instanceOf: JsDocPanel.subclass({
          event_update: function(object, delta){
            JsDocPanel.prototype.event_update.call(this, object, delta);

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
        })
      }
    }
  });

  var specialMethod = {
    init: 'constructor',
    destroy: 'destructor'
  };

 /**
  * @class
  */
  var PrototypeMethod = Class(PrototypeItem, {
    nodeType: 'method',
    template:
      '<div class="item {nodeType}">' +
        '<div class="title">' +
          '<a href="#{path}">{title}</a><span class="args">({args})</span><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
      '</div>',

    binding: {
      args: function(node){
        return nsCore.getFunctionDescription(mapDO[node.data.path].data.obj).args;
      },
      mark: function(node){
        return specialMethod[node.data.key];
      }
    }
  });

 /**
  * @class
  */
  var PrototypeSpecialMethod = Class(PrototypeMethod, {
    template:
      '<div class="item {nodeType}">' +
        '<div class="title">' +
          '<span class="method_mark">{mark}</span>' +
          '<a href="#{path}">{title}</a><span class="args">({args})</span><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
      '</div>'
  });

 /**
  * @class
  */
  var PrototypeEvent = Class(PrototypeMethod, {
    nodeType: 'event',
    template:
      '<div class="item {nodeType}">' +
        '<div class="title">' +
          '<a href="#{path}">{title}</a><span class="args">({args})</span><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
      '</div>'
  });


  var PROTOTYPE_GROUPING_TYPE = {
    type: 'type',
    groupGetter: getter('data.kind'),
    sorting: getter('data.id', PROTOTYPE_ITEM_WEIGHT),
    childClass: {
      titleGetter: getter('data.id', PROTOTYPE_ITEM_TITLE)
    }
  };

  var PROTOTYPE_GROUPING_IMPLEMENTATION = {
    type: 'class',
    groupGetter: function(node){
      //console.log(node.data, node.data.key, node.data.cls.className, mapDO[node.data.cls.className]);
      var key = node.data.key;
      var tag = node.data.tag;
      var cls;
      if (tag == 'override')
      {
        cls = node.data.implementCls;
        if (!cls)
        {
          var cursor = node.data.cls.superClass_;
          while (cursor)
          {
            var cfg = cursor.docsProto_ && cursor.docsProto_[key];
            if (cfg && cfg.tag == 'implement')
            { 
              cls = mapDO[cfg.cls.className];
              node.data.implementCls = cls;
              break;
            }
            cursor = cursor.superClass_;
          }
        }
      }
      else
        cls = mapDO[node.data.cls.className];

      return cls || mapDO['basis.Class'];
    },
    childClass: {
      titleGetter: getter('data.fullPath')
    },
    sorting: function(group){
      return group.delegate && group.delegate.eventObjectId;
    }
  };

 /**
  * @class
  */
  var ViewPrototype = Class(ViewList, {
    viewHeader: 'Prototype',
    template:
      '<div class="view viewPrototype">' +
        htmlHeader('Prototype') +
        '<!-- {viewOptions} -->' +
        '<div{content|childNodesElement} class="content grouping-{groupingType}"/>' +
      '</div>',

    binding: {
      groupingType: {
        events: 'groupingChanged',
        getter: function(node){
          return node.grouping ? node.grouping.type : '';
        }
      }
    },

    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      if (this.data.obj)
      {
        var d = new Date();

        var clsVector = nsCore.getInheritance(this.data.obj);
        if (!this.clsVector)
          this.clsVector = new basis.data.Dataset();

        this.clsVector.set(clsVector.map(function(item){
          return mapDO[item.cls.className];
        }));

        this.setChildNodes(
          Object
            .values(mapDO[this.data.fullPath].data.obj.docsProto_)
            .map(function(val){
              return {
                data: val,
                host: this
              }
            }, this)
            .filter(Boolean)
        );
        console.log('time: ', new Date - d);
      }
    },

    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass;

      switch (config.data.kind){
        case 'event': childClass = PrototypeEvent; break;
        case 'method': childClass = specialMethod[config.data.key] ? PrototypeSpecialMethod : PrototypeMethod; break;
        default:
          childClass = PrototypeItem;
      };

      return new childClass(config);
    },

    groupingClass: {
      className: namespace + '.ViewPrototypeGroupingNode',
      childClass: {
        className: namespace + '.ViewPrototypePartitionNode',
        handler: {
          childNodesModified: function(){
            DOM.display(this.tmpl.empty, !this.first);
          }
        },
        template:
          '<div class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '{title}' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content">' +
              '<div{empty} class="empty">Implement nothing</div>' +
            '</div>' +
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
                handler: function(){
                  owner.setSorting('data.key');
                  owner.setGrouping(PROTOTYPE_GROUPING_TYPE);
                }
              },
              {
                title: 'Implementation',
                selected: true,
                handler: function(){
                  owner.setSorting(function(node){
                    return (PROTOTYPE_ITEM_WEIGHT[node.data.kind] || 0) + '_' + node.data.key;
                  });
                  owner.setGrouping(PROTOTYPE_GROUPING_IMPLEMENTATION);
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
          '<a target="_blank" href="{url}">{title}</a>' +
        '</li>',

      binding: {
        title: {
          events: 'update',
          getter: function(node){
            return node.data.title || node.data.url;
          }
        },
        url: 'data.url'
      }
    }
  });

  var viewConstructor = new JsDocView({
    viewHeader: 'Constructor',
    satelliteConfig: {
      contentPanel: {
        existsIf: getter('data.fullPath'),
        delegate: function(owner){
          return nsCore.JsDocEntity.getSlot(owner.data.fullPath + '.prototype.init');
        },
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
      sourceCode: nsHighlight.SourceCodeNode.subclass({
        autoDelegate: DELEGATE.OWNER,
        lang: 'js',
        codeGetter: getter('data.obj || ""', String)
      })
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
          '<div{header} class="ClassNode-Header">' +
            '<div class="ClassNode-Header-Title"><a href{link}="#">{title}</a></div>' +
          '</div>' +
          '<div{container} class="ClassNode-SubClassList">' +
            '<div class="sub-connector"/>' +
            '<div{childNodesElement} class="ClassNode-SubClassList-Wrapper"/>' +
          '</div>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, eventName, delta){
      tmpl.title.nodeValue = this.data.className.split(/\./).pop();
      tmpl.header.title = this.data.className;
      tmpl.link.nodeValue = '#' + this.data.className;

      if (!eventName || 'clsId' in delta)
        this.setDataSource(clsSplitBySuper.getSubset(this.data.clsId));
    },
    event_childNodesModified: function(node, delta){
      uiContainer.prototype.event_childNodesModified.call(this, node, delta);
      classList(this.tmpl.container).bool('has-subclasses', !!this.childNodes.length);
    },

    sorting: getter('data.className')
  });

  ClsNode.prototype.childClass = ClsNode;

  var classMap = new nsScroller.ScrollPanel({
    autoDelegate: 'parent',
    dataSource: clsSplitBySuper.getSubset(0),
    childClass: ClsNode
  })

  var viewClassMap = new View({
    viewHeader: 'ClassMap',
    template:
      '<div class="view ClassMap">' +
        htmlHeader('ClassMap') +
        '<div{childNodesElement} class="content"/>' +
      '</div>',

    childNodes: classMap
  });


  // scroll to class
  var scrollTimeout;
  var classNode;

  classMap.addHandler({
    update: function(object, delta){
      if ('fullPath' in delta && this.data.fullPath)
      {
        clearTimeout(scrollTimeout);
        classNode = searchClassNode(this, this.delegate.data.obj.className);
        if (classNode)
          scrollTimeout = setTimeout(scrollToClassNode, 0);
      }
    }     
  });

  function searchClassNode(parent, className){
    var result = parent.childNodes.search(className, Function.getter('data.className'));
    if (!result)
    {
      for (var i = 0, node; node = parent.childNodes[i]; i++)
      {
        result = searchClassNode(node, className);
        if (result)
          break;
      }
    }
    return result;
  }

  function scrollToClassNode(){
     var classNodeRect = new nsLayout.Box(classNode.tmpl.header, false, classMap.tmpl.scrollElement);

     var x = classNodeRect.left - (classMap.element.offsetWidth / 2) + (classNodeRect.width / 2);
     var y = classNodeRect.top - (classMap.element.offsetHeight / 2) + (classNodeRect.height / 2);

     classMap.scroller.setPosition(x, y);
  }


  //
  //
  //

  var namespaceClassDS = new nsData.Dataset();
  namespaceClsSplitBySuper = new nsData.dataset.Split({
    source: namespaceClassDS,
    rule: function(object){
      //console.log(object.part);
      return object.part != 'parent' ? object.data.superClsId : 0;
    }
  });

  var ViewNSNode = uiContainer.subclass({
    template:
      '<div class="ClassNode">' +
        '<div class="connector"/>' +
        '<div class="ClassNode-Wrapper">' +
          '<div{header} class="ClassNode-Header">' +
            '<div class="ClassNode-Header-Title">' +
              '<a href{link}="#">{title}</a>' +
              '<span class="ns">{namespace}</span>' +
            '</div>' +
          '</div>' +
          '<div{container} class="ClassNode-SubClassList">' +
            '<div class="sub-connector"/>' +
            '<div{childNodesElement} class="ClassNode-SubClassList-Wrapper"/>' +
          '</div>' +
        '</div>' +
      '</div>',

    templateUpdate: function(tmpl, eventName, delta){
      var p = this.data.className.split('.');
      tmpl.title.nodeValue = p.pop();
      tmpl.namespace.nodeValue = p.join('.');
      tmpl.link.nodeValue = '#' + this.data.className;
      classList(tmpl.header).add('side-' + this.delegate.part);

      if (!eventName || 'clsId' in delta)
        this.setDataSource(namespaceClsSplitBySuper.getSubset(this.data.clsId));
    },
    event_childNodesModified: function(node, delta){
      uiContainer.prototype.event_childNodesModified.call(this, node, delta);
      classList(this.tmpl.container).bool('has-subclasses', !!this.childNodes.length);
    },
    sorting: getter('data.className.split(".").pop()'),

    childClass: Class.SELF
  });

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
        }
      }
    },
    viewHeader: 'Namespace class map',
    template:
      '<div class="view ClassMap">' +
        htmlHeader('Namespace class map') +
        '<div class="content">' +
          //'<div{childNodesElement} style="position: absolute;"/>' +
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