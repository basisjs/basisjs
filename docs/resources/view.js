(function(){

  'use strict';

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
  var cssom = basis.cssom;
  var classList = basis.cssom.classList;
  var createEvent = basis.event.create;

  var nsWrappers = basis.dom.wrapper;
  var nsTree = basis.ui.tree;
  var nsCore = BasisDoc.Core;
  var nsScroller = basis.ui.scroller;
  var nsLayout = basis.layout;

  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var Template = basis.template.Template;
  var ui = basis.ui;
  var uiNode = basis.ui.Node;
  var uiContainer = basis.ui.Container;

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
    binding: {
      viewOptions: 'satellite:'
    },
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

      uiNode.prototype.destroy.call(this);
    }
  });

  var JsDocView = Class(View, {
    className: namespace + '.JsDocView',
    viewHeader: 'Description',
    template:
      '<div class="view viewJsDoc">' +
        htmlHeader('Description') +
        '<div class="content">' +
          '<!--{docsView}-->' +
        '</div>' +
      '</div>',

    binding: {
      docsView: 'satellite:content'
    },

    satelliteConfig: {
      content: {
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

    binding: {
      refList: 'satellite:',
      nodeName: 'data:',
      nodeValue: 'data:',
      hasRefs: function(node){
        return node.data.refs ? 'hasRefs' : '';
      }
    },

    satelliteConfig: {
      refList: {
        existsIf: getter('data.refs'),
        delegate: Function.$self,
        instanceOf: uiNode.subclass({
          template: 
            '<span class="refList"><b>{</b>{refs}<b>}</b></span>',

          binding: {
            refs: 'data:'
          }
        })
      }
    }
  });

  TemplateTreeNode.AttributeValueText = Class(uiNode, {
    template:
      '<span class="Doc-TemplateView-Attribute-Text">{text}</span>',

    binding: {
      text: 'data:'
    }
  });

  TemplateTreeNode.AttributeValueBinding = Class(uiNode, {
    template:
      '<span class="Doc-TemplateView-Attribute-Binding">{text}</span>',

    binding: {
      text: 'data:'
    }
  });

  TemplateTreeNode.AttributeClassBinding = Class(uiNode, {
    template:
      '<span class="Doc-TemplateView-Attribute-ClassBinding">{text}</span>',

    binding: {
      text: 'data:'
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Attribute = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Attribute',
    template:
      '<span> ' +
        '<span class="Doc-TemplateView-Node Doc-TemplateView-Attribute Doc-TemplateView-Attribute__{isEvent} {hasRefs}">' +
          '<span>{nodeName}<!--{refList}-->="<!--{childNodesHere}-->"</span>' + 
        '</span>' +
      '</span>',


    binding: {
      isEvent: {
        events: 'update',
        getter: function(node){
          return node.data.isEvent ? 'isEvent' : '';
        }
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.EmptyElement = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.EmptyElement',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Element {hasRefs}">' + 
        '<span>&lt;{nodeName}<!--{refList}--><!--{attributes}-->/&gt;</span>' + 
      '</div>',

    binding: {
      attributes: 'satellite:'
    },

    satelliteConfig: {
      attributes: {
        existsIf: getter('data.attrs'),
        instanceOf: uiContainer.subclass({
          template: '<span/>',
          childClass: TemplateTreeNode.Attribute
        }),
        config: function(owner){
          return {
            childNodes: owner.data.attrs
          }
        }
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
        '<span>&lt;{nodeName}<!--{refList}--><!--{attributes}-->&gt;</span>' + 
        '<div{childNodesElement} class="Doc-TemplateView-NodeContent"></div>' + 
        '<span>&lt;/{nodeName}&gt;</span>' +
      '</div>'
  });

 /**
  * @class
  */
  TemplateTreeNode.Text = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Text',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Text {hasRefs}">' + 
        '<span><!--{refList}-->{nodeValue}</span>' + 
      '</div>'
  });

 /**
  * @class
  */
  TemplateTreeNode.Comment = Class(TemplateTreeNode, {
    className: namespace + '.TemplateTreeNode.Comment',
    template:
      '<div class="Doc-TemplateView-Node Doc-TemplateView-Comment {hasRefs}">' + 
        '&lt;!--<span>{nodeValue}</span>--&gt;' + 
      '</div>'
  });

 /**
  * @class
  */
  var BindingsPanel = basis.ui.Container.subclass({
    templateUpdate: function(){
      var template = this.delegate.templateView;
      var binding;
      if (template)
      {
        var matchBinding = template.getBinding(this.data.obj.prototype.binding);
        binding = Object.iterate(this.data.obj.prototype.binding, function(key, value){
          return typeof value == 'object' ? {
            data: {
              name: key,
              getter: value.getter,
              events: value.events,
              used: matchBinding && matchBinding.names.indexOf(key) != -1
            }
          } : null
        }).filter(Boolean);
      }

      this.setChildNodes(binding);
    },

    template:
      '<div class="bindingList">' +
        '<div class="bindingList_header">Bindings</div>' +
        '<!--{childNodesHere}-->' +
      '</div>',

    sorting: 'data.name',

    childClass: {
      expanded: false,
      event_toggle: basis.event.create('toggle'),

      template: 
        '<div class="binding {used} binding__{expanded}">' +
          '<div class="binding-header" event-click="toggle">{name} on {events}</div>' +
          '<div class="binding-content">' +
            '<!--{source}-->' +
          '</div>' +
        '</div>',

      binding: {
        name: 'data:',
        events: 'data:events || ""',
        used: function(node){
          return node.data.used ? 'used' : '';
        },
        expanded: {
          events: 'toggle',
          getter: function(node){
            return node.expanded ? 'expanded' : '';
          }
        },
        source: 'satellite:'
      },

      action: {
        toggle: function(){
          this.expanded = !this.expanded;
          this.event_toggle(this);
        }
      },

      satelliteConfig: {
        source: {
          hook: { toggle: true },
          existsIf: Function.getter('expanded'),
          instanceOf: nsHighlight.SourceCodeNode.subclass({
            autoDelegate: DELEGATE.OWNER,
            lang: 'js',
            lineNumber: false,
            codeGetter: function(node){
              var code = resolveFunction(node.data.getter);
              return code.getter || code.asIs;
            }
          })
        }
      }
    }
  });

 /**
  * @class
  */
  var ActionsPanel = basis.ui.Container.subclass({
    templateUpdate: function(){
      var cls = this.data.obj;

      if (cls && basis.Class.isClass(cls))
      {
        //console.dir(cls);

        var action = cls.prototype.action;
        var childNodes = [];
        if (action)
        {
          for (var actionName in action)
            if (actionName != '__extend__' && typeof action[actionName] == 'function')
            {
              childNodes.push({
                data: {
                  name: actionName,
                  action: action[actionName],
                  used: true
                }
              });
            }
        }

        this.setChildNodes(childNodes);
      }
    },

    template:
      '<div class="actionsList">' +
        '<div class="actionsList_header">Actions</div>' +
        '<!--{childNodesHere}-->' +
      '</div>',

    sorting: 'data.name',

    childClass: {
      expanded: false,
      event_toggle: basis.event.create('toggle'),

      template: 
        '<div class="action action__{expanded} {used}">' +
          '<div class="action-header" event-click="toggle">{name}</div>' +
          '<div class="action-content">' +
            '<!--{source}-->' +
          '</div>' +
        '</div>',

      binding: {
        name: 'data:',
        used: function(node){
          return node.data.used ? 'used' : '';
        },
        expanded: {
          events: 'toggle',
          getter: function(node){
            return node.expanded ? 'expanded' : '';
          }
        },
        source: 'satellite:'
      },

      action: {
        toggle: function(){
          this.expanded = !this.expanded;
          this.event_toggle(this);
        }
      },

      satelliteConfig: {
        source: {
          hook: { toggle: true },
          existsIf: Function.getter('expanded'),
          instanceOf: nsHighlight.SourceCodeNode.subclass({
            autoDelegate: DELEGATE.OWNER,
            lang: 'js',
            lineNumber: false,
            codeGetter: function(node){
              var code = resolveFunction(node.data.action);
              return code.getter || code.asIs;
            }
          })
        }
      }
    }
  });


  // token types
  /** @const */ var TYPE_ELEMENT = 1;
  /** @const */ var TYPE_ATTRIBUTE = 2;
  /** @const */ var TYPE_TEXT = 3;
  /** @const */ var TYPE_COMMENT = 8;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = 0
  /** @const */ var TOKEN_BINDINGS = 1;
  /** @const */ var TOKEN_REFS = 2;

  /** @const */ var ATTR_NAME = 3;
  /** @const */ var ATTR_VALUE = 4;

  /** @const */ var ELEMENT_NAME = 3;
  /** @const */ var ELEMENT_ATTRS = 4;
  /** @const */ var ELEMENT_CHILDS = 5;

  /** @const */ var TEXT_VALUE = 3;
  /** @const */ var COMMENT_VALUE = 3;

  function buildTemplate(tokens){
    var result = [];

    function refList(token){
      var refs = token[TOKEN_REFS];

      if (refs && refs.length)
        return refs.join('|');

      return null;
    }

    var nodeConfig;
    var nodeClass;
    for (var i = 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE]){
        case TYPE_ELEMENT:
          var childs = buildTemplate(token[ELEMENT_CHILDS]);
          var attrs = token[ELEMENT_ATTRS];
          var attrNodes = [];

          for (var j = 0, attr; attr = attrs[j]; j++)
          {
            var attrParts = [];
            var addValue = !attr[TOKEN_BINDINGS];

            if (attr[TOKEN_BINDINGS])
            {
              if (attr[ATTR_NAME] == 'class')
              {
                if (attr[ATTR_VALUE])
                  addValue = true;

                var bindings = attr[TOKEN_BINDINGS];
                var list = bindings[0];
                for (var b = 0; b < list.length; b++)
                  for (var p = 0; p < bindings[b + 1].length; p++)
                    attrParts.push(new TemplateTreeNode.AttributeClassBinding({
                      data: {
                        text: bindings[b + 1][p] + '{' + list[b] + '}'
                      }
                    }));
              }
              else
              {
                var bindings = attr[TOKEN_BINDINGS];
                var dict = bindings[0];
                var list = bindings[1];
                for (var b = 0; b < list.length; b++)
                {
                  if (typeof list[b] == 'string')
                    attrParts.push(new TemplateTreeNode.AttributeValueText({
                      data: {
                        text: list[b]
                      }
                    }));
                  else
                    attrParts.push(new TemplateTreeNode.AttributeValueBinding({
                      data: {
                        text: '{' + dict[list[b]] + '}'
                      }
                    }));
                }
              }
            }

            if (addValue && attr[ATTR_VALUE])
              attrParts.unshift(new TemplateTreeNode.AttributeValueText({
                data: {
                  text: attr[ATTR_VALUE]
                }
              }));

            attrNodes.push(new TemplateTreeNode.Attribute({
              data: {
                nodeName: attr[ATTR_NAME],
                refs: refList(attr),
                isEvent: /^event-/.test(attr[ATTR_NAME])
              },
              childNodes: attrParts
            }));
          }

          nodeClass = TemplateTreeNode.EmptyElement;
          nodeConfig = {
            data: {
              nodeName: token[ELEMENT_NAME],
              nodeType: TYPE_ELEMENT,
              refs: refList(token),
              attrs: attrNodes.length ? attrNodes : null
            }
          };

          if (childs.length)
          {
            nodeClass = TemplateTreeNode.Element;
            nodeConfig.childNodes = childs; 
          }

          break;

        case TYPE_TEXT:
          nodeClass = TemplateTreeNode.Text;
          nodeConfig = {
            data: {
              nodeType: TYPE_TEXT,
              nodeValue: token[TEXT_VALUE] || '?',
              refs: refList(token)
            }
          };

          break;

        case TYPE_COMMENT:
          nodeClass = TemplateTreeNode.Comment;
          nodeConfig = {
            data: {
              nodeType: TYPE_COMMENT,
              nodeValue: token[COMMENT_VALUE],
              refs: refList(token)
            }
          };

          break;
      }

      result.push(new nodeClass(nodeConfig));
    }

    return result;
  }

 /**
  * @class
  */
  var TemplatePanel = uiContainer.subclass({
    template:
      '<div class="templatePanel {isExternalFile}">' +
        '<a class="templateFile" href="source_viewer.html?file={externalFileUrl}" target="_blank">{externalFileCaption}</a>' +
        '<div{childNodesElement} class="templateHtml"/>' +
        '<div>' +
          '<!--{bindings}-->' +
          '<!--{actions}-->' +
        '</div>' +
      '</div>',

    binding: {
      bindings: 'satellite:',
      actions: 'satellite:',
      isExternalFile: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        if (template && template.source && template.source.url)
          return 'isExternalFile';
        return '';
      },
      externalFileCaption: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        return ((template && template.source && template.source.url) || '').split('src/basis/').pop();
      },
      externalFileUrl: function(node){
        var template = node.data.obj && node.data.obj.prototype.template;
        return ((template && template.source && template.source.url) || '').replace(/^(.*)(src\/basis\/)/i, '$2');
      }
    },

    event_templateViewChanged: createEvent('templateViewChanged'),

    templateUpdate: function(tmpl, object, oldDelegate){
      var rootCfg = {};

      var template = this.data.obj.prototype.template;

      if (this.templateView === template)
        return;

      if (template)
      {
        rootCfg.childNodes = template.docsCache_;

        if (!rootCfg.childNodes)
        {
          rootCfg.childNodes = [];

          var source = String(typeof template.source == 'function' ? template.source() : template.source);
          var decl = basis.template.makeDeclaration(source);

          rootCfg.childNodes = buildTemplate(decl.tokens);
        }
      }

      this.setChildNodes(rootCfg.childNodes || [], true);
      this.updateBind('isExternalFile');
      this.updateBind('externalFileCaption');
      this.updateBind('externalFileUrl');

      if (template)
        template.docsCache_ = Array.from(this.childNodes);

      var oldTemplate = this.templateView;
      this.templateView = template;
      this.event_templateViewChanged(this, oldTemplate);
    },

    satelliteConfig: {
      bindings: {
        hook: { templateViewChanged: true },
        existsIf: getter('templateView'),
        delegate: Function.$self,
        instanceOf: BindingsPanel
      },
      actions: {
        hook: { templateViewChanged: true },
        existsIf: getter('templateView'),
        delegate: Function.$self,
        instanceOf: ActionsPanel
      }
    }
  });


  function hasTemplate(node){
    return node.data.obj && node.data.obj.prototype && node.data.obj.prototype.template instanceof Template;
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
          '<!-- {template} -->' +
        '</div>' +
      '</div>',

    binding: {
      template: 'satellite:'
    },

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
                handler: function(){
                  contentClassList.set('references');
                }
              },
              {
                title: 'Highlight',
                selected: true,
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
      className: 'data:title',
      namespace: 'data:',
      fullPath: 'data:',
      tag: 'data:tag || "none"'
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
          title: 'data:'
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
          var group;
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
    className: 'PrototypeProperty',
    nodeType: 'property',
    template: 
      '<div class="item {nodeType}">' +
        '<div class="title">' +
          '<a href="#{path}">{title}</a><span{types} class="types"/>' +
        '</div>' +
        '<!-- {jsdocs} -->' +
      '</div>',

    binding: {
      jsdocs: 'satellite:',
      nodeType: 'nodeType',
      title: 'data:key.replace(/^event_/, "")',
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
    className: 'PrototypeMethod',
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
    className: 'PrototypeSpecialMethod',
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
    className: 'PrototypeEvent',
    nodeType: 'event'
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

        //console.profile();
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
        //console.profileEnd();
        console.log('time: ', new Date - d, ' for ', this.childNodes.length);
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
            cssom.display(this.tmpl.empty, !this.first);
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
        url: 'data:'
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

    binding: {
      sourceCode: 'satellite:'
    },

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
  var namespaceClsSplitBySuper = new nsData.dataset.Split({
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
          var clsList = namespace.exports;
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

    binding: {
      classMap: 'satellite:'
    },

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

  var viewTemplate = new ViewTemplate();

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
    viewSourceCode: viewSourceCode,
    viewTemplate: viewTemplate,
    viewInheritance: viewInheritance,
    viewPrototype: viewPrototype,
    viewClassMap: viewClassMap,
    viewNamespaceMap: viewNamespaceMap
  });

})()