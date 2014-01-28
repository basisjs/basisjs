  basis.require('basis.template');
  basis.require('basis.ui');

  var namespace = module.path;
  var uiNode = basis.ui.Node;

  var TemplateTreeNode = uiNode.subclass({
    className: namespace + '.TemplateTreeNode',

    binding: {
      refList: 'satellite:',
      nodeName: 'data:',
      nodeValue: 'data:',
      hasRefs: function(node){
        return node.data.refs ? 'hasRefs' : '';
      }
    },

    satellite: {
      refList: {
        existsIf: basis.getter('data.refs'),
        delegate: basis.fn.$self,
        instanceOf: uiNode.subclass({
          template: resource('template/tree/refList.tmpl'),
          binding: {
            refs: 'data:'
          }
        })
      }
    }
  });

  TemplateTreeNode.AttributeValueText = uiNode.subclass({
    template: resource('template/tree/attributeText.tmpl'),

    binding: {
      text: 'data:'
    }
  });

  TemplateTreeNode.AttributeValueBinding = uiNode.subclass({
    template: resource('template/tree/attributeBinding.tmpl'),

    binding: {
      text: 'data:'
    }
  });

  TemplateTreeNode.AttributeClassBinding = uiNode.subclass({
    template: resource('template/tree/attributeClass.tmpl'),

    binding: {
      text: 'data:'
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Attribute = TemplateTreeNode.subclass({
    className: namespace + '.TemplateTreeNode.Attribute',
    template: resource('template/tree/attribute.tmpl'),

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
  TemplateTreeNode.EmptyElement = TemplateTreeNode.subclass({
    className: namespace + '.TemplateTreeNode.EmptyElement',
    template: resource('template/tree/emptyElement.tmpl'),

    binding: {
      attributes: 'satellite:'
    },

    satellite: {
      attributes: {
        existsIf: basis.getter('data.attrs'),
        instanceOf: basis.ui.Node.subclass({
          template: '<span/>',
          childClass: TemplateTreeNode.Attribute
        }),
        config: function(owner){
          return {
            childNodes: owner.data.attrs
          };
        }
      }
    }
  });

 /**
  * @class
  */
  TemplateTreeNode.Element = TemplateTreeNode.EmptyElement.subclass({
    className: namespace + '.TemplateTreeNode.Element',
    template: resource('template/tree/element.tmpl')
  });

 /**
  * @class
  */
  TemplateTreeNode.Text = TemplateTreeNode.subclass({
    className: namespace + '.TemplateTreeNode.Text',
    template: resource('template/tree/text.tmpl')
  });

 /**
  * @class
  */
  TemplateTreeNode.Comment = TemplateTreeNode.subclass({
    className: namespace + '.TemplateTreeNode.Comment',
    template: resource('template/tree/comment.tmpl')
  });

  // token types
  /** @const */ var TYPE_ELEMENT = basis.template.TYPE_ELEMENT;
  /** @const */ var TYPE_ATTRIBUTE = basis.template.TYPE_ATTRIBUTE;
  /** @const */ var TYPE_TEXT = basis.template.TYPE_TEXT;
  /** @const */ var TYPE_COMMENT = basis.template.TYPE_COMMENT;
  /** @const */ var TYPE_ATTRIBUTE_CLASS = basis.template.TYPE_ATTRIBUTE_CLASS;
  /** @const */ var TYPE_ATTRIBUTE_STYLE = basis.template.TYPE_ATTRIBUTE_STYLE;
  /** @const */ var TYPE_ATTRIBUTE_EVENT = basis.template.TYPE_ATTRIBUTE_EVENT;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = basis.template.TOKEN_TYPE;
  /** @const */ var TOKEN_BINDINGS = basis.template.TOKEN_BINDINGS;
  /** @const */ var TOKEN_REFS = basis.template.TOKEN_REFS;

  /** @const */ var ATTR_NAME = basis.template.ATTR_NAME;
  /** @const */ var ATTR_VALUE = basis.template.ATTR_VALUE;

  /** @const */ var ELEMENT_NAME = basis.template.ELEMENT_NAME;
  /** @const */ var ELEMENT_ATTRS = basis.template.ELEMENT_ATTRS;
  /** @const */ var ELEMENT_CHILDS = basis.template.ELEMENT_CHILDS;

  /** @const */ var TEXT_VALUE = basis.template.TEXT_VALUE;
  /** @const */ var COMMENT_VALUE = basis.template.COMMENT_VALUE;

  function buildTemplate(tokens){
    var result = [];

    function refList(token){
      var refs = token[TOKEN_REFS];

      if (refs && refs.length)
        return refs.join('|');

      return null;
    }

    var nodeConfig;
    var NodeClass;
    for (var i = 0, token; token = tokens[i]; i++)
    {
      switch(token[TOKEN_TYPE]){
        case TYPE_ELEMENT:
          var attrs = [];
          var attrNodes = [];
          var children = [];
          for (var j = ELEMENT_ATTRS, t; t = token[j]; j++)
            if (t[TOKEN_TYPE] == TYPE_ELEMENT || t[TOKEN_TYPE] == TYPE_TEXT || t[TOKEN_TYPE] == TYPE_COMMENT)
              children.push(t);
            else
              attrs.push(t);

          var childs = buildTemplate(children);

          for (var j = 0, attr; attr = attrs[j]; j++)
          {
            // normalization
            switch (attr[TOKEN_TYPE])
            {
              case TYPE_ATTRIBUTE_CLASS:
                attr = attr.slice();
                attr.splice(ATTR_NAME, 0, 'class');
                break;
              case TYPE_ATTRIBUTE_STYLE:
                attr = attr.slice();
                attr.splice(ATTR_NAME, 0, 'style');
                break;
              case TYPE_ATTRIBUTE_EVENT:
                attr = [2, 0, 0, 'event-' + attr[1], attr[2] || attr[1]];
                break;
            }

            var attrParts = [];
            var addValue = !attr[TOKEN_BINDINGS];
            if (attr[TOKEN_BINDINGS])
            {
              if (attr[ATTR_NAME] == 'class')
              {
                if (attr[ATTR_VALUE])
                  addValue = true;

                var bindings = attr[TOKEN_BINDINGS];
                for (var p = 0, binding; binding = bindings[p]; p++)
                  attrParts.push(new TemplateTreeNode.AttributeClassBinding({
                    data: {
                      text: binding[0] + '{' + binding[1] + '}'
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

          NodeClass = TemplateTreeNode.EmptyElement;
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
            NodeClass = TemplateTreeNode.Element;
            nodeConfig.childNodes = childs; 
          }

          break;

        case TYPE_TEXT:
          NodeClass = TemplateTreeNode.Text;
          nodeConfig = {
            data: {
              nodeType: TYPE_TEXT,
              nodeValue: token[TOKEN_REFS] ? '{' + token[TOKEN_REFS].join('|') + '}' : token[TEXT_VALUE],
              refs: refList(token)
            }
          };

          break;

        case TYPE_COMMENT:
          NodeClass = TemplateTreeNode.Comment;
          var refs = refList(token);
          nodeConfig = {
            data: {
              nodeType: TYPE_COMMENT,
              nodeValue: token[COMMENT_VALUE] || (refs ? '{' + refs + '}' : ''),
              refs: refs
            }
          };

          break;
      }

      result.push(new NodeClass(nodeConfig));
    }

    return result;
  }

  module.exports = buildTemplate;
