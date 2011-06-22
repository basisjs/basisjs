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
  var cssClass = Basis.CSS.cssClass;

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
    return '<h3 class="Content-Header">' +
             '<span>' + title + '</span>' +
           '</h3>';
  }

  function extendViewSatelliteConfig(config){
    return Object.complete(config, View.prototype.satelliteConfig);
  }

  //
  // View
  //

  var ViewOption = Class(nsWrappers.TmplNode, {
    className: namespace + '.ViewOption',
    template: new Template(
      '<span{element} class="option" event-click="click">{titleText}</span>'
    ),
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
    },
    init: function(config){
      nsWrappers.TmplNode.prototype.init.call(this, config);

      this.tmpl.titleText.nodeValue = this.title;
    }
  });

  var ViewOptions = Class(nsWrappers.TmplContainer, {
    className: namespace + '.ViewOptions',
    childClass: ViewOption,
    template: new Template(
      '<div{element} class="viewOptions">' +
        '<span class="title">{titleText}:</span>' +
        '<span{childNodesElement} class="options"/>' +
      '</div>'
    ),
    selection: {},
    init: function(config){
      nsWrappers.TmplControl.prototype.init.call(this, config);

      this.tmpl.titleText.nodeValue = this.title;
    }
  });

  var View = Class(nsWrappers.TmplContainer, {
    className: namespace + '.View',
    autoDelegateParent: true,
    isAcceptableObject: Function.$true
  });

  var tagLabels = 'readonly private'.qw();
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
      
      var newInfo = this.info;

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

      if (newInfo.file)
      {
        var filename = newInfo.file.replace(BASE_URL_RX, '');
        DOM.insert(this.tmpl.content,
          DOM.createElement('A.location[href="source_viewer.html?file={0}#{1}"][target="_blank"]'.format(filename, newInfo.line),
            filename + ':' + newInfo.line
            /*DOM.createElement('SPAN.file', filename),
            DOM.createElement('SPAN.splitter', ':'),
            DOM.createElement('SPAN.line', newInfo.line)*/
          )
        );
      }

      if (newInfo.tags)
      {
        var tags = DOM.wrap(Object.keys(Object.slice(newInfo.tags, tagLabels)), { 'SPAN.tag': Function.$true });
        /*Object.iterate(Object.slice(newInfo.tags, tagLabels), function(key, value){
          tags.push(DOM.createElement('SPAN.tag', key));
        });*/
        if (tags.length)
          DOM.insert(this.tmpl.content, DOM.createElement('.tags', tags));
        
        if (newInfo.tags.description)
        {
          if (!newInfo.tags.description_)
          {
            newInfo.tags.description_ = parseDescription(newInfo.tags.description);
          }
          
          DOM.insert(DOM.clear(this.tmpl.description), newInfo.tags.description_);
          DOM.insert(this.tmpl.content, this.tmpl.description);
        }

        if (newInfo.tags.link && newInfo.tags.link.length)
        {
          if (!this.linksPanel)
            this.linksPanel = new JsDocLinksPanel();

          this.linksPanel.setChildNodes(newInfo.tags.link.map(nsCore.resolveUrl).map(nsCore.JsDocLinkEntity));
          DOM.insert(this.tmpl.content, this.linksPanel.element);
        }
        
        if (newInfo.tags.param)
        {
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Parameters:'),
            DOM.createElement('UL',
              Object.iterate(newInfo.tags.param, function(key, value){
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

        if (newInfo.tags.returns)
        {
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Returns:'),
            DOM.createElement('UL',
              Object.iterate({ ret: newInfo.tags.returns }, function(key, value){
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

        if (newInfo.tags.example)
        {
          var code;
          DOM.insert(this.tmpl.content, [
            DOM.createElement('DIV.label', 'Example:'),
            code = DOM.createElement('PRE.Basis-SyntaxHighlight')
          ]);
          code.innerHTML = Basis.Plugin.SyntaxHighlight.highlight(newInfo.tags.example);
          //code.className = 'brush: javascript';
          //SyntaxHighlighter.highlight({}, code);
        }
      }

      DOM.display(this.element, !!newInfo.text)
    },
    destroy: function(){
      if (this.info.tags && this.info.tags.description_)
      {
        delete this.info.tags.description_;
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
        '<div{content} class="content"><span{contentPanel}/></div>' +
      '</div>'
    ),
    satelliteConfig: extendViewSatelliteConfig({
      contentPanel: {
        existsIf: getter('info.fullPath'),
        delegate: getter('info.fullPath', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    })
  });

  //
  // Template View
  //

 /**
  * @class
  */
  var TemplateTreeNode = Class(nsTree.TreeNode, {
    className: namespace + '.TemplateTreeNode',
    selectable: false
  });

 /**
  * @class
  */
  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.EmptyElement',
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span href="#"><{titleText}/></span>' + 
      '</li>'
    ),
    init: function(config){
      TemplateTreeNode.prototype.init.call(this, config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref.join('-').split(/(\-)/), { 'span.ref': function(value, idx){ return idx % 2 == 0 } })), 0);
        cssClass(this.element).add('hasRefs');
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Element = Class(TemplateTreeNode.EmptyElement, {
    className: namespace + '.TemplateTreeNode.Element',
    canHaveChildren: true,
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span><{titleText}></span>' + 
        '<ul{childNodesElement}></ul>' + 
        '<span></{endText}></span>' +
      '</li>'
    ),
    init: function(config){
      TemplateTreeNode.EmptyElement.prototype.init.call(this, config);

      this.tmpl.endText.nodeValue = this.info.tagName;
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Text = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Text',
    template: new Template(
      '<li{element} class="Doc-TemplateView-Text">' + 
        '<span href="#">{titleText}</span>' + 
      '</li>'
    ),
    init: function(config){
      TemplateTreeNode.prototype.init.call(this, config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, [DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref, { 'span.ref': Function.$true }))], 0);
        cssClass(this.element).add('hasRefs');
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Comment = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Comment',
    template: new Template(
      '<li{element} class="Doc-TemplateView-Comment">' + 
        '<--<span>{titleText}</span>-->' + 
      '</li>'
    ),
    init: function(config){
      TemplateTreeNode.prototype.init.call(this, config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, [DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref, { 'span.ref': Function.$true }))], 0);
        cssClass(this.element).add('hasRefs');
      }
    }
  });


 /**
  * @class
  */
  var ViewTemplate = Class(View, {
    className: namespace + '.ViewTemplate',
    viewHeader: 'Template',
    isAcceptableObject: function(info){
      return !!(info.obj.prototype && info.obj.prototype.template);
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
        
      var newInfo = this.info;
      if ('obj' in delta && newInfo.obj)
      {
        var template = newInfo.obj.prototype.template;
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
              var refs = [];

              for (key in map)
                if (map[key] === node)
                  refs.push(key);

              var cfg = {
                info: {
                  el: node,
                  ref: refs,
                  title: node.nodeType == DOM.ELEMENT_NODE ? DOM.outerHTML(node.cloneNode(false)).match(/<([^>]+)>/)[1] : node.nodeValue,
                  tagName: (node.tagName || '').toLowerCase()
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
            if (config.info.tagName)
              childClass = config.childNodes.length ? TemplateTreeNode.Element : TemplateTreeNode.EmptyElement;
            else
              if (config.info.el.nodeType == 3)
                childClass = TemplateTreeNode.Text;
              else
                childClass = TemplateTreeNode.Comment;
            return new childClass(config);
          };
          var t = new nsTree.Tree({ childFactory: cf, childNodes: map.element.parentNode.c.childNodes });

          //console.log(map.element.c);

          DOM.insert(DOM.clear(this.tmpl.content), t.element)
        }
      }
    },
    satelliteConfig: extendViewSatelliteConfig({
      viewOptions: {
        instanceOf: ViewOptions,
        config: function(owner){
          return {
            title: 'References',
            childNodes: [
              {
                title: 'Show',
                selected: true,
                handler: function(){
                  cssClass(owner.tmpl.content).add('show-references');
                }
              },
              {
                title: 'Hide',
                handler: function(){
                  cssClass(owner.tmpl.content).remove('show-references');
                }
              }
            ]
          }
        }
      }
    })
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

      var newInfo = this.info;
      var pathPart = newInfo.fullPath.split(/\./);
      this.tmpl.classNameText.nodeValue = pathPart.pop();
      this.tmpl.namespaceText.nodeValue = newInfo.namespace || pathPart.join('.');

      this.tmpl.refAttr.nodeValue = '#' + newInfo.fullPath;
      
      if (newInfo.tag)
        DOM.insert(this.tmpl.content, DOM.createElement('SPAN.tag.tag-' + newInfo.tag, newInfo.tag));
    },
    event_match: function(){
      cssClass(this.tmpl.content).remove('absent');
    },
    event_unmatch: function(){
      cssClass(this.tmpl.content).add('absent');
    }
  });

  var ViewInheritance = Class(ViewList, {
    className: namespace + '.ViewInheritance',
    childClass: InheritanceItem,

    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      this.clear();

      var newInfo = this.info;
      var list = newInfo.key
        ? nsCore.getInheritance(
            newInfo.kind == 'class'
              ? newInfo.obj
              : (map[newInfo.path.replace(/.prototype$/, '')] || { obj: null }).obj,
            newInfo.kind == 'class'
              ? null
              : newInfo.key
          )
        : [];

      if (newInfo.kind == 'class')
        this.setMatchFunction();
      else
        this.setMatchFunction(function(node){
          return list.search(node.info.fullPath, Function.getter('cls.className')).tag;
        });
      
      var cursor = this;
      for (var i = 0, item; item = list[i]; i++)
        /*cursor = */cursor.appendChild({
          info: {
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
          this.tmpl.hrefAttr.nodeValue = '#' + this.info.title;
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
                groupGetter: getter('info.classInfo.namespace || "Basis"')
              });
              cssClass(view.tmpl.content).remove('show-namespace');
            }
          },
          {
            title: 'None',
            handler: function(){
              view.setLocalGrouping();
              cssClass(view.tmpl.content).add('show-namespace');
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

      this.tmpl.nameText.nodeValue = this.info.name;

      if (this.info.type)
      {
        DOM.insert(this.tmpl.content,
          DOM.createElement('SPAN.types', DOM.createElement('SPAN.splitter', ':'),
            parseTypes(this.info.type)
          )
        );
      }

      if (this.info.description)
        DOM.insert(this.element, DOM.createElement('P', this.info.description))
    }
  });

  var viewConfigRegExp = /config\.(?:([a-z0-9\_\$]+)|\[(\'\")([a-z0-9\_\$]+)\2\])/gi;

  var ViewConfig = Class(ViewList, {
    viewHeader: 'Config',
    isAcceptableObject: function(info){
      return !!(info.obj.prototype && info.obj.prototype.init);
    },

    template: new Template(
      '<div{element} class="view viewConfig">' +
        htmlHeader('Config') +
        '<span{viewOptions}/>' +
        '<ul{content|childNodesElement} class="content"></ul>' +
      '</div>'
    ),

    childClass: ConfigItem,
    localSorting: getter('info.name'),

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

          var parts = this.info.path.replace(/\.prototype\.init$/, '').split(/\./);
          this.tmpl.hrefAttr.nodeValue = '#' + parts.join('.');
          this.tmpl.titleText.nodeValue = parts.join('.');
        }
      })
    }),
    event_update: function(object, delta){
      ViewList.prototype.event_update.call(this, object, delta);

      if ('fullPath' in delta)
      {
        var path = this.info.fullPath;
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
            this.localGrouping.setLocalSorting(getter('info.path', this.groupOrder_));

          this.setChildNodes(Object.values(items));
        }
      }
    },
    satelliteConfig: extendViewSatelliteConfig({
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
                    groupGetter:  getter('info.constructorPath', nsCore.JsDocEntity),
                    localSorting: getter('info.path', owner.groupOrder_)
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
    })
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
        this.tmpl.titleText.nodeValue = this.info.title;
        this.tmpl.refAttr.nodeValue = '#' + this.info.fullPath;
        if (this.info.implClass)
          this.jsDocPanel.setDelegate(nsCore.JsDocEntity(this.info.implClass.info.fullPath + '.prototype.' + this.info.key));
      }
    },
    init: function(config){
      this.jsDocPanel = new JsDocPanel();
      this.jsDocPanel.addHandler({
        update: function(object, delta){
          var tags = object.info.tags;
          if (tags)
          {
            cssClass(this.element).add('hasJsDoc');
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
      this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.info.obj).args;
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
      this.tmpl.argsText.nodeValue = nsCore.getFunctionDescription(this.info.obj).args;

      if (this.info.title == 'init')
        DOM.insert(this.tmpl.content, DOM.createElement('SPAN.method_mark', 'constructor'), 0);
      if (this.info.title == 'destroy')
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

      switch (config.delegate.info.kind){
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

      var newInfo = this.info;
      if (newInfo.obj)
      {
        //console.log('set', newInfo.obj, delta);
        this.setChildNodes(nsCore.getMembers(newInfo.fullPath + '.prototype'));
      }
    },

    satelliteConfig: extendViewSatelliteConfig({
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
                  cssClass(owner.tmpl.content).remove('classGrouping');
                  owner.setLocalSorting('info.title');
                  owner.setLocalGrouping({
                    groupGetter: getter('info.kind'),
                    titleGetter: getter('info.id', PROTOTYPE_ITEM_TITLE),
                    localSorting: getter('info.id', PROTOTYPE_ITEM_WEIGHT)
                  });
                }
              },
              {
                title: 'Implementation',
                handler: function(){
                  cssClass(owner.tmpl.content).add('classGrouping');
                  owner.setLocalSorting(function(node){
                    return (PROTOTYPE_ITEM_WEIGHT[node.info.kind] || 0) + '_' + node.info.title;
                  });
                  owner.setLocalGrouping({
                    groupGetter: function(node){
                      return node.info.implClass || mapDO['Basis.Class'];
                    },
                    titleGetter: getter('info.fullPath'),
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
    })
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

      this.tmpl.titleText.nodeValue = this.info.title || this.info.url;
      this.tmpl.hrefAttr.nodeValue = this.info.url;
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
    satelliteConfig: extendViewSatelliteConfig({
      contentPanel: {
        existsIf: getter('info.fullPath'),
        delegate: getter('info.fullPath + ".prototype.init"', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    })
  });

  var SourceCodeView = Class(View, {
    viewHeader: 'Source code',
    template: new Template(
      '<div{element} class="view viewSourceCode">' +
        htmlHeader('Source code') +
        '<div{content} class="content"><span{sourceCode}/></div>' +
      '</div>'
    ),
    satelliteConfig: extendViewSatelliteConfig({
      sourceCode: {
        delegate: Function.$self,
        instanceOf: Class(Basis.Plugin.SyntaxHighlight.SourceCodeNode, {
          codeGetter: function(node){
            return (node.info.obj || '').toString();
          }
        })
      }
    })
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