(function(){

  var namespace = 'BasisDoc.View';

  //
  // import names
  //

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Template = Basis.Html.Template;

  var getter = Function.getter;
  var classList = Basis.CSS.classList;

  var nsWrappers = Basis.DOM.Wrapper;
  var nsTree = Basis.Controls.Tree;
  var nsCore = BasisDoc.Core;

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

  var ViewOption = Class(nsWrappers.TmplNode,
    nsWrappers.simpleTemplate(
      '<span{element} class="option" event-click="click">{this_title}</span>'
    ),
    {
      className: namespace + '.ViewOption',
      templateAction: function(actionName, event){
        if (actionName == 'click')
          this.select();
        else
          nsWrappers.TmplNode.prototype.templateAction.call(this, actionName, event);
      },
      event_select: function(){
        nsWrappers.TmplNode.prototype.event_select.call(this);

        if (this.handler)
          this.handler();
      }
    }
  );

  var ViewOptions = Class(nsWrappers.TmplContainer,
    nsWrappers.simpleTemplate(
      '<div{element} class="viewOptions">' +
        '<span class="title">{this_title}:</span>' +
        '<span{childNodesElement} class="options"/>' +
      '</div>'
    ),
    {
      className: namespace + '.ViewOptions',
      childClass: ViewOption,
      selection: {}
    }
  );

  var View = Class(nsWrappers.TmplContainer, {
    className: namespace + '.View',
    autoDelegateParent: true,
    isAcceptableObject: Function.$true,
    templateAction: function(actionName, event){
      if (actionName == 'scrollTo')
      {
        if (this.parentNode)
          this.parentNode.scrollTo(this.element);
      }
    }
  });

  var tagLabels = ['readonly', 'private'];
  var JsDocPanel = Class(nsWrappers.TmplNode, {
    className: namespace + '.JsDocPanel',
    active: true,
    template: new Template(
      '<div{element|content} class="jsDocs">' +
        '<div{description} class="description"/>' +
        '<div{link} class="links"/>' +
      '</div>'
    ),
    event_update: function(object, delta){
      nsWrappers.TmplNode.prototype.event_update.call(this, object, delta);
      
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

        if (newData.tags.link && newData.tags.link.length)
        {
          if (!this.linksPanel)
            this.linksPanel = new JsDocLinksPanel();

          this.linksPanel.setChildNodes(newData.tags.link.map(nsCore.resolveUrl).map(nsCore.JsDocLinkEntity));
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
          code.innerHTML = Basis.Plugin.SyntaxHighlight.highlight(newData.tags.example);
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

      nsWrappers.TmplNode.prototype.destroy.call(this);
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
  var TemplateTreeNode = Class(nsWrappers.TmplContainer,
    {
      childFactory: null,
      className: namespace + '.TemplateTreeNode',
      selectable: false,
      init: function(config){
        nsWrappers.TmplContainer.prototype.init.call(this, config);

        if (this.data.ref)
        {
          //DOM.insert(this.element, [DOM.createElement('SPAN.refList', DOM.wrap(this.data.ref, { 'span.ref': Function.$true }))], 0);
          classList(this.element).add('hasRefs');
        }
      }
    }
  );

  TemplateTreeNode.Attribute = Class(TemplateTreeNode, 
    nsWrappers.simpleTemplate(
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
    nsWrappers.simpleTemplate(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Element">' + 
        '<span><{this_data_nodeName}<span class="refList"><b>{</b>{this_data_ref}<b>}</b></span><!--{attributes}-->/></span>' + 
      '</div>'
    ),
    {
      className: namespace + '.TemplateTreeNode.EmptyElement',
      satelliteConfig: {
        attributes: {
          existsIf: Function.getter('data.attrs'),
          dataSource: function(node){
            return new Basis.Data.Dataset({ items: node.data.attrs });
          },
          instanceOf: Class(nsWrappers.TmplContainer,
            {
              template: new Template('<span{element}><!-- {childNodesHere} --></span>'),
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
    nsWrappers.simpleTemplate(
      '<div{element} class="Doc-TemplateView-Node Doc-TemplateView-Element">' + 
        '<span><{this_data_nodeName}<span class="refList"><b>{</b>{this_data_ref}<b>}</b></span><!--{attributes}-->></span>' + 
        '<div{childNodesElement} class="Doc-TemplateView-NodeContent"></div>' + 
        '<span></{this_data_nodeName}></span>' +
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
    nsWrappers.simpleTemplate(
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
    nsWrappers.simpleTemplate(
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
  var ViewTemplate = Class(View, {
    className: namespace + '.ViewTemplate',
    viewHeader: 'Template',
    isAcceptableObject: function(data){
      return !!(data.obj.prototype && data.obj.prototype.template);
    },
    template: new Template(
      '<div{element} class="view viewTemplate">' +
        htmlHeader('Template') +
        '<!-- {viewOptions} -->' +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    event_update: function(object, delta){
      View.prototype.event_update.call(this, object, delta);

      function findRefs(map, node){
        var result = [];

        for (var key in map)
          if (map[key] === node)
            result.push(key);

        return result.length ? result.join(' | ') : null;
      }
        
      var newData = this.data;
      if ('obj' in delta && newData.obj)
      {
        var template = newData.obj.prototype.template;
        //console.log(template);
        if (template)
        {
          var map = {};
          template.createInstance(map);
          
          var dw = new DOM.TreeWalker(map.element.parentNode);
          var node = map.element.parentNode;
          map.element.parentNode.c = {
            childNodes: []
          }

          do
          {
            if ([DOM.ELEMENT_NODE, DOM.TEXT_NODE, DOM.COMMENT_NODE].has(node.nodeType))
            {
              var attrs = [];

              if (node.nodeType == 1)
              {
                for (var i = 0, len = node.attributes.length; i < len; i++)
                {
                  var attr = node.attributes[i];
                  var attrRefs = [];

                  attrs.push(new Basis.Data.DataObject({
                    data: {
                      nodeName: attr.nodeName,
                      nodeValue: attr.nodeValue,
                      ref: findRefs(map, attr)
                    }
                  }));
                }
              }

              var cfg = {
                data: {
                  nodeType: node.nodeType,
                  nodeValue: node.nodeType == DOM.ELEMENT_NODE ? '' : node.nodeValue,
                  nodeName: node.nodeType == DOM.ELEMENT_NODE ? node.tagName.toLowerCase() : '',
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

          var cf = function(config){
            switch (config.data.nodeType)
            {
              case 1:
                childClass = config.childNodes.length ? TemplateTreeNode.Element : TemplateTreeNode.EmptyElement;
              break;
              case 3:
                childClass = TemplateTreeNode.Text;
              break;
              default:
                childClass = TemplateTreeNode.Comment;
            }

            return new childClass(config);
          };
          var t = new nsWrappers.TmplControl({
            childFactory: cf,
            childNodes: map.element.parentNode.c.childNodes
          });

          //console.log(map.element.c);


          DOM.insert(DOM.clear(this.tmpl.content), t.element)
        }
      }
    },
    satelliteConfig: {
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          return {
            title: 'References',
            childNodes: [
              {
                title: 'Schematic',
                selected: true,
                handler: function(){
                  classList(owner.tmpl.content).add('show-references');
                  classList(owner.tmpl.content).remove('show-realReferences');
                }
              },
              {
                title: 'Highlight',
                handler: function(){
                  classList(owner.tmpl.content).remove('show-references');
                  classList(owner.tmpl.content).add('show-realReferences');
                }
              },
              {
                title: 'Hide',
                handler: function(){
                  classList(owner.tmpl.content).remove('show-references');
                  classList(owner.tmpl.content).remove('show-realReferences');
                }
              }
            ]
          }
        }
      }
    }
  });

  var ViewList = Class(View, {
    className: namespace + '.ViewList',
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var InheritanceItem = Class(nsWrappers.TmplNode, {
    className: namespace + '.InheritanceItem',
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title"><a href{refAttr}="#">{classNameText}</a></div>' +
        '<span class="namespace">{namespaceText}</span>' +
        '<ul{childNodesElement}></ul>' +
      '</li>'
    ),
    event_update: function(object, delta){
      nsWrappers.TmplNode.prototype.event_update.call(this, object, delta);

      var newData = this.data;
      var pathPart = newData.fullPath.split(/\./);
      this.tmpl.classNameText.nodeValue = pathPart.pop();
      this.tmpl.namespaceText.nodeValue = newData.namespace || pathPart.join('.');

      this.tmpl.refAttr.nodeValue = '#' + newData.fullPath;
      
      if (newData.tag)
        DOM.insert(this.tmpl.content, DOM.createElement('SPAN.tag.tag-' + newData.tag, newData.tag));
    },
    event_match: function(){
      classList(this.tmpl.content).remove('absent');
    },
    event_unmatch: function(){
      classList(this.tmpl.content).add('absent');
    }
  });

  var ViewInheritance = Class(ViewList, {
    className: namespace + '.ViewInheritance',
    childClass: InheritanceItem,

    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      this.clear();

      var newData = this.data;
      var list = newData.key
        ? nsCore.getInheritance(
            newData.kind == 'class'
              ? newData.obj
              : (map[newData.path.replace(/.prototype$/, '')] || { obj: null }).obj,
            newData.kind == 'class'
              ? null
              : newData.key
          )
        : [];

      if (newData.kind == 'class')
        this.setMatchFunction();
      else
        this.setMatchFunction(function(node){
          return list.search(node.data.fullPath, Function.getter('cls.className')).tag;
        });
      
      var cursor = this;
      for (var i = 0, item; item = list[i]; i++)
        /*cursor = */cursor.appendChild({
          data: {
            classInfo: map[item.cls.className] || { namespace: 'unknown' },
            fullPath: item.cls.className,
            present: item.present,
            tag: item.tag
          }
        });
    },

    localGroupingClass: Class(ViewList.prototype.localGroupingClass, {
      className: namespace + '.ViewInheritanceGroupingNode',
      childClass: Class(ViewList.prototype.localGroupingClass.prototype.childClass, {
        className: namespace + '.ViewInheritancePartitionNode',
        event_update: function(object, delta){
          ViewList.prototype.localGroupingClass.prototype.childClass.prototype.event_update.call(this, object, delta);
          this.tmpl.hrefAttr.nodeValue = '#' + this.data.title;
        },
        template: new Template(
          '<div{element} class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '<a href{hrefAttr}="#">{titleText}</a>' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content"/>' +
          '</div>'
        )
      })
    }),
    viewHeader: 'Inheritance',
    template: new Template(
      '<div{element} class="view viewInheritance">' +
        htmlHeader('Inheritance') +
        '<ul{content|childNodesElement} class="content"></ul>' +
      '</div>'
    ),
    init: function(config){
      ViewList.prototype.init.call(this, config);

      var view = this;
      this.viewOptions = new ViewOptions({
        title: 'Group by',
        childNodes: [
          {
            title: 'Namespace',
            selected: true,
            handler: function(){
              view.setLocalGrouping({
                groupGetter: getter('data.classInfo.namespace || "Basis"')
              });
              classList(view.tmpl.content).remove('show-namespace');
            }
          },
          {
            title: 'None',
            handler: function(){
              view.setLocalGrouping();
              classList(view.tmpl.content).add('show-namespace');
            }
          }
        ]
      });

      DOM.insert(this.element, this.viewOptions.element, 1);
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      ViewList.prototype.destroy.call(this);
    }
  });

  var ConfigItem = Class(nsWrappers.TmplNode, {
    canHaveChildren: false,
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title">{nameText}</div>' +
      '</li>'
    ),
    event_update: function(object, delta){
      nsWrappers.TmplNode.prototype.event_update.call(this, object, delta);

      this.tmpl.nameText.nodeValue = this.data.name;

      if (this.data.type)
      {
        DOM.insert(this.tmpl.content,
          DOM.createElement('SPAN.types', DOM.createElement('SPAN.splitter', ':'),
            parseTypes(this.data.type)
          )
        );
      }

      if (this.data.description)
        DOM.insert(this.element, DOM.createElement('P', this.data.description))
    }
  });

  var viewConfigRegExp = /config\.(?:([a-z0-9\_\$]+)|\[(\'\")([a-z0-9\_\$]+)\2\])/gi;

  var ViewConfig = Class(ViewList, {
    viewHeader: 'Config',
    isAcceptableObject: function(data){
      return !!(data.obj.prototype && data.obj.prototype.init);
    },

    template: new Template(
      '<div{element} class="view viewConfig">' +
        htmlHeader('Config') +
        '<span{viewOptions}/>' +
        '<ul{content|childNodesElement} class="content"></ul>' +
      '</div>'
    ),

    childClass: ConfigItem,
    localSorting: getter('data.name'),

    localGroupingClass: Class(ViewList.prototype.localGroupingClass, {
      childClass: Class(ViewList.prototype.localGroupingClass.prototype.childClass, {
        active: true,
        template: new Template(
          '<div{element} class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '<a href{hrefAttr}="#">{titleText}</a>' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content"/>' +
          '</div>'
        ),
        event_update: function(object, delta){
          ViewList.prototype.localGroupingClass.prototype.childClass.prototype.event_update.call(this, object, delta);

          var parts = this.data.path.replace(/\.prototype\.init$/, '').split(/\./);
          this.tmpl.hrefAttr.nodeValue = '#' + parts.join('.');
          this.tmpl.titleText.nodeValue = parts.join('.');
        }
      })
    }),
    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      if ('fullPath' in delta)
      {
        var path = this.data.fullPath;
        if (path && map[path].obj.prototype.init)
        {
          var list = nsCore.getInheritance(map[path].obj);
          var items = {};
          this.groupOrder_ = {};

          for (var i = 0; i < list.length; i++)
          {
            var classRef = list[i].obj;
            var path = classRef.className + '.prototype.init';
            var code = String(classRef.prototype.init).replace(/\/\*(.|[\r\n])+?\*\/|\/\/.+/g, '');
            var m;

            this.groupOrder_[path] = i;

            while (m = viewConfigRegExp.exec(code))
            {
              var name = m[1] || m[3];
              if (!items[name])
              {
                items[name] = nsCore.JsDocConfigOption({
                  name: name,
                  path: path + ':' + name,
                  constructorPath: path
                });
              }
            }
          }

          this.clear();

          if (this.localGrouping)
            this.localGrouping.setLocalSorting(getter('data.path', this.groupOrder_));

          this.setChildNodes(Object.values(items));
        }
      }
    },
    satelliteConfig: {
      viewOptions: {
        delegate: Function.$self,
        instanceOf: ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Inheritance',
                selected: true,
                handler: function(){
                  owner.setLocalGrouping({
                    groupGetter:  getter('data.constructorPath', nsCore.JsDocEntity),
                    localSorting: getter('data.path', owner.groupOrder_)
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
          };
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
  var PrototypeItem = Class(nsWrappers.TmplNode, {
    template: new Template(
      '<div{element} class="item property">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span{types} class="types"/>' +
        '</div>' +
        '<a{trigger} href="#" class="trigger">...</a>' +
      '</div>'
    ),
    event_update: function(object, delta){
      nsWrappers.TmplNode.prototype.event_update.call(this, object, delta);

      if ('fullPath' in delta)
      {
        this.tmpl.titleText.nodeValue = this.data.title;
        this.tmpl.refAttr.nodeValue = '#' + this.data.fullPath;
        if (this.data.implClass)
          this.jsDocPanel.setDelegate(nsCore.JsDocEntity(this.data.implClass.data.fullPath + '.prototype.' + this.data.key));
      }
    },
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

      nsWrappers.TmplNode.prototype.init.call(this, config);

      DOM.insert(this.element, this.jsDocPanel.element)
    },
    destroy: function(){
      this.jsDocPanel.destroy();
      delete this.jsDocPanel;

      nsWrappers.TmplNode.prototype.destroy.call(this);
    }
  });

 /**
  * @class
  */
  var PrototypeEvent = Class(PrototypeItem, {
    template: new Template(
      '<div{element} class="item event">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span class="args">({argsText})</span><span{types} class="types"/>' +
        '</div>' +
      '</div>'
    ),
    event_update: function(object, delta){
      PrototypeItem.prototype.event_update.call(this, object, delta);
      this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.data.obj).args;
    }
  });
  
 /**
  * @class
  */
  var PrototypeMethod = Class(PrototypeItem, {
    template: new Template(
      '<div{element} class="item method">' +
        '<div{content} class="title">' +
          '<a href{refAttr}="#">{titleText}</a><span class="args">({argsText})</span><span{types} class="types"/>' +
        '</div>' +
      '</div>'
    ),
    event_update: function(object, delta){
      PrototypeItem.prototype.event_update.call(this, object, delta);
      this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.data.obj).args;

      if (this.data.title == 'init')
        DOM.insert(this.tmpl.content, DOM.createElement('SPAN.method_mark', 'constructor'), 0);
      if (this.data.title == 'destroy')
        DOM.insert(this.tmpl.content, DOM.createElement('SPAN.method_mark', 'destructor'), 0);
    }
  });

 /**
  * @class
  */
  var ViewPrototype = Class(ViewList, {
    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass;

      switch (config.delegate.data.kind){
        case 'event': childClass = PrototypeEvent; break;
        case 'method': childClass = PrototypeMethod; break;
        default:
          childClass = PrototypeItem
      };

      return new childClass(config);
    },
    viewHeader: 'Prototype',
    template: new Template(
      '<div{element} class="view viewPrototype">' +
        htmlHeader('Prototype') +
        '<!-- {viewOptions} -->' +
        '<div{content|childNodesElement} class="content"></div>' +
      '</div>'
    ),

    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      var newData = this.data;
      if (newData.obj)
      {
        //console.log('set', newData.obj, delta);
        this.setChildNodes(nsCore.getMembers(newData.fullPath + '.prototype'));
      }
    },

    localGroupingClass: Class(ViewList.prototype.localGroupingClass, {
      className: namespace + '.ViewPrototypeGroupingNode',
      childClass: Class(ViewList.prototype.localGroupingClass.prototype.childClass, {
        className: namespace + '.ViewPrototypePartitionNode',
        template: new Template(
          '<div{element} class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '{titleText}' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content"/>' +
          '</div>'
        )
      })
    }),


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
                  owner.setLocalSorting('data.title');
                  owner.setLocalGrouping({
                    groupGetter: getter('data.kind'),
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
                      return node.data.implClass || mapDO['Basis.Class'];
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

  var JsDocLinkViewItem = Class(nsWrappers.TmplNode, {
    template: new Template(
      '<li{element|content} class="item">' +
        '<a href{hrefAttr}="#" target="_blank">{titleText}</a>' +
      '</li>'
    ),
    event_update: function(object, delta){
      nsWrappers.TmplNode.prototype.event_update.call(this, object, delta);

      this.tmpl.titleText.nodeValue = this.data.title || this.data.url;
      this.tmpl.hrefAttr.nodeValue = this.data.url;
    }
  });
  var JsDocLinksPanel = Class(nsWrappers.TmplContainer, {
    childClass: JsDocLinkViewItem,
    childFactory: function(config){
      return new this.childClass(config);
    },
    template: new Template(
      '<div{element|content} class="linksPanel">' +
        '<div class="label">Links:</div>' +
        '<ul{childNodesElement}/>' +
      '</div>'
    )
  });

  var JsDocConstructorView = Class(JsDocView, {
    viewHeader: 'Constructor',
    satelliteConfig: {
      contentPanel: {
        existsIf: getter('data.fullPath'),
        delegate: getter('data.fullPath + ".prototype.init"', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    }
  });

  var SourceCodeView = Class(View, {
    viewHeader: 'Source code',
    template: new Template(
      '<div{element} class="view viewSourceCode">' +
        htmlHeader('Source code') +
        '<div{content} class="content"><span{sourceCode}/></div>' +
      '</div>'
    ),
    satelliteConfig: {
      sourceCode: {
        delegate: Function.$self,
        instanceOf: Class(Basis.Plugin.SyntaxHighlight.SourceCodeNode, {
          codeGetter: function(node){
            return (node.data.obj || '').toString();
          }
        })
      }
    }
  });

  //
  // View instances
  //


  var viewJsDoc = new JsDocView();

  var viewConstructor = new JsDocConstructorView();

  var viewSourceCode = new SourceCodeView();

  var viewTemplate = new ViewTemplate();

  var viewInheritance = new ViewInheritance();

  var viewPrototype = new ViewPrototype();

  var viewConfig = new ViewConfig();

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    htmlHeader: htmlHeader,
    View: View,
    ViewTemplate: ViewTemplate,
    ViewList: ViewList,
    ViewInheritance: ViewInheritance,
    ViewPrototype: ViewPrototype,

    viewJsDoc: viewJsDoc,
    viewConstructor: viewConstructor,
    viewSourceCode: viewSourceCode,
    viewTemplate: viewTemplate,
    viewInheritance: viewInheritance,
    viewPrototype: viewPrototype,
    viewConfig: viewConfig
  });

})()