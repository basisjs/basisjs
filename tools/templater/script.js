
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
      /*'<li class="devtools-templateNode Tag {selected} {disabled}" event-click="select" event-dblclick="edit">' +
        '<div class="devtools-templateNode-Title">' +
          '&lt;' +
          '<span class="devtools-templateNode-Caption">{title}</span>' +
          '<!--{refList}-->' +
          '<!--{attributeList}-->' +
          '&gt;' +
        '</div>' +
        '<ul{childNodesElement} class="devtools-templateNode-Content" />' + 
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
    template: 'file:templates/textNode.tmpl',
      /*'<li class="devtools-templateNode Text {selected} {disabled} {hasRefs}" event-click="select" event-dblclick="edit">' +
        '<div class="devtools-templateNode-Title">' +
          '<span class="devtools-templateNode-Caption">{value}</span>' +
        '</div>' +
      '</li>',*/

    binding: {
      value: function(object){
        return object.data[TEXT_VALUE].replace(/\r\n?|\n\r?/g, '\u21b5');
      }
    }
  });

  var CommentNode = TemplateNode.subclass({
    template: 'file:templates/commentNode.tmpl',
      /*'<li class="devtools-templateNode Comment {selected} {disabled}" event-click="select" event-dblclick="edit">' +
        '<div class="devtools-templateNode-Title">' +
          '&lt;!--' +
          '<span class="devtools-templateNode-Caption">{title}</span>' +
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
      '<ul tabindex="0" class="devtools-templateTree" event-keydown="keydown" event-focus="focus" event-blur="blur" />',

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
    var newContent = this.getValue();

    if (this.target)
    {
      var file = basis.template.filesMap[this.data.filename.replace('../templater/', '')];

      this.target.update({ content: newContent }, true);

      if (file)
        file.update(newContent);
    }

    nodes = basis.template.makeDeclaration(newContent);
    tree.setChildNodes(nodes);
  }

  var form = new basis.ui.form.FormContent({
    active: true,
    childNodes: {
      autoDelegate: basis.dom.wrapper.DELEGATE.PARENT,
      type: 'textarea',
      name: 'Source',
      value: 
        '<li class="devtools-templateNode {collapsed}">\n\
          <div{content} class="devtools-templateNode-Title devtools-templateNode-CanHaveChildren {selected} {disabled}">\n\
            <div class="devtools-templateNode-Expander" event-click="toggle"/>\n\
            <span{titleElement} class="devtools-templateNode-Caption" event-click="select">\n\
              <!--{preTitle} sdf-->{title} ({childCount})<!--just a comment-->\n\
            </span>\n\
          </div>\n\
          <ul{childNodesElement} class="devtools-templateNode-Content"/>\n\
        </li>',

      cssClassName: 'Field-Source',

      listen: {
        target: {
          rollbackUpdate: function(){
            this.updateBind('modified');
            classList(this.tmpl.field).bool('modified', this.target && this.target.modified);
          }
        }
      },

      handler: {
        input: sourceChangedHandler,
        change: sourceChangedHandler,
        keydown: function(event){
          if (!this.target)
            return;

          var key = basis.dom.event.key(event);
          if (key == basis.dom.event.KEY.F2 || (key == 83 && event.ctrlKey))
          {
            this.target.save();
            basis.dom.event.kill(event);
          }
        },
        focus: function(){
          classList(editorPanel.element).add('focus');
        },
        blur: function(){
          classList(editorPanel.element).remove('focus');
        },
        update: function(object, delta){
          if ('content' in delta)
          {
            this.tmpl.field.value = this.data.content;
            tree.setChildNodes(basis.template.makeDeclaration(this.data.content));
          }
        },
        targetChanged: function(){
          classList(this.tmpl.field).bool('modified', this.target && this.target.modified);

          if (this.target)
            this.enable();
          else
          {
            this.update({ content: '' });
            this.disable();
          }
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
    childNodes: [
      {
        id: 'EditorToolbar',
        childNodes: [
          new basis.ui.button.ButtonPanel({
            delegate: form,
            disabled: true,
            childNodes: [
              {
                delegate: form,
                caption: 'Save',
                click: function(){
                  this.target.save();
                }
              },
              {
                delegate: form,
                caption: 'Cancel changes',
                click: function(){
                  this.target.rollback();
                }
              }
            ],
            syncDisableState: function(){
              if (this.target && this.target.modified)
                this.enable();
              else
                this.disable();
            },
            handler: {
              targetChanged: function(){
                this.syncDisableState();
              }
            },
            listen: {
              target: {
                rollbackUpdate: function(){
                  this.syncDisableState();
                }
              }
            }
          })
        ]
      },
      {
        flex: 1,
        childNodes: form
      }
    ]
  });

  //
  // Template file view
  //

  var childFactory = function(cfg){
    var childClass = cfg.delegate.data.type == 'dir' ? FolderNode : FileNode;
    return new childClass(cfg);
  };

  var updatedNodes = new basis.data.Dataset({
    handler: {
      datasetChanged: function(dataset, delta){
        var array;

        if (array = delta.inserted)
          for (var i = 0; i < array.length; i++)
            classList(array[i].tmpl.content).add('highlight');

        if (array = delta.deleted)
          for (var i = 0; i < array.length; i++)
            classList(array[i].tmpl.content).remove('highlight');

        if (this.itemCount && !this.timer)
          this.timer = setTimeout(function(){
            this.timer = 0;
            this.clear();
          }.bind(this), 50);
      }
    }
  });

  var FileNode = basis.ui.tree.Node.subclass({
    binding: {
      title: 'data:filename.split("/").slice(-1)'
    },

    event_update: function(object, delta){
      basis.ui.tree.Node.prototype.event_update.call(this, object, delta);
      updatedNodes.add([this]);
    },

    templateUpdate: function(){
      classList(this.element).bool('modified', this.target.modified);
    },

    listen: {
      target: {
        rollbackUpdate: function(){
          classList(this.element).bool('modified', this.target.modified);
        }
      }
    }
  });
  var FolderNode = basis.ui.tree.Folder.subclass({
    binding: {
      title: 'data:filename.split("/").slice(-1)'
    },

    childFactory: childFactory,
    sorting: 'data.filename',
    grouping: {
      groupGetter: 'data.type',
      sorting: 'data.id == "file"',
      childClass: {
        template: '<div/>'
      }
    },

    init: function(config){
      basis.ui.tree.Folder.prototype.init.call(this, config);
      this.setDataSource(basis.devtools.filesByFolder.getSubset(this.data.filename, true));
    }
  });

  var fileTree = new basis.ui.tree.Tree({
    container: document.body,
    template:
      '<ul tabindex="0" class="devtools-templateFileList" event-keydown="keydown" event-focus="focus" event-blur="blur" />',

    action: {
      focus: function(){
        classList(this.element.parentNode.parentNode).add('focus');
      },
      blur: function(){
        classList(this.element.parentNode.parentNode).remove('focus');
      }
    },

    childFactory: childFactory,
    sorting: 'data.filename',
    grouping: {
      groupGetter: 'data.type',
      sorting: 'data.id == "file"',
      childClass: {
        template: '<div/>'
      }
    },

    selection: {
      handler: {
        datasetChanged: function(dataset, delta){
          form.setDelegate(this.pick());
        }
      }
    }
  });

  var templatesPanel = new VerticalPanelStack({
    id: 'TemplateList',
    cssClassName: 'not-active',
    childNodes: {
      flex: 1,
      childNodes: [
        fileTree
      ]
    }
  });

  new basis.ui.resizer.Resizer({
    element: templatesPanel.element
  });


  basis.devtools.isReady.addLink(templatesPanel, function(value){
    if (value)
    {
      app.insertBefore(templatesPanel, app.firstChild)
      fileTree.setDataSource(basis.devtools.filesByFolder.getSubset('../templater', true));
    }

    classList(this.element).bool('not-active', !value);
  })


  //
  // App
  //

  var app = new UIContainer({
    id: 'Layout',
    container: document.body,
    childNodes: [
      viewerPanel,
      editorPanel
    ]
  });

  form.firstChild.tmpl.field.focus();

  return app;

})();
