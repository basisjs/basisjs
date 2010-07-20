(function(){

  var namespace = 'BasisDoc.View';

  //
  // import names
  //

  var Class = Basis.Class;
  var DOM = Basis.DOM;
  var Event = Basis.Event;
  var Data = Basis.Data;
  var Template = Basis.Html.Template;

  var cssClass = Basis.CSS.cssClass;

  var nsWrapers = Basis.DOM.Wrapers;
  var nsTree = Basis.Controls.Tree;
  var nsCore = BasisDoc.Core;

  //
  // functions
  //

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

  //
  // View
  //

  function htmlHeader(title){
    return '<h3><span>{0}</span></h3>'.format(title);
  }

  var ViewOption = Class(nsWrapers.HtmlNode, {
    template: new Template('<span{element} class="option">{titleText}</span>'),
    init: function(config){
      config = this.inherit(config);

      this.titleText.nodeValue = config.title;
      this.addHandler({
        click: function(){ this.select() },
        select: config.handler
      });

      return config;
    }
  });

  var ViewOptions = Class(nsWrapers.HtmlControl, {
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

  var View = Class(nsWrapers.HtmlPanel, {
    className: 'View'/*,
    autoDelegateParent: true*/
  });

  var TemplateTreeNode = Class(nsTree.TreeNode, {
    altTitle: false,
    selectable: false
  });

  TemplateTreeNode.Element = Class(TemplateTreeNode, {
    canHaveChildren: true,
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span><{titleText}></span>' + 
        '<ul{childNodesElement}></ul>' + 
        '<span></{endText}></span>' +
      '</li>'
    ),
    init: function(config){
      config = this.inherit(config);

      this.endText.nodeValue = this.info.tagName;
      if (this.info.ref.length)
      {
        DOM.insert(this.element, DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref.join('-').split(/(\-)/), { 'span.ref': function(value, idx){ return idx % 2 == 0 } })), 0);
        cssClass(this.element).add('hasRefs');
      }

      return config;
    }
  });

  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode, {
    template: new Template(
      '<li{element} class="Doc-TemplateView-Element">' + 
        '<span href="#"><{titleText}/></span>' + 
      '</li>'
    ),
    init: function(config){
      config = this.inherit(config);

      if (this.info.ref.length)
      {
        DOM.insert(this.element, DOM.createElement('SPAN.refList', DOM.wrap(this.info.ref.join('-').split(/(\-)/), { 'span.ref': function(value, idx){ return idx % 2 == 0 } })), 0);
        cssClass(this.element).add('hasRefs');
      }

      return config;
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
    template: new Template(
      '<div{element} class="view viewTemplate">' +
        htmlHeader('Template') +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(View, {
      update: function(object, newInfo, oldInfo, delta){
        this.inherit(object, newInfo, oldInfo, delta);
        
        if (newInfo.obj && newInfo.obj != oldInfo.obj)
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

            DOM.display(this.element, true);
            DOM.insert(DOM.clear(this.content), t.element)
          }
          else
            DOM.display(this.element, false);
        }
      }
    }),
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

  var InheritanceItem = Class(nsWrapers.HtmlNode, {
    canHaveChildren: true,
    childFactory: function(config){
      return new InheritanceItem(config);
    },
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title"><a href{ref}="#">{classNameText}</a></div>' +
        '<span class="namespace">{namespaceText}</span>' +
        '<ul{childNodesElement}></ul>' +
      '</li>'
    ),
    behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
      update: function(object, newInfo){
        var pathPart = newInfo.objPath.split(/\./);
        this.classNameText.nodeValue = pathPart.pop();
        this.namespaceText.nodeValue = this.info.namespace || pathPart.join('.');

        this.ref.nodeValue = '#' + newInfo.objPath;
        
        cssClass(this.content).bool('absent', !newInfo.present);
        
        if (newInfo.tag)
          DOM.insert(this.content, DOM.createElement('SPAN.tag.tag-' + newInfo.tag, newInfo.tag));
      }
    })
  });

  var ViewInheritance = Class(ViewList, {
    childClass: InheritanceItem,
    groupControlClass: Class(ViewList.prototype.groupControlClass, {
      childClass: Class(ViewList.prototype.groupControlClass.prototype.childClass, {
        behaviour: nsWrapers.createBehaviour(ViewList.prototype.groupControlClass.prototype.childClass, {
          update: function(object, newInfo, oldInfo, delta){
            this.inherit(object, newInfo, oldInfo, delta);
            this.hrefAttr.nodeValue = '#' + newInfo.title;
          }
        }),
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
                groupGetter: Data('info.classInfo.namespace || "Basis"')
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

  var ConfigItem = Class(nsWrapers.HtmlNode, {
    canHaveChildren: false,
    template: new Template(
      '<li{element} class="item">' +
        '<div{content} class="title">{nameText}</div>' +
      '</li>'
    ),
    behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
      update: function(object, newInfo){
        if (newInfo.tags && newInfo.tags.config)
        {
          var descr = newInfo.tags.config[this.propName];
          if (descr)
          {
            DOM.insert(this.content,
              DOM.createElement('SPAN.types', DOM.createElement('SPAN.splitter', ':'),
                parseTypes(descr.type)
                //DOM.wrap(descr.type.split(/\s*(\|)\s*/), { 'SPAN.splitter': function(value, idx){ return idx % 2 } })
              )
            );
            if (descr.description)
              DOM.insert(this.element, DOM.createElement('P', descr.description))
          }
        }
      }
    }),
    init: function(config){
      this.propName = config.propName;
      this.context = config.context;
      this.inherit(config);
      this.nameText.nodeValue = this.propName;
    }
  });

  var viewConfigRegExp = /config\.(?:([a-z0-9\_\$]+)|\[(\'\")([a-z0-9\_\$]+)\2\])/gi;
  var ViewConfig = Class(ViewList, {
    childClass: ConfigItem,
    localSorting: Data('propName'),
    groupControlClass: Class(ViewList.prototype.groupControlClass, {
      childClass: Class(ViewList.prototype.groupControlClass.prototype.childClass, {
        behaviour: nsWrapers.createBehaviour(ViewList.prototype.groupControlClass.prototype.childClass, {
          update: function(object, newInfo, oldInfo, delta){
            var parts = newInfo.path.split(/\./);
            parts.pop();
            parts.pop();
            this.hrefAttr.nodeValue = '#' + parts.join('.');
            this.titleText.nodeValue = parts.pop();
          }
        }),
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
    template: new Template(
      '<div{element} class="view viewConfig">' +
        htmlHeader('Config') +
        '<ul{content|childNodesElement} class="content"></ul>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(ViewList, {
      update: function(object, newInfo, oldInfo, delta){
        var path = newInfo.objPath;
        if (newInfo.objPath && map[path].obj.prototype.init)
        {
          var list = nsCore.getInheritance(map[path].obj).reverse();
          var items = {};

          this.groupOrder = {};
          for (var i = 0; i < list.length; i++)
          {
            var path = list[i].obj.className + '.prototype.init';
            var jsDoc = nsCore.JsDocEntity(path);
            /*var jsDoc = nsCore.JsDocEntity.get(path)
            if (!jsDoc)
              jsDoc = nsCore.JsDocEntity({ path: path, text: ' ' });*/
            this.groupOrder[path] = i;

            var code = String(list[i].obj.prototype.init).replace(/\/\*(.|[\r\n])+?\*\/|\/\/.+/g, '');
            var m;
            while (m = viewConfigRegExp.exec(code))
            {
              var name = m[1] || m[3];
              items[name] = {
                propName: name,
                info: jsDoc,
                context: list[i].obj
              };
            }
          }

          items = Object.values(items);
          this.setChildNodes(items);
          DOM.display(this.element, items.length);
        }
        else
          DOM.display(this.element, false);
      }
    }),
    init: function(config){
      config = this.inherit(config);

      var view = this;
      this.viewOptions = new ViewOptions({
        title: 'Group by',
        childNodes: [
          {
            selected: true,
            title: 'Inheritance',
            handler: function(){
              view.setLocalGrouping({
                groupGetter: Data('delegate'),
                localSortingDesc: true,
                localSorting: function(group){
                  var groupControl = group.parentNode || this;
                  return groupControl.document.groupOrder[group.info.path];
                }
              });
            }
          },
          {
            title: 'None',
            handler: function(){
              view.setLocalGrouping();
            }
          }
        ]
      });
      DOM.insert(this.element, this.viewOptions.element, 1);

      this.jsdocPanel = new JsDocPanel();

      return config;
    },
    destroy: function(){
      this.jsdocPanel.destroy();
      delete this.jsdocPanel;
      this.viewOptions.destroy();
      delete this.viewOptions;
      this.inherit();
    }
  });

  var PrototypeItem = Class(nsWrapers.HtmlNode, {
    template: new Template(
      '<div{element} class="item property">' +
        '<div{content} class="title"><a href{ref}="#">{titleText}</a></div>' +
        '<a{trigger} href="#" class="trigger">...</a>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
      update: function(object, newInfo){
        if (newInfo.objPath)
        {
          this.titleText.nodeValue = newInfo.title;
          this.ref.nodeValue = '#' + newInfo.objPath;
          this.jsDocPanel.setDelegate(nsCore.JsDocEntity(newInfo.objPath));
        }
      }
    }),
    init: function(config){
      this.jsDocPanel = new JsDocPanel();
      this.jsDocPanel.addHandler({
        update: function(object, newInfo){
          if (newInfo.tags)
          {
            cssClass(this.element).add('hasJsDoc');
            var typ = newInfo.tags.type || (newInfo.tags.returns && newInfo.tags.returns.type);
            if (typ)
            {
              DOM.insert(this.content, DOM.createElement('SPAN.types',
                DOM.createElement('SPAN.splitter', ':'),
                parseTypes(typ.replace(/^\s*\{|\}\s*$/g, ''))
                /*DOM.wrap(
                  type.replace(/^\s*\{|\}\s*$/g, '').split(/(\|)/),
                  { 'SPAN.splitter': function(value, idx){ return idx % 2 } }
                )*/
              ));
            }
          }
        }
      }, this)
      config = this.inherit(config);

      DOM.insert(this.element, this.jsDocPanel.element)

      return config;
    },
    destroy: function(){
      this.jsDocPanel.destroy();
      delete this.jsDocPanel;
      this.inherit();
    }
  });
  
  var PrototypeMethod = Class(PrototypeItem, {
    template: new Template(
      '<div{element} class="item method collapsed">' +
        '<div{content} class="title">' +
          '<a href{ref}="#">{titleText}</a><span class="args">({argsText})</span>' +
        '</div>' +
        '<a{trigger} href="#" class="trigger">...</a>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(PrototypeItem, {
      update: function(object, newInfo, oldInfo, delta){
        this.inherit(object, newInfo, oldInfo, delta);
        this.argsText.nodeValue = nsCore.getFunctionDescription(newInfo.obj).args;
      }
    })
  });

  var ViewPrototype = Class(ViewList, {
    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass = config.info.kind == 'method' ? PrototypeMethod : PrototypeItem;
      return new childClass(config);
    },
    template: new Template(
      '<div{element} class="view viewPrototype">' +
        htmlHeader('Prototype') +
        '<div{content|childNodesElement} class="content"></div>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(ViewList, {
      click: function(event, node){
        if (node && Event.sender(event).className == 'trigger')
          cssClass(node.element).remove('collapsed');
      }
    }),
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
              view.setLocalGrouping({
                groupGetter: Data('info.kind'),
                titleGetter: Data('info.id', { property: 'Properties', method: 'Methods' }),
                localSorting: function(group){
                  return group.info.id == 'method';
                }
              });
            }
          },
          {
            title: 'Implementation',
            handler: function(){
              cssClass(view.content).add('classGrouping');
              view.setLocalGrouping({
                groupGetter: function(node){
                  return node.info.implementationClass;
                },
                titleGetter: Data('info.id'),
                localSorting: function(group){
                  return view.inheritance.indexOf(group.info.id);
                }
              });
            }
          }
        ]
      });

      DOM.insert(this.element, this.viewOptions.element, 1);

      this.addEventListener('click');

      return config;
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      this.inherit();
    }
  });

  var JsDocLinkViewItem = Class(nsWrapers.HtmlNode, {
    template: new Template(
      '<li{element|content} class="item">' +
        '<a href{href}="#" target="_blank">{titleText}</a>' +
      '</li>'
    ),
    behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
      update: function(object, newInfo){
        if (newInfo.url)
        {
          this.titleText.nodeValue = newInfo.title || newInfo.url;
          this.href.nodeValue = newInfo.url;
        }
      }
    })
  });
  var JsDocLinksPanel = Class(nsWrapers.HtmlNode, {
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

  var JsDocView = Class(View, {
    template: new Template(
      '<div{element} class="view viewJsDoc">' +
        htmlHeader('Description') +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(View, {
      delegateChanged: function(){
        if (this.delegate)
          this.contentPanel.setDelegate(nsCore.JsDocEntity(this.delegate.info.objPath));
      }/*,
      update: function(object, newInfo, oldInfo, delta){
        var doc = nsCore.JsDocEntity(newInfo.objPath);
        DOM.display(this.element, doc && !!doc.value.text);
      }*/
    }),
    init: function(config){
      this.contentPanel = new JsDocPanel();

      config = this.inherit(config);

      DOM.insert(this.content, this.contentPanel.element);
    
      return config;
    },
    destroy: function(){
      this.contentPanel.destroy();
      delete this.contentPanel;

      this.inherit();
    }
  });

  var JsDocConstructorView = Class(JsDocView, {
    template: new Template(
      '<div{element} class="view viewJsDoc">' +
        htmlHeader('Constructor') +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(View, {
      delegateChanged: function(){
        if (this.delegate)
        {
          var path = this.delegate.info.objPath + '.prototype.init';
          var jsDoc = nsCore.JsDocEntity(path)
          this.contentPanel.setDelegate(jsDoc);
        }
      }
    }),
    init: function(config){
      config = this.inherit(config);

      this.configPanel

      return config;
    }
  });

  var tagLabels = 'readonly private'.qw();
  var JsDocPanel = Class(nsWrapers.HtmlPanel, {
    template: new Template(
      '<div{element|content} class="jsDocs"><div{description} class="description"/><div{link} class="links"/></div>'
    ),
    behaviour: new nsWrapers.createBehaviour(nsWrapers.HtmlPanel, {
      update: function(object, newInfo){
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

            this.linksPanel.setChildNodes(newInfo.tags.link.map(nsCore.JsDocLinkEntity));
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
                    DOM.createElement('P', value.description)
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
              code = DOM.createElement('PRE',
                newInfo.tags.example
              )
            ]);
            code.className = 'brush: javascript';
            SyntaxHighlighter.highlight({}, code);
          }
        }

        DOM.display(this.element, !!newInfo.text)
      }
    }),
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

  //
  // View instances
  //

  var viewTitle = new View({
    template: new Template(
      '<h2{element} class="view viewTitle">' +
        '<span class="title">{contentText}</span>' +
        '<span class="path">{pathText}</span>' +
      '</h2>'
    ),
    handlers: {
      update: function(object, newInfo, oldInfo, delta){
        this.contentText.nodeValue = (this.info.title || '') + (/^(method|function|class)$/.test(newInfo.kind) ? nsCore.getFunctionDescription(this.info.obj).args.quote('(') : '');
        this.pathText.nodeValue = (this.info.path || '');

        cssClass(this.element).replace(oldInfo.kind, newInfo.kind, 'kind-');
      }
    }
  });

  var viewJsDoc = new JsDocView();
  var viewConstructor = new JsDocConstructorView();

  var viewSourceCode = new View({
    template: new Template(
      '<div{element} class="view viewSourceCode">' +
        htmlHeader('Source code') +
        '<div{content} class="content"></div>' +
      '</div>'
    ),
    handlers: {
      update: function(object, newInfo, oldInfo, delta){
        // TODO: reduce updates
        if (newInfo.obj && newInfo.obj != oldInfo.obj)
        {
          var code = (newInfo.obj || '').toString();
          code = code.replace(/^function/, code.match(/\n(\s*)\}$/)[1] + '$&');
          DOM.insert(DOM.clear(this.content), this.source = DOM.createElement('PRE', code));
          this.source.className = 'brush: javascript';
          SyntaxHighlighter.highlight({}, this.source);
        }
      }
    }
  });

  var viewTemplate = new ViewTemplate();

  var viewInheritance = new ViewInheritance({
    handlers: {
      update: function(object, newInfo, oldInfo, delta){
        this.clear();

        var list = newInfo.title ? nsCore.getInheritance(newInfo.kind == 'class' ? newInfo.obj : map[newInfo.path.replace(/.prototype$/, '')].obj, newInfo.kind == 'class' ? null : newInfo.title) : [];
        
        var cursor = this;
        for (var i = 0, item; item = list[i]; i++)
          /*cursor = */cursor.appendChild({
            info: {
              classInfo: map[item.cls.className],
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
      update: function(object, newInfo){
        if (newInfo.obj)
        {
          var inheritance = nsCore.getInheritance(newInfo.obj);
          var list = nsCore.getMembers(newInfo.objPath + '.prototype');
          this.inheritance = inheritance.map(Data('cls.className'));
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