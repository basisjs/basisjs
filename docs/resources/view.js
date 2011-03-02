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
        node = DOM.createElement('A[href=#{objPath}].doclink-{kind}'.format(descr), parts[i]);
      else
      {
        var m = parts[i].match(/^Array\.\<(.+)\>/);
        if (m && (descr = map[m[1]]))
          node = DOM.createFragment('Array.<', DOM.createElement('A[href=#{objPath}].doclink-{kind}'.format(descr), m[1]), '>');
        else
          node = DOM.createText(parts[i]);
      }

      result.appendChild(node);
    }
    return result;
  }

  function htmlHeader(title){
    return '<span{header}/>'//'<h3><span>{0}</span></h3>'.format(title);
  }

  function extendViewSatelliteConfig(config){
    return Object.complete(config, View.prototype.satelliteConfig);
  }

  //
  // View
  //

  var ViewOption = Class(nsWrappers.HtmlNode, {
    template: new Template('<span{element} class="option">{titleText}</span>'),
    behaviour: {
      click: function(){
        this.select();
      },
      select: function(){
        this.inherit();
        if (this.handler)
          this.handler();
      }
    },
    init: function(config){
      if (config && config.handler)
        this.handler = config.handler;
      
      this.inherit(config);

      this.titleText.nodeValue = config.title;
    }
  });

  var ViewOptions = Class(nsWrappers.HtmlControl, {
    childClass: ViewOption,
    template: new Template(
      '<div{element} class="viewOptions">' +
        '<span class="title">{titleText}:</span>' +
        '<span{childNodesElement} class="options"/>' +
      '</div>'
    ),
    init: function(config){
      config = this.inherit(config);

      this.titleText.nodeValue = config.title;
      this.addEventListener('click');

      return config;
    }
  });

  var View = Class(Basis.Plugin.X.ControlItem, {
    className: 'View',
    autoDelegateParent: true,
    isAcceptableObject: Function.$true,
    satelliteConfig: {
      header: {
        delegate: Function.$self,
        instanceOf: Class(Basis.Plugin.X.ControlItemHeader, {
          template: new Template(
            '<h3{element} class="Content-Header">' +
              '<span>{titleText}</span>' +
            '</h3>'
          ),
          titleGetter: getter('delegate && object.delegate.viewHeader')
        })
      }
    }
    /*,
    autoDelegateParent: true*/
  });

  var tagLabels = 'readonly private'.qw();
  var JsDocPanel = Class(nsWrappers.HtmlNode, {
    isActiveSubscriber: true,
    template: new Template(
      '<div{element|content} class="jsDocs">' +
        '<div{description} class="description"/>' +
        '<div{link} class="links"/>' +
      '</div>'
    ),
    behaviour: {
      update: function(object, delta){
        var newInfo = this.info;

        DOM.clear(this.content);

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
                parts[i] = DOM.createElement('A[href=#{objPath}].doclink-{kind}'.format(descr), descr.title);
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
          DOM.insert(this.content,
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
            DOM.insert(this.content, DOM.createElement('.tags', tags));
          
          if (newInfo.tags.description)
          {
            if (!newInfo.tags.description_)
            {
              newInfo.tags.description_ = parseDescription(newInfo.tags.description);
            }
            
            DOM.insert(DOM.clear(this.description), newInfo.tags.description_);
            DOM.insert(this.content, this.description);
          }

          if (newInfo.tags.link && newInfo.tags.link.length)
          {
            if (!this.linksPanel)
              this.linksPanel = new JsDocLinksPanel();

            this.linksPanel.setChildNodes(newInfo.tags.link.map(nsCore.resolveUrl).map(nsCore.JsDocLinkEntity));
            DOM.insert(this.content, this.linksPanel.element);
          }
          
          if (newInfo.tags.param)
          {
            DOM.insert(this.content, [
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
            DOM.insert(this.content, [
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
            DOM.insert(this.content, [
              DOM.createElement('DIV.label', 'Example:'),
              code = DOM.createElement('PRE.Basis-SyntaxHighlight')
            ]);
            code.innerHTML = Basis.Plugin.SyntaxHighlight.highlight(newInfo.tags.example);
            //code.className = 'brush: javascript';
            //SyntaxHighlighter.highlight({}, code);
          }
        }

        DOM.display(this.element, !!newInfo.text)
      }
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
      this.inherit();
    }
  });

  var JsDocView = Class(View, {
    viewHeader: 'Description',
    template: new Template(
      '<div{element} class="view viewJsDoc">' +
        htmlHeader('Description') +
        '<div{content} class="content"><span{contentPanel}/></div>' +
      '</div>'
    ),
    satelliteConfig: extendViewSatelliteConfig({
      contentPanel: {
        existsIf: getter('info.objPath'),
        delegate: getter('info.objPath', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    })
  });

  var TemplateTreeNode = Class(nsTree.TreeNode, {
    altTitle: false,
    selectable: false
  });

  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode, {
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span href="#"><{titleText}/></span>' + 
      '</li>'
    ),
    init: function(config){
      this.inherit(config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref.join('-').split(/(\-)/), { 'span.ref': function(value, idx){ return idx % 2 == 0 } })), 0);
        cssClass(this.element).add('hasRefs');
      }
    }
  });

  TemplateTreeNode.Element = Class(TemplateTreeNode.EmptyElement, {
    canHaveChildren: true,
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span><{titleText}></span>' + 
        '<ul{childNodesElement}></ul>' + 
        '<span></{endText}></span>' +
      '</li>'
    ),
    init: function(config){
      this.inherit(config);

      this.endText.nodeValue = this.info.tagName;
    }
  });


  TemplateTreeNode.Text = Class(TemplateTreeNode, {
    template: new Template(
      '<li{element} class="Doc-TemplateView-Text">' + 
        '<span href="#">{titleText}</span>' + 
      '</li>'
    ),
    init: function(config){
      config = this.inherit(config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, [DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref, { 'span.ref': Function.$true }))], 0);
        cssClass(this.element).add('hasRefs');
      }

      return config;
    }
  });

  var ViewTemplate = Class(View, {
    className: 'ViewTemplate',
    viewHeader: 'Template',
    isAcceptableObject: function(info){
      return !!(info.obj.prototype && info.obj.prototype.template);
    },
    template: new Template(
      '<div{element} class="view viewTemplate">' +
        htmlHeader('Template') +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);
        
        var newInfo = this.info;
        if ('obj' in delta && newInfo.obj)
        {
          var template = newInfo.obj.prototype.template;
          //console.log(template);
          if (template)
          {
            var map = {};
            template.createInstance(map);
            
            var dw = new DOM.TreeWalker(map.element);
            var node = map.element;

            do
            {
              if ([DOM.ELEMENT_NODE, DOM.TEXT_NODE].has(node.nodeType))
              {
                var cfg = {
                  info: {
                    el: node,
                    ref: Object.iterate(map, function(key, value){
                      return value === this ? key : null
                    }, node).filter(Function.$isNotNull),
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
                childClass = TemplateTreeNode.Text;
              return new childClass([config, { childFactory: cf }].merge());
            };
            var t = new nsTree.Tree({ childFactory: cf, childNodes: [map.element.c] });

            //console.log(map.element.c);

            DOM.insert(DOM.clear(this.content), t.element)
          }
        }
      }
    },
    init: function(config){
      config = this.inherit(config);

      var view = this;
      this.viewOptions = new ViewOptions({
        title: 'References',
        childNodes: [
          {
            selected: true,
            title: 'Show',
            handler: function(){
              cssClass(view.content).add('show-references');
            }
          },
          {
            title: 'Hide',
            handler: function(){
              cssClass(view.content).remove('show-references');
            }
          }
        ]
      });

      DOM.insert(this.element, this.viewOptions.element, 1);

      return config;
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      this.inherit();
    }
  });

  var ViewList = Class(View, {
    childFactory: function(config){
      return new this.childClass(config);
    }
  });

  var InheritanceItem = Class(nsWrappers.HtmlNode, {
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title"><a href{ref}="#">{classNameText}</a></div>' +
        '<span class="namespace">{namespaceText}</span>' +
        '<ul{childNodesElement}></ul>' +
      '</li>'
    ),
    behaviour: {
      update: function(object, delta){
        var newInfo = this.info;
        var pathPart = newInfo.objPath.split(/\./);
        this.classNameText.nodeValue = pathPart.pop();
        this.namespaceText.nodeValue = this.info.namespace || pathPart.join('.');

        this.ref.nodeValue = '#' + newInfo.objPath;
        
        cssClass(this.content).bool('absent', !newInfo.present);
        
        if (newInfo.tag)
          DOM.insert(this.content, DOM.createElement('SPAN.tag.tag-' + newInfo.tag, newInfo.tag));
      }
    }
  });

  var ViewInheritance = Class(ViewList, {
    childClass: InheritanceItem,
    groupControlClass: Class(ViewList.prototype.groupControlClass, {
      childClass: Class(ViewList.prototype.groupControlClass.prototype.childClass, {
        behaviour: {
          update: function(object, delta){
            this.inherit(object, delta);
            this.hrefAttr.nodeValue = '#' + this.info.title;
          }
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
      config = this.inherit(config);

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
              cssClass(view.content).remove('show-namespace');
            }
          },
          {
            title: 'None',
            handler: function(){
              view.setLocalGrouping();
              cssClass(view.content).add('show-namespace');
            }
          }
        ]
      });

      DOM.insert(this.element, this.viewOptions.element, 1);

      return config;
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      this.inherit();
    }
  });

  var ConfigItem = Class(nsWrappers.HtmlNode, {
    canHaveChildren: false,
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title">{nameText}</div>' +
      '</li>'
    ),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);

        this.nameText.nodeValue = this.info.name;

        if (this.info.type)
        {
          DOM.insert(this.content,
            DOM.createElement('SPAN.types', DOM.createElement('SPAN.splitter', ':'),
              parseTypes(this.info.type)
            )
          );
        }

        if (this.info.description)
          DOM.insert(this.element, DOM.createElement('P', this.info.description))
      }
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

    groupControlClass: Class(ViewList.prototype.groupControlClass, {
      childClass: Class(ViewList.prototype.groupControlClass.prototype.childClass, {
        isActiveSubscriber: true,
        template: new Template(
          '<div{element} class="Basis-PartitionNode">' +
            '<div class="Basis-PartitionNode-Title">' +
              '<a href{hrefAttr}="#">{titleText}</a>' +
            '</div>' +
            '<div{childNodesElement|content} class="Basis-PartitionNode-Content"/>' +
          '</div>'
        ),
        behaviour: {
          update: function(object, delta){
            this.inherit(object, delta);

            var parts = this.info.path.replace(/\.prototype\.init$/, '').split(/\./);
            this.hrefAttr.nodeValue = '#' + parts.join('.');
            this.titleText.nodeValue = parts.join('.');
          }
        }
      })
    }),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);

        if ('objPath' in delta)
        {
          var path = this.info.objPath;
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

            if (this.groupControl)
              this.groupControl.setLocalSorting(getter('info.path', this.groupOrder_));

            this.setChildNodes(Object.values(items));
          }
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

  var PrototypeItem = Class(nsWrappers.HtmlNode, {
    template: new Template(
      '<div{element} class="item property">' +
        '<div{content} class="title">' +
          '<a href{ref}="#">{titleText}</a><span{types} class="types"/>' +
        '</div>' +
        '<a{trigger} href="#" class="trigger">...</a>' +
      '</div>'
    ),
    behaviour: {
      update: function(object, delta){
        if ('objPath' in delta)
        {
          this.titleText.nodeValue = this.info.title;
          this.ref.nodeValue = '#' + this.info.objPath;
          this.jsDocPanel.setDelegate(nsCore.JsDocEntity(this.info.implementationClass + '.prototype.' + this.info.title));
        }
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
              DOM.insert(this.types, [
                DOM.createElement('SPAN.splitter', ':'),
                parseTypes(type.replace(/^\s*\{|\}\s*$/g, ''))
              ]);
            }
          }
        }
      }, this)

      this.inherit(config);
      DOM.insert(this.element, this.jsDocPanel.element)
    },
    destroy: function(){
      this.jsDocPanel.destroy();
      delete this.jsDocPanel;
      this.inherit();
    }
  });
  
  var PrototypeMethod = Class(PrototypeItem, {
    template: new Template(
      '<div{element} class="item method">' +
        '<div{content} class="title">' +
          '<a href{ref}="#">{titleText}</a><span class="args">({argsText})</span><span{types} class="types"/>' +
        '</div>' +
        //'<a{trigger} href="#" class="trigger">...</a>' +
      '</div>'
    ),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);
        this.argsText.nodeValue = nsCore.getFunctionDescription(this.info.obj).args;

        var events = this.info.obj.toString().match(/dispatch\((["'])[a-z]+\1/gi);
        if (events)
          for (var i = 0; i < events.length; i++)
            DOM.insert(this.content, DOM.createElement('SPAN.event', events[i].split(/['"]/)[1]));
      }
    }
  });

  var ViewPrototype = Class(ViewList, {
    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass = config.info.kind == 'method' ? PrototypeMethod : PrototypeItem;
      return new childClass(config);
    },
    viewHeader: 'Prototype',
    template: new Template(
      '<div{element} class="view viewPrototype">' +
        htmlHeader('Prototype') +
        '<div{content|childNodesElement} class="content"></div>' +
      '</div>'
    ),
    init: function(config){
      config = this.inherit(config);

      this.document = this;

      var view = this;
      this.viewOptions = new ViewOptions({
        title: 'Group by',
        childNodes: [
          {
            selected: true,
            title: 'Type',
            handler: function(){
              cssClass(view.content).remove('classGrouping');
              view.setLocalSorting('info.title');
              view.setLocalGrouping({
                groupGetter: getter('info.kind'),
                titleGetter: getter('info.id', { property: 'Properties', method: 'Methods' }),
                localSorting: getter('info.id', { property: 1, method: 2 })
              });
            }
          },
          {
            title: 'Implementation',
            handler: function(){
              cssClass(view.content).add('classGrouping');
              view.setLocalSorting(function(node){
                return (node.info.kind == 'property' ? 1 : 2) + node.info.title;
              });
              view.setLocalGrouping({
                groupGetter: function(node){
                  return node.info.implementationClass;
                },
                titleGetter: getter('info.id'),
                localSorting: function(group){
                  return view.inheritance.indexOf(group.info.id);
                }
              });
            }
          }
        ]
      });

      DOM.insert(this.element, this.viewOptions.element, 1);

      return config;
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      this.inherit();
    }
  });

  var JsDocLinkViewItem = Class(nsWrappers.HtmlNode, {
    template: new Template(
      '<li{element|content} class="item">' +
        '<a href{href}="#" target="_blank">{titleText}</a>' +
      '</li>'
    ),
    behaviour: {
      update: function(object, delta){
        this.inherit(object, delta);

        this.titleText.nodeValue = this.info.title || this.info.url;
        this.href.nodeValue = this.info.url;
      }
    }
  });
  var JsDocLinksPanel = Class(nsWrappers.HtmlContainer, {
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
        existsIf: getter('info.objPath'),
        delegate: getter('info.objPath + ".prototype.init"', nsCore.JsDocEntity),
        instanceOf: JsDocPanel
      }
    })
  });



  //
  // View instances
  //

  var ViewTitle = Class(View, {
    template: new Template(
      '<h2{element} class="view viewTitle">' +
        '<span class="title">{contentText}</span>' +
        '<span class="path">{pathText}</span>' +
      '</h2>'
    ),
    behaviour: {
      update: function(object, delta){
        this.inherit();

        this.contentText.nodeValue = (this.info.title || '') + (/^(method|function|class)$/.test(this.info.kind) ? nsCore.getFunctionDescription(this.info.obj).args.quote('(') : '');
        this.pathText.nodeValue = (this.info.path || '');

        if ('kind' in delta)
          cssClass(this.element).replace(delta.kind, this.info.kind, 'kind-');
      }
    }
  });
  var viewTitle = new ViewTitle();

  var viewJsDoc = new JsDocView();
  var viewConstructor = new JsDocConstructorView();

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

  var viewSourceCode = new SourceCodeView({
    /*handlers: {
      update: function(object, delta){
        // TODO: reduce updates
        var newInfo = this.info;
        if ('obj' in delta && newInfo.obj)
        {
          var code = (newInfo.obj || '').toString();
          code = code.replace(/^function/, code.match(/\n(\s*)\}$/)[1] + '$&');
          DOM.insert(DOM.clear(this.content), this.source = DOM.createElement('PRE', code));
          this.source.className = 'brush: javascript';
          SyntaxHighlighter.highlight({}, this.source);
        }
      }
    }*/
  });

  var viewTemplate = new ViewTemplate();

  var viewInheritance = new ViewInheritance({
    handlers: {
      update: function(object, delta){
        this.clear();

        var newInfo = this.info;
        var list = newInfo.title
          ? nsCore.getInheritance(
              newInfo.kind == 'class'
                ? newInfo.obj
                : (map[newInfo.path.replace(/.prototype$/, '')] || { obj: null }).obj,
              newInfo.kind == 'class'
                ? null
                : newInfo.title
            )
          : [];
        
        var cursor = this;
        for (var i = 0, item; item = list[i]; i++)
          /*cursor = */cursor.appendChild({
            info: {
              classInfo: map[item.cls.className] || { namespace: 'unknown' },
              objPath: item.cls.className,
              present: item.present,
              tag: item.tag
            }
          });
      }
    }
  });

  var viewPrototype = new ViewPrototype({
    localSorting: 'info.title',
    handlers: {
      update: function(object, delta){
        var newInfo = this.info;
        if (newInfo.obj)
        {
          var inheritance = nsCore.getInheritance(newInfo.obj);
          var list = nsCore.getMembers(newInfo.objPath + '.prototype');
          this.inheritance = inheritance.map(getter('cls.className'));
          list.forEach(function(member){
            member.info.implementationClass = !inheritance.length ? newInfo.obj : inheritance.search(true, function(item){ return member.info.title in item.cls.prototype }).cls.className;
          });
          this.setChildNodes(list);
        }
      }
    }
  });

  var viewConfig = new ViewConfig();

  //
  // export names
  //

  Basis.namespace(namespace).extend({
    htmlHeader: htmlHeader,
    View: View,
    ViewTitle: ViewTitle,
    ViewTemplate: ViewTemplate,
    ViewList: ViewList,
    ViewInheritance: ViewInheritance,
    ViewPrototype: ViewPrototype,

    viewTitle: viewTitle,
    viewJsDoc: viewJsDoc,
    viewConstructor: viewConstructor,
    viewSourceCode: viewSourceCode,
    viewTemplate: viewTemplate,
    viewInheritance: viewInheritance,
    viewPrototype: viewPrototype,
    viewConfig: viewConfig
  });

})()