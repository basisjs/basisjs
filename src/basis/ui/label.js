
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

  var LISTEN = basis.event.LISTEN;
  var STATE = basis.data.STATE;
  var DELEGATE = basis.dom.wrapper.DELEGATE;


  var getter = Function.getter;
  var createEvent = basis.event.create;
  var events = basis.event.events;

  var Class = basis.Class;
  var DOM = basis.dom;
  var cssom = basis.cssom;

  var UINode = basis.ui.Node;


  //
  // main part
  //

  var stateTemplate = resource('templates/label/state.tmpl');
  var processingTemplate = resource('templates/label/processing.tmpl');
  var errorTemplate = resource('templates/label/error.tmpl');
  var countTemplate = resource('templates/label/count.tmpl');
  var emptyTemplate = resource('templates/label/empty.tmpl');

  //
  // NodeLabel
  //

  var condChangedTrigger = function(){
    this.event_condChanged();
  };

 /**
  * Base class for all labels.
  * @class
  */
  var NodeLabel = Class(UINode, {
    className: namespace + '.NodeLabel',

    template: resource('templates/label/label.tmpl'),
    content: null,

    visibilityGetter: Function.$true,
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
      //this.event_condChanged.call()
    }/*,

    init: function(){
      UINode.prototype.init.call(this);
      condChangedTrigger.call(this);
    }*/
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

    template: stateTemplate,

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
