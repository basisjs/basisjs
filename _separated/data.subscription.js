/**
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
    * Extend Basis.Data namespace with subscription scheme.
    *
    * Namespace overview:
    *
    * @namespace Basis.Data
    */
    var namespace = Basis.namespace('Basis.Data');

    // CONST
    
    var subscriptionType_ = String('subscriptionType');
    var isActiveSubscriber_ = String('isActiveSubscriber');

    var subscriptionHandlers = {};
    var subscriptionSeed = 1;

    var SUBSCRIPTION = {
      NONE: 0,
      MASK: 0
    };

    //
    // MAIN PART
    //

    function regSubscription(name, handler, action){
      subscriptionHandlers[subscriptionSeed] = {
        handler: handler,
        action: action,
        context: {
          add: function(thisObject, object){
            if (object)
            {
              var subscriberId = SUBSCRIPTION[name] + '_' + thisObject.eventObjectId;
              if (!object.subscribers_[subscriberId])
              {
                object.subscribers_[subscriberId] = thisObject;
                object.subscriberCount += 1;
                object.dispatch('subscribersChanged');
              }
            }
          },
          remove: function(thisObject, object){
            if (object)
            {
              var subscriberId = SUBSCRIPTION[name] + '_' + thisObject.eventObjectId;
              if (object.subscribers_[subscriberId])
              {
                delete object.subscribers_[subscriberId];
                object.subscriberCount -= 1;
                object.dispatch('subscribersChanged');
              }
            }
          }
        }
      };

      SUBSCRIPTION[name] = subscriptionSeed;
      SUBSCRIPTION.MASK |= subscriptionSeed;

      subscriptionSeed <<= 1;
    }

    //
    // Default subscriptions
    //

    regSubscription(
      'DELEGATE',
      {
        delegateChanged: function(object, oldDelegate){
          this.remove(object, oldDelegate);
          this.add(object, object.delegate);
        }
      },
      function(action, object){
        action(object, object.delegate);
      }
    );

    regSubscription(
      'COLLECTION',
      {
        collectionChanged: function(object, oldCollection){
          this.remove(object, oldCollection);
          this.add(object, object.collection);
        }
      },
      function(action, object){
        action(object, object.collection);
      }
    );

    regSubscription(
      'SOURCE',
      {
        sourcesChanged: function(object, delta){
          if (delta.inserted)
            for (var i = 0, source; source = delta.inserted[i]; i++)
              this.add(object, source);

          if (delta.deleted)
            for (var i = 0, source; source = delta.deleted[i]; i++)
              this.remove(object, source);
        }
      },
      function(action, object){
        for (var i = 0, source; source = object.sources[i]; i++)
          action(object, source);
      }
    );

    function applySubscription(object, mask, state){
      var idx = 1;
      var config;

      while (mask)
      {
        if (mask & 1)
        {
          config = subscriptionHandlers[idx];
          if (state & idx)
          {
            object.addHandler(config.handler, config.context);
            config.action(config.context.add, object);
          }
          else
          {
            object.removeHandler(config.handler, config.context);
            config.action(config.context.remove, object);
          }
        }
          
        mask >>= 1;
        idx <<= 1;
      }
    }

    // 

   /**
    * Extend DataObject.prototype
    * @namespace Basis.Data.DataObject.prototype
    */

    var DataObjectProto = namespace.DataObject.prototype;

    Object.extend(DataObjectProto, {
     /**
      * Count of subscribed objects. This property can use to determinate
      * is data update necessary or not. Usualy if object is in UNDEFINED
      * or DEPRECATED state and subscriberCount more than zero - update needed.
      * @type {number}
      */
      subscriberCount: 0,

     /**
      * Subscribers list. Using to prevent subscriber dublicate count.
      * @type {Object}
      */
      subscribers_: null,

     /**
      * Indicates if object influence to related objects (his delegate or/and
      * collection) or not.
      * @type {boolean}
      */
      isActiveSubscriber: false,

     /**
      * Subscriber type indicates what sort of influence has currency object on
      * related objects (delegate, collection).
      * @type {Basis.Data.SUBSCRIPTION|number}
      */
      subscriptionType: SUBSCRIPTION.DELEGATE | SUBSCRIPTION.COLLECTION,
      
     /**
      * Set new value for isActiveSubscriber property.
      * @param {boolean} isActive New value for {Basis.Data.DataObject#isActiveSubscriber} property.
      * @return {boolean} Returns true if {Basis.Data.DataObject#isActiveSubscriber} was changed.
      */
      setIsActiveSubscriber: function(isActive){
        isActive = !!isActive;

        if (this[isActiveSubscriber_] != isActive)
        {
          this[isActiveSubscriber_] = isActive;
          this.dispatch('isActiveStateChanged');

          applySubscription(this, this[subscriptionType_], SUBSCRIPTION.MASK * isActive);

          return true;
        }

        return false;
      },

     /**
      * Set new value for subscriptionType property.
      * @param {number} subscriptionType New value for {Basis.Data.DataObject#subscriptionType} property.
      * @return {boolean} Returns true if {Basis.Data.DataObject#subscriptionType} was changed.
      */
      setSubscriptionType: function(subscriptionType){
        var curSubscriptionType = this[subscriptionType_];
        var newSubscriptionType = subscriptionType & SUBSCRIPTION.MASK;
        var delta = curSubscriptionType ^ newSubscriptionType;

        if (delta)
        {
          this[subscriptionType_] = newSubscriptionType;

          if (this[isActiveSubscriber_])
            applySubscription(this, delta, newSubscriptionType);

          return true;
        }

        return false;
      }
    });

    var init_ = DataObjectProto.init.method;
    var destroy_ = DataObjectProto.destroy.method;

    DataObjectProto.init.method = function(config){
      init_.apply(this, arguments);

      this.subscribers_ = {};

      if (config)
      {
        if (!isNaN(config[subscriptionType_]))
          this[subscriptionType_] = config[subscriptionType_];

        if (typeof config[isActiveSubscriber_] == 'boolean')
          this[isActiveSubscriber_] = config[isActiveSubscriber_];
      }
      
      if (this[isActiveSubscriber_])
        applySubscription(this, this[subscriptionType_], SUBSCRIPTION.MASK);
    };

    DataObjectProto.destroy.method = function(){
      if (this[isActiveSubscriber_])
        applySubscription(this, this[subscriptionType_], 0);

      destroy_.apply(this, arguments);
    };

   /**
    * @namepspace Basis.Data.AggregateDataset.prototype
    */

    Object.extend(namespace.AggregateDataset.prototype, {
      subscriptionType: SUBSCRIPTION.SOURCE
    });

    //
    // export names
    //

    namespace.extend({
      SUBSCRIPTION: SUBSCRIPTION,
      regSubscription: regSubscription
    });

  })();