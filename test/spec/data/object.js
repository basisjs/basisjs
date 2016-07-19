module.exports = {
  name: 'basis.data.Object',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var DataObject = basis.require('basis.data').Object;
    var isConnected = basis.require('basis.data').isConnected;
    var Value = basis.require('basis.data').Value;
    var STATE = basis.require('basis.data').STATE;
    var PROXY = basis.PROXY;

    var helpers = basis.require('./helpers/events.js').createAPI(DataObject);
    var eventCount = helpers.eventCount;
    var getLastEvent = helpers.getLastEvent;

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
                assert(object.delegateRA_ != null);
                assert(object.delegateRA_ && object.delegateRA_.source === value);

                var adapter = object.delegateRA_;
                object.setDelegate(value);
                assert(object.delegate === foo);
                assert(object.delegateRA_ === adapter);
              }
            }
          ]
        }
      ]
    }
  ]
};
