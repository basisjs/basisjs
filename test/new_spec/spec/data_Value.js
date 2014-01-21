module.exports = {
  name: 'basis.data.Value',

  html: resource('../env.html').url,
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
        this.is(val, testValue.value);
        this.is(val, t.saved);

        // not fire on existing testValue set
        t.saved = 0;
        testValue.set(val);
        this.is(val, testValue.value);
        this.is(0, t.saved);
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
        this.is(val, testValue.value);
        this.is(val, t.saved);

        var testValue = new basis.data.Value({ value: 123 });
        var t = {};
        var val = Math.random();
        testValue.link(t, function(val){ this.saved = val * 2; });
        testValue.set(val);
        this.is(val, testValue.value);
        this.is(val * 2, t.saved);
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

        this.is(null, testValue.links_);
        this.is(null, object.handler);

        testValue.link(object, object.testMethod);
        this.is(1, object.xxx);
        this.is(true, object.handler !== null);
        this.is(true, testValue.links_.context === object);
        this.is(null, testValue.links_.links_);

        testValue.unlink(object);
        this.is(null, object.handler);
        this.is(null, testValue.links_);

        testValue.link(object, object.testMethod);
        testValue.link(object, function(testValue){ this.xxx = testValue });
        this.is(true, testValue.links_.context === object);
      }
    },
    {
      name: 'linked testValue and emitter should correct reset links',
      test: function(){
        // destroy linked object
        var testValue = new basis.data.Value({ value: 1 });
        var object = new basis.data.Object();
        testValue.link(object, function(){});
        this.is(true, !!object.handler);
        this.is(true, !!testValue.links_);

        object.destroy();
        this.is(null, object.handler);
        this.is(null, testValue.links_);

        // destroy testValue with link to emitter
        var testValue = new basis.data.Value({ value: 1 });
        var object = new basis.data.Object();
        testValue.link(object, function(){});

        testValue.destroy();
        this.is(null, object.handler);
        this.is(null, testValue.links_);
      }
    },
    {
      name: 'value should be set to null if value instanceof basis.event.Emitter',
      test: function(){
        var emitter = new basis.event.Emitter;
        var testValue = new basis.data.Value({ value: emitter });

        this.is(true, testValue.value === emitter);
        this.is(true, !!emitter.handler);

        emitter.destroy();
        this.is(null, testValue.value);
        this.is(null, emitter.handler);
      }
    },
    {
      name: 'value should correct add/remove handler on value if value instanceof basis.event.Emitter',
      test: function(){
        var emitter = new basis.event.Emitter;
        var testValue = new basis.data.Value({ value: null });

        this.is(null, emitter.handler);
        this.is(null, testValue.value);

        testValue.set(emitter);
        this.is(true, !!emitter.handler);
        this.is(true, testValue.value === emitter);

        testValue.set(null);
        this.is(null, emitter.handler);
        this.is(null, testValue.value);
      }
    },
    {
      name: 'Value#as',
      test: function(){
        var testValue = new basis.data.Value();
        var fn = function(){};
        var a = testValue.as(fn);
        var b = testValue.as(fn);

        this.is(true, a instanceof basis.Token);
        this.is(true, a === b);

        ///////

        var testValue = new basis.data.Value();
        var fn = function(){};
        var a = testValue.as(fn, true);
        var b = testValue.as(fn, true);

        this.is(true, a instanceof basis.DeferredToken);
        this.is(true, a === b);

        ///////

        var testValue = new basis.data.Value();
        var a = testValue.as(function(){});
        var b = testValue.as(function(){});

        this.is(true, a instanceof basis.Token);
        this.is(true, a === b);

        ///////

        var testValue = new basis.data.Value({ value: 3 });
        var fn = function(v){
          return v * v;
        };
        var a = testValue.as(fn);
        var b = testValue.as(basis.fn.$self);

        this.is(true, a !== b);
        this.is(9, a.value);
        this.is(3, b.value);

        testValue.set(4);

        this.is(16, a.value);
        this.is(4, b.value);
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

        this.is(0, changeCount);
        this.is(1, testValue.value);
        this.is(true, testValue.locked === false);

        testValue.lock();
        testValue.set(2);

        this.is(0, changeCount);
        this.is(2, testValue.value);
        this.is(true, testValue.locked === true);

        testValue.unlock();
        this.is(1, changeCount);
        this.is(2, testValue.value);
        this.is(true, testValue.locked === false);
        this.is(true, testValue.lockValue_ === null);
      }
    }
  ]
};
