module.exports = {
  name: 'basis.data.Value',

  init: function(){
    var Value = basis.require('basis.data').Value;
    var AbstractData = basis.require('basis.data').AbstractData;
    var DataObject = basis.require('basis.data').Object;
    var resolveValue = basis.require('basis.data').resolveValue;
    var ResolveAdapter = basis.require('basis.data').ResolveAdapter;

    function catchWarnings(fn){
      var warn = basis.dev.warn;
      var warnings = [];

      try {
        basis.dev.warn = function(message){
          warnings.push(message);
        };

        fn();
      } finally {
        basis.dev.warn = warn;
      }

      return warnings.length ? warnings : false;
    }
  },

  test: [
    {
      name: 'basis.data.Value',
      test: [
        {
          name: 'create',
          test: function(){
            var testValue = new Value({ value: 123 });
            this.is(123, testValue.value);
          }
        },
        {
          name: 'set #1',
          test: function(){
            var testValue = new Value({ value: 123 });
            var t = {};
            var val = 777;

            testValue.link(t, 'saved');
            testValue.set(val);
            assert(testValue.value === val);
            assert(t.saved === val);

            // not fire on existing testValue set
            t.saved = 0;
            testValue.set(val);
            assert(testValue.value === val);
            assert(t.saved === 0);
          }
        },
        {
          name: 'set #2',
          test: function(){
            var testValue = new Value({ value: 123 });
            var t = {};
            var val = Math.random();

            testValue.link(t, 'saved');
            testValue.set(val);
            assert(testValue.value === val);
            assert(t.saved === val);

            var testValue = new Value({ value: 123 });
            var t = {};
            var val = Math.random();
            testValue.link(t, function(val){ this.saved = val * 2; });
            testValue.set(val);
            assert(testValue.value === val);
            assert(t.saved === val * 2);
          }
        },
        {
          name: 'link/unlink',
          test: function(){
            var testValue = new Value({ value: 1 });
            var object = new basis.data.Object({
              testMethod: function(testValue){
                this.xxx = testValue;
              }
            });

            assert(testValue.links_ === null);
            assert(object.handler === null);

            testValue.link(object, object.testMethod);
            assert(object.xxx === 1);
            assert(object.handler !== null);
            assert(testValue.links_.context === object);
            assert(testValue.links_.links_ === null);

            testValue.unlink(object);
            assert(object.handler === null);
            assert(testValue.links_ === null);

            testValue.link(object, object.testMethod);
            testValue.link(object, function(testValue){ this.xxx = testValue; });
            assert(testValue.links_.context === object);
          }
        },
        {
          name: 'linked testValue and emitter should correct reset links',
          test: function(){
            // destroy linked object
            var testValue = new Value({ value: 1 });
            var object = new basis.data.Object();
            testValue.link(object, function(){});
            assert(object.handler !== null);
            assert(testValue.links_ !== null);

            object.destroy();
            assert(object.handler === null);
            assert(testValue.links_ === null);

            // destroy testValue with link to emitter
            var testValue = new Value({ value: 1 });
            var object = new basis.data.Object();
            testValue.link(object, function(){});

            testValue.destroy();
            assert(object.handler === null);
            assert(testValue.links_ === null);
          }
        },
        {
          name: 'value should be set to null if value instanceof basis.event.Emitter',
          test: function(){
            var emitter = new basis.event.Emitter;
            var testValue = new Value({ value: emitter });

            assert(testValue.value === emitter);
            assert(emitter.handler !== null);

            emitter.destroy();
            assert(testValue.value === null);
            assert(emitter.handler === null);
          }
        },
        {
          name: 'value should correct add/remove handler on value if value instanceof basis.event.Emitter',
          test: function(){
            var emitter = new basis.event.Emitter;
            var testValue = new Value({ value: null });

            assert(emitter.handler === null);
            assert(testValue.value === null);

            testValue.set(emitter);
            assert(emitter.handler !== null);
            assert(testValue.value === emitter);

            testValue.set(null);
            assert(emitter.handler === null);
            assert(testValue.value === null);
          }
        },
        {
          name: 'Value#as',
          test: [
            {
              name: 'result for same function should be equal',
              test: function(){
                var testValue = new Value();
                var fn = function(){};
                var a = testValue.as(fn);
                var b = testValue.as(fn);

                assert(a instanceof basis.Token);
                assert(a === b);
              }
            },
            {
              name: 'result for same function and deferred should be equal',
              test: function(){
                var testValue = new Value();
                var fn = function(){};
                var a = testValue.as(fn, true);
                var b = testValue.as(fn, true);

                assert(a instanceof basis.DeferredToken);
                assert(a === b);
              }
            },
            {
              name: 'result for different functions but the same source code should be the same',
              test: function(){
                var testValue = new Value();
                var a = testValue.as(function(){});
                var b = testValue.as(function(){});

                assert(a instanceof basis.Token);
                assert(a === b);
              }
            },
            {
              name: 'result for getters should be the same',
              test: function(){
                var testValue = new Value();
                var a = testValue.as(basis.getter('data.foo'));
                var b = testValue.as(basis.getter('data.bar'));
                var c = testValue.as(basis.getter('data.foo'));

                assert(a instanceof basis.Token);
                assert(b instanceof basis.Token);
                assert(c instanceof basis.Token);
                assert(a !== b);
                assert(a === c);
              }
            },
            {
              name: 'common case',
              test: function(){
                var testValue = new Value({ value: 3 });
                var fn = function(v){
                  return v * v;
                };
                var a = testValue.as(fn);
                var b = testValue.as(basis.fn.$self);

                assert(a !== b);
                assert(a.value === 9);
                assert(b.value === 3);

                testValue.set(4);

                assert(a.value === 16);
                assert(b.value === 4);
              }
            }
          ]
        },
        {
          name: 'Value#lock/unlock',
          test: function(){
            var changeCount = 0;
            var testValue = new Value({
              value: 1,
              handler: {
                change: function(){
                  changeCount++;
                }
              }
            });

            assert(changeCount === 0);
            assert(testValue.value === 1);
            assert(testValue.isLocked() === false);

            testValue.lock();
            testValue.set(2);

            assert(changeCount === 0);
            assert(testValue.value === 2);
            assert(testValue.isLocked() === true);

            testValue.unlock();
            assert(changeCount === 1);
            assert(testValue.value === 2);
            assert(testValue.isLocked() === false);
            assert(testValue.lockedValue_ === null);

            testValue.lock();
            assert(testValue.lockedValue_ === 2);
            testValue.unlock();
            assert(testValue.value === 2);
            assert(testValue.isLocked() === false);
            assert(testValue.lockedValue_ === null);
          }
        },
        {
          name: 'multiple Value#lock/unlock',
          test: function(){
            var changeCount = 0;
            var testValue = new Value({
              value: 1,
              handler: {
                change: function(){
                  changeCount++;
                }
              }
            });

            assert(testValue.isLocked() === false);

            testValue.lock();
            testValue.lock();
            testValue.unlock();

            assert(testValue.isLocked() === true);

            testValue.unlock();
            assert(testValue.isLocked() === false);

            testValue.unlock();
            assert(testValue.isLocked() === false);

            testValue.unlock();
            assert(testValue.isLocked() === false);

            testValue.lock();
            assert(testValue.isLocked() === true);

            testValue.unlock();
            assert(testValue.isLocked() === false);
          }
        },
        {
          name: 'Value.from',
          test: [
            {
              name: 'value destroy -> unlink from source',
              test: function(){
                var obj = new basis.data.Object();
                var value = basis.data.Value.from(obj, null, 'basisObjectId');

                assert(obj.debug_handlers().length == 1);

                assert(catchWarnings(function(){
                  value.destroy();
                }) == false);

                assert(obj.debug_handlers().length == 0);
                assert(value !== basis.data.Value.from(obj, null, 'basisObjectId'));
              }
            },
            {
              name: 'source destroy -> value destroy',
              test: function(){
                var obj = new basis.data.Object();
                var value = basis.data.Value.from(obj, null, 'basisObjectId');
                var destroyCount = 0;

                value.addHandler({
                  destroy: function(){
                    destroyCount++;
                  }
                });

                assert(catchWarnings(function(){
                  obj.destroy();
                }) == false);
                assert(destroyCount == 1);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'resolveValue',
      test: [
        {
          name: 'value is not a basis.data.Value or bb-value',
          test: function(){
            var log = [];
            var obj = {
              log: function(value){
                log.push(value);
              }
            };

            var values = [
              {},
              [],
              123,
              true,
              new AbstractData,
              new DataObject
            ];

            for (var i = 0; i < values.length; i++)
            {
              var value = values[i];
              var resolveResult = resolveValue(obj, obj.log, value, 'test');
              assert(resolveResult === value);
              assert('test' in obj == false);
              assert([], log);
            }
          }
        },
        {
          name: 'value is basis.data.Value',
          test: function(){
            var log = [];
            var obj = {
              log: function(value){
                log.push(value);
              }
            };
            var foo = {};
            var bar = {};
            var value = new Value({ value: foo });
            var resolveResult = resolveValue(obj, obj.log, value, 'test');
            var adapter = obj.test;

            assert(resolveResult === foo);
            assert(obj.test instanceof ResolveAdapter);
            assert([], log);

            // set new value to source
            value.set(bar);
            assert(resolveResult === foo);
            assert(obj.test instanceof ResolveAdapter);
            assert(obj.test === adapter);
            assert([value], log);

            // resolveValue does nothing
            log = [];
            resolveResult = resolveValue(obj, obj.log, value, 'test');
            assert(resolveResult === bar);
            assert(obj.test instanceof ResolveAdapter);
            assert(obj.test === adapter);
            assert([], log);

            // reset value
            log = [];
            resolveResult = resolveValue(obj, obj.log, null, 'test');
            assert(resolveResult === null);
            assert(obj.test === null);
            assert([], log);
          }
        },
        {
          name: 'destroy ',
          test: function(){
            var foo = {};
            var log = [];
            var obj = {
              log: function(value){
                if (value === foo)
                  this.test = null;
                log.push(value);
              }
            };

            var value = new Value({ value: foo });
            var resolveResult;

            // set again
            resolveResult = resolveValue(obj, obj.log, value, 'test');
            assert(resolveResult === foo);
            assert(obj.test instanceof ResolveAdapter);
            assert([], log);

            // destroy source
            value.destroy();
            assert(obj.test === null);
            assert([foo], log);
          }
        },
        {
          name: 'destroy resolved Value should left value as is',
          test: function(){
            var value = new Value({ value: true });
            var obj = new AbstractData({
              active: value
            });

            assert(obj.active === true);
            assert(obj.active_ instanceof ResolveAdapter);

            // destroy source
            value.destroy();
            assert(obj.active === true);
            assert(obj.active_ === null);
          }
        },
        {
          name: 'destroy nested resolved Value should left value as is',
          test: function(){
            var foo = new Value({ value: true });
            var bar = new Value({ value: foo });
            var obj = new AbstractData({
              active: bar
            });

            assert(obj.active === true);
            assert(obj.active_ instanceof ResolveAdapter);

            // destroy source
            bar.destroy();
            assert(obj.active === true);
            assert(obj.active_ === null);
          }
        },
        {
          name: 'destroy resolved Value of resolved Value should set to null',
          test: function(){
            var foo = new Value({ value: true });
            var bar = new Value({ value: foo });
            var obj = new AbstractData({
              active: bar
            });

            assert(obj.active === true);
            assert(obj.active_ instanceof ResolveAdapter);

            // destroy source
            foo.destroy();
            assert(bar.value === null);
            assert(obj.active === false);
            assert(obj.active_ instanceof ResolveAdapter);

            bar.destroy();
            assert(obj.active === false);
            assert(obj.active_ === null);
          }
        }
      ]
    }
  ]
};
