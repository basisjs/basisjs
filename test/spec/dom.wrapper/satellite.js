module.exports = {
  name: 'Satellite',
  test: [
    {
      name: 'switch owner (setSatellite)',
      test: function(){
        var ownerChangedCount = 0;
        var satellite = new Node({
          handler: {
            ownerChanged: function(){
              ownerChangedCount++;
            }
          }
        });
        var node1 = new Node({
          satellite: {
            example: satellite
          }
        });
        var node2 = new Node();

        this.is(false, checkNode(node1));
        this.is(false, checkNode(node2));
        this.is(false, checkNode(satellite));
        this.is(true, node1.satellite.example === satellite);
        this.is(true, node1.satellite.example.owner === node1);
        this.is(1, ownerChangedCount);

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node2.setSatellite('somename', node1.satellite.example);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node1));
        this.is(false, checkNode(node2));
        this.is(false, checkNode(satellite));
        this.is(false, warning);
        this.is(2, ownerChangedCount);
        this.is(true, node1.satellite.example === undefined);
        this.is(true, node2.satellite.somename === satellite);
        this.is(true, satellite.owner === node2);
      }
    },
    {
      name: 'switch owner (setOwner)',
      test: function(){
        var ownerChangedCount = 0;
        var satellite = new Node({
          handler: {
            ownerChanged: function(){
              ownerChangedCount++;
            }
          }
        });
        var node1 = new Node({
          satellite: {
            example: satellite
          }
        });
        var node2 = new Node();

        this.is(false, checkNode(node1));
        this.is(false, checkNode(node2));
        this.is(false, checkNode(satellite));
        this.is(true, node1.satellite.example === satellite);
        this.is(true, node1.satellite.example.owner === node1);
        this.is(1, ownerChangedCount);

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner(node2);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node1));
        this.is(false, checkNode(node2));
        this.is(false, checkNode(satellite));
        this.is(false, warning);
        this.is(2, ownerChangedCount);
        this.is(true, node1.satellite.example === undefined);
        this.is(true, satellite.owner === node2);
      }
    },
    {
      name: 'reset owner',
      test: function(){
        var satellite = new Node();
        var node = new Node({
          satellite: {
            test: satellite
          }
        });

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.owner === node);
        this.is(true, node.satellite.test === satellite);

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner();
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, warning);
        this.is(null, satellite.owner);
        this.is(undefined, node.satellite.test);
      }
    },
    {
      name: 'change satellite name on the same owner should not trigger ownerChanged event',
      test: function(){
        var ownerChangedEventCount = 0;
        var satelliteChangedEventCount = 0;
        var satellite = new Node({
          handler: {
            ownerChanged: function(){
              ownerChangedEventCount++;
            }
          }
        });
        var node = new Node({
          satellite: {
            test: satellite
          },
          listen: {
            satellite: {
              // just for add/remove listen
            }
          },
          handler: {
            satelliteChanged: function(){
              satelliteChangedEventCount++;
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.owner === node);
        this.is(true, node.satellite.test === satellite);
        this.is(1, satelliteChangedEventCount);
        this.is(1, ownerChangedEventCount);

        node.setSatellite('newName', satellite);
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.owner === node);
        this.is(undefined, node.satellite.test);
        this.is(true, node.satellite.newName === satellite);
        this.is(3, satelliteChangedEventCount);
        this.is(1, ownerChangedEventCount);
      }
    },
    {
      name: 'destroy satellite on owner destroy',
      test: function(){
        var satellite = new Node();
        var node = new Node({
          satellite: {
            test: satellite
          }
        });

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.owner === node);
        this.is(true, node.satellite.test === satellite);

        var satelliteDestroyed = false;
        satellite.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        node.destroy();

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satelliteDestroyed);
        this.is(null, node.satellite);
        this.is(null, satellite.owner);
      }
    },
    {
      name: 'reset owner for objects that isn\'t a satellite',
      test: function(){
        var nodeDestroyed = false;
        var ownerDestroyed = false;
        var owner = new Node({
          handler: {
            destroy: function(){
              ownerDestroyed = true;
            }
          }
        });
        var node = new Node({
          owner: owner,
          handler: {
            destroy: function(){
              nodeDestroyed = true;
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(false, checkNode(owner));
        this.is(true, node.owner === owner);

        owner.destroy();

        this.is(false, checkNode(node));
        this.is(false, checkNode(owner));
        this.is(false, nodeDestroyed);
        this.is(true, ownerDestroyed);
        this.is(null, node.owner);
      }
    },
    {
      name: 'auto-create satellite (empty config)',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });

        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(true, node.satellite.test.owner === node);
        this.is(true, 'test' in node.satellite[AUTO]);
      }
    },
    {
      name: 'auto-satellite with instance',
      test: function(){
        var satellite = new Node();
        var node = new Node({
          satellite: {
            test: {
              instance: satellite
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test === satellite);
        this.is(true, node.satellite.test.owner === node);
      }
    },
    {
      name: 'auto-create satellite with existsIf',
      test: function(){
        // use existsIf config
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value'
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should be created
        node.update({ value: true });
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(true, node.satellite.test.owner === node);

        // should be destroyed
        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });
        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, satelliteDestroyed);
      }
    },
    {
      name: 'auto-create satellite with existsIf as bindingBridge',
      test: function(){
        // use existsIf config
        var token = new basis.Token(false);
        var node = new Node({
          satellite: {
            test: {
              existsIf: token
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should be created
        token.set(true);
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(true, node.satellite.test.owner === node);

        // should be destroyed
        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        token.set(false);
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, satelliteDestroyed);
        assert(token.handler != null);

        node.destroy();
        assert(token.handler == null);
      }
    },
    {
      name: 'should be possible don\'t listen event by setting false/null/empty string/array to events setting',
      test: function(){
        // set null
        var node = new Node({
          satellite: {
            test: {
              events: null,
              existsIf: 'data.value'
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, !node.handler && !node.handler);
        node.update({ value: true });
        this.is(undefined, node.satellite.test);

        // set false
        var node = new Node({
          satellite: {
            test: {
              events: false,
              existsIf: 'data.value'
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, !node.handler);
        node.update({ value: true });
        this.is(undefined, node.satellite.test);

        // set empty string
        var node = new Node({
          satellite: {
            test: {
              events: '',
              existsIf: 'data.value'
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, !node.handler);
        node.update({ value: true });
        this.is(undefined, node.satellite.test);

        // set empty array
        var node = new Node({
          satellite: {
            test: {
              events: [],
              existsIf: 'data.value'
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, !node.handler);
        node.update({ value: true });
        this.is(undefined, node.satellite.test);
      }
    },
    {
      name: 'auto-create satellite with config',
      test: function(){
        // config as object
        var node = new Node({
          satellite: {
            test: {
              config: {
                foo: 'bar'
              }
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is('bar', node.satellite.test.foo);

        // config as function
        var node = new Node({
          satellite: {
            test: {
              config: function(owner){
                return {
                  ownerObjectId: owner.basisObjectId,
                  foo: 'bar'
                };
              }
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is('bar', node.satellite.test.foo);
        this.is(node.basisObjectId, node.satellite.test.ownerObjectId);
      }
    },
    {
      name: 'auto-create satellite should be destroyed after satelliteChanged event on owner',
      test: function(){
        // use existsIf config
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value'
            }
          },
          data: {
            value: true
          }
        });

        // should be created
        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);

        var events = [];
        node.satellite.test.addHandler({
          destroy: function(){
            events.push('destroy');
          }
        });
        node.addHandler({
          satelliteChanged: function(){
            events.push('satelliteChanged');
          }
        });

        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(false, 'test' in node.satellite);
        this.is(['satelliteChanged', 'destroy'], events);
      }
    },
    {
      name: 'auto-satellite with instance and existsIf',
      test: function(){
        // use existsIf config
        var satelliteDestroyed = false;
        var satellite = new Node({
          handler: {
            destroy: function(){
              satelliteDestroyed = true;
            }
          }
        });
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(undefined, node.satellite.test);
        this.is(false, satelliteDestroyed);

        // should be created
        node.update({ value: true });
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);

        // should not be destroyed
        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(undefined, node.satellite.test);
        this.is(false, satelliteDestroyed);
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, satellite.owner !== node);
      }
    },
    {
      name: 'auto-create satellite with delegate/dataSource',
      test: function(){
        // use existsIf config
        var delegate = new DataObject;
        var dataSource = new Dataset;
        var node = new Node({
          _delegate: delegate,
          _dataSource: dataSource,
          satellite: {
            test: {
              satelliteClass: Node,
              delegate: '_delegate',
              dataSource: '_dataSource'
            }
          }
        });

        var satellite = node.satellite.test;

        // should be created
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.delegate === delegate);
        this.is(true, satellite.dataSource === dataSource);
      }
    },
    {
      name: 'auto-create satellite should be created with delegate/dataSource (set delegate/dataSource before postInit – templateUpdate issue)',
      test: function(){
        // use existsIf config
        var delegate = new DataObject;
        var dataSource = new Dataset;
        var delegateSet = false;
        var delegateSetBeforePostInit = false;
        var dataSourceSet = false;
        var dataSourceSetBeforePostInit = false;
        var node = new Node({
          _delegate: delegate,
          _dataSource: dataSource,
          satellite: {
            test: {
              satelliteClass: Node.subclass({
                handler: {
                  delegateChanged: function(){
                    delegateSet = true;
                  },
                  dataSourceChanged: function(){
                    dataSourceSet = true;
                  }
                },
                postInit: function(){
                  delegateSetBeforePostInit = delegateSet;
                  dataSourceSetBeforePostInit = dataSourceSet;
                  Node.prototype.postInit.call(this);
                }
              }),
              delegate: '_delegate',
              dataSource: '_dataSource'
            }
          }
        });

        var satellite = node.satellite.test;

        // should be created
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, delegateSetBeforePostInit);
        this.is(true, dataSourceSetBeforePostInit);
        this.is(true, satellite.delegate === delegate);
        this.is(true, satellite.dataSource === dataSource);
      }
    },
    {
      name: 'auto-satellite with delegate/dataSource',
      test: function(){
        // use existsIf config
        var delegate = new DataObject;
        var dataSource = new Dataset;
        var node = new Node({
          _delegate: delegate,
          _dataSource: dataSource,
          satellite: {
            test: {
              instance: new Node(),
              delegate: '_delegate',
              dataSource: '_dataSource'
            }
          }
        });

        var satellite = node.satellite.test;

        // should be created
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satellite.delegate === delegate);
        this.is(true, satellite.dataSource === dataSource);
      }
    },
    {
      name: 'auto-satellite with delegate/dataSource and existsIf',
      test: function(){
        // use existsIf config
        var delegate = new DataObject;
        var dataSource = new Dataset;
        var satellite = new Node();
        var node = new Node({
          _delegate: delegate,
          _dataSource: dataSource,
          satellite: {
            test: {
              existsIf: 'data.value',
              instance: satellite,
              delegate: '_delegate',
              dataSource: '_dataSource'
            }
          }
        });

        // instance is not linked and delegate/dataSource is not set
        this.is(false, checkNode(node));
        this.is(false, 'test' in node.satellite);
        this.is(true, satellite.owner === null);
        this.is(true, satellite.delegate === null);
        this.is(true, satellite.dataSource === null);

        // set delegate/dataSource when instance in use
        node.update({ value: true });
        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, satellite.owner === node);
        this.is(true, satellite.delegate === delegate);
        this.is(true, satellite.dataSource === dataSource);

        // reset delegate/dataSource when instance not in use
        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(false, 'test' in node.satellite);
        this.is(true, satellite.owner === null);
        this.is(true, satellite.delegate === null);
        this.is(true, satellite.dataSource === null);
      }
    },
    {
      name: 'auto-satellite should unlink from it\'s owner on destroy',
      test: function(){
        // use existsIf config
        var satelliteDestroyed = false;
        var satellite = new Node({
          handler: {
            destroy: function(){
              satelliteDestroyed = true;
            }
          }
        });
        var node = new Node({
          satellite: {
            test: {
              instance: satellite
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, satellite.owner === node);
        this.is(false, satelliteDestroyed);

        // should unlink from owner
        satellite.destroy();
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, 'test' in node.satellite);
        this.is(false, 'test' in node.satellite[AUTO]);
        this.is(true, satelliteDestroyed);
        this.is(true, satellite.owner === null);
      }
    },
    {
      name: 'non-used auto-satellite with existsIf should be destroyed on owner destroy',
      test: function(){
        // use existsIf config
        var satelliteDestroyed = false;
        var satellite = new Node({
          handler: {
            destroy: function(){
              satelliteDestroyed = true;
            }
          }
        });
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, satellite.owner === null);
        this.is(false, satelliteDestroyed);

        // should unlink from owner
        satellite.destroy();
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, 'test' in node.satellite);
        this.is(false, 'test' in node.satellite[AUTO]);
        this.is(true, satelliteDestroyed);
        this.is(true, satellite.owner === null);
      }
    },
    {
      name: 'non-used auto-satellite should be destroyed on owner destroy',
      test: function(){
        // use existsIf config
        var satelliteDestroyed = false;
        var satellite = new Node({
          handler: {
            destroy: function(){
              satelliteDestroyed = true;
            }
          }
        });
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, satellite.owner === null);
        this.is(false, satelliteDestroyed);

        // should unlink from owner
        node.destroy();
        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, satelliteDestroyed);
        this.is(true, satellite.owner === null);
      }
    },
    {
      name: 'auto-create satellite with existsIf and custom events - events as string',
      test: function(){
        // events as string
        var node = new Node({
          satellite: {
            test: {
              events: 'stateChanged activeChanged',
              existsIf: 'data.value'
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should not be created (no changes on update event)
        node.update({ value: true });
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should be created
        node.setState(READY, '1');
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(true, node.satellite.test.owner === node);

        // should not be destroyed (no changes on update event)
        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });
        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test.owner === node);

        // should be destroyed
        node.setActive(!node.active);
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, satelliteDestroyed);

      }
    },
    {
      name: 'auto-create satellite with existsIf and custom events - events as array',
      test: function(){
        // events as array
        var node = new Node({
          satellite: {
            test: {
              events: ['stateChanged', 'activeChanged'],
              existsIf: 'data.value'
            }
          }
        });

        // should not exists
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should not be created (no changes on update event)
        node.update({ value: true });
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);

        // should be created
        node.setState(READY, '1');
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(true, node.satellite.test.owner === node);

        // should not be destroyed (no changes on update event)
        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });
        node.update({ value: false });
        this.is(false, checkNode(node));
        this.is(true, !!node.satellite.test);
        this.is(true, node.satellite.test.owner === node);

        // should be destroyed
        node.setActive(!node.active);
        this.is(false, checkNode(node));
        this.is(undefined, node.satellite.test);
        this.is(true, satelliteDestroyed);
      }
    },
    {
      name: 'auto-create satellite can be replaced, auto config should be dropped',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        var satelliteDestroyed = false;
        var newSatellite = new AbstractNode;

        satellite.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.setSatellite('test', newSatellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, warning); // should not be warning
        this.is(true, satelliteDestroyed);
        this.is(true, node.satellite.test === newSatellite);
        this.is(false, 'test' in node.satellite[AUTO]);
      }
    },
    {
      name: 'auto-create satellite can be replaced (not created), auto-config should be dropped',
      test: function(){
        var node = new Node({
          satellite: {
            test: {
              existsIf: basis.fn.$false
            }
          }
        });

        this.is(false, checkNode(node));
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);

        var warn = basis.dev.warn;
        var warning = false;
        var newSatellite = new AbstractNode;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.setSatellite('test', newSatellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(newSatellite));
        this.is(false, warning); // should be warning
        this.is(true, node.satellite.test === newSatellite);
        this.is(false, 'test' in node.satellite[AUTO]);
      }
    },
    {
      name: 'dynamicaly set auto-create satellite (empty config)',
      test: function(){
        var satelliteChangedEventCount = 0;
        var node = new Node({
         handler: {
            satelliteChanged: function(){
              satelliteChangedEventCount++;
            }
          }
        });

        node.setSatellite('test', {});

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(1, satelliteChangedEventCount);

        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        node.setSatellite('test', null);

        this.is(false, checkNode(node));
        this.is(true, satelliteDestroyed);
        this.is(undefined, node.satellite.test);
        this.is(false, 'test' in node.satellite[AUTO]);
        this.is(2, satelliteChangedEventCount);
      }
    },
    {
      name: 'dynamicaly set auto-create satellite with existsIf',
      test: function(){
        var satelliteChangedEventCount = 0;
        var node = new Node({
         handler: {
            satelliteChanged: function(){
              satelliteChangedEventCount++;
            }
          }
        });

        node.setSatellite('test', {
          existsIf: 'data.value'
        });

        this.is(false, checkNode(node));
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(0, satelliteChangedEventCount);

        node.update({
          value: true
        });

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test instanceof AbstractNode);
        this.is(1, satelliteChangedEventCount);

        var satelliteDestroyed = false;
        node.satellite.test.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        node.update({
          value: false
        });

        this.is(false, checkNode(node));
        this.is(true, satelliteDestroyed);
        this.is(undefined, node.satellite.test);
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(2, satelliteChangedEventCount);
      }
    },
    {
      name: 'dynamicaly set auto-create satellite and replace by another auto-create satellite',
      test: function(){
        var satelliteChangedEventCount = 0;
        var node = new Node({
          handler: {
            satelliteChanged: function(){
              satelliteChangedEventCount++;
            }
          }
        });

        node.setSatellite('test', {});

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(1, satelliteChangedEventCount);

        var satellite = node.satellite.test;
        var satelliteDestroyed = false;
        satellite.addHandler({
          destroy: function(){
            satelliteDestroyed = true;
          }
        });

        // satellite.test -> null
        node.setSatellite('test', {
          existsIf: 'data.value'
        });

        this.is(false, checkNode(node));
        this.is(2, satelliteChangedEventCount);
        this.is(false, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test !== satellite);
        this.is(true, satelliteDestroyed);

        // satellite.test -> AbstractNode instance
        node.update({
          value: 1
        });

        this.is(false, checkNode(node));
        this.is(true, 'test' in node.satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(true, node.satellite.test instanceof AbstractNode);
      }
    },
    {
      name: 'auto-create satellite can\'t reset owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner();
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-satellite can\'t reset owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {
              instance: new Node()
            }
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner();
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-create satellite can\'t change owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });
        var newOwner = new Node();

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner(newOwner);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(false, checkNode(newOwner));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-satellite can\'t change owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {
              instance: new Node()
            }
          }
        });
        var newOwner = new Node();

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner(newOwner);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(newOwner));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'non-used auto-satellite can\'t change owner',
      test: function(){
        var satellite = new Node();
        var node = new Node({
          satellite: {
            test: {
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });
        var newOwner = new Node();

        var warn = basis.dev.warn;
        var warning = false;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.setOwner(newOwner);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(newOwner));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(null, satellite.owner);
      }
    },
    {
      name: 'auto-create satellite can\'t moved to another owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });
        var newOwner = new Node();

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          newOwner.setSatellite('name', satellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(newOwner));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, node.satellite.test.owner === node);
      }
    },
    {
      name: 'auto-satellite can\'t moved to another owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {
              instance: new Node()
            }
          }
        });
        var newOwner = new Node();

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          newOwner.setSatellite('name', satellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(newOwner));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-create satellite can\'t change name inside owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.setSatellite('name', satellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning);
        this.is(true, node.satellite.test === satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(false, node.satellite.name === satellite);
        this.is(false, 'name' in node.satellite[AUTO]);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-satellite can\'t change name inside owner',
      test: function(){
        var node = new Node({
          satellite: {
            test: {
              instance: new Node()
            }
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.setSatellite('name', satellite);
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning);
        this.is(true, node.satellite.test === satellite);
        this.is(true, 'test' in node.satellite[AUTO]);
        this.is(false, node.satellite.name === satellite);
        this.is(false, 'name' in node.satellite[AUTO]);
        this.is(true, satellite.owner === node);
      }
    },
    {
      name: 'auto-create satellite can\'t be destroyed',
      test: function(){
        var node = new Node({
          satellite: {
            test: {}
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var satellite = node.satellite.test;
        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          satellite.destroy();
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, checkNode(satellite));
        this.is(true, !!warning); // should be warning
        this.is(true, node.satellite.test === satellite);
        this.is(true, node.satellite.test.owner === node);
      }
    },
    {
      name: 'all satellites should be destroyed with owner',
      test: function(){
        var node = new Node({
          satellite: {
            autoCreateSatellite: {},
            autoSatellite: {
              instance: new Node()
            },
            regularSatellite: new Node()
          }
        });

        var warn = basis.dev.warn;
        var warning = false;
        var autoCreateSatellite = node.satellite.autoCreateSatellite;
        var autoCreateSatelliteDestroyed = false;
        var autoSatellite = node.satellite.autoSatellite;
        var autoSatelliteDestroyed = false;
        var regularSatellite = node.satellite.autoCreateSatellite;
        var regularSatelliteDestroyed = false;

        autoCreateSatellite.addHandler({
          destroy: function(){
            autoCreateSatelliteDestroyed = true;
          }
        });
        autoSatellite.addHandler({
          destroy: function(){
            autoSatelliteDestroyed = true;
          }
        });
        regularSatellite.addHandler({
          destroy: function(){
            regularSatelliteDestroyed = true;
          }
        });

        try {
          basis.dev.warn = function(message){
            warning = message;
          };

          node.destroy();
        } finally {
          basis.dev.warn = warn;
        }

        this.is(false, checkNode(node));
        this.is(false, warning); // no warnings
        this.is(true, autoCreateSatelliteDestroyed);
        this.is(true, autoSatelliteDestroyed);
        this.is(true, regularSatelliteDestroyed);
        this.is(null, node.satellite);
        this.is(null, autoCreateSatellite.owner);
        this.is(null, autoSatellite.owner);
        this.is(null, regularSatellite.owner);
      }
    },
    {
      name: 'instance with existsIf dataSource should not be reset if dataSource is not specified in auto-satellite config',
      test: function(){
        var dataset = new Dataset();
        var satellite = new Node({
          dataSource: dataset
        });
        var node = new Node({
          data: {
            value: true
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.dataSource === dataset);

        node.update({ value: false });
        this.is(false, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(true, satellite.dataSource === dataset);

        node.update({ value: true });
        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.dataSource === dataset);
      }
    },
    {
      name: 'instance with existsIf dataSource should be overrided by auto-satellite config value if specified',
      test: function(){
        var dataset = new Dataset();
        var nodeDataset = new Dataset();
        var satellite = new Node({
          dataSource: dataset
        });
        var node = new Node({
          data: {
            dataset: nodeDataset
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.dataset',
              dataSource: 'data.dataset',
              instance: satellite
            }
          }
        });

        this.is(true, node.data.dataset === nodeDataset);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.dataSource === nodeDataset);

        node.update({ dataset: null });
        this.is(true, node.data.dataset === null);
        this.is(false, 'foo' in node.satellite);
        this.is(true, satellite.dataSource === null);

        node.update({ dataset: nodeDataset });
        this.is(true, node.data.dataset === nodeDataset);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.dataSource === nodeDataset);
      }
    },
    {
      name: 'instance with existsIf delegate should not be reset if delegate is not specified in auto-satellite config',
      test: function(){
        var object = new DataObject();
        var satellite = new Node({
          delegate: object
        });
        var node = new Node({
          data: {
            value: true
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === object);

        node.update({ value: false });
        this.is(false, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(true, satellite.delegate === object);

        node.update({ value: true });
        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === object);
      }
    },
    {
      name: 'instance with existsIf delegate should be overrided by auto-satellite config value if specified',
      test: function(){
        var object = new DataObject();
        var satellite = new Node({
          delegate: object
        });
        var node = new Node({
          data: {
            value: true
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              delegate: basis.fn.$self,
              instance: satellite
            }
          }
        });

        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === node);

        node.update({ value: false });
        this.is(false, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(true, satellite.delegate === null);

        node.update({ value: true });
        this.is(true, node.data.value);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === node);
      }
    },
    {
      name: 'auto-create satellite should apply autoDelegate when no config.delegate',
      test: function(){
        var delegateChangedCount = 0;
        var object = new DataObject();
        var node = new Node({
          data: {
            value: object
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              satelliteClass: Node,
              config: {
                autoDelegate: true,
                handler: {
                  delegateChanged: function(){
                    delegateChangedCount++;
                  }
                }
              }
            }
          }
        });

        this.is(true, node.data.value === object);
        this.is(true, 'foo' in node.satellite);
        this.is(true, node.satellite.foo.delegate === node);
        this.is(1, delegateChangedCount);

        node.update({ value: null });
        this.is(null, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(1, delegateChangedCount);

        node.update({ value: object });
        this.is(true, node.data.value === object);
        this.is(true, 'foo' in node.satellite);
        this.is(true, node.satellite.foo.delegate === node);
        this.is(2, delegateChangedCount);
      }
    },
    {
      name: 'auto-create satellite config delegate value should be used even if satellite has autoDelegate',
      test: function(){
        var delegateChangedCount = 0;
        var object = new DataObject();
        var node = new Node({
          data: {
            value: object
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              delegate: 'data.value',
              satelliteClass: Node,
              config: {
                autoDelegate: true,
                handler: {
                  delegateChanged: function(){
                    delegateChangedCount++;
                  }
                }
              }
            }
          }
        });

        this.is(true, node.data.value === object);
        this.is(true, 'foo' in node.satellite);
        this.is(true, node.satellite.foo.delegate === object);
        this.is(1, delegateChangedCount);

        node.update({ value: null });
        this.is(null, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(1, delegateChangedCount);

        node.update({ value: object });
        this.is(true, node.data.value === object);
        this.is(true, 'foo' in node.satellite);
        this.is(true, node.satellite.foo.delegate === object);
        this.is(2, delegateChangedCount);
      }
    },
    {
      name: 'auto-satellite should apply autoDelegate when no config.delegate',
      test: function(){
        var delegateChangedCount = 0;
        var object = new DataObject();
        var satellite = new Node({
          autoDelegate: true,
          handler: {
            delegateChanged: function(){
              delegateChangedCount++;
            }
          }
        });
        var node = new Node({
          data: {
            value: object
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              instance: satellite
            }
          }
        });

        this.is(true, node.data.value === object);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === node);
        this.is(1, delegateChangedCount);

        node.update({ value: null });
        this.is(null, node.data.value);
        this.is(false, 'foo' in node.satellite);
        this.is(true, satellite.delegate === null);
        this.is(2, delegateChangedCount);

        node.update({ value: object });
        this.is(true, node.data.value === object);
        this.is(true, node.satellite.foo === satellite);
        this.is(true, satellite.delegate === node);
        this.is(3, delegateChangedCount);
      }
    },
    {
      name: 'auto-satellite config delegate value should be used even if satellite has autoDelegate',
      test: function(){
        var delegateChangedCount = 0;
        var object = new DataObject();
        var satellite = new Node({
          autoDelegate: true,
          handler: {
            delegateChanged: function(){
              delegateChangedCount++;
            }
          }
        });
        var node = new Node({
          data: {
            value: object
          },
          satellite: {
            foo: {
              events: 'update',
              existsIf: 'data.value',
              delegate: 'data.value',
              instance: satellite
            }
          }
        });

        assert(node.data.value === object);
        assert(node.satellite.foo === satellite);
        assert(satellite.delegate === object);
        assert(delegateChangedCount === 1);

        node.update({ value: null });
        assert(node.data.value === null);
        assert('foo' in node.satellite === false);
        assert(satellite.delegate === null);
        assert(delegateChangedCount === 2);

        node.update({ value: object });
        assert(node.data.value === object);
        assert(node.satellite.foo === satellite);
        assert(satellite.delegate === object);
        assert(delegateChangedCount === 3);
      }
    },
    {
      name: 'instances and classes should be able to reset satellite',
      test: function(){
        var MyNode = Node.subclass({
          satellite: {
            foo: Node
          }
        });

        var foo = new MyNode();
        var bar = new MyNode({
          satellite: {
            foo: null
          }
        });

        assert(foo.satellite.foo instanceof Node);

        assert(bar.satellite.foo === undefined);
        assert('foo' in bar.satellite == false);
      }
    }
  ]
};
