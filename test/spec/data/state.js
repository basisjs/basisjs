module.exports = {
  name: 'State subsystem',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var STATE = basis.require('basis.data').STATE;
    var Value = basis.require('basis.data').Value;
    var AbstractData = basis.require('basis.data').AbstractData;
    var DataObject = basis.require('basis.data').Object;
    var resolveValue = basis.require('basis.data').resolveValue;
  },

  test: [
    {
      name: 'set on init',
      test: [
        {
          name: 'should set correct value on init',
          test: function(){
            var values = [
              STATE.READY,
              Object(STATE.READY),
              basis.fn.factory(function(){
                return STATE.READY;
              }),
              new basis.Token(STATE.READY),
              new Value({ value: STATE.READY })
            ];

            for (var i = 0; i < values.length; i++)
            {
              var data = new AbstractData({
                state: values[i]
              });
              assert(data.state == STATE.READY);
            }
          }
        },
        {
          name: 'should preserve state value',
          test: function(){
            var state = Object(STATE.READY);
            var data = new AbstractData({
              state: state
            });

            assert(data.state === state);
          }
        },
        {
          name: 'should throw exception on wrong value',
          test: function(){
            var values = [
              'xxx',
              {},
              function(){
                return STATE.READY;
              },
              basis.fn.factory(function(){
                return 'xxx';
              }),
              new basis.Token('xxx'),
              new Value({ value: 'xxx' })
            ];

            for (var i = 0; i < values.length; i++)
            {
              var data = new AbstractData({
                state: values[i]
              });
              assert(data.state == STATE.UNDEFINED);
            }
          }
        }
      ]
    },
    {
      name: 'helpers',
      test: [
        {
          name: 'STATE.factory',
          test: [
            {
              name: 'should return undefined state when called for subject with null property',
              test: function(){
                var factory = STATE.factory('foo', 'bar');
                var state = factory(new DataObject());

                assert(state.value === STATE.UNDEFINED);
              }
            },
            {
              name: 'should return undefined state when called for subject with null property',
              test: function(){
                var object = new DataObject({
                  state: STATE.factory('delegateChanged', 'delegate'),
                  delegate: new basis.Token(null)
                });

                assert(object.state == STATE.UNDEFINED);
              }
            }
          ]
        }
      ]
    }
  ]
};
