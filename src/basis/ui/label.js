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
  var countTemplate = '<div class="Basis-Label Basis-Label-Count">{count}</div>';
  var emptyTemplate = '<div class="Basis-Label Basis-Label-Empty"/>';

  //
  // NodeLabel
  //

  var condChangedTrigger = function(){
    this.event_condChanged(this);
  };

 /**
  * Base class for all labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    template: '<div class="Basis-Label"/>',
    content: null,

    visibilityGetter: Function.$true,
    visible: null,

    insertPoint: function(){
      return this.owner ? this.owner.tmpl.content || this.owner.element : null;
    },

    event_visibilityChanged: createEvent('visibilityChanged', 'node') && function(node){
      event.visibilityChanged.call(this, node);

      if (this.insertPoint)
      {
        if (this.visible)
        {
          var insertPoint = typeof this.insertPoint == 'function' ? this.insertPoint() : this.insertPoint;
          var params = Array.isArray(insertPoint) ? insertPoint : [insertPoint];
          params.splice(1, 0, this.element);
          DOM.insert.apply(null, params);
        }
        else
          DOM.remove(this.element);
      }
      else
        DOM.display(this.element, this.visible);
    },

    event_condChanged: createEvent('condChanged', 'node') && function(node){
      event.condChanged.call(this, node);

      var visible = this.owner ? !!this.visibilityGetter(this.owner) : false;

      if (this.visible !== visible)
      {
        this.visible = visible;
        this.event_visibilityChanged(this);
      }
    },

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      condChangedTrigger.call(this);
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
        stateChanged: condChangedTrigger
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

  function syncOwnerDataSource(){
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

 /**
  * @class
  */
  var DataSourceLabel = Class(NodeLabel, {
    className: namespace + '.DataSourceState',

    template: stateTemplate,

    listen: {
      owner: {
        dataSourceChanged: function(){
          syncOwnerDataSource.call(this);
        }
      }
    },

    ownerDataSource: null,

    event_ownerChanged: function(node, oldOwner){
      UINode.prototype.event_ownerChanged.call(this, node, oldOwner);

      syncOwnerDataSource.call(this);
    },

    event_ownerDataSourceChanged: createEvent('ownerDataSourceChanged', 'node', 'oldOwnerDataSource') && function(node, oldOwnerDataSource){
      event.ownerDataSourceChanged.call(this, node, oldOwnerDataSource);

      condChangedTrigger.call(this);
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
        stateChanged: condChangedTrigger
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

    template: countTemplate,
    listen: {
      ownerDataSource: {
        stateChanged: condChangedTrigger,
        datasetChanged: condChangedTrigger
      }
    }
  });

 /**
  * @class
  */
  var DataSourceEmpty = Class(DataSourceItemCount, {
    className: namespace + '.DataSourceEmpty',

    template: emptyTemplate,
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

    template: countTemplate,
    listen: {
      owner: {
        stateChanged: condChangedTrigger,
        childNodesModified: condChangedTrigger
      }
    }
  });

 /**
  * Label that shows only when owner has no child nodes.
  * @class
  */
  var Empty = Class(ChildNodesCount, {
    className: namespace + '.Empty',

    template: emptyTemplate,
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