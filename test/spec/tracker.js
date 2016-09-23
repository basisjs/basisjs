module.exports = {
  name: 'basis.tracker',

  init: function(){
    basis = window.basis.createSandbox();

    var createEvent = basis.require('basis.event').create;
    var isPathMatchSelector = basis.require('basis.tracker').isPathMatchSelector;
    var setDeep = basis.require('basis.tracker').setDeep;
    var addDispatcher = basis.require('basis.tracker').addDispatcher;
    var loadMap = basis.require('basis.tracker').loadMap;
    var Emitter = basis.require('basis.event').Emitter;
    var demoDispatcher = new Emitter();
  },
  test: [
    {
      name: 'isPathMatchSelector',
      test: [
        {
          name: 'simple cases - role match',
          test: function(){
            var match = [
              {
                path: [],
                selector: []
              },
              {
                path: ['a'],
                selector: []
              },
              {
                path: ['a'],
                selector: ['a']
              },
              {
                path: ['a', 'b'],
                selector: ['b']
              },
              {
                path: ['a', 'b'],
                selector: ['a', 'b']
              },
              {
                path: ['a', 'b', 'c'],
                selector: ['a', 'c']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['b', 'd']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['a', 'b', 'd']
              }
            ];

            for (var i = 0, test; test = match[i]; i++)
              assert(isPathMatchSelector(test.path, test.selector) === true);
          }
        },
        {
          name: 'simple cases - non-match',
          test: function(){
            var nonmatch = [
              {
                path: [],
                selector: ['a']
              },
              {
                path: ['a', 'b'],
                selector: ['a']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['a', 'c']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['x', 'a', 'b', 'd']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['x', 'a', 'b', 'd']
              }
            ];

            for (var i = 0, test; test = nonmatch[i]; i++)
              assert(isPathMatchSelector(test.path, test.selector) === false);
          }
        }
      ]
    },
    {
      name: 'setDeep',
      test: [
        {
          name: 'replace any roleId with matched roleId',
          test: function(){
            var sample = '*';
            var value = 123;
            var examples = [
              [{ foo: sample }, { foo: value }],
              [{ foo: { bar: sample } }, { foo: { bar: value } }],
              [{ foo: { bar: { qux: sample } } }, { foo: { bar: { qux: value } } }],
              [{ foo: { bar: sample }, baz: sample }, { foo: { bar: value }, baz: sample }],
              [{ foo: { bar: { qux: sample } }, baz: sample }, { foo: { bar: { qux: value } }, baz: sample }],
              [{ baz: sample, foo: { bar: { qux: sample } } }, { baz: value, foo: { bar: { qux: sample } } }]
            ];

            for (var i = 0, test; test = examples[i]; i++)
            {
              setDeep(test[0], sample, value);
              assert(JSON.stringify(test[0]) === JSON.stringify(test[1]));
            }
          }
        }
      ]
    },
    {
      name: 'addDispatcher arguments',
      test: [
        {
          name: 'First argument should have `addHandler` method',
          test: function(){
            assert(addDispatcher() == undefined);
            assert(addDispatcher({}) == undefined);
            assert(addDispatcher({ addHandler: null }) == undefined);

            assert(addDispatcher(demoDispatcher, [], function(){}) == true);

          }
        },
        {
          name: 'Second argument should be a list of events',
          test: function(){
            assert(addDispatcher(demoDispatcher, undefined)  == undefined);
            assert(addDispatcher(demoDispatcher, 'click', function(){})  == true);
            assert(addDispatcher(demoDispatcher, ['success', 'failure'], function(){})  == true);
          }
        },
        {
          name: 'Third argument should be a function',
          test: function(){
            assert(addDispatcher(demoDispatcher, [])  == undefined);
            assert(addDispatcher(demoDispatcher, [], {})  == undefined);
            assert(addDispatcher(demoDispatcher, [], function(){})  == true);
          }
        }
      ]
    },
    {
      name: 'addDispatcher',
      test: [
        {
          name: 'Test success event tracking',
          test: function(){
            var demoDispatcher = new Emitter({
              emit_success: createEvent('success'),
              emit_failure: createEvent('failure')
            });

            loadMap({
              'foo': {
                  success: {
                      id: 'foo request'
                  }
              }
            });

            var transformerEvent;
            var transformerItem;
            var transformer = function(event, item){
              transformerEvent = event;
              transformerItem = item;
            };

            addDispatcher(demoDispatcher, ['success'], transformer);

            var successArg = { foo: 'bar' };

            demoDispatcher.emit_success(successArg);

            assert(transformerEvent.type === 'success');
            assert(transformerEvent.args[1] === successArg);
            assert(transformerItem.data.id === 'foo request');
          }
        }
      ]
    }
  ]
};
