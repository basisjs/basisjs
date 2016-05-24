module.exports = {
  name: 'basis.data.keyObjectMap',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var DataValue = basis.require('basis.data').Value;
    var DataObject = basis.require('basis.data').Object;
    var KeyObjectMap = basis.require('basis.data').KeyObjectMap;
  },

  test: [
    {
      name: 'Base',
      test: [
        {
          name: 'create and resolve',
          test: function(){
            var map = new KeyObjectMap();
            var object1 = new DataObject({ data: { prop1: 'some value' } });
			var value1 = new DataValue({ value: 'some value' });

            assert(map.resolve(object1) === map.get(object1));
            assert(map.resolve(object1).delegate === object1);

			assert(map.resolve(value1) === map.get(value1));
			assert(map.resolve(value1).data.title === value1);
          }
        },
        {
          name: 'destroy key object',
          test: function(){
            var map = new KeyObjectMap();
            var object1 = new DataObject({ data: { prop1: 'some value' } });
			var resolved = map.resolve(object1);

            assert(typeof object1.handler.callbacks.destroy === 'function');
            assert(typeof resolved.handler.callbacks.destroy === 'function');
            object1.destroy();
            assert(object1.handler === null);
            assert(resolved.handler === null);
            assert(!map.get(object1));
          }
        },
        {
          name: 'destroy member object',
          test: function(){
            var map = new KeyObjectMap();
            var object1 = new DataObject({ data: { prop1: 'some value' } });
			var resolved = map.resolve(object1);

            resolved.destroy();
            assert(object1.handler === null);
            assert(resolved.handler === null);
          }
        },
        {
          name: 'destroy map',
          test: function(){
            var map = new KeyObjectMap();
            var object1 = new DataObject({ data: { prop1: 'some value' } });
			var resolved = map.resolve(object1);

            map.destroy();
            assert(object1.handler === null);
            assert(resolved.handler === null);
          }
        }
      ]
    }
  ]
};
