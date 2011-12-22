/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

basis.require('basis.html');
basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.dom.wrapper');
basis.require('basis.ui');

!function(basis){

  'use strict';

 /**
  * @namespace basis.ui.label
  */

  var namespace = 'basis.ui.label';


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;

  var getter = Function.getter;
  var createEvent = basis.EventObject.createEvent;
  var event = basis.EventObject.event;
  var classList = basis.cssom.classList;

  var STATE = basis.data.STATE;
  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;


  //
  // main part
  //

  var stateTemplate = '<div class="Basis-Label Basis-Label-State"/>';
  var processingTemplate = '<div class="Basis-Label Basis-Label-Processing"/>';
  var errorTemplate = '<div class="Basis-Label Basis-Label-Error"/>';

  //
  // NodeLabel
  //

  var HANDLER = function(){
    var visible = this.owner ? !!this.visibilityGetter(this.owner) : false;

    if (this.visible !== visible)
    {
      this.visible = visible;
      this.event_visibilityChanged(this);
    }
  };

 /**
  * Base class for all labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    template: '<div class="Basis-Label"/>',
    content: '[no text]',

    visibilityGetter: Function.$true,
    visible: null,

    event_visibilityChanged: createEvent('visibilityChanged', 'node') && function(node){
      event.visibilityChanged.call(this, node);

      DOM.display(this.element, this.visible);
    },

    /*event_condChanged: createEvent('condChanged', 'node') && function(node){
      event.condChanged.call(this, node);

      HANDLER.call(this);
    },*/

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      HANDLER.call(this);
      //this.event_condChanged.call(this)
    }
  });

  //
  // State labels
  //

 /**
  * Label that reacts on master node state changes.
  * @class
  */
  var State = Class(NodeLabel, {
    className: namespace + '.State',

    template: stateTemplate,

    listen: {
      owner: {
        stateChanged: HANDLER
      }
    }
  });

 /**
  * Label that shows only when delegate node in processing state.
  * @class
  */
  var Processing = Class(State, {
    className: namespace + '.Processing',

    template: processingTemplate,
    content: 'Processing...',

    visibilityGetter: function(owner){
      return owner.state == STATE.PROCESSING;
    }
  });

 /**
  * @class
  */
  var Error = Class(State, {
    className: namespace + '.Error',

    template: errorTemplate,
    content: 'Error',

    visibilityGetter: function(owner){
      return owner.state == STATE.ERROR;
    }
  })

  //
  // Node dataSource labels
  //

 /**
  * @class
  */
  var DataSourceLabel = Class(NodeLabel, {
    className: namespace + '.DataSourceState',

    template: stateTemplate,

    listen: {
      owner: {
        dataSourceChanged: function(){
          this.syncOwnerDataSource();
        }
      }
    },

    ownerDataSource: null,

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      this.syncOwnerDataSource();
    },

    event_ownerDataSourceChanged: createEvent('ownerDataSourceChanged', 'node', 'oldOwnerDataSource') && function(node, oldOwnerDataSource){
      event.ownerDataSourceChanged.call(this, node, oldOwnerDataSource);

      HANDLER.call(this);
    },

    syncOwnerDataSource: function(){
      var newOwnerDataSource = this.owner && this.owner.dataSource;

      if (this.ownerDataSource != newOwnerDataSource)
      {
        var oldOwnerDataSource = this.ownerDataSource;
        var listenHandler = this.listen.ownerDataSource;

        this.ownerDataSource = newOwnerDataSource;

        if (listenHandler)
        {
          if (oldOwnerDataSource)
            oldOwnerDataSource.removeHandler(listenHandler, this);

          if (newOwnerDataSource)
            newOwnerDataSource.addHandler(listenHandler, this);
        }

        this.event_ownerDataSourceChanged(this, oldOwnerDataSource);
      }
    }
  });

 /**
  * @class
  */
  var DataSourceState = Class(DataSourceLabel, {
    className: namespace + '.DataSourceState',

    template: stateTemplate,

    listen: {
      ownerDataSource: {
        stateChanged: HANDLER
      }
    }
  });

 /**
  * Label that shows only when owner's dataSource in processing state.
  * @class
  */
  var DataSourceProcessing = Class(DataSourceState, {
    className: namespace + '.DataSourceProcessing',

    content: 'Processing...',
    template: processingTemplate,

    visibilityGetter: function(owner){
      return owner.dataSource && owner.dataSource.state == STATE.PROCESSING;
    }
  });

 /**
  * Label that shows only when owner's dataSource in error state.
  * @class
  */
  var DataSourceError = Class(DataSourceState, {
    className: namespace + '.DataSourceProcessing',

    content: 'Error',
    template: errorTemplate,

    visibilityGetter: function(owner){
      return owner.dataSource && owner.dataSource.state == STATE.ERROR;
    }
  });

 /**
  * @class
  */
  var DataSourceItemCount = Class(DataSourceLabel, {
    className: namespace + '.DataSourceItemCount',

    listen: {
      ownerDataSource: {
        stateChanged: HANDLER,
        datasetChanged: HANDLER
      }
    }
  });

 /**
  * @class
  */
  var DataSourceEmpty = Class(DataSourceItemCount, {
    className: namespace + '.DataSourceEmpty',

    content: 'Empty',
    visibilityGetter: function(owner){ 
      return owner.dataSource && owner.dataSource.state == STATE.READY && !owner.dataSource.itemCount;
    }
  });


  //
  // Child nodes count labels
  //

 /**
  * @class
  */
  var ChildNodesCount = Class(NodeLabel, {
    className: namespace + '.ChildCount',

    listen: {
      owner: {
        stateChanged: HANDLER,
        childNodesModified: HANDLER
      }
    },

    template:
      '<div class="Basis-Label Basis-Label-Count">{caption|}</div>'
  });

 /**
  * Label that shows only when owner has no child nodes.
  * @class
  */
  var Empty = Class(ChildNodesCount, {
    className: namespace + '.Empty',

    content: 'Empty',
    visibilityGetter: function(owner){ 
      return owner.state == STATE.READY && !owner.firstChild;
    }
  });


  //
  // export names
  //

  basis.namespace(namespace).extend({
    NodeLabel: NodeLabel,
    State: State,
    //ObjectState: ObjectState,
    Processing: Processing,
    Error: Error,

    DataSourceLabel: DataSourceLabel,
    DataSourceState: DataSourceState,
    DataSourceProcessing: DataSourceProcessing,
    DataSourceError: DataSourceError,

    DataSourceItemCount: DataSourceItemCount,
    DataSourceEmpty: DataSourceEmpty,

    ChildNodesCount: ChildNodesCount,
    Empty: Empty
  });

}(basis);