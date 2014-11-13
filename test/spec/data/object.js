module.exports = {
  name: 'basis.data.Object',

  init: function(){
    var DataObject = basis.require('basis.data').Object;
    var isConnected = basis.require('basis.data').isConnected;
    var Value = basis.require('basis.data').Value;
    var STATE = basis.require('basis.data').STATE;
    var SUBSCRIPTION = basis.require('basis.data').SUBSCRIPTION;
    var PROXY = basis.require('basis.data').PROXY;

    (function(){
      var proto = DataObject.prototype;
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
                var a = new DataObject({ target: true });
                var b = new DataObject({
                  delegate: a,
                  listen: {
                    delegate: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    }
                  }
                });
                var c = new DataObject({
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

                a.setState(STATE.READY, 'ok');
                assert(String(STATE.READY), String(c.state));
                assert(c.state.data === 'ok');
                assert(c.delegate === b);
                assert(c.target === a);
                assert(c.root === a);

                a.destroy();
                assert(String(STATE.READY), String(c.state));
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
            assert(isConnected(objectC, objectA));

            objectA.setDelegate(objectC);
            assert(objectA.delegate === objectC);
            assert(isConnected(objectC, objectA));
            assert(isConnected(objectC, objectB));
            assert(isConnected(objectB, objectA) === false);
            assert(isConnected(objectB, objectC) === false);
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
              state: STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate(this);
                }
              }
            });
            var delegate = new DataObject({
              state: STATE.UNDEFINED
            });

            assert(eventCount(delegate, 'stateChanged') === 0);

            object.setState(STATE.READY);

            assert(eventCount(delegate, 'stateChanged') === 1);
          }
        },
        {
          name: 'delegates removed on stateChanged should not recieve stateChanged event',
          test: function(){
            var object = new DataObject({
              state: STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate();
                }
              }
            });
            var delegate = new DataObject({
              state: STATE.UNDEFINED,
              delegate: object
            });

            assert(eventCount(delegate, 'stateChanged') === 0);

            object.setState(STATE.READY);

            assert(eventCount(delegate, 'stateChanged') === 0);
          }
        },
        {
          name: 'resolveObject',
          test: [
            {
              name: 'use Value with null as value on init',
              test: function(){
                var value = new Value();
                var delegate = new DataObject({
                  state: STATE.READY,
                  delegate: value
                });
                var object = new DataObject({
                  delegate: value,
                  state: STATE.UNDEFINED,
                  data: { bar: 1 }
                });

                assert(delegate.delegate === null);
                assert(delegate.state == STATE.READY);
                assert({}, delegate.data);
                assert(eventCount(delegate, 'update') === 0);
                assert(eventCount(delegate, 'stateChanged') === 0);

                assert(object.delegate === null);
                assert(object.state == STATE.UNDEFINED);
                assert({ bar: 1 }, object.data);
                assert(eventCount(object, 'update') === 0);
                assert(eventCount(object, 'stateChanged') === 0);

                assert(object.state !== delegate.state);
                assert(object.data !== delegate.data);

                delegate.setDelegate(null);
                assert(eventCount(delegate, 'update') === 0);
                assert(eventCount(delegate, 'stateChanged') === 0);

                delegate.update({ foo: 1 });
                delegate.setState(STATE.PROCESSING);
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
                var delegate = new DataObject({
                  state: STATE.READY,
                  data: { foo: 1 }
                });
                var value = new Value({ value: delegate });
                var object = new DataObject({
                  delegate: value,
                  state: STATE.UNDEFINED,
                  data: { bar: 1 }
                });

                assert(object.delegate === delegate);
                assert(object.state == STATE.READY);
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
            },
            {
              name: 'set the same value should does nothing',
              test: function(){
                var object = new DataObject();
                var foo = new DataObject();
                var value = new Value({
                  value: foo
                });

                object.setDelegate(value);
                assert(object.delegate === foo);
                assert(object.delegateAdapter_ != null);
                assert(object.delegateAdapter_ && object.delegateAdapter_.source === value);

                var adapter = object.delegateAdapter_;
                object.setDelegate(value);
                assert(object.delegate === foo);
                assert(object.delegateAdapter_ === adapter);
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
        },

        // TODO: move to abstract.js
        {
          name: 'active',
          test: [
            {
              name: 'create',
              test: [
                {
                  name: 'by default active = false',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      delegate: target
                    });

                    assert(obj.active === false);
                    assert(target.subscriberCount === 0);
                    assert(eventCount(obj, 'activeChanged') === 0);
                  }
                },
                {
                  name: 'active = false',
                  test: function(){
                    var values = [
                      false,
                      new basis.Token(false),
                      new basis.data.Value({ value: false })
                    ];

                    for (var i = 0; i < values.length; i++)
                    {
                      var target = new DataObject();
                      var obj = new DataObject({
                        active: values[i],
                        delegate: target
                      });

                      assert(obj.active === false);
                      assert(eventCount(obj, 'activeChanged') === 0);
                      assert(target.subscriberCount === 0);
                    }
                  }
                },
                {
                  name: 'active = true',
                  test: function(){
                    var values = [
                      true,
                      new basis.Token(true),
                      new basis.data.Value({ value: true })
                    ];

                    for (var i = 0; i < values.length; i++)
                    {
                      var target = new DataObject();
                      var obj = new DataObject({
                        active: values[i],
                        delegate: target
                      });

                      assert(obj.active === true);
                      assert(eventCount(obj, 'activeChanged') === 0);
                      assert(target.subscriberCount === 1);
                    }
                  }
                },
                {
                  name: 'active = proxy',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      active: PROXY,
                      delegate: target
                    });
                    var trigger = new DataObject({
                      delegate: obj
                    });

                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 0);
                    assert(target.subscriberCount === 0);

                    trigger.setActive(true);
                    assert(obj.active === true);
                    assert(eventCount(obj, 'activeChanged') === 1);
                    assert(target.subscriberCount === 1);

                    trigger.setActive(false);
                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 2);
                    assert(target.subscriberCount === 0);
                  }
                }
              ]
            },
            {
              name: 'change',
              test: [
                {
                  name: 'simple',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      delegate: target
                    });

                    obj.setActive(true);
                    assert(obj.active === true);
                    assert(target.subscriberCount === 1);
                    assert(eventCount(obj, 'activeChanged') === 1);

                    obj.setActive(false);
                    assert(obj.active === false);
                    assert(target.subscriberCount === 0);
                    assert(eventCount(obj, 'activeChanged') === 2);
                  }
                },
                {
                  name: 'same value should do nothing (default)',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      delegate: target
                    });

                    obj.setActive(false);
                    assert(obj.active === false);
                    assert(target.subscriberCount === 0);
                    assert(eventCount(obj, 'activeChanged') === 0);
                  }
                },
                {
                  name: 'same value should do nothing',
                  test: function(){
                    var values = [
                      false,
                      new basis.Token(false),
                      new basis.data.Value({ value: false }),
                      true,
                      new basis.Token(true),
                      new basis.data.Value({ value: true }),
                      PROXY
                    ];

                    for (var i = 0; i < values.length; i++)
                    {
                      var value = values[i];
                      var target = new DataObject();
                      var obj = new DataObject({
                        active: value,
                        delegate: target
                      });

                      var active = obj.active;
                      var subscriberCount = target.subscriberCount;

                      obj.setActive(value);
                      assert(target.subscriberCount === subscriberCount);
                      assert(obj.active === active);
                      assert(eventCount(obj, 'activeChanged') === 0);
                    }
                  }
                },
                {
                  name: 'active = proxy from passive trigger',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      delegate: target
                    });
                    var trigger = new DataObject({
                      active: false,
                      delegate: obj
                    });

                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 0);
                    assert(target.subscriberCount === 0);

                    obj.setActive(PROXY);
                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 0);
                    assert(target.subscriberCount === 0);

                    trigger.setActive(true);
                    assert(obj.active === true);
                    assert(eventCount(obj, 'activeChanged') === 1);
                    assert(target.subscriberCount === 1);

                    obj.setActive(true);
                    trigger.setActive(false);
                    assert(obj.active === true);
                    assert(eventCount(obj, 'activeChanged') === 1);
                    assert(target.subscriberCount === 1);
                  }
                },
                {
                  name: 'active = proxy from active trigger',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      delegate: target
                    });
                    var trigger = new DataObject({
                      active: true,
                      delegate: obj
                    });

                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 0);
                    assert(target.subscriberCount === 0);

                    obj.setActive(PROXY);
                    assert(obj.active === true);
                    assert(eventCount(obj, 'activeChanged') === 1);
                    assert(target.subscriberCount === 1);

                    obj.setActive(true);
                    trigger.setActive(false);
                    assert(obj.active === true);
                    assert(eventCount(obj, 'activeChanged') === 1);
                    assert(target.subscriberCount === 1);

                    obj.setActive(false);
                    assert(obj.active === false);
                    assert(eventCount(obj, 'activeChanged') === 2);
                    assert(target.subscriberCount === 0);
                  }
                }
              ]
            },
            {
              name: 'destroy',
              test: [
                {
                  name: 'should clean up adapter',
                  test: function(){
                    var obj = new DataObject({
                      active: new basis.Token
                    });

                    assert(obj.active_ != null);

                    obj.destroy();

                    assert(obj.active_ == null);
                  }
                },
                {
                  name: 'destroy active obj',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      active: true,
                      delegate: target
                    });

                    assert(obj.active === true);
                    assert(target.subscriberCount === 1);

                    obj.destroy();
                    assert(target.subscriberCount === 0);
                  }
                },
                {
                  name: 'destroy active trigger when obj has active = proxy',
                  test: function(){
                    var target = new DataObject();
                    var obj = new DataObject({
                      active: PROXY,
                      delegate: target
                    });
                    var trigger = new DataObject({
                      active: true,
                      delegate: obj
                    });

                    assert(obj.active === true);
                    assert(target.subscriberCount === 1);

                    trigger.destroy();
                    assert(obj.active === false);
                    assert(target.subscriberCount === 0);
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
