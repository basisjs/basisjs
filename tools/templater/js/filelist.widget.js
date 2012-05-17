
  'use strict';

  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.layout');
  basis.require('basis.ui.tree');


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
    template: resource('../templates/filelist/fileNode.tmpl'),

    binding: {
      title: 'data:filename.split("/").slice(-1)',
      fileType: 'data:filename.split(".").pop()',
      modified: {
        events: 'targetChanged',
        getter: function(node){
          return node.target && node.target.modified ? 'modified' : '';
        }
      }
    },

    event_update: function(delta){
      nsTree.Node.prototype.event_update.call(this, delta);
      updatedNodes.add([this]);
    },

    listen: {
      target: {
        rollbackUpdate: function(){
          this.tmpl.set('modified', this.binding.modified.getter(this));
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

    init: function(){
      nsTree.Folder.prototype.init.call(this);
      //console.log(this.data.filename);
      if (this.data.filename)
        this.setDataSource(fsobserver.filesByFolder.getSubset(this.data.filename, true));
    }
  });


  //
  // file tree
  //

  var fileTree = new nsTree.Tree({
    template: resource('../templates/filelist/tree.tmpl'),

    dataSource: fsobserver.filesByFolder.getSubset('', true),

    action: {
      focus: function(){
        classList(widget.element).add('focus');
      },
      blur: function(){
        classList(widget.element).remove('focus');
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

  fsobserver.isOnline.addLink(fileTree, function(value){
    if (value)
      this.enable();
    else
      this.disable();
  });

  fsobserver.isReady.addLink(widget, function(value){
    classList(this.element).bool('not-active', !value);
  });


  //
  // export names
  //

  exports = module.exports = widget;
  exports.tree = fileTree;
