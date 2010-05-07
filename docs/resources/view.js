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
  // View
  //

  function htmlHeader(title){
    return '<h3><span>{0}</span></h3>'.format(title);
  }

  var ViewOption = Class(nsWrapers.HtmlNode, {
    template: new Template('<a{element} href="#">{titleText}</a>'),
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
        this.namespaceText.nodeValue = pathPart.join('.');

        this.ref.nodeValue = '#' + newInfo.objPath;
        
        cssClass(this.content).bool('absent', !newInfo.present);
        
        if (newInfo.tag)
          DOM.insert(this.content, DOM.createElement('SPAN.tag.tag-' + newInfo.tag, newInfo.tag));
      }
    })
  });

  var ViewInheritance = Class(ViewList, {
    childClass: InheritanceItem,
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
        title: 'Show',
        childNodes: [
          {
            selected: true,
            title: 'Name only',
            handler: function(){
              cssClass(view.content).remove('show-namespace');
            }
          },
          {
            title: 'With namespace',
            handler: function(){
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
        this.nameText.nodeValue = newInfo.name;
      }
    })
  });

  var viewConfigRegExp = /config\.(?:([a-z0-9\_\$]+)|\[(\'\")([a-z0-9\_\$]+)\2\])/gi;
  var ViewConfig = Class(ViewList, {
    childClass: ConfigItem,
    localSorting: Data('info.name'),
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
          var list = nsCore.getInheritance(map[path].obj);
          var items = {};

          for (var i = 0; i < list.length; i++)
          {
            var code = String(list[i].obj.prototype.init);
            var m;
            while (m = viewConfigRegExp.exec(code))
            {
              items[m[1] || m[3]] = {
                info: {
                  name: m[1] || m[3]
                }
              };
            }
          }

          this.setChildNodes(Object.values(items));
          DOM.display(this.element, true);
        }
        else
          DOM.display(this.element, false);
      }
    })
  });

  var PrototypeItem = Class(nsWrapers.HtmlNode, {
    template: new Template(
      '<div{element} class="item property">' +
        '<div{content} class="title"><a href{ref}="#">{titleText}</a></div>' +
        '<div{jsDocContent}/>' +
      '</div>'
    ),
    behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlNode, {
      update: function(object, newInfo){
        if (newInfo.objPath)
        {
          this.titleText.nodeValue = newInfo.title;
          this.ref.nodeValue = '#' + newInfo.objPath;
          this.jsDocPanel.setDelegate(a = nsCore.JsDocEntity(newInfo.objPath));
        }
      }
    }),
    init: function(config){
      this.jsDocPanel = new JsDocPanel();
      this.jsDocPanel.addHandler({
        update: function(object, newInfo){
          if (newInfo.tags)
          {
            var type = newInfo.tags.type || (newInfo.tags.returns && newInfo.tags.returns.type);
            if (type)
            {
              DOM.insert(this.content, DOM.createElement('SPAN.tags',
                DOM.createElement('SPAN.splitter', ':'),
                DOM.wrap(
                  type.replace(/^\s*\{|\}\s*$/g, '').split(/(\|)/),
                  { 'SPAN.splitter': function(value, idx){ return idx % 2 } }
                )
              ));
            }
          }
        }
      }, this)
      config = this.inherit(config);

      DOM.insert(this.jsDocContent, this.jsDocPanel.element)

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
      '<div{element} class="item method">' +
        '<div{content} class="title">' +
          '<a href{ref}="#">{titleText}</a><span class="args">({argsText})</span>' +
        '</div>' +
        '<div{jsDocContent}/>' +
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
    init: function(config){
      config = this.inherit(config);

      var view = this;
      this.viewOptions = new ViewOptions({
        title: 'Group by',
        childNodes: [
          {
            selected: true,
            title: 'Type',
            handler: function(){
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

      return config;
    },
    destroy: function(){
      this.viewOptions.destroy();
      delete this.viewOptions;

      this.inherit();
    }
  });

  var JsDocView = Class(View, {
    template: new Template(
      '<div{element} class="view viewJsDoc">' +
        htmlHeader('jsDoc') +
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

  var JsDocPanel = Class(nsWrapers.HtmlPanel, {
    template: new Template(
      '<div{element|content} class="jsDocs"><p{description}>{descriptionText}</p></div>'
    ),
    behaviour: new nsWrapers.createBehaviour(nsWrapers.HtmlPanel, {
      update: function(object, newInfo){
        if (newInfo.tags)
        {
          DOM.clear(this.content);
          var tags = [];
          Object.iterate(Object.slice(newInfo.tags, 'readonly private'.qw()), function(key, value){
            tags.push(DOM.createElement('SPAN.tag', key));
          });
          if (tags.length)
            DOM.insert(this.content, DOM.createElement('.tags', tags));
          
          if (newInfo.tags.description != '')
          {
            this.descriptionText.nodeValue = newInfo.tags.description;
            DOM.insert(this.content, this.description);
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
                    DOM.createElement('SPAN.types', DOM.wrap(types.split(/\s*(\|)\s*/), { 'SPAN.splitter': function(value, idx){ return idx % 2 } })),
                    (isOptional ? ' (optional)' : ''),
                    DOM.createElement('P', value.description)
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
                    DOM.createElement('SPAN.types', DOM.wrap(types.split(/\s*(\|)\s*/), { 'SPAN.splitter': function(value, idx){ return idx % 2 } })),
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
              code =DOM.createElement('PRE',
                newInfo.tags.example
              )
            ]);
            code.className = 'brush: javascript';
            SyntaxHighlighter.highlight({}, code);
          }
        }
        else
          DOM.clear(this.content);
        DOM.display(this.element, !!newInfo.text)
      }
    })
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
          cursor = cursor.appendChild({
            info: {
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
    viewSourceCode: viewSourceCode,
    viewTemplate: viewTemplate,
    viewInheritance: viewInheritance,
    viewPrototype: viewPrototype,
    viewConfig: viewConfig
  });

})()