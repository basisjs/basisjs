
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


  //
  // Main part
  //

  var templateSource = new nsProperty.Property('');

  var sourceChangedHandler = function(){
    var newContent = this.getValue();

    if (this.target)
    {
      var file = nsTemplate.filesMap[this.data.filename.replace('../templater/', '')];

      this.target.update({ content: newContent }, true);

      if (file)
        file.update(newContent);
    }

    templateSource.set(newContent);
  }

  var form = new nsForm.FormContent({
    active: true,
    autoDelegate: DELEGATE.PARENT,
    childNodes: {
      autoDelegate: DELEGATE.PARENT,
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
            templateSource.set(this.data.content);
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
        childNodes: form
      }
    ]
  });

  //
  // export names
  //

  widget.form = form;
  widget.templateSource = templateSource;
  widget.setSource = function(source){
    form.setDelegate();
    form.firstChild.update({ content: source });
  }

  return widget;

})(basis);