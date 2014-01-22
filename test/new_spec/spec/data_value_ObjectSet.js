module.exports = {
  name: 'basis.data.value.ObjectSet',

  init: function(){
    basis.require('basis.data.value');

    var Property = basis.data.value.Property;
    var ObjectSet = basis.data.value.ObjectSet;
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
              // this checks here because ObjectSet update occur by timeout
              this.is(1, updateCount);
              this.is('test', s.a.value);
              this.is(11, s.b.value);
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

            this.is(2, s.objects.length);
            this.is(0, updateCount);

            s.a.destroy();

            this.is(1, s.objects.length);
            this.is(0, updateCount);
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

            this.is(0, result);
          }
        }
      ]
    }
  ]
};
