module.exports = {
  name: 'basis.data.Object',

  init: function(){
    basis.require('basis.event');
    basis.require('basis.data');

    var nsData = basis.data;
    var DataObject = nsData.Object;

    (function(){
      var proto = basis.data.Object.prototype;
      var eventsMap = {};
      var seed = 1;
      var eventTypeFilter = function(event){
        return event.type == this;
      };

      proto.debug_emit = function(event){
        if (!this.testEventId_)
        {
          this.testEventId_ = seed++;
          eventsMap[this.testEventId_] = [];
        }

        eventsMap[this.testEventId_].push(event);
      };

      window.getEvents = function(object, type){
        var events = eventsMap[object.testEventId_];

        if (events && type)
          events = events.filter(eventTypeFilter, type);

        return events;
      };

      window.eventCount = function(object, type){
        var events = getEvents(object, type);

        return events ? events.length : 0;
      };

      window.getLastEvent = function(object, type){
        var events = getEvents(object, type);

        return events && events[events.length - 1];
      };
    })();

    function checkObject(object){

      if (object.delegate)
      {
        var chain = [];
        var cursor = object;
        while (cursor.delegate && cursor.delegate !== cursor)
        {
          cursor = cursor.delegate;
          chain.unshift(cursor);
        }

        var target = null;
        var root = chain[0];

        for (var i = 0, chainObject; chainObject = chain[i]; i++)
        {
          if (chainObject === chainObject.target)
            target = chainObject.target;

          if (chainObject.data !== object.data)
            return 'Data are not equal in chain (' + (i + 1) + ')';

          if (chainObject.state !== object.state)
            return 'States are not equal in chain (' + (i + 1) + ')';

          if (chainObject.root !== root)
            return 'Wrong root reference in chain (' + (i + 1) + ')';

          if (chainObject.target !== target)
            return 'Wrong target referece in chain (' + (i + 1) + ')';
        }

        if (object.root !== root)
          return 'Wrong root reference';
      }
      else
      {
        if (object.root !== object)
          return 'root must point to it self';
        if (object.target !== null)
          return 'target must point to it self';
      }

      return false;
    }
  },

  test: [
    {
      name: 'construct',
      test: [
        {
          name: 'simple create',
          test: function(){
            var objectA = new DataObject;
            assert({}, objectA.data);
            assert(eventCount(objectA) === 0);

            var objectB = new DataObject({ data: { a: 1, b: 2 } });
            assert({ a: 1, b: 2 }, objectB.data);
            assert(eventCount(objectB) === 0);
            assert(eventCount(objectB) === 0);
          }
        },
        {
          name: 'create with delegate',
          test: function(){
            var objectA = new DataObject({ data: { a: 1, b: 2 } });
            var objectB = new DataObject({ data: { a: 3, b: 4 }, delegate: objectA });
            assert({ a: 1, b: 2 }, objectA.data);
            assert({ a: 1, b: 2 }, objectB.data);
            assert(objectA.data === objectB.data);
            assert(objectA.state === objectB.state);
            assert(eventCount(objectA) === 0);
            assert(eventCount(objectB, 'update') === 0);
            assert(eventCount(objectB, 'delegateChanged') === 1);

            assert(checkObject(objectA) === false);
            assert(checkObject(objectB) === false);

            objectB.setDelegate();
            assert({ a: 1, b: 2 }, objectB.data);
            assert(eventCount(objectB, 'update') === 0);
            assert(checkObject(objectA) === false);
            assert(checkObject(objectB) === false);
          }
        }
      ]
    },
    {
      name: 'delegate subsystem',
      test: [
        {
          name: 'set delegate',
          test: [
            {
              name: 'set delegate #1',
              test: function(){
                var a = new DataObject({ data: { a: 1, b: 2 } });
                var b = new DataObject({ data: { b: 2, c: 3 } });

                assert(eventCount(b, 'update') === 0);

                b.setDelegate(a);
                assert(eventCount(b, 'update') === 1);
                assert({ a: undefined, c: 3 }, getLastEvent(b, 'update').args[0]);
              }
            },
            {
              name: 'set delegate #2',
              test: function(){
                var objectA = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });

                objectA.setDelegate(objectB); // no update event
                assert({ a: 1, b: 2, c: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 0);
                assert(eventCount(objectB, 'update') === 0);

                objectA.setDelegate(objectC);
                assert({ x: 1, y: 2, z: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 1);
                assert({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectA, 'update').args[0]);

                objectA.setDelegate(objectB);
                assert({ a: 1, b: 2, c: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 2);
                assert({ a: undefined, b: undefined, c: undefined, x: 1, y: 2, z: 3 }, getLastEvent(objectA, 'update').args[0]);

                objectA.setDelegate();
                assert({ a: 1, b: 2, c: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 2);
              }
            },
            {
              name: 'set delegate #3',
              test: function(){
                var objectA = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });
                // data tested in previous test, see above

                objectA.setDelegate(objectB);
                assert(objectA.delegate === objectB);
                assert({ a: 1, b: 2, c: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 0);
                assert(eventCount(objectA, 'delegateChanged') === 1);
                assert(checkObject(objectA) === false);
                assert(checkObject(objectB) === false);

                objectB.setDelegate(objectC);
                assert(true, objectB.delegate === objectC);
                assert({ x: 1, y: 2, z: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 1);
                assert({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectA, 'update').args[0]);
                assert(eventCount(objectA, 'delegateChanged') === 1);
                assert(checkObject(objectA) === false);
                assert(checkObject(objectB) === false);
                assert(checkObject(objectC) === false);

                objectB.setDelegate();
                assert(objectB.delegate == null);
                assert({ x: 1, y: 2, z: 3 }, objectA.data);
                assert(objectB.data !== objectC.data);
                assert(eventCount(objectA, 'update') === 1);
                assert(eventCount(objectA, 'delegateChanged') === 1);
                assert(eventCount(objectB, 'delegateChanged') === 2);
                assert(checkObject(objectA) === false);
                assert(checkObject(objectB) === false);
                assert(checkObject(objectC) === false);

                objectA.setDelegate();
                assert(objectA.delegate == null);
                assert({ x: 1, y: 2, z: 3 }, objectA.data);
                assert(eventCount(objectA, 'update') === 1);
                assert(eventCount(objectA, 'delegateChanged') === 2);
                assert(checkObject(objectA) === false);
                assert(checkObject(objectB) === false);
              }
            },
            {
              name: 'set delegate #4',
              test: function(){
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });
                // data tested in previous test, see above

                objectB.setDelegate(objectC);
                assert(objectB.delegate === objectC);
                assert({ x: 1, y: 2, z: 3 }, objectB.data);
                assert(eventCount(objectB, 'update') === 1);
                assert({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectB, 'update').args[0]);
                assert(eventCount(objectB, 'delegateChanged') === 1);

                objectB.setDelegate('not a delegate');
                assert(objectB.delegate === null);
                assert({ x: 1, y: 2, z: 3 }, objectB.data);
                assert(eventCount(objectB, 'update') === 1);
                assert(eventCount(objectB, 'delegateChanged') === 2);

                objectB.setDelegate('not a delegate #2');
                assert(objectB.delegate === null);
                assert({ x: 1, y: 2, z: 3 }, objectB.data);
                assert(eventCount(objectB, 'update') === 1);
                assert(eventCount(objectB, 'delegateChanged') === 2);

                objectB.setDelegate(objectC);
                assert(objectB.delegate === objectC);
                assert({ x: 1, y: 2, z: 3 }, objectB.data);
                assert(eventCount(objectB, 'update') === 1);
                assert(eventCount(objectB, 'delegateChanged') === 3);
              }
            },
            {
              name: 'destroy',
              test: function(){
                var destroyCatched = 0;
                var a = new basis.data.Object({ target: true });
                var b = new basis.data.Object({
                  delegate: a,
                  listen: {
                    delegate: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    }
                  }
                });
                var c = new basis.data.Object({
                  delegate: b,
                  listen: {
                    root: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    },
                    target: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    }
                  }
                });

                a.setState(basis.data.STATE.READY, 'ok');
                assert(String(basis.data.STATE.READY), String(c.state));
                assert(c.state.data === 'ok');
                assert(c.delegate === b);
                assert(c.target === a);
                assert(c.root === a);

                a.destroy();
                assert(String(basis.data.STATE.READY), String(c.state));
                assert(c.state.data === 'ok');
                assert(c.target === null);
                assert(c.root === b);
                assert(b.delegate === null);
                assert(destroyCatched === 3);
              }
            }
          ]
        },
        {
          name: 'sets with no data',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject;

            assert(eventCount(objectA, 'update') === 0); // should be no update events

            objectA.setDelegate(objectB); // no update event
            assert(objectA.delegate === objectB);
            assert(objectA.data === objectB.data);
            assert({}, objectA.data);

            assert(eventCount(objectA, 'update') === 0); // should be no update events

            objectA.setDelegate(); // no update event
            assert(objectA.delegate === null);
            assert(objectA.data !== objectB.data);
            assert({}, objectA.data);

            assert(eventCount(objectA, 'update') === 0); // should be no update events
          }
        },
        {
          name: 'set as delegate connected objects',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject;
            var objectC = new DataObject;

            objectA.setDelegate(objectB);
            assert(objectA.delegate === objectB);

            objectB.setDelegate(objectC);
            assert(objectB.delegate === objectC);

            objectC.setDelegate(objectA); // should be ignored
            assert(objectC.delegate === null);
            assert(basis.data.isConnected(objectC, objectA));

            objectA.setDelegate(objectC);
            assert(objectA.delegate === objectC);
            assert(basis.data.isConnected(objectC, objectA));
            assert(basis.data.isConnected(objectC, objectB));
            assert(basis.data.isConnected(objectB, objectA) === false);
            assert(basis.data.isConnected(objectB, objectC) === false);
          }
        },
        {
          name: 'delegate drop should not affect other storing delegates (issue #12)',
          test: function(){
            var a = new DataObject;
            var b = new DataObject;
            var c = new DataObject;

            a.setDelegate(c);
            b.setDelegate(c);
            var delegates = c.debug_delegates();
            assert(delegates.length === 2);
            assert(basis.array.has(delegates, a) === true);
            assert(basis.array.has(delegates, b) === true);

            a.setDelegate();
            var delegates = c.debug_delegates();
            assert(delegates.length === 1);
            assert(basis.array.has(delegates, a) === false);
            assert(basis.array.has(delegates, b) === true);
          }
        },
        {
          name: 'delegates added on update should recieve just one update event',
          test: function(){
            var delegateEventCount = 0;
            var object = new DataObject({
              handler: {
                update: function(){
                  delegate.setDelegate(this);
                }
              }
            });
            var delegate = new DataObject({
              handler: {
                update: function(){
                  delegateEventCount++;
                }
              }
            });

            assert(eventCount(delegate, 'update') === 0);

            object.update({ foo: 1 });

            assert(eventCount(delegate, 'update') === 1);
          }
        },
        {
          name: 'delegates removed on update should not recieve update event',
          test: function(){
            var object = new DataObject({
              handler: {
                update: function(){
                  delegate.setDelegate();
                }
              }
            });
            var delegate = new DataObject({
              delegate: object
            });

            assert(eventCount(delegate, 'update') === 0);

            object.update({ foo: 1 });

            assert(eventCount(delegate, 'update') === 0);
          }
        },
        {
          name: 'delegates added on stateChanged should recieve just one stateChanged event',
          test: function(){
            var object = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate(this);
                }
              }
            });
            var delegate = new DataObject({
              state: basis.data.STATE.UNDEFINED
            });

            assert(eventCount(delegate, 'stateChanged') === 0);

            object.setState(basis.data.STATE.READY);

            assert(eventCount(delegate, 'stateChanged') === 1);
          }
        },
        {
          name: 'delegates removed on stateChanged should not recieve stateChanged event',
          test: function(){
            var object = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate();
                }
              }
            });
            var delegate = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              delegate: object
            });

            assert(eventCount(delegate, 'stateChanged') === 0);

            object.setState(basis.data.STATE.READY);

            assert(eventCount(delegate, 'stateChanged') === 0);
          }
        },
        {
          name: 'resolveObject',
          test: [
            {
              name: 'use Value with null as value on init',
              test: function(){
                var value = new basis.data.Value();
                var delegate = new basis.data.Object({
                  state: basis.data.STATE.READY,
                  delegate: value
                });
                var object = new basis.data.Object({
                  delegate: value,
                  state: basis.data.STATE.UNDEFINED,
                  data: { bar: 1 }
                });

                assert(delegate.delegate === null);
                assert(delegate.state == basis.data.STATE.READY);
                assert({}, delegate.data);
                assert(eventCount(delegate, 'update') === 0);
                assert(eventCount(delegate, 'stateChanged') === 0);

                assert(object.delegate === null);
                assert(object.state == basis.data.STATE.UNDEFINED);
                assert({ bar: 1 }, object.data);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);

                assert(object.state !== delegate.state);
                assert(object.data !== delegate.data);

                delegate.setDelegate(null);
                assert(eventCount(delegate, 'update') === 0);
                assert(eventCount(delegate, 'stateChanged') === 0);

                delegate.update({ foo: 1 });
                delegate.setState(basis.data.STATE.PROCESSING);
                assert(eventCount(delegate, 'update') === 1);
                assert(eventCount(delegate, 'stateChanged') === 1);

                // set object to value should set delegate for object
                value.set(delegate);
                assert(object.delegate === delegate);
                assert(object.data === delegate.data);
                assert(object.state === delegate.state);
                assert(eventCount(object, 'update') === 1);
                assert(eventCount(object, 'stateChanged') === 1);
                assert(eventCount(delegate, 'update') === 1);
                assert(eventCount(delegate, 'stateChanged') === 1);
              }
            },
            {
              name: 'use Value with Object as value on init',
              test: function(){
                var delegate = new basis.data.Object({
                  state: basis.data.STATE.READY,
                  data: { foo: 1 }
                });
                var value = new basis.data.Value({ value: delegate });
                var object = new basis.data.Object({
                  delegate: value,
                  state: basis.data.STATE.UNDEFINED,
                  data: { bar: 1 }
                });

                assert(object.delegate === delegate);
                assert(object.state == basis.data.STATE.READY);
                assert({ foo: 1 }, object.data);
                assert(eventCount(object, 'delegateChanged') === 1);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);
                assert(object.data === delegate.data);
                assert(object.state === delegate.state);

                // reset value should drop delegate on object
                value.set();
                assert(object.delegate === null);
                assert(object.data !== delegate.data);
                assert(object.state === delegate.state);
                assert(eventCount(object, 'delegateChanged') === 2);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);
                assert(eventCount(delegate, 'update') === 0);
                assert(eventCount(delegate, 'stateChanged') === 0);

                // changes in old delegate doesn't affect object
                delegate.update({ foo: 2 });
                assert(eventCount(delegate, 'update') === 1);
                assert(object.delegate === null);
                assert(object.data !== delegate.data);
                assert(object.state === delegate.state);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);

                // drop resolve adapter
                object.setDelegate();
                assert(object.delegate === null);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);

                // now changes in value doesn't affect object
                value.set(delegate);
                assert(object.delegate === null);
                assert(eventCount(object, 'delegateChanged') === 2);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'subscription subsystem',
      test: [
        {
          name: '(delegate) during creation',
          test: function(){
            var objectA = new DataObject;
            new DataObject({
              delegate: objectA,
              active: true,
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE
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
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE
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
              subscribeTo: nsData.SUBSCRIPTION.NONE
            });

            assert(objectA.subscriberCount === 0);
            assert(eventCount(objectA, 'subscribersChanged') === 0);

            objectB.setDelegate(objectA);

            assert(objectA.subscriberCount === 0);
            assert(eventCount(objectA, 'subscribersChanged') === 0);

            // switch on
            objectB.setSubscription(nsData.SUBSCRIPTION.DELEGATE);

            assert(objectA.subscriberCount === 1);
            assert(eventCount(objectA, 'subscribersChanged') === 1);

            // nothing changed
            objectB.setSubscription(nsData.SUBSCRIPTION.DELEGATE);

            assert(objectA.subscriberCount === 1);
            assert(eventCount(objectA, 'subscribersChanged') === 1);

            // switch off
            objectB.setSubscription(nsData.SUBSCRIPTION.NONE);

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
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE,
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
    }
  ]
};
