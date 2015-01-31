module.exports = {
  name: 'basis.data.value',

  init: function(){
    var Value = basis.require('basis.data').Value;
    var Property = basis.require('basis.data.value').Property;
    var ObjectSet = basis.require('basis.data.value').ObjectSet;
    var Expression = basis.require('basis.data.value').Expression;
  },

  test: [
    {
      name: 'ObjectSet',
      test: [
        {
          name: 'test #1',
          test: function(){
            var s = new ObjectSet();
            s.a = new Property(1);
            s.b = new Property(2);

            var updateCount = 0;
            s.add(s.a);
            s.add(s.b);

            s.addHandler({
              change: function(){
                updateCount++;
              }
            });

            s.a.set(11);
            s.b.set(11);

            s.a.set('test');

            this.async(function(){
              // check async because ObjectSet update occur by timeout
              assert(updateCount === 1);
              assert(s.a.value === 'test');
              assert(s.b.value === 11);
            });
          }
        },
        {
          name: 'destroyed property unlink',
          test: function(){
            var s = new ObjectSet();
            s.a = new Property(1);
            s.b = new Property(2);

            var updateCount = 0;
            s.add(s.a);
            s.add(s.b);

            s.addHandler({
              change: function(){
                updateCount++;
              }
            });

            assert(s.objects.length === 2);
            assert(updateCount === 0);

            s.a.destroy();

            assert(s.objects.length === 1);
            assert(updateCount === 0);
          }
        },
        {
          name: 'destroyed ObjectSet unlink',
          test: function(){
            var result = 0;
            var s = new ObjectSet();
            s.a = new Property(1),
            s.b = new Property(2);

            s.addHandler({
              change: function(){
                result = a.value + b.value;
              }
            });

            s.a.destroy();

            assert(result === 0);
          }
        }
      ]
    },
    {
      name: 'Expression',
      test: [
        {
          name: 'create',
          test: [
            {
              name: 'basic',
              test: function(){
                var a = new Value({ value: 1 });
                var b = new basis.Token(2);
                var expr = new Expression(a, b, function(a, b){
                  return a + b;
                });

                assert(expr.value === 3);
              }
            },
            {
              name: 'should throw exception if last argument is not a function',
              test: function(){
                var a = new Value({ value: 1 });
                var b = new basis.Token(2);

                assert.exception(function(){
                  new Expression(a, b);
                });
              }
            },
            {
              name: 'should throw exception if any argument is not a Value or bb-value instance',
              test: function(){
                assert.exception(function(){
                  new Expression({}, function(a){
                    return a;
                  });
                });
              }
            }
          ]
        },
        {
          name: 'change',
          test: [
            {
              name: 'arguments value change',
              test: function(){
                var a = new Value({ value: 0 });
                var b = new basis.Token(0);
                var expr = new Expression(a, b, function(a, b){
                  return a + b;
                });
                var changeCount = 0;

                assert(expr.value === 0);
                expr.addHandler({
                  change: function(){
                    changeCount++;
                  }
                });

                a.set(1);
                b.set(2);
                assert(expr.value === 0);

                this.async(function(){
                  assert(expr.value === 3);
                  assert(changeCount === 1);
                });
              }
            },
            {
              name: 'Expression#update',
              test: function(){
                var a = new Value({ value: 0 });
                var b = new basis.Token(0);
                var updateCount = 0;
                var expr = new Expression(a, b, function(a, b){
                  return a + b;
                });

                var update = expr.update;
                expr.update = function(){
                  updateCount++;
                  update.apply(this, arguments);
                };

                a.set(1);
                b.set(2);
                assert(updateCount === 0);
                assert(expr.value === 0);

                expr.update();
                assert(updateCount === 1);
                assert(expr.value === 3);

                this.async(function(){
                  assert(updateCount === 1);
                });
              }
            }
          ]
        },
        {
          name: 'destroy',
          test: [
            {
              name: 'when any argument is destroying expression should be destroyed',
              test: function(){
                var a = new Value({ value: 1 });
                var expr = new Expression(a, function(){});

                expr.destroy();
                a.set(2);
                assert(a.handler === null);

                this.async(function(){
                  assert(expr.value === null);
                });
              }
            },
            {
              name: 'when any argument is destroying expression should be destroyed',
              test: function(){
                var a = new Value({ value: 1 });
                var expr = new Expression(a, function(){});
                var destroyed = false;

                expr.addHandler({
                  destroy: function(){
                    destroyed = true;
                  }
                });
                a.destroy();

                assert(destroyed === true);
              }
            },
            {
              name: 'when expression was destroyed by argument destroy, other argument changes should not cause any changes',
              test: function(){
                var a = new Value({ value: 1 });
                var b = new Value({ value: 2 });
                var expr = new Expression(a, b, function(){});

                a.destroy();
                b.set(3);

                this.async(function(){
                  assert(expr.value === null);
                });
              }
            },
            {
              name: 'destroy expression with sheduled update',
              test: function(){
                var a = new Value({ value: 1 });
                var expr = new Expression(a, function(a){
                  return a;
                });

                a.set(2);
                expr.destroy();

                this.async(function(){
                  assert(expr.value === null);
                });
              }
            }
          ]
        }
      ]
    }
  ]
};
