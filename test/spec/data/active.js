module.exports = {
  name: 'Active',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var DataObject = basis.require('basis.data').Object;
    var Value = basis.require('basis.data').Value;
    var STATE = basis.require('basis.data').STATE;
    var PROXY = basis.PROXY;

    var helpers = basis.require('./helpers/events.js').createAPI(DataObject);
    var eventCount = helpers.eventCount;
  },

  test: [
    {
      name: 'create',
      test: [
        {
          name: 'by default active = false',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });

            assert(obj.active === false);
            assert(target.subscriberCount === 0);
            assert(eventCount(obj, 'activeChanged') === 0);
          }
        },
        {
          name: 'active = false',
          test: function(){
            var values = [
              false,
              new basis.Token(false),
              new Value({ value: false })
            ];

            for (var i = 0; i < values.length; i++)
            {
              var target = new DataObject();
              var obj = new DataObject({
                active: values[i],
                delegate: target
              });

              assert(obj.active === false);
              assert(eventCount(obj, 'activeChanged') === 0);
              assert(target.subscriberCount === 0);
            }
          }
        },
        {
          name: 'active = true',
          test: function(){
            var values = [
              true,
              new basis.Token(true),
              new Value({ value: true })
            ];

            for (var i = 0; i < values.length; i++)
            {
              var target = new DataObject();
              var obj = new DataObject({
                active: values[i],
                delegate: target
              });

              assert(obj.active === true);
              assert(eventCount(obj, 'activeChanged') === 0);
              assert(target.subscriberCount === 1);
            }
          }
        },
        {
          name: 'active = proxy',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              active: PROXY,
              delegate: target
            });
            var trigger = new DataObject({
              delegate: obj
            });

            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);
            assert(target.subscriberCount === 0);

            trigger.setActive(true);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            trigger.setActive(false);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 2);
            assert(target.subscriberCount === 0);
          }
        },
        {
          name: 'active = function()',
          test: function(){
            var obj = new DataObject({
              active: function(obj){
                return obj.state == STATE.READY;
              }
            });

            assert(obj.active === true);
            assert(obj.activeRA_ === null);
            assert(eventCount(obj, 'activeChanged') === 0);
          }
        },
        {
          name: 'active = factory',
          test: function(){
            var obj = new DataObject({
              active: Value.factory('stateChanged', function(obj){
                return obj.state == STATE.READY;
              })
            });

            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);

            obj.setState(STATE.READY);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);

            obj.setState(STATE.ERROR);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 2);
          }
        }
      ]
    },
    {
      name: 'change',
      test: [
        {
          name: 'simple',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });

            obj.setActive(true);
            assert(obj.active === true);
            assert(target.subscriberCount === 1);
            assert(eventCount(obj, 'activeChanged') === 1);

            obj.setActive(false);
            assert(obj.active === false);
            assert(target.subscriberCount === 0);
            assert(eventCount(obj, 'activeChanged') === 2);
          }
        },
        {
          name: 'same value should do nothing (default)',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });

            obj.setActive(false);
            assert(obj.active === false);
            assert(target.subscriberCount === 0);
            assert(eventCount(obj, 'activeChanged') === 0);
          }
        },
        {
          name: 'same value should do nothing',
          test: function(){
            var values = [
              false,
              new basis.Token(false),
              new Value({ value: false }),
              true,
              new basis.Token(true),
              new Value({ value: true }),
              PROXY
            ];

            for (var i = 0; i < values.length; i++)
            {
              var value = values[i];
              var target = new DataObject();
              var obj = new DataObject({
                active: value,
                delegate: target
              });

              var active = obj.active;
              var subscriberCount = target.subscriberCount;

              obj.setActive(value);
              assert(target.subscriberCount === subscriberCount);
              assert(obj.active === active);
              assert(eventCount(obj, 'activeChanged') === 0);
            }
          }
        },
        {
          name: 'active = proxy from passive trigger',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });
            var trigger = new DataObject({
              active: false,
              delegate: obj
            });

            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);
            assert(target.subscriberCount === 0);

            obj.setActive(PROXY);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);
            assert(target.subscriberCount === 0);

            trigger.setActive(true);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            obj.setActive(true);
            trigger.setActive(false);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);
          }
        },
        {
          name: 'active = proxy from active trigger',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });
            var trigger = new DataObject({
              active: true,
              delegate: obj
            });

            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);
            assert(target.subscriberCount === 0);

            obj.setActive(PROXY);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            obj.setActive(true);
            trigger.setActive(false);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            obj.setActive(false);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 2);
            assert(target.subscriberCount === 0);
          }
        },
        {
          name: 'set active to proxy and back several times',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              delegate: target
            });
            var trigger = new DataObject({
              active: true,
              delegate: obj
            });

            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 0);
            assert(target.subscriberCount === 0);

            obj.setActive(PROXY);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            obj.setActive(PROXY);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 1);
            assert(target.subscriberCount === 1);

            trigger.setActive(false);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 2);
            assert(target.subscriberCount === 0);

            trigger.setActive(true);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 3);
            assert(target.subscriberCount === 1);

            obj.setActive(true);
            trigger.setActive(false);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 3);
            assert(target.subscriberCount === 1);

            obj.setActive(false);
            assert(obj.active === false);
            assert(eventCount(obj, 'activeChanged') === 4);
            assert(target.subscriberCount === 0);

            trigger.setActive(true);
            obj.setActive(PROXY);
            assert(obj.active === true);
            assert(eventCount(obj, 'activeChanged') === 5);
            assert(target.subscriberCount === 1);
          }
        },
        {
          name: 'set function should not invoke function',
          test: function(){
            var obj = new DataObject();

            obj.setActive(function(obj){
              return obj.state == STATE.READY;
            });

            assert(obj.active === true);
            assert(obj.activeRA_ == null);
          }
        },
        {
          name: 'set factory',
          test: function(){
            var obj = new DataObject();

            obj.setActive(Value.factory('stateChanged', function(obj){
              return obj.state == STATE.READY;
            }));

            assert(obj.active === false);

            obj.setState(STATE.READY);

            assert(obj.active === true);
          }
        }
      ]
    },
    {
      name: 'destroy',
      test: [
        {
          name: 'should clean up adapter',
          test: function(){
            var obj = new DataObject({
              active: new basis.Token
            });

            assert(obj.activeRA_ != null);

            obj.destroy();

            assert(obj.activeRA_ == null);
          }
        },
        {
          name: 'destroy active obj',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              active: true,
              delegate: target
            });

            assert(obj.active === true);
            assert(target.subscriberCount === 1);

            obj.destroy();
            assert(target.subscriberCount === 0);
          }
        },
        {
          name: 'destroy active trigger when obj has active = proxy',
          test: function(){
            var target = new DataObject();
            var obj = new DataObject({
              active: PROXY,
              delegate: target
            });
            var trigger = new DataObject({
              active: true,
              delegate: obj
            });

            assert(obj.active === true);
            assert(target.subscriberCount === 1);

            trigger.destroy();
            assert(obj.active === false);
            assert(target.subscriberCount === 0);
          }
        }
      ]
    }
  ]
}
