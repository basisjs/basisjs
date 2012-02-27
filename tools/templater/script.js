
basis.require('basis.dom');
basis.require('basis.dom.event');
basis.require('basis.ui');
basis.require('basis.ui.form');
basis.require('basis.ui.tree');
basis.require('basis.ui.resizer');
basis.require('basis.layout');

(function(){
  var getter = Function.getter;
  var wrapper = Function.wrapper;

  var DOM = basis.dom;
  var isInside = basis.dom.isInside;
  var Event = basis.dom.event;
  var classList = basis.cssom.classList;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;

  var VerticalPanelStack = basis.layout.VerticalPanelStack;


  var TYPE_TAG = 1;
  var TYPE_ATTRIBUTE = 2;
  var TYPE_TEXT = 3;
  var TYPE_COMMENT = 8;

  var TOKEN_TYPE = 0
  var TOKEN_BINDINGS = 1;
  var TOKEN_REFS = 2;

  var ATTR_NAME = 3;
  var ATTR_VALUE = 4;

  var ELEMENT_NAME = 3;
  var ELEMENT_ATTRS = 4;
  var ELEMENT_CHILDS = 5;

  var TEXT_VALUE = 3;
  var COMMENT_VALUE = 3;


  var buildSource = function(node, noChildren){
    var result = '';
    var data = node.data;

    switch (data.type)
    {
      case TYPE_TAG:
        result = '<' + (data.prefix ? data.prefix + ':' : '') + data.name + (data.refs ? '{' + data.refs.join('|') + '}' : '');

        if (data.attrs.length)
          for (var i = 0, attr; attr = data.attrs[i]; ++i)
            result += ' ' + (attr.prefix ? attr.prefix + ':' : '') + attr.name + (attr.refs ? '{' + attr.refs.join('|') + '}' : '') + (typeof attr.value != 'undefined' ? '="' + attr.value + '"' : '');

        if (!noChildren)
          if (node.firstChild)
          {
            result += '>';

            for (var i = 0, child; child = node.childNodes[i]; ++i)
              result += buildSource(child);

            result += '</' + (data.prefix ? data.prefix + ':' : '') + data.name + '>';
          }
          else
            result += '/>';
        else
          result += '>';

        break;
      case TYPE_COMMENT:
        result += '<!--' + data.value + '-->';
        break;
      case TYPE_TEXT:
        result += data.value;
        break;
    }

    return result;
  }

  var buildOffset = function(node, root){
    var result = '';

    for (var cursor = node; cursor != root;)
      if (cursor.previousSibling)
      {
        if (cursor.previousSibling != root)
          result = buildSource(cursor.previousSibling) + result;

        cursor = cursor.previousSibling;
      }
      else
      {
        if (cursor.parentNode != root)
          result = buildSource(cursor.parentNode, true) + result;

        cursor = cursor.parentNode;
      }

    return result;
  }


  var lazy_EditPanel = Function.lazyInitAndRun(
    function(){
      var applyHandler = function(event){
        if (this.delegate && !isInside(Event.sender(event), this.element))
        {
          /*var nodes;
          var value = this.getValue();

          try
          {
            nodes = basis.template.makeDeclaration(value);
          }
          catch(e){}

          if (typeof nodes != 'undefined')
          {
            var oldValue = sourceField.getValue();
            var offset = buildOffset(this.delegate, tree).length;

            sourceField.tmpl.field.value = oldValue.substr(0, offset) + value + oldValue.substr(offset + buildSource(this.delegate).length);

            this.delegate.parentNode.setChildNodes(nodes);
          }*/

          this.setDelegate();
        }
      }

      var valueChangedHandler = function(){
        this.validate();
      }

      var result = new basis.ui.form.Field.Textarea({
        cssClassName: 'Field-Edit',
        validators: [
          function(field){
            try
            {
              parseHtml3(field.getValue());
            }
            catch(e)
            {
              return new basis.ui.form.ValidatorError(field, 'Incorrect template');
            }
          }
        ],
        handler: {
          input: valueChangedHandler,
          change: valueChangedHandler,
          delegateChanged: function(object, oldDelegate){
            if (oldDelegate)
              DOM.remove(this.element);

            if (this.delegate)
            {
              DOM.insert(this.delegate.element, this.element);
              // this.setValue(buildSource(this.delegate));
              this.select();
            }
          }
        }
      });

      Event.addGlobalHandler('click', applyHandler, result);

      return result;
    },
    function(node){
      this.setDelegate(node);
    }
  );



  var TemplateNode = basis.ui.tree.Folder.subclass({
    action: {
      edit: function(event){
        lazy_EditPanel(this);
        Event.kill(event);
      }
    },

    binding: {
      refList: 'satellite:',
      hasRefs: function(node){
        return node.data[TOKEN_REFS] ? 'hasRefs' : '';
      }
    },

    satelliteConfig: {
      refList: {
        existsIf: function(object){
          return object.data[TOKEN_REFS];
        },
        instanceOf: UIContainer.subclass({
          template:
            '<span class="ReferenceList" />',

          childClass: {
            template:
              '<span class="Reference {selected} {disabled}">{title}</span>',

            binding: {
              title: 'title'
            }
          }
        }),
        config: function(owner){
          return {
            childNodes: owner.data[TOKEN_REFS].map(wrapper('title'))
          }
        }
      }
    }
  });

  var TagNode = TemplateNode.subclass({
    template: 'file:templates/tagNode.tmpl',
      /*'<li class="Basis-TreeNode Tag {selected} {disabled}" event-click="select" event-dblclick="edit">' +
        '<div class="Basis-TreeNode-Title">' +
          '&lt;' +
          '<span class="Basis-TreeNode-Caption">{title}</span>' +
          '<!--{refList}-->' +
          '<!--{attributeList}-->' +
          '&gt;' +
        '</div>' +
        '<ul{childNodesElement} class="Basis-TreeNode-Content" />' + 
      '</li>',*/

    binding: {
      attributeList: 'satellite:',
      title: function(object){
        return object.data[ELEMENT_NAME];
      }
    },

    satelliteConfig: {
      attributeList: {
        existsIf: function(object){
          return object.data[ELEMENT_ATTRS];
        },
        instanceOf: UIContainer.subclass({
          template: 'file:templates/attributeList.tmpl',
            //'<span class="AttributeList" />',

          childClass: UIContainer.subclass({
            template: 'file:templates/attribute.tmpl',
              /*'<span> ' +
                '<span class="Attribute {selected} {disabled} {hasValue} {isEvent}">' +
                  '<span class="AttributeTitle">{name}</span>' +
                  '<span class="AttributeValue">="{value}"</span>' +
                '</span>' +
              '</span>',*/

            binding: {
              name: function(object){
                return object[ATTR_NAME];
              },
              value: function(object){
                return object[ATTR_VALUE];
              },
              hasValue: function(object){
                return object[ATTR_VALUE] ? 'hasValue' : '';
              },
              isEvent: function(object){
                return /^event-(.+)+/.test(object[ATTR_NAME]) ? 'isEvent' : '';
              }
            },

            childClass: {
              template: '<b>part</b>'
            },

            init: function(config){
              UIContainer.prototype.init.call(this, config);
              //this.setChildNodes([{}, {}])
            }
          })
        }),
        config: function(owner){
          return {
            childNodes: owner.data[ELEMENT_ATTRS]
          }
        }
      }
    }
  });

  var TextNode = TemplateNode.subclass({
    template: 'id:textNode',
      /*'<li class="Basis-TreeNode Text {selected} {disabled} {hasRefs}" event-click="select" event-dblclick="edit">' +
        '<div class="Basis-TreeNode-Title">' +
          '<span class="Basis-TreeNode-Caption">{value}</span>' +
        '</div>' +
      '</li>',*/

    binding: {
      value: function(object){
        return object.data[TEXT_VALUE].replace(/\r\n?|\n\r?/g, '\u21b5');
      }
    }
  });

  var CommentNode = TemplateNode.subclass({
    template: 'id:commentNode',
      /*'<li class="Basis-TreeNode Comment {selected} {disabled}" event-click="select" event-dblclick="edit">' +
        '<div class="Basis-TreeNode-Title">' +
          '&lt;!--' +
          '<span class="Basis-TreeNode-Caption">{title}</span>' +
          '--&gt;' +
          '<!--{refList}-->' +
        '</div>' +
      '</li>',*/

    binding: {
      title: function(object){
        return object.data[COMMENT_VALUE];
      }
    }
  });


  var NODE_FACTORY_MAP = {}

  NODE_FACTORY_MAP[TYPE_TAG] = TagNode;
  NODE_FACTORY_MAP[TYPE_TEXT] = TextNode;
  NODE_FACTORY_MAP[TYPE_COMMENT] = CommentNode;

  var nodeFactory = function(config){
    return new NODE_FACTORY_MAP[config[TOKEN_TYPE]]({
      data: config,
      childNodes: config[ELEMENT_CHILDS],
      childFactory: nodeFactory
    });
  }

  var tree = new basis.ui.tree.Tree({
    template:
      '<ul tabindex="0" class="Basis-Tree" event-keydown="keydown" event-focus="focus" event-blur="blur" />',

    action: {
      focus: function(){
        classList(this.element.parentNode.parentNode).add('focus');
      },
      blur: function(){
        classList(this.element.parentNode.parentNode).remove('focus');
      },
      keydown: function(event){
        var key = Event.key(event);
        var selected = this.selection.pick();

        switch (key)
        {
          case Event.KEY.UP:
          case Event.KEY.DOWN:
            var node;
            var axis = this.childAxis;
            var first = axis[0];
            var last = axis[axis.length - 1];

            if (selected)
            {
              var idx = axis.indexOf(selected);

              node = key == Event.KEY.UP ? axis[idx - 1] || last : axis[idx + 1] || first;
            }
            else
              node = key == Event.KEY.UP ? last : first;

            if (node)
              node.select();

            Event.kill(event);
            break;
        }
      }
    },

    childFactory: nodeFactory,

    selection: {
      handler: {
        datasetChanged: function(object, delta){
          /*var selected = this.pick();
          var start = DOM.getSelectionStart(sourceField.tmpl.field);
          var end = start;

          if (selected)
          {
            start = buildOffset(selected, tree).length;
            end = start + buildSource(selected).length;
          }

          DOM.setSelectionRange(sourceField.tmpl.field, start, end);*/
        }
      }
    },

    handler: {
      childNodesModified: function(object, delta){
        this.childAxis = DOM.axis(this, DOM.AXIS_DESCENDANT);
      }
    }
  });

  var viewerPanel =  new VerticalPanelStack({
    id: 'Viewer',
    childNodes: {
      flex: 1,
      childNodes: tree
    }
  });

  new basis.ui.resizer.Resizer({
    element: viewerPanel.element
  });


  var sourceChangedHandler = function(){
    var nodes = [];

    try
    {
      nodes = basis.template.makeDeclaration(this.getValue());
    }
    catch(e){}

    tree.setChildNodes(nodes);
  }

  var form = new basis.ui.form.FormContent({
    childNodes: {
      type: 'textarea',
      name: 'Source',
      value: 
        '<li class="Basis-TreeNode {collapsed}">\n\
          <div{content} class="Basis-TreeNode-Title Basis-TreeNode-CanHaveChildren {selected} {disabled}">\n\
            <div class="Basis-TreeNode-Expander" event-click="toggle"/>\n\
            <span{titleElement} class="Basis-TreeNode-Caption" event-click="select">\n\
              <!--{preTitle} sdf-->{title} ({childCount})<!--just a comment-->\n\
            </span>\n\
          </div>\n\
          <ul{childNodesElement} class="Basis-TreeNode-Content"/>\n\
        </li>',
/*
      '<div class="Basis-Table Basis-ScrollTable" event-load="">' +
              '<namespace:div class="Basis-ScrollTable-Header-Container">' +
                'LOCALE.HEADER' +
                '<!--simple comment-->' +
                '<table{headerOffset} class="Basis-ScrollTable-Header" cellspacing="0">' +
                  '<!--{header}-->' +
                  '<!--{headerExpandRow}-->' +
                '</table>' +
                '<div{headerExpandCell} class="Basis-ScrollTable-ExpandHeaderCell">' +
                  '<div class="Basis-ScrollTable-ExpandHeaderCell-B1">' +
                    '<div class="Basis-ScrollTable-ExpandHeaderCell-B2"/>' +
                  '</div>' +
                '</div>'+
              '</namespace:div>' +
              '<div{scrollContainer} class="Basis-ScrollTable-ScrollContainer" event-scroll="scroll">' +
                '<namespace:div{boundElement} class="Basis-ScrollTable-TableWrapper">' +
                  'LOCALE.TABLE_WRAPPER' +
                  '<table{tableElement|groupsElement} class="Basis-ScrollTable-ContentTable" cellspacing="0">' +
                    '<!--{shadowHeader}-->' +
                    '<!--{measureRow}-->' +
                    '<tbody{content|childNodesElement} class="Basis-Table-Body"/>' +
                    '<!--{shadowFooter}-->' +
                  '</table>' +
                '</namespace:div>' +
              '</div>' +
              '<div class="Basis-ScrollTable-Footer-Container">' +
                'Some text' +
                '<table{footerOffset} class="Basis-ScrollTable-Footer" cellspacing="0">' +
                  '<!--{footer}-->' +
                  '<!--{footerExpandRow}-->' +
                '</table>' +
                '<div{footerExpandCell} class="Basis-ScrollTable-ExpandFooterCell">' +
                  '<div class="Basis-ScrollTable-ExpandFooterCell-B1">' +
                    '<div class="Basis-ScrollTable-ExpandFooterCell-B2"/>' +
                  '</div>' +
                '</div>'+
              '</div>' +
            '</div>',*/
      cssClassName: 'Field-Source',
      handler: {
        input: sourceChangedHandler,
        change: sourceChangedHandler,
        focus: function(){
          classList(document.getElementById('Editor')).add('focus');
        },
        blur: function(){
          classList(document.getElementById('Editor')).remove('focus');
        }
      }
    }
  });

  var sourceField = form.getFieldByName('Source');

  //
  // Editor
  //

  var editorPanel = new VerticalPanelStack({
    id: 'Editor',
    childNodes: {
      flex: 1,
      childNodes: form
    }
  });

  //
  // Template file view
  //

  var templatesPanel = new VerticalPanelStack({
    id: 'TemplateList',
    cssClassName: 'not-active',
    childNodes: {
      flex: 1,
      childNodes: [
        {
          id: 'FSObserber',
          template: '<iframe src="../fsobserver/fileviewer.html?path=templates" event-load="show"/>'
        }
      ]
    }
  });

  var fsObserver = templatesPanel.firstChild.firstChild.element;
  var fsObserverEnabled = new basis.data.property.Property(false, {
    change: function(value){
      classList(templatesPanel.element).bool('not-active', !value);
    }
  });

  window.addEventListener('message', function(event){
    if (event.data == 'fileObserverLoaded')
      fsObserverEnabled.set(true);

    console.log(event.data);
  }, true);

  new basis.ui.resizer.Resizer({
    element: templatesPanel.element
  });

  return new UIContainer({
    id: 'Layout',
    container: document.body,
    childNodes: [
      templatesPanel,
      viewerPanel,
      editorPanel
    ]
  });

  form.firstChild.focus();

})();
