/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
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
    var Data = Basis.Data;
    var Template = Basis.Html.Template;

    var nsWrapers = Basis.DOM.Wrapers;

    //
    // NodeLabel
    //

   /**
    * Base class for all labels.
    * @class
    */
    var NodeLabel = Class(nsWrapers.HtmlPanel, { className: namespace + '.NodeLabel',
      cascadeDestroy: true,

      show_: false,
      visible_: false,
      visibilityGetter: Function.$false,

      defaultContent: '[no text]',

      behaviour: nsWrapers.createBehaviour(nsWrapers.HtmlPanel, {
        delegateChanged: function(object, oldDelegate){
          var newContainer = oldDelegate ? oldDelegate.element == this.container : !this.container;
          if (newContainer)
            this.setContainer(this.delegate && this.delegate.element);
        }
      }),

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
          this.visibilityGetter = Data(config.visibilityGetter);

        config = this.inherit(config);

        this.traceChanges_();

        return config;
      },

      traceChanges_: function(){
        if (this.container && this.visible_)
        {
          if (this.container != this.element.parentNode)
            DOM.insert(this.container, this.element);
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
    var State = Class(NodeLabel, { className: namespace + '.State',

      behaviour: nsWrapers.createBehaviour(NodeLabel, {
        stateChanged: function(object, newState, oldState, stateData){
          this.setVisibility(this.visibilityGetter(newState, oldState));
        }
      }),

      init: function(config){
        if (config)
        {
          if (config.visibleStates && !config.visibilityGetter)
          {
            var map = {};
            for (var state, i = 0; state = config.visibleStates[i++];)
              map[state] = true;
            config.visibilityGetter = Data(Function.$self, map);
          }
        }

        return this.inherit(config);
      }
    });

   /**
    * Label that shows only when delegate node in processing state.
    * @class
    */
    var Processing = Class(State, { className: namespace + '.Processing',
      visibilityGetter: function(newState){ return newState == nsWrapers.STATE.PROCESSING },
      defaultContent: 'Processing...'
    });

    //
    // Node collection state label
    //

    var CollectionState_CollectionHandler = {
      stateChanged: function(object, newState, oldState, stateData){
        this.setVisibility(this.visibilityGetter(newState, oldState));
        this.dispatch('collectionStateChanged', object, newState, oldState, stateData);
      }
    };

    var CollectionState_DelegateHandler = {
      collectionChanged: function(object, oldCollection){
        if (oldCollection)
          oldCollection.removeHandler(CollectionState_CollectionHandler, this);

        if (object.collection)
        {
          object.collection.addHandler(CollectionState_CollectionHandler, this);
          CollectionState_CollectionHandler.stateChanged.call(this, object.collection, object.collection.state, object.collection.state);
        }
      }
    };

   /**
    * @class
    */
    var CollectionState = Class(State, { className: namespace + '.CollectionState',
      behaviour: nsWrapers.createBehaviour(NodeLabel, {
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
      })
    });

   /**
    * Label that shows only when delegate's collection in processing state.
    * @class
    */
    var CollectionProcessing = Class(CollectionState, { className: namespace + '.CollectionProcessing',
      visibilityGetter: function(newState){ return newState == nsWrapers.STATE.PROCESSING },
      defaultContent: 'Processing...'
    });

    //
    // Child nodes count labels
    //

   /**
    * @class
    */
    var ChildCount = Class(NodeLabel, { className: namespace + '.ChildCount',
      behaviour: nsWrapers.createBehaviour(NodeLabel, {
        childNodesModified: function(object, delta){
          this.setVisibility(this.visibilityGetter(object.childNodes.length, object, delta));
        }
      })
    });

   /**
    * @class
    */
    var IsEmpty = Class(ChildCount, { className: namespace + '.IsEmpty',
      visibilityGetter: function(childCount){ return !childCount },
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