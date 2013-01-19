
  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.data');
  basis.require('basis.dom.wrapper');
  basis.require('basis.ui');


 /**
  * @see ./demo/defile/label.html
  * @namespace basis.ui.label
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var cssom = basis.cssom;

  var LISTEN = basis.event.LISTEN;
  var STATE = basis.data.STATE;
  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var getter = basis.getter;
  var createEvent = basis.event.create;
  var events = basis.event.events;

  var UINode = basis.ui.Node;


  //
  // definitions
  //

  var templates = basis.template.define(namespace, {
    base: resource('templates/label/label.tmpl'),
    state: resource('templates/label/state.tmpl'),
    processing: resource('templates/label/processing.tmpl'),
    error: resource('templates/label/error.tmpl'),
    count: resource('templates/label/count.tmpl'),
    empty: resource('templates/label/empty.tmpl')
  });


  //
  // main part
  //

  var condChangedTrigger = function(){
    this.event_condChanged();
  };

 /**
  * Base class for labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    template: templates.base,
    content: null,

    visibilityGetter: basis.fn.$true,
    visible: null,

    insertPoint: function(owner){
      return owner.tmpl.content || owner.element;
    },

    event_visibilityChanged: createEvent('visibilityChanged') && function(){
      events.visibilityChanged.call(this);

      if (this.insertPoint)
      {
        if (this.visible)
        {
          var insertPoint = typeof this.insertPoint == 'function' ? this.insertPoint(this.owner) : this.insertPoint;
          var params = Array.isArray(insertPoint) ? insertPoint : [insertPoint];
          params.splice(1, 0, this.element);
          DOM.insert.apply(null, params);
        }
        else
          DOM.remove(this.element);
      }
      else
        cssom.display(this.element, this.visible);
    },

    event_condChanged: createEvent('condChanged') && function(){
      events.condChanged.call(this);

      var visible = this.owner ? !!this.visibilityGetter(this.owner) : false;

      if (this.visible !== visible)
      {
        this.visible = visible;
        this.event_visibilityChanged();
      }
    },

    event_ownerChanged: function(oldOwner){
      UINode.prototype.event_ownerChanged.call(this, oldOwner);

      condChangedTrigger.call(this);
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

    template: templates.state,

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

    template: templates.processing,
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

    template: templates.error,
    content: 'Error',

    visibilityGetter: function(owner){
      return owner.state == STATE.ERROR;
    }
  });


  //
  // Node dataSource labels
  //

  function syncOwnerDataSource(){
    var newOwnerDataSource = this.owner && this.owner.dataSource;

    var oldOwnerDataSource = this.ownerDataSource;
    if (oldOwnerDataSource != newOwnerDataSource)
    {
      this.ownerDataSource = newOwnerDataSource;
      this.event_ownerDataSourceChanged(oldOwnerDataSource);
    }
  }

  LISTEN.add('ownerDataSource', 'ownerDataSourceChanged');

 /**
  * @class
  */
  var DataSourceLabel = Class(NodeLabel, {
    className: namespace + '.DataSourceLabel',

    template: templates.state,

    listen: {
      owner: {
        dataSourceChanged: function(){
          syncOwnerDataSource.call(this);
        }
      }
    },

    ownerDataSource: null,

    event_ownerChanged: function(oldOwner){
      UINode.prototype.event_ownerChanged.call(this, oldOwner);

      syncOwnerDataSource.call(this);
    },

    event_ownerDataSourceChanged: createEvent('ownerDataSourceChanged', 'oldOwnerDataSource') && function(oldOwnerDataSource){
      events.ownerDataSourceChanged.call(this, oldOwnerDataSource);

      condChangedTrigger.call(this);
    }
  });

 /**
  * @class
  */
  var DataSourceState = Class(DataSourceLabel, {
    className: namespace + '.DataSourceState',

    template: templates.state,

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
    template: templates.processing,

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
    template: templates.error,

    visibilityGetter: function(owner){
      return owner.dataSource && owner.dataSource.state == STATE.ERROR;
    }
  });

 /**
  * @class
  */
  var DataSourceItemCount = Class(DataSourceLabel, {
    className: namespace + '.DataSourceItemCount',

    template: templates.count,
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

    template: templates.empty,
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

    template: templates.count,
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

    template: templates.empty,
    content: 'Empty',

    visibilityGetter: function(owner){ 
      return owner.state == STATE.READY && !owner.firstChild;
    }
  });


  //
  // export names
  //

  module.exports = {
    // Owner
    NodeLabel: NodeLabel,

    // Owner state
    State: State,
    Processing: Processing,
    Error: Error,

    // Owner dataSource
    DataSourceLabel: DataSourceLabel,

    // Owner dataSource state
    DataSourceState: DataSourceState,
    DataSourceProcessing: DataSourceProcessing,
    DataSourceError: DataSourceError,

    // Owner dataSource items
    DataSourceItemCount: DataSourceItemCount,
    DataSourceEmpty: DataSourceEmpty,

    // Owner childNodes
    ChildNodesCount: ChildNodesCount,
    Empty: Empty
  };
