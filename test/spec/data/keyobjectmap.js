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
            var keyObject = new DataObject({ data: { prop1: 'some value' } });
            var keyObject2 = new DataValue({ value: 'some value' });
            var keyValue = 100;

            //DataObject
            assert(map.resolve(keyObject) === map.get(keyObject));
            assert(map.resolve(keyObject).delegate === keyObject);

            //DataValue
            assert(map.resolve(keyObject2) === map.get(keyObject2));
            assert(map.resolve(keyObject2).data.value === keyObject2);

            //scalar
            assert(map.resolve(keyValue) === map.get(keyValue));
            assert(map.resolve(keyValue).data.value === keyValue);
          }
        },
        {
          name: 'destroy key object',
          test: function(){
            var map = new KeyObjectMap();
            var keyObject = new DataObject({ data: { prop1: 'some value' } });
            var resolved = map.resolve(keyObject);

            assert(typeof keyObject.handler.callbacks.destroy === 'function');
            assert(typeof resolved.handler.callbacks.destroy === 'function');
            keyObject.destroy();
            assert(keyObject.handler === null);
            assert(resolved.handler === null);
            assert(!map.get(keyObject));
          }
        },
        {
          name: 'destroy member object',
          test: function(){
            var map = new KeyObjectMap();
            var keyValue = new DataValue({ value: 'some value' });
            var resolved = map.resolve(keyValue);

            resolved.destroy();
            assert(keyValue.handler === null);
            assert(resolved.handler === null);
            assert(!map.get(keyValue));
          }
        },
        {
          name: 'destroy map',
          test: function(){
            var map = new KeyObjectMap();
            var keyObject = new DataObject({ data: { prop1: 'some value' } });
            var resolved = map.resolve(keyObject);

            map.destroy();
            assert(keyObject.handler === null);
            assert(resolved.handler === null);
            assert(!map.get(keyObject));
          }
        }
      ]
    }
  ]
};
