
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.layout');
  basis.require('basis.ui.tree');

(function(basis){
  'use strict';

  //
  // import names
  //
  var getter = Function.getter;
  var wrapper = Function.wrapper;

  var classList = basis.cssom.classList;
  var fsobserver = basis.devtools;

  var nsData = basis.data;
  var nsLayout = basis.layout;
  var nsTree = basis.ui.tree;
  var nsResizer = basis.ui.resizer;


  //
  // main part
  //

  var childFactory = function(cfg){
    var childClass = cfg.delegate.data.type == 'dir' ? FolderNode : FileNode;
    return new childClass(cfg);
  };

  var updatedNodes = new nsData.Dataset({
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

 /**
  * @class
  */
  var FileNode = nsTree.Node.subclass({
    binding: {
      title: 'data:filename.split("/").slice(-1)'
    },

    event_update: function(object, delta){
      nsTree.Node.prototype.event_update.call(this, object, delta);
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

 /**
  * @class
  */
  var FolderNode = nsTree.Folder.subclass({
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
      nsTree.Folder.prototype.init.call(this, config);
      this.setDataSource(fsobserver.filesByFolder.getSubset(this.data.filename, true));
    }
  });


  //
  // file tree
  //

  var fileTree = new nsTree.Tree({
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
    }
  });


  //
  // main control
  //

  var widget = new nsLayout.VerticalPanelStack({
    id: 'TemplateList',
    cssClassName: 'not-active',
    childNodes: {
      flex: 1,
      childNodes: [
        fileTree
      ]
    }
  });

  new nsResizer.Resizer({
    element: widget.element
  });

  //
  // link with fsobserver
  //

  fsobserver.isReady.addLink(widget, function(value){
    if (value)
    {
      //app.insertBefore(templatesPanel, app.firstChild)
      fileTree.setDataSource(fsobserver.filesByFolder.getSubset('../templater', true));
    }

    classList(this.element).bool('not-active', !value);
  });

  //
  // export names
  //

  widget.tree = fileTree;

  return widget;

})(basis);