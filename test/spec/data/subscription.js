module.exports = {
  name: 'subscription subsystem',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var DataObject = basis.require('basis.data').Object;
    var STATE = basis.require('basis.data').STATE;
    var SUBSCRIPTION = basis.require('basis.data').SUBSCRIPTION;

    var helpers = basis.require('./helpers/events.js').createAPI(DataObject);
    var eventCount = helpers.eventCount;
  },

  test: [
    {
      name: '(delegate) during creation',
      test: function(){
        var objectA = new DataObject;
        new DataObject({
          delegate: objectA,
          active: true,
          subscribeTo: SUBSCRIPTION.DELEGATE
        });

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);
      }
    },
    {
      name: '(delegate) switch on/off via active',
      test: function(){
        var objectA = new DataObject;
        var objectB = new DataObject({
          active: false,
          subscribeTo: SUBSCRIPTION.DELEGATE
        });

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 0);

        objectB.setDelegate(objectA);

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 0);

        // switch on
        objectB.setActive(true);

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);

        // nothing changed
        objectB.setActive(true);

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);

        // switch off
        objectB.setActive(false);

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 2);
      }
    },
    {
      name: '(delegate) switch on/off via subscribeTo',
      test: function(){
        var objectA = new DataObject;
        var objectB = new DataObject({
          active: true,
          subscribeTo: SUBSCRIPTION.NONE
        });

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 0);

        objectB.setDelegate(objectA);

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 0);

        // switch on
        objectB.setSubscription(SUBSCRIPTION.DELEGATE);

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);

        // nothing changed
        objectB.setSubscription(SUBSCRIPTION.DELEGATE);

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);

        // switch off
        objectB.setSubscription(SUBSCRIPTION.NONE);

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 2);
      }
    },
    {
      name: '(delegate) unsubscribe on destroy',
      test: function(){
        var objectA = new DataObject;
        var objectB = new DataObject({
          active: true,
          subscribeTo: SUBSCRIPTION.DELEGATE,
          delegate: objectA
        });

        assert(objectA.subscriberCount === 1);
        assert(eventCount(objectA, 'subscribersChanged') === 1);

        objectB.destroy();

        assert(objectA.subscriberCount === 0);
        assert(eventCount(objectA, 'subscribersChanged') === 2);
      }
    }
  ]
};
