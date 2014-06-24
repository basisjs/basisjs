module.exports = {
  name: 'basis.data.Value',

  init: function(){
    basis.require('basis.data');
  },

  test: [
    {
      name: 'create',
      test: function(){
        var testValue = new basis.data.Value({ value: 123 });
        this.is(123, testValue.value);
      }
    },
    {
      name: 'set #1',
      test: function(){
        var testValue = new basis.data.Value({ value: 123 });
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
        var testValue = new basis.data.Value({ value: 123 });
        var t = {};
        var val = Math.random();

        testValue.link(t, 'saved');
        testValue.set(val);
        assert(testValue.value === val);
        assert(t.saved === val);

        var testValue = new basis.data.Value({ value: 123 });
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
        var testValue = new basis.data.Value({ value: 1 });
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
        var testValue = new basis.data.Value({ value: 1 });
        var object = new basis.data.Object();
        testValue.link(object, function(){});
        assert(object.handler !== null);
        assert(testValue.links_ !== null);

        object.destroy();
        assert(object.handler === null);
        assert(testValue.links_ === null);

        // destroy testValue with link to emitter
        var testValue = new basis.data.Value({ value: 1 });
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
        var testValue = new basis.data.Value({ value: emitter });

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
        var testValue = new basis.data.Value({ value: null });

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
      test: function(){
        var testValue = new basis.data.Value();
        var fn = function(){};
        var a = testValue.as(fn);
        var b = testValue.as(fn);

        assert(a instanceof basis.Token);
        assert(a === b);

        ///////

        var testValue = new basis.data.Value();
        var fn = function(){};
        var a = testValue.as(fn, true);
        var b = testValue.as(fn, true);

        assert(a instanceof basis.DeferredToken);
        assert(a === b);

        ///////

        var testValue = new basis.data.Value();
        var a = testValue.as(function(){});
        var b = testValue.as(function(){});

        assert(a instanceof basis.Token);
        assert(a !== b);

        ///////

        var testValue = new basis.data.Value({ value: 3 });
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
    },
    {
      name: 'Value#lock/unlock',
      test: function(){
        var changeCount = 0;
        var testValue = new basis.data.Value({
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
        var testValue = new basis.data.Value({
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
    }
  ]
};
