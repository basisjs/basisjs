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

  (function(){

   /**
    * @namespace Basis.Controls.Label
    */

    var namespace = 'Basis.Controls.Label';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;
    var Template = Basis.Html.Template;

    var getter = Function.getter;

    var createBehaviour = Basis.EventObject.createBehaviour;
    var nsWrappers = Basis.DOM.Wrapper;
    var STATE = Basis.Data.STATE;


    //
    // Main part
    //

    var stateTemplate = new Template(
      '<div{element|content} class="Basis-Label-State"/>'
    );
    var processingTemplate = new Template(
      '<div{element|content} class="Basis-Label-Processing"/>'
    );

    //
    // NodeLabel
    //

   /**
    * Base class for all labels.
    * @class
    */
    var NodeLabel = Class(nsWrappers.HtmlNode, {
      className: namespace + '.NodeLabel',

      cascadeDestroy: true,

      show_: false,
      visible_: false,
      visibilityGetter: Function.$false,

      defaultContent: '[no text]',

      behaviour: {
        delegateChanged: function(object, oldDelegate){
          var newContainer = oldDelegate ? oldDelegate.element == this.container : !this.container;
          if (newContainer)
            this.setContainer(this.delegate && this.delegate.element);
        }
      },

      init: function(config){
        config = config || {};

        if (config.container)
        {
          this.container = config.container;
          delete config.container;
        }

        if (!config.content)
          config.content = this.defaultContent;

        if (config.visibilityGetter)
          this.visibilityGetter = getter(config.visibilityGetter);

        config = this.inherit(config);

        this.traceChanges_();

        return config;
      },

      traceChanges_: function(){
        if (this.container && this.visible_)
        {
          if (this.container != this.element.parentNode)
            DOM.insert(this.container, this.tmpl.element);
        }
        else
          DOM.remove(this.element);
      },

      setContainer: function(container){
        if (this.container != container)
        {
          this.container = container;
          this.traceChanges_()
        }
      },
      setVisibility: function(visible){
        if (this.visible_ != visible)
        {
          this.visible_ = visible;
          this.traceChanges_();
          this.dispatch('visibilityChanged', this.visible_);
        }
      },

      destroy: function(){
        delete this.container;
        this.inherit();
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

      behaviour: {
        stateChanged: function(object, oldState){
          this.setVisibility(this.visibilityGetter(this.state, oldState));
        }
      },

      template: stateTemplate,

      init: function(config){
        if (config)
        {
          if (config.visibleStates && !config.visibilityGetter)
          {
            var map = {};
            for (var state, i = 0; state = config.visibleStates[i++];)
              map[state] = true;
            config.visibilityGetter = getter(Function.$self, map);
          }
        }

        return this.inherit(config);
      }
    });

   /**
    * Label that shows only when delegate node in processing state.
    * @class
    */
    var Processing = Class(State, {
      className: namespace + '.Processing',

      visibilityGetter: function(newState){ return newState == STATE.PROCESSING },
      defaultContent: 'Processing...',
      template: processingTemplate
    });

    //
    // Node collection state label
    //

    var CollectionState_CollectionHandler = {
      stateChanged: function(object, oldState){
        this.setVisibility(this.visibilityGetter(object.state, oldState));
      }
    };

    var CollectionState_DelegateHandler = {
      collectionChanged: function(object, oldCollection){
        if (oldCollection)
          oldCollection.removeHandler(CollectionState_CollectionHandler, this);

        if (object.collection)
        {
          object.collection.addHandler(CollectionState_CollectionHandler, this);
          CollectionState_CollectionHandler.stateChanged.call(this, object.collection, object.collection.state);
        }
      }
    };

   /**
    * @class
    */
    var CollectionState = Class(State, {
      className: namespace + '.CollectionState',

      behaviour: createBehaviour(NodeLabel, {
        delegateChanged: function(object, oldDelegate){
          this.inherit(object, oldDelegate);

          if (oldDelegate)
            oldDelegate.removeHandler(CollectionState_DelegateHandler, this);

          if (this.delegate)
          {
            this.delegate.addHandler(CollectionState_DelegateHandler, this);
            CollectionState_DelegateHandler.collectionChanged.call(this, this.delegate, oldDelegate && oldDelegate.collection);
          }
        }
      }),
      template: stateTemplate
    });

   /**
    * Label that shows only when delegate's collection in processing state.
    * @class
    */
    var CollectionProcessing = Class(CollectionState, {
      className: namespace + '.CollectionProcessing',

      visibilityGetter: function(newState){ return newState == STATE.PROCESSING },
      defaultContent: 'Processing...',
      template: processingTemplate
    });

    //
    // Child nodes count labels
    //

    var CHILD_COUNT_FUNCTION = function(){
      this.setVisibility(this.visibilityGetter(this.delegate ? this.delegate.childNodes.length : 0, this.delegate));
    };

    var ChildCount_CollectionHandler = {
      stateChanged: function(object, oldState){
        this.setVisibility(this.visibilityGetter(object.itemCount, this.delegate));
      }
    };

    var ChildCount_DelegateHandler = {
      childNodesModified: CHILD_COUNT_FUNCTION,
      collectionStateChanged: CHILD_COUNT_FUNCTION,
      stateChanged: CHILD_COUNT_FUNCTION,

      collectionChanged: function(object, oldCollection){
        if (oldCollection)
          oldCollection.removeHandler(ChildCount_CollectionHandler, this);

        if (object.collection)
        {
          object.collection.addHandler(ChildCount_CollectionHandler, this);
          ChildCount_CollectionHandler.stateChanged.call(this, object.collection, object.collection.state);
        }
      }
    };

   /**
    * @class
    */
    var ChildCount = Class(NodeLabel, {
      className: namespace + '.ChildCount',

      behaviour: {
        delegateChanged: function(object, oldDelegate){
          this.inherit(object, oldDelegate);

          if (oldDelegate)
            oldDelegate.removeHandler(ChildCount_DelegateHandler, this);

          if (this.delegate)
          {
            this.delegate.addHandler(ChildCount_DelegateHandler, this);
            ChildCount_DelegateHandler.collectionChanged.call(this, this.delegate);
          }

          CHILD_COUNT_FUNCTION.call(this);
        }
      },
      template: new Template(
        '<div{element|content} class="Basis-CountLabel"/>'
      )
    });

   /**
    * @class
    */
    var IsEmpty = Class(ChildCount, {
      className: namespace + '.IsEmpty',

      visibilityGetter: function(childCount, object){ 
        return !childCount && (object.collection ? object.collection.state : object.state) == STATE.READY;
      },
      defaultContent: 'Empty'
    })

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      NodeLabel: NodeLabel,
      State: State,
      Processing: Processing,
      CollectionState: CollectionState,
      CollectionProcessing: CollectionProcessing,
      ChildCount: ChildCount,
      IsEmpty: IsEmpty
    });

  })();