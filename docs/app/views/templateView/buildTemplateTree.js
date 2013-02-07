
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

    satelliteConfig: {
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

    satelliteConfig: {
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
  /** @const */ var TYPE_ELEMENT = 1;
  /** @const */ var TYPE_ATTRIBUTE = 2;
  /** @const */ var TYPE_TEXT = 3;
  /** @const */ var TYPE_COMMENT = 8;

  // references on fields in declaration
  /** @const */ var TOKEN_TYPE = 0;
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
    var NodeClass;
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
