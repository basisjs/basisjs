
  'use strict';

  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.form');


  //
  // import names
  //

  var getter = Function.getter;
  var wrapper = Function.wrapper;
  var classList = basis.cssom.classList;

  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;

  var nsTemplate = basis.template;
  var nsEvent = basis.dom.event;
  var nsProperty = basis.data.property;
  var nsLayout = basis.layout;
  var nsButton = basis.ui.button;
  var nsForm = basis.ui.form;

  var KEY_S = 'S'.charCodeAt(0);

  function onEnter(editor){
    var textarea = editor.tmpl.field;
    var curValue = textarea.value;
    var insertPoint = basis.dom.getSelectionStart(textarea);
    var chrPos = curValue.lastIndexOf('\n', insertPoint - 1) + 1;
    var spaces = '';
    var chr;

    while (chrPos < insertPoint)
    {
      chr = curValue.charAt(chrPos++);
      if (chr == ' ' || chr == '\t')
        spaces += chr;
      else
        break;
    }

    if (spaces)
    {
      textarea.value = textarea.value.substr(0, insertPoint) + '\n' + spaces + textarea.value.substr(insertPoint);
      insertPoint += spaces.length + 1;
      basis.dom.setSelectionRange(textarea, insertPoint, insertPoint);
      nsEvent.kill(event);
    }
  }


  //
  // Main part
  //

  var tmplSource = new nsProperty.Property('');
  var cssSource = new nsProperty.Property('');

  //
  // Editor class
  //

  var editorContentChangedHandler = function(){
    var newContent = this.getValue().replace(/\r/g, '');

    if (this.target)
      this.target.update({ content: newContent }, true);

    this.sourceProperty.set(newContent);
  }

 /**
  *
  */
  var Editor = basis.ui.field.Textarea.subclass({
    cssClassName: 'SourceEditor',

    autoDelegate: DELEGATE.PARENT,

    template: resource('../templates/editor/editor.tmpl'),

    binding: {
      filename: 'data:',
      modified: {
        events: 'targetChanged update',
        getter: function(node){
          return node.target && node.target.modified ? 'modified' : '';
        }
      },
      createFilePanel: 'satellite:'
    },

    event_targetChanged: function(oldTarget){
      basis.ui.field.Textarea.prototype.event_targetChanged.call(this, oldTarget);
      if (this.target)
        this.target.read();
    },

    /*listen: {
      target: {
        rollbackUpdate: function(){
          this.updateBind('modified');
        }
      }
    },*/

    handler: {
      change: editorContentChangedHandler,
      fieldInput: editorContentChangedHandler,
      fieldChange: editorContentChangedHandler,
      fieldKeyup: editorContentChangedHandler,
      fieldKeydown: function(event){
        var key = nsEvent.key(event);

        if (key == nsEvent.KEY.F2 || (event.ctrlKey && key == KEY_S))
        {
          if (this.target)
            this.target.save();

          nsEvent.kill(event);

          return;
        }

        if (key == nsEvent.KEY.ENTER)
          onEnter(this);
      },
      fieldFocus: function(){
        classList(widget.element).add('focus');
      },
      fieldBlur: function(){
        classList(widget.element).remove('focus');
      },
      update: function(object, delta){
        if ('content' in delta)
        {
          if (this.tmpl.field.value != this.data.content)
            this.tmpl.field.value = this.data.content;

          this.sourceProperty.set(this.data.content);
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
    },
    satelliteConfig: {
      createFilePanel: {
        existsIf: function(editor){
          return editor.data.filename && !editor.target;
        },
        hook: {
          rootChanged: true,
          targetChanged: true
        },
        instanceOf: UINode.subclass({
          autoDelegate: DELEGATE.OWNER,

          template: resource('../templates/editor/createFilePanel.tmpl'),

          binding: {
            filename: 'data:',
            ext: function(node){
              return (node.owner && node.owner.fileExt) || '?';
            },
            button: 'satellite:'
          },

          satelliteConfig: {
            button: basis.ui.button.Button.subclass({
              autoDelegate: DELEGATE.OWNER,
              caption: 'Create a file',
              click: function(){
                fsobserver.createFile(this.data.filename);
              }
            })
          }
        })
      }
    }
  });

  //
  // Custom editors
  //

  // .tmpl
  var tmplEditor = new Editor({
    id: 'TmplEditor',
    sourceProperty: tmplSource,
    fileExt: 'tmpl',

    active: true,

    value:
      '{resource:1.css}\n\
       <b:resource src="style.css"/>\n\
       <b:include src="include.tmpl"/>\n\
       <b:include src="include2.tmpl">\n\
         <b:replace ref="title">\n\
           {title} {childCount}\n\
         </b:replace>\n\
       </b:include>\n\
       <li class="devtools-templateNode {collapsed}">\n\
        <div{content} class="devtools-templateNode-Title devtools-templateNode-CanHaveChildren {selected} {disabled}">\n\
          <div class="devtools-templateNode-Expander" event-click="toggle" attr="{l10n:path.to.dict.token}"/>\n\
          <span{titleElement} class="devtools-templateNode-Caption" event-click="select">\n\
            {l10n:path.to.dict.token}\n\
            <!--{preTitle} sdf-->{title} ({childCount})<!--just a comment-->\n\
            <span{l10n:path.to.dict.token}/>\n\
          </span>\n\
        </div>\n\
        <ul{childNodesElement} class="devtools-templateNode-Content"/>\n\
      </li>'
  });

  editorContentChangedHandler.call(tmplEditor);

  // .css
  var cssEditor = new Editor({
    id: 'CssEditor',
    sourceProperty: cssSource,
    fileExt: 'css',
    active: true
  });



  //
  // Editor
  //

  var widget = new nsLayout.VerticalPanelStack({
    id: 'Editor',

    childNodes: [
      {
        id: 'EditorToolbar',
        childNodes: [
          new nsButton.ButtonPanel({
            delegate: tmplEditor,
            disabled: true,
            childNodes: [
              {
                delegate: tmplEditor,
                caption: 'Save',
                click: function(){
                  this.target.save();
                }
              },
              {
                delegate: tmplEditor,
                caption: 'Rollback',
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
        autoDelegate: DELEGATE.PARENT,
        childNodes: tmplEditor
      },
      {
        flex: 1,
        autoDelegate: DELEGATE.PARENT,
        childNodes: cssEditor
      }
    ]
  });

  function jumpOut(){
    if (cursorText.value)
    {
      cursor.parentNode.insertBefore(document.createTextNode(cursorText.value), cursor);
      cursorText.value = '';
    }
  }

  var cursorText
  var cursor = basis.dom.createElement('SPAN.cursor',
    cursorText = basis.dom.createElement({
      description: 'TEXTAREA',
      change: jumpOut,
      keydown: jumpOut,
      keypressed: jumpOut,
      keyup: jumpOut
    })
  );

  //
  // export names
  //

  exports = module.exports = widget;
  exports.tmplSource = tmplSource;
  exports.tmplEditor = tmplEditor;
  exports.setSource = function(source){
    tmplEditor.setDelegate();
    tmplEditor.update({ content: source });
  }
  exports.setSourceFile = function(file){
    var filename;

    if (file instanceof basis.data.DataObject)
      filename = file.data.filename;
    else
      filename = file;

    if (filename)
    {
      var tmplFilename = filename.replace(/\.[a-z0-9]+$/, '.tmpl');
      var cssFilename = filename.replace(/\.[a-z0-9]+$/, '.css');
      tmplEditor.setDelegate(basis.devtools.File.getSlot({ filename: tmplFilename, content: '' }));
      cssEditor.setDelegate(basis.devtools.File.getSlot({ filename: cssFilename, content: '' }));
    }
    else
    {
      tmplEditor.setDelegate();
      cssEditor.setDelegate();
    }
  }
