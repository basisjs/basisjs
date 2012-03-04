
basis.require('basis.dom.event');
basis.require('basis.cssom');
basis.require('basis.data');
basis.require('basis.data.property');
basis.require('basis.layout');
basis.require('basis.ui');
basis.require('basis.ui.form');

(function(basis){

  'use strict';

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

  var fsobserver = basis.devtools;


  //
  // Main part
  //

  var tmplSource = new nsProperty.Property('');
  var cssSource = new nsProperty.Property('');

  var sourceChangedHandler = function(){
    var newContent = this.getValue();

    if (this.target)
      this.target.update({ content: newContent }, true);

    tmplSource.set(newContent);
  }

  var tmplEditor = new nsForm.Field.Textarea({
    id: 'TemplateEditor',
    cssClassName: 'Field-Source',

    autoDelegate: DELEGATE.PARENT,
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

    template:
      '<div{sampleContainer} class="Basis-Field {selected} {disabled}">' +
        '<div{content} class="Basis-Field-Container">' +
          '<textarea{field} />' +
        '</div>' +
      '</div>',

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

        var key = nsEvent.key(event);
        if (key == nsEvent.KEY.F2 || (key == 83 && event.ctrlKey))
        {
          this.target.save();
          nsEvent.kill(event);
        }
      },
      focus: function(){
        classList(widget.element).add('focus');
      },
      blur: function(){
        classList(widget.element).remove('focus');
      },
      update: function(object, delta){
        if ('content' in delta)
        {
          this.tmpl.field.value = this.data.content;
          tmplSource.set(this.data.content);
          //tree.setChildNodes(nsTemplate.makeDeclaration(this.data.content));
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
  });

  //
  // CSS editor
  //

  var sourceChangedHandler = function(){
    var newContent = this.getValue();

    if (this.target)
      this.target.update({ content: newContent }, true);

    cssSource.set(newContent);
  }

  var cssEditor = new nsForm.Field.Textarea({
    id: 'TemplateEditor',
    cssClassName: 'Field-Source',

    autoDelegate: DELEGATE.PARENT,
    name: 'Source',
    value: '',

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

        var key = nsEvent.key(event);
        if (key == nsEvent.KEY.F2 || (key == 83 && event.ctrlKey))
        {
          this.target.save();
          nsEvent.kill(event);
        }
      },
      focus: function(){
        classList(widget.element).add('focus');
      },
      blur: function(){
        classList(widget.element).remove('focus');
      },
      update: function(object, delta){
        if ('content' in delta)
        {
          this.tmpl.field.value = this.data.content;
          cssSource.set(this.data.content);
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

  //
  // export names
  //

  widget.tmplSource = tmplSource;
  widget.tmplEditor = tmplEditor;
  widget.setSource = function(source){
    tmplEditor.setDelegate();
    tmplEditor.update({ content: source });
  }
  widget.setSourceFile = function(file){
    var filename;

    if (file instanceof basis.data.DataObject)
      filename = file.data.filename;
    else
      filename = file;

    if (filename)
    {
      var tmplFilename = filename.replace(/\.[a-z0-9]+$/, '.tmpl');
      var cssFilename = filename.replace(/\.[a-z0-9]+$/, '.css');
      tmplEditor.setDelegate(fsobserver.File.getSlot({ filename: tmplFilename, content: '' }));
      cssEditor.setDelegate(fsobserver.File.getSlot({ filename: cssFilename, content: '' }));
    }
    else
    {
      tmplEditor.setDelegate();
      cssEditor.setDelegate();
    }
  }

  return widget;

})(basis);