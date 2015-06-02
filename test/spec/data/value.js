module.exports = {
  name: 'basis.data.Value',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var Emitter = basis.require('basis.event').Emitter;
    var Value = basis.require('basis.data').Value;
    var AbstractData = basis.require('basis.data').AbstractData;
    var DataObject = basis.require('basis.data').Object;
    var resolveValue = basis.require('basis.data').resolveValue;
    var ResolveAdapter = basis.require('basis.data').ResolveAdapter;
    var ReadOnlyValue = basis.require('basis.data').ReadOnlyValue;
    var DeferredValue = basis.require('basis.data').DeferredValue;

    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
  },

  test: [
    {
      name: 'basis.data.Value',
      test: [
        {
          name: 'create',
          test: function(){
            var testValue = new Value({ value: 123 });
            assert(testValue.value === 123);
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
            var object = new DataObject({
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
            var object = new DataObject();
            testValue.link(object, function(){});
            assert(object.handler !== null);
            assert(testValue.links_ !== null);

            object.destroy();
            assert(object.handler === null);
            assert(testValue.links_ === null);

            // destroy testValue with link to emitter
            var testValue = new Value({ value: 1 });
            var object = new DataObject();
            testValue.link(object, function(){});

            testValue.destroy();
            assert(object.handler === null);
            assert(testValue.links_ === null);
          }
        },
        {
          name: 'value should be set to null if value instanceof basis.event.Emitter',
          test: function(){
            var emitter = new Emitter();
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
            var emitter = new Emitter();
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

                assert(a instanceof ReadOnlyValue);
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

                assert(a instanceof DeferredValue);
                assert(a === b);
              }
            },
            {
              name: 'result for as and deferred should be equal',
              test: function(){
                var testValue = new Value();

                assert(testValue.as(null, true) === testValue.deferred());
                assert(testValue.as(basis.fn.$self, true) === testValue.deferred());
              }
            },
            {
              name: 'result for different functions but the same source code should be the same',
              test: function(){
                var testValue = new Value();
                var a = testValue.as(function(){});
                var b = testValue.as(function(){});

                assert(a instanceof ReadOnlyValue);
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

                assert(a instanceof ReadOnlyValue);
                assert(b instanceof ReadOnlyValue);
                assert(c instanceof ReadOnlyValue);
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
            },
            {
              name: 'value produced by as method should destroy on source value destroy',
              test: function(){
                var destroyed = false;
                var value = new Value({ value: 3 });
                var as = value.as(function(v){
                  return v * v;
                });

                as.addHandler({
                  destroy: function(){
                    destroyed = true;
                  }
                });

                value.destroy();
                assert(destroyed === true);
              }
            }
          ]
        },
        {
          name: 'Value#deferred',
          test: [
            {
              name: 'should return DeferredValue instance',
              test: function(){
                var value = new Value();

                assert(value.deferred() instanceof DeferredValue);
              }
            },
            {
              name: 'should return the same value all the time',
              test: function(){
                var value = new Value();

                assert(value.deferred() === value.deferred());
              }
            },
            {
              name: 'deferred value should update when source value change',
              test: function(){
                var value = new Value({ value: 1 });
                var deferred = value.deferred();

                assert(deferred.value === 1);

                value.set(2);
                assert(deferred.value === 2);

                value.set(3);
                assert(deferred.value === 3);
              }
            },
            {
              name: 'deferred value should fire change event async (asap)',
              test: function(){
                var changeCount = 0;
                var value = new Value({ value: 1 });
                var deferred = value.deferred();
                deferred.addHandler({
                  change: function(){
                    changeCount++;
                  }
                });

                value.set(2);
                value.set(3);
                assert(deferred.value === 3);
                assert(changeCount === 0);

                setTimeout(function(){
                  assert(changeCount === 1);
                }, 20);
              }
            },
            {
              name: 'deferred value should not fire change event if value is the same as on last change event',
              test: function(){
                var changeCount = 0;
                var value = new Value({ value: 1 });
                var deferred = value.deferred();
                deferred.addHandler({
                  change: function(){
                    changeCount++;
                  }
                });

                value.set(2);
                value.set(3);
                value.set(1);
                assert(deferred.value === 1);
                assert(changeCount === 0);

                setTimeout(function(){
                  assert(changeCount === 0);
                }, 20);
              }
            },
            {
              name: 'deferred value should when source value destroy',
              test: function(){
                var destroyed = false;
                var value = new Value();
                var deferred = value.deferred();

                deferred.addHandler({
                  destroy: function(){
                    destroyed = true;
                  }
                });

                value.destroy();
                assert(destroyed === true);
              }
            }
          ]
        },
        {
          name: 'Value#pipe',
          test: [
            {
              name: 'should return an instance of Value',
              test: function(){
                var pipe = new Value().pipe('activeChanged', 'active');

                assert(pipe instanceof Value);
              }
            },
            {
              name: 'should return the same instance for the same params',
              test: function(){
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', 'active');

                assert(pipe === parent.pipe('activeChanged', 'active'));
              }
            },
            {
              name: 'should be read-only',
              test: function(){
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', 'active');

                assert(pipe.value === null);

                pipe.set(true);
                assert(pipe.value === null);
              }
            },
            {
              name: 'should not calc value on init if parent has non-Emitter value',
              test: function(){
                var calcCount = 0;
                var pipe = new Value().pipe('activeChanged', function(){
                  calcCount++;
                });

                assert(calcCount === 0);
              }
            },
            {
              name: 'should calc value only once on init but when parent value has an Emitter value',
              test: function(){
                var calcCount = 0;
                var pipe = new Value({ value: new DataObject() })
                  .pipe('activeChanged', function(){
                    calcCount++;
                  });

                assert(calcCount === 1);
              }
            },
            {
              name: 'should not recalc on parent value non-Emitter->non-Emitter changes',
              test: function(){
                var calcCount = 0;
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', function(){
                  calcCount++;
                });

                calcCount = 0;

                parent.set(false);
                assert(calcCount == 0);

                parent.set(new DataObject());
                assert(calcCount == 1);

                parent.set(new DataObject());
                assert(calcCount == 2);

                parent.set();
                assert(calcCount == 3);

                parent.set();
                assert(calcCount == 3);

                parent.set(null);
                assert(calcCount == 3);

                parent.set(new DataObject());
                assert(calcCount == 4);
              }
            },
            {
              name: 'should store null if prev step stores undefined',
              test: function(){
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', 'active');

                assert(pipe.value === null);

                parent.set(new DataObject());
                assert(pipe.value === false);

                parent.set();
                assert(pipe.value === null);
              }
            },
            {
              name: 'should works through long chains',
              test: function(){
                var foo = new DataObject({ active: true });
                var bar = new DataObject({ active: true });
                var obj = new DataObject({ delegate: foo });
                var pipe = new Value({ value: obj })
                  .pipe('delegateChanged', 'delegate')
                  .pipe('activeChanged', 'active');

                assert(pipe.value === true);

                foo.setActive(false);
                assert(pipe.value === false);

                obj.setDelegate(bar);
                assert(pipe.value === true);

                bar.setActive(false);
                assert(pipe.value === false);

                foo.setActive(true);
                assert(pipe.value === false);

                obj.setDelegate(foo);
                assert(pipe.value === true);
              }
            },
            {
              name: 'should destroy when parent destroy',
              test: function(){
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', 'active');
                var pipeDestroyed = false;

                pipe.addHandler({
                  destroy: function(){
                    pipeDestroyed = true;
                  }
                });

                parent.destroy();
                assert(pipeDestroyed);
              }
            },
            {
              name: 'should unlink from parent on destroy',
              test: function(){
                var parent = new Value();
                var pipe = parent.pipe('activeChanged', 'active');

                pipe.destroy();
                assert(pipe !== parent.pipe('activeChanged', 'active'));
              }
            }
          ]
        },
        {
          name: 'Value#compute',
          test: [
            {
              name: 'should return instance of ReadOnlyValue',
              test: function(){
                var value = new Value();
                var compute = value.compute('update', Boolean);
                var object = new DataObject();

                assert(compute(object) instanceof ReadOnlyValue);
              }
            },
            {
              name: 'should return the same value for same source object',
              test: function(){
                var value = new Value();
                var compute = value.compute('update', Boolean);
                var object = new DataObject();

                assert(compute(object) === compute(object));
              }
            },
            {
              name: 'should compute correct value on init',
              test: function(){
                var value = new Value({ value: 2 });
                var compute = value.compute('update', function(object, value){
                  return object.data.foo * value;
                });
                var object = new DataObject({
                  data: {
                    foo: 3
                  }
                });

                assert(compute(object).value === 6);
              }
            },
            {
              name: 'should update value on arguments changes',
              test: function(){
                var value = new Value({ value: 2 });
                var compute = value.compute('update', function(object, value){
                  return object.data.foo * value;
                });
                var object = new DataObject({
                  data: {
                    foo: 3
                  }
                });
                var computeValue = compute(object);

                assert(computeValue.value === 6);

                value.set(3);
                assert(computeValue.value === 9);

                object.update({ foo: 4 });
                assert(computeValue.value === 12);
              }
            },
            {
              name: 'chaining',
              test: [
                {
                  name: 'should has `deferred` method',
                  test: function(){
                    var value = new Value({ value: 2 });
                    var compute = value
                      .compute('update', function(object, value){
                        return object.data.foo * value;
                      })
                      .deferred();
                    var object = new DataObject({
                      data: {
                        foo: 3
                      }
                    });
                    var deferredComputeValue = compute(object);

                    var changeCount = 0;
                    deferredComputeValue.addHandler({
                      change: function(){
                        changeCount++;
                      }
                    });

                    assert(deferredComputeValue.value === 6);
                    assert(changeCount === 0);

                    value.set(3);
                    assert(deferredComputeValue.value === 9);
                    assert(changeCount === 0);

                    object.update({
                      foo: 4
                    });
                    assert(deferredComputeValue.value === 12);
                    assert(changeCount === 0);

                    setTimeout(function(){
                      assert(changeCount === 1);
                    }, 20);
                  }
                },
                {
                  name: '`deferred` method should be chainable',
                  test: function(){
                    var value = new Value({ value: 2 });
                    var compute = value
                      .compute('update', function(object, value){
                        return object.data.foo * value;
                      })
                      .deferred()
                      .as(String);
                    var object = new DataObject({
                      data: {
                        foo: 3
                      }
                    });
                    var deferredComputeValue = compute(object);

                    assert(deferredComputeValue.value === '6');

                    value.set(3);
                    object.update({
                      foo: 4
                    });
                    assert(deferredComputeValue.value === '6');

                    setTimeout(function(){
                      assert(deferredComputeValue.value === '12');
                    }, 20);
                  }
                },
                {
                  name: 'should has `as` method',
                  test: function(){
                    var value = new Value({ value: 2 });
                    var compute = value
                      .compute('update', function(object, value){
                        return object.data.foo * value;
                      })
                      .as(String);
                    var object = new DataObject({
                      data: {
                        foo: 3
                      }
                    });

                    assert(compute(object).value === '6');
                  }
                },
                {
                  name: 'should has `compute` method',
                  test: function(){
                    var value = new Value({ value: 2 });
                    var compute = value
                      .compute('update', function(object, value){
                        return object.data.foo * value;
                      })
                      .compute('update', function(object, value){
                        return object.data.bar * value;
                      });
                    var object = new DataObject({
                      data: {
                        foo: 3,
                        bar: 4
                      }
                    });

                    assert(compute(object).value === 24);
                  }
                },
                {
                  name: 'should has `pipe` method',
                  test: function(){
                    var value = new Value({ value: 'delegate' });
                    var compute = value
                      .compute('delegateChanged', function(object, value){
                        return object[value];
                      })
                      .pipe('update', 'data.foo');
                    var object = new DataObject({
                      delegate: new DataObject({
                        data: {
                          foo: 1
                        }
                      })
                    });
                    var computeValue = compute(object);

                    assert(computeValue.value === 1);

                    object.delegate.update({
                      foo: 2
                    });
                    assert(computeValue.value === 2);

                    object.setDelegate(new DataObject({
                      data: {
                        foo: 3
                      }
                    }));
                    assert(computeValue.value === 3);

                    value.set('xxx');
                    assert(computeValue.value === null);

                    value.set('delegate');
                    assert(computeValue.value === 3);
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'Value#lock/unlock',
          test: [
            {
              name: 'base test',
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
            }
          ]
        }
      ]
    },
    {
      name: 'Value.from',
      test: [
        {
          name: 'value destroy -> unlink from source',
          test: function(){
            var obj = new DataObject();
            var value = Value.from(obj, null, 'basisObjectId');

            assert(obj.debug_handlers().length == 1);

            assert(catchWarnings(function(){
              value.destroy();
            }) == false);

            assert(obj.debug_handlers().length == 0);
            assert(value !== Value.from(obj, null, 'basisObjectId'));
          }
        },
        {
          name: 'source destroy -> value destroy',
          test: function(){
            var obj = new DataObject();
            var value = Value.from(obj, null, 'basisObjectId');
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
    },
    {
      name: 'Value.factory',
      test: [
        {
          name: 'should return factory',
          test: function(){
            var factory = Value.factory('foo', 'bar');

            assert(basis.fn.isFactory(factory));
            assert(typeof factory.deferred === 'function');
            assert(typeof factory.compute === 'function');
            assert(typeof factory.pipe === 'function');
            assert(typeof factory.as === 'function');
          }
        },
        {
          name: 'should returns the same value as Value.from',
          test: function(){
            var factory = Value.factory('foo', 'bar');
            var obj = new DataObject();

            assert(factory(obj) === Value.from(obj, 'foo', 'bar'));
          }
        },
        {
          name: 'chaining',
          test: [
            {
              name: 'deferred',
              test: [
                {
                  name: 'should return new factory',
                  test: function(){
                    var factory = Value.factory('foo', 'bar')
                      .deferred();

                    assert(basis.fn.isFactory(factory));
                    assert(typeof factory.deferred === 'function');
                    assert(typeof factory.compute === 'function');
                    assert(typeof factory.pipe === 'function');
                    assert(typeof factory.as === 'function');
                  }
                },
                {
                  name: 'should return the same value as Value.from().deferred()',
                  test: function(){
                    var obj = new DataObject();
                    var value = Value.from(obj, 'foo', 'bar').deferred();
                    var factory = Value.factory('foo', 'bar')
                      .deferred();

                    assert(factory(obj) === value);
                  }
                }
              ]
            },
            {
              name: 'compute',
              test: [
                {
                  name: 'should return new factory',
                  test: function(){
                    var factory = Value.factory('foo', Boolean)
                      .compute('baz', Boolean);

                    assert(basis.fn.isFactory(factory));
                    assert(typeof factory.deferred === 'function');
                    assert(typeof factory.compute === 'function');
                    assert(typeof factory.pipe === 'function');
                    assert(typeof factory.as === 'function');
                  }
                },
                {
                  name: 'should return the same value as Value.from().compute()',
                  test: function(){
                    var obj = new DataObject();
                    var value = Value.from(obj, 'foo', 'bar').compute('baz', Boolean)(obj);
                    var factory = Value.factory('foo', 'bar')
                      .compute('baz', Boolean);

                    assert(factory(obj) === value);
                  }
                }
              ]
            },
            {
              name: 'pipe',
              test: [
                {
                  name: 'should return new factory',
                  test: function(){
                    var factory = Value.factory('foo', 'bar')
                      .pipe('baz', 'qux');

                    assert(basis.fn.isFactory(factory));
                    assert(typeof factory.deferred === 'function');
                    assert(typeof factory.compute === 'function');
                    assert(typeof factory.pipe === 'function');
                    assert(typeof factory.as === 'function');
                  }
                },
                {
                  name: 'should return the same value as Value.from().pipe()',
                  test: function(){
                    var obj = new DataObject();
                    var value = Value.from(obj, 'foo', 'bar').pipe('baz', 'qux');
                    var factory = Value.factory('foo', 'bar')
                      .pipe('baz', 'qux');

                    assert(factory(obj) === value);
                    assert(factory(obj).pipe('a', 'b') === value.pipe('a', 'b'));
                  }
                }
              ]
            },
            {
              name: 'as',
              test: [
                {
                  name: 'should return new factory',
                  test: function(){
                    var factory = Value.factory('update', 'data.foo')
                      .as(Boolean);

                    assert(basis.fn.isFactory(factory));
                    assert(typeof factory.deferred === 'function');
                    assert(typeof factory.compute === 'function');
                    assert(typeof factory.pipe === 'function');
                    assert(typeof factory.as === 'function');
                  }
                },
                {
                  name: '`should return the same value as Value.from().as()',
                  test: function(){
                    var obj = new DataObject({ data: { foo: 1 } });
                    var value = Value.from(obj, 'update', 'data.foo').as(Boolean);
                    var factory = Value.factory('update', 'data.foo')
                      .as(Boolean);

                    assert(factory(obj) === value);
                  }
                },
                {
                  name: 'should support pipe method',
                  test: function(){
                    var foo = new DataObject({ data: { bar: 1 } });
                    var obj = new DataObject({ data: { foo: foo } });
                    var value = Value
                      .from(obj, 'update', 'data.foo')
                      .as(Object)
                      .pipe('update', 'data.bar');
                    var factory = Value
                      .factory('update', 'data.foo')
                      .as(Object)
                      .pipe('update', 'data.bar');

                    assert(factory(obj) === value);
                    assert(factory(obj).value === 1);

                    foo.update({ bar: 2 });
                    assert(factory(obj).value === 2);
                  }
                },
                {
                  name: 'should invoke even if previous steps are can\'t to be computed',
                  test: function(){
                    var factory = Value.factory('update', 'data.foo')
                      .pipe('update', 'data.bar')
                      .as(String);
                    var object = new DataObject({
                      data: {
                        foo: new DataObject({
                          data: {
                            bar: 1
                          }
                        })
                      }
                    });
                    var computedValue = factory(object);

                    assert(computedValue.value === '1');

                    object.update({
                      foo: null
                    });
                    assert(computedValue.value === 'null');

                    object.update({
                      foo: new DataObject()
                    });
                    assert(computedValue.value === 'undefined');

                    object.data.foo.update({
                      bar: 'hello'
                    });
                    assert(computedValue.value === 'hello');
                  }
                }
              ]
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
            assert(obj.activeRA_ instanceof ResolveAdapter);

            // destroy source
            value.destroy();
            assert(obj.active === true);
            assert(obj.activeRA_ === null);
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
            assert(obj.activeRA_ instanceof ResolveAdapter);

            // destroy source
            bar.destroy();
            assert(obj.active === true);
            assert(obj.activeRA_ === null);
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
            assert(obj.activeRA_ instanceof ResolveAdapter);

            // destroy source
            foo.destroy();
            assert(bar.value === null);
            assert(obj.active === false);
            assert(obj.activeRA_ instanceof ResolveAdapter);

            bar.destroy();
            assert(obj.active === false);
            assert(obj.activeRA_ === null);
          }
        }
      ]
    }
  ]
};
