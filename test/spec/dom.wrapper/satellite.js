module.exports = {
  name: 'Satellite',
  test: [
    {
      name: 'Common',
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

            assert(checkNode(node1) === false);
            assert(checkNode(node2) === false);
            assert(checkNode(satellite) === false);
            assert(node1.satellite.example === satellite);
            assert(node1.satellite.example.owner === node1);
            assert(ownerChangedCount === 1);

            assert(catchWarnings(function(){
              node2.setSatellite('somename', node1.satellite.example);
            }) === false);

            assert(checkNode(node1) === false);
            assert(checkNode(node2) === false);
            assert(checkNode(satellite) === false);
            assert(ownerChangedCount === 2);
            assert(node1.satellite.example === undefined);
            assert(node2.satellite.somename === satellite);
            assert(satellite.owner === node2);
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

            assert(checkNode(node1) === false);
            assert(checkNode(node2) === false);
            assert(checkNode(satellite) === false);
            assert(node1.satellite.example === satellite);
            assert(node1.satellite.example.owner === node1);
            assert(true, ownerChangedCount === 1);

            assert(catchWarnings(function(){
              satellite.setOwner(node2);
            }) === false);

            assert(checkNode(node1) === false);
            assert(checkNode(node2) === false);
            assert(checkNode(satellite) === false);
            assert(true, ownerChangedCount === 2);
            assert(node1.satellite.example === undefined);
            assert(satellite.owner === node2);
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

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satellite.owner === node);
            assert(node.satellite.test === satellite);

            assert(catchWarnings(function(){
              satellite.setOwner();
            }) === false);

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satellite.owner === null);
            assert(node.satellite.test === undefined);
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

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satellite.owner === node);
            assert(node.satellite.test === satellite);
            assert(satelliteChangedEventCount === 1);
            assert(ownerChangedEventCount === 1);

            node.setSatellite('newName', satellite);
            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satellite.owner === node);
            assert(node.satellite.test === undefined);
            assert(node.satellite.newName === satellite);
            assert(satelliteChangedEventCount === 3);
            assert(ownerChangedEventCount === 1);
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

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satellite.owner === node);
            assert(node.satellite.test === satellite);

            var satelliteDestroyed = false;
            satellite.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            node.destroy();

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(satelliteDestroyed === true);
            assert(node.satellite === null);
            assert(satellite.owner === null);
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

            assert(catchWarnings(function(){
              node.destroy();
            }) === false);

            assert(checkNode(node) === false);
            assert(autoCreateSatelliteDestroyed === true);
            assert(autoSatelliteDestroyed === true);
            assert(regularSatelliteDestroyed === true);
            assert(node.satellite === null);
            assert(autoCreateSatellite.owner === null);
            assert(autoSatellite.owner === null);
            assert(regularSatellite.owner === null);
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

            assert(checkNode(node) === false);
            assert(checkNode(owner) === false);
            assert(node.owner === owner);

            owner.destroy();

            assert(checkNode(node) === false);
            assert(checkNode(owner) === false);
            assert(nodeDestroyed === false);
            assert(ownerDestroyed === true);
            assert(node.owner === null);
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
        },
        {
          name: 'getSatellitesDataset must return satellite dataset',
          test: function(){
            var MyNode = Node.subclass({
              satellite: {
                foo: Node,
                bar: Node,
                baz: Node
              }
            });

            var someNode = new MyNode();
            var satelliteDataset = someNode.getSatellitesDataset();

            assert(satelliteDataset instanceof SatellitesDataset);
            assert(getSatelliteList(someNode), satelliteDataset.getItems());

            someNode.satellite.foo.destroy();
            assert(getSatelliteList(someNode), satelliteDataset.getItems());

            someNode.destroy();
            assert(!satelliteDataset.itemCount);
          }
        }
      ]
    },
    {
      name: 'Auto-create satellite',
      test: [
        {
          name: 'create',
          test: [
            {
              name: 'should create satellite when config is empty',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });

                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test instanceof AbstractNode);
                assert(node.satellite.test.owner === node);
                assert('test' in node.satellite[AUTO]);
              }
            },
            {
              name: 'should use value of config when creates new instance',
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

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert(node.satellite.test.foo === 'bar');

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

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert(node.satellite.test.foo === 'bar');
                assert(node.satellite.test.ownerObjectId === node.basisObjectId);
              }
            },
            {
              name: 'should create satellite only when existsIf is true',
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
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should be created
                node.update({ value: true });
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test instanceof AbstractNode);
                assert(node.satellite.test.owner === node);

                // should be destroyed
                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });
                node.update({ value: false });
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(satelliteDestroyed === true);
              }
            },
            {
              name: 'should not create new instance on events',
              test: function(){
                // use existsIf config
                var node = new Node({
                  satellite: {
                    test: {
                      existsIf: basis.fn.$true  // otherwise event listener wouldn't be added
                    }
                  }
                });
                var satellite = node.satellite.test;
                var satelliteDestroyed = false;
                var updated = false;

                node.addHandler({
                  update: function(){
                    updated = true;
                  }
                });
                satellite.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });

                node.update({ value: NaN });
                assert(checkNode(node) === false);
                assert(satelliteDestroyed === false);
                assert(updated === true);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should resolve value of bb-value set for existsIf',
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
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should be created
                token.set(true);
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test instanceof AbstractNode);
                assert(node.satellite.test.owner === node);

                // should be destroyed
                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });

                token.set(false);
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(satelliteDestroyed === true);
                assert(token.handler != null);

                node.destroy();
                assert(token.handler == null);
              }
            }
          ]
        },
        {
          name: 'events',
          test: [
            {
              name: 'should be possible don\'t listen events by setting false/null/empty string/array to events setting',
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

                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(node.handler === null);
                node.update({ value: true });
                assert(node.satellite.test === undefined);

                // set false
                var node = new Node({
                  satellite: {
                    test: {
                      events: false,
                      existsIf: 'data.value'
                    }
                  }
                });

                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(!node.handler === true);
                node.update({ value: true });
                assert(node.satellite.test === undefined);

                // set empty string
                var node = new Node({
                  satellite: {
                    test: {
                      events: '',
                      existsIf: 'data.value'
                    }
                  }
                });

                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(!node.handler === true);
                node.update({ value: true });
                assert(node.satellite.test === undefined);

                // set empty array
                var node = new Node({
                  satellite: {
                    test: {
                      events: [],
                      existsIf: 'data.value'
                    }
                  }
                });

                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(!node.handler === true);
                node.update({ value: true });
                assert(node.satellite.test === undefined);
              }
            },
            {
              name: 'should be possible set custom events with string',
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
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should not be created (no changes on update event)
                node.update({ value: true });
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should be created
                node.setState(READY, '1');
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test instanceof AbstractNode);
                assert(node.satellite.test.owner === node);

                // should not be destroyed (no changes on update event)
                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });
                node.update({ value: false });
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test.owner === node);

                // should be destroyed
                node.setActive(!node.active);
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(satelliteDestroyed === true);

              }
            },
            {
              name: 'should be possible set custom events with array',
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
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should not be created (no changes on update event)
                node.update({ value: true });
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);

                // should be created
                node.setState(READY, '1');
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test instanceof AbstractNode);
                assert(node.satellite.test.owner === node);

                // should not be destroyed (no changes on update event)
                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });
                node.update({ value: false });
                assert(checkNode(node) === false);
                assert(!!node.satellite.test === true);
                assert(node.satellite.test.owner === node);

                // should be destroyed
                node.setActive(!node.active);
                assert(checkNode(node) === false);
                assert(node.satellite.test === undefined);
                assert(satelliteDestroyed === true);
              }
            }
          ]
        },
        {
          name: 'delegate & dataSource',
          test: [
            {
              name: 'should set delegate/dataSource for new instance if those values set in config',
              test: function(){
                // use existsIf config
                var delegate = new DataObject;
                var dataSource = new Dataset;
                var node = new Node({
                  delegateForSatellite: delegate,
                  dataSourceForSatellite: dataSource,
                  satellite: {
                    test: {
                      instance: Node,
                      delegate: 'delegateForSatellite',
                      dataSource: 'dataSourceForSatellite'
                    }
                  }
                });

                var satellite = node.satellite.test;

                // should be created
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(satellite.delegate === delegate);
                assert(satellite.dataSource === dataSource);
              }
            },
            {
              name: 'should be created with delegate/dataSource (set delegate/dataSource before postInit – templateUpdate issue)',
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
                      instance: Node.subclass({
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
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(delegateSetBeforePostInit === true);
                assert(dataSourceSetBeforePostInit === true);
                assert(satellite.delegate === delegate);
                assert(satellite.dataSource === dataSource);
              }
            }
          ]
        },
        {
          name: 'change satellite descriptor',
          test: [
            {
              name: 'should be possible replace satellite by new description, auto-descriptor should be dropped',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);

                var satellite = node.satellite.test;
                var satelliteDestroyed = false;
                var newSatellite = new Node;

                satellite.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });

                assert(catchWarnings(function(){
                  node.setSatellite('test', newSatellite);
                }) === false);

                assert(satelliteDestroyed === true);
                assert(checkNode(node) === false);
                assert(checkNode(newSatellite) === false);
                assert(node.satellite.test === newSatellite);
                assert('test' in node.satellite[AUTO] === false);
              }
            },
            {
              name: 'should be possible replace satellite by new description w/o creating, auto-config should be dropped',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {
                      existsIf: basis.fn.$false
                    }
                  }
                });

                assert(checkNode(node) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);

                var newSatellite = new Node;
                assert(catchWarnings(function(){
                  node.setSatellite('test', newSatellite);
                }) === false);

                assert(checkNode(node) === false);
                assert(checkNode(newSatellite) === false);
                assert(node.satellite.test === newSatellite);
                assert('test' in node.satellite[AUTO] === false);
              }
            },
            {
              name: 'should apply autoDelegate if no delegate in descriptor',
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
                      instance: Node,
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

                assert(node.data.value === object);
                assert('foo' in node.satellite);
                assert(node.satellite.foo.delegate === node);
                assert(delegateChangedCount === 1);

                node.update({ value: null });
                assert(node.data.value === null);
                assert('foo' in node.satellite === false);
                assert(delegateChangedCount === 1);

                node.update({ value: object });
                assert(node.data.value === object);
                assert('foo' in node.satellite);
                assert(node.satellite.foo.delegate === node);
                assert(delegateChangedCount === 2);
              }
            },
            {
              name: 'should ignore autoDelegate if delegate is specified in descriptor',
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
                      instance: Node,
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

                assert(node.data.value === object);
                assert('foo' in node.satellite);
                assert(node.satellite.foo.delegate === object);
                assert(delegateChangedCount === 1);

                node.update({ value: null });
                assert(node.data.value === null);
                assert('foo' in node.satellite === false);
                assert(delegateChangedCount === 1);

                node.update({ value: object });
                assert(node.data.value === object);
                assert('foo' in node.satellite);
                assert(node.satellite.foo.delegate === object);
                assert(delegateChangedCount === 2);
              }
            }
          ]
        },
        {
          name: 'set auto-create satellite in runtime',
          test: [
            {
              name: 'empty config',
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

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.test instanceof AbstractNode);
                assert(satelliteChangedEventCount === 1);

                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });

                node.setSatellite('test', null);

                assert(checkNode(node) === false);
                assert(satelliteDestroyed === true);
                assert(node.satellite.test === undefined);
                assert('test' in node.satellite[AUTO] === false);
                assert(satelliteChangedEventCount === 2);
              }
            },
            {
              name: 'config with existsIf',
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

                assert(checkNode(node) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);
                assert(satelliteChangedEventCount === 0);

                node.update({
                  value: true
                });

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.test instanceof AbstractNode);
                assert(satelliteChangedEventCount === 1);

                var satelliteDestroyed = false;
                node.satellite.test.addHandler({
                  destroy: function(){
                    satelliteDestroyed = true;
                  }
                });

                node.update({
                  value: false
                });

                assert(checkNode(node) === false);
                assert(satelliteDestroyed === true);
                assert(node.satellite.test === undefined);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);
                assert(satelliteChangedEventCount === 2);
              }
            },
            {
              name: 'set descriptor and than replace by another one',
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

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);
                assert(satelliteChangedEventCount === 1);

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

                assert(checkNode(node) === false);
                assert(satelliteChangedEventCount === 2);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.test !== satellite);
                assert(satelliteDestroyed === true);

                // satellite.test -> AbstractNode instance
                node.update({
                  value: 1
                });

                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.test instanceof AbstractNode);
              }
            }
          ]
        },
        {
          name: 'owner changing',
          test: [
            {
              name: 'should not reset owner',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });
                var satellite = node.satellite.test;

                assert(catchWarnings(function(){
                  satellite.setOwner();
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should not change owner',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });
                var newOwner = new Node();
                var satellite = node.satellite.test;

                assert(catchWarnings(function(){
                  satellite.setOwner(newOwner);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(checkNode(newOwner) === false);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should not move to another owner',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });
                var newOwner = new Node();
                var satellite = node.satellite.test;

                assert(catchWarnings(function(){
                  newOwner.setSatellite('name', satellite);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(newOwner) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(node.satellite.test.owner === node);
              }
            },
            {
              name: 'should not change name inside owner',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });
                var satellite = node.satellite.test;

                assert(catchWarnings(function(){
                  node.setSatellite('name', satellite);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.name !== satellite);
                assert('name' in node.satellite[AUTO] === false);
                assert(satellite.owner === node);
              }
            }
          ]
        },
        {
          name: 'destroy and links',
          test: [
            {
              name: 'should be destroyed after satelliteChanged event emit on owner',
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
                assert(checkNode(node) === false);
                assert('test' in node.satellite);

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
                assert(checkNode(node) === false);
                assert('test' in node.satellite === false);
                assert(['satelliteChanged', 'destroy'], events);
              }
            },
            {
              name: 'can\'t be destroyed by user',
              test: function(){
                var node = new Node({
                  satellite: {
                    test: {}
                  }
                });

                var satellite = node.satellite.test;

                assert(catchWarnings(function(){
                  satellite.destroy();
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(node.satellite.test.owner === node);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Auto-attach satellite',
      test: [
        {
          name: 'should attach instance',
          test: function(){
            var satellite = new Node();
            var node = new Node({
              satellite: {
                test: {
                  instance: satellite
                }
              }
            });

            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert('test' in node.satellite);
            assert('test' in node.satellite[AUTO]);
            assert(node.satellite.test === satellite);
            assert(node.satellite.test.owner === node);
          }
        },
        {
          name: 'should attach instance only when existsIf is true',
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
            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert('test' in node.satellite === false);
            assert('test' in node.satellite[AUTO]);
            assert(node.satellite.test === undefined);
            assert(satelliteDestroyed === false);

            // should be created
            node.update({ value: true });
            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert('test' in node.satellite);
            assert('test' in node.satellite[AUTO]);
            assert(node.satellite.test === satellite);
            assert(satellite.owner === node);

            // should not be destroyed
            node.update({ value: false });
            assert(checkNode(node) === false);
            assert(checkNode(satellite) === false);
            assert(node.satellite.test === undefined);
            assert(satelliteDestroyed === false);
            assert('test' in node.satellite === false);
            assert('test' in node.satellite[AUTO]);
            assert(satellite.owner !== node);
          }
        },
        {
          name: 'delegate & dataSource',
          test: [
            {
              name: 'should set delegate/dataSource for instance if necessary when attach instance',
              test: function(){
                // use existsIf config
                var delegate = new DataObject;
                var dataSource = new Dataset;
                var node = new Node({
                  delegateForSatellite: delegate,
                  dataSourceForSatellite: dataSource,
                  satellite: {
                    test: {
                      instance: new Node(),
                      delegate: 'delegateForSatellite',
                      dataSource: 'dataSourceForSatellite'
                    }
                  }
                });

                var satellite = node.satellite.test;

                // should be created
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(satellite.delegate === delegate);
                assert(satellite.dataSource === dataSource);
              }
            },
            {
              name: 'should set delegate/dataSource for instance only when existsIf is true',
              test: function(){
                // use existsIf config
                var delegate = new DataObject;
                var dataSource = new Dataset;
                var satellite = new Node();
                var node = new Node({
                  delegateForSatellite: delegate,
                  dataSourceForSatellite: dataSource,
                  satellite: {
                    test: {
                      existsIf: 'data.value',
                      instance: satellite,
                      delegate: 'delegateForSatellite',
                      dataSource: 'dataSourceForSatellite'
                    }
                  }
                });

                // instance is not linked and delegate/dataSource is not set
                assert(checkNode(node) === false);
                assert('test' in node.satellite === false);
                assert(satellite.owner === null);
                assert(satellite.delegate === null);
                assert(satellite.dataSource === null);

                // set delegate/dataSource when instance in use
                node.update({ value: true });
                assert(checkNode(node) === false);
                assert('test' in node.satellite);
                assert(satellite.owner === node);
                assert(satellite.delegate === delegate);
                assert(satellite.dataSource === dataSource);

                // reset delegate/dataSource when instance not in use
                node.update({ value: false });
                assert(checkNode(node) === false);
                assert('test' in node.satellite === false);
                assert(satellite.owner === null);
                assert(satellite.delegate === null);
                assert(satellite.dataSource === null);
              }
            },
            {
              name: 'dataSource should not be reset if dataSource is not specified in descriptor',
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

                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.dataSource === dataset);

                node.update({ value: false });
                assert(node.data.value === false);
                assert('foo' in node.satellite === false);
                assert(satellite.dataSource === dataset);

                node.update({ value: true });
                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.dataSource === dataset);
              }
            },
            {
              name: 'dataSource should be overrided by descriptor value if specified',
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

                assert(node.data.dataset === nodeDataset);
                assert(node.satellite.foo === satellite);
                assert(satellite.dataSource === nodeDataset);

                node.update({ dataset: null });
                assert(node.data.dataset === null);
                assert('foo' in node.satellite === false);
                assert(satellite.dataSource === null);

                node.update({ dataset: nodeDataset });
                assert(node.data.dataset === nodeDataset);
                assert(node.satellite.foo === satellite);
                assert(satellite.dataSource === nodeDataset);
              }
            },
            {
              name: 'delegate should not be reset if delegate is not specified in descriptor',
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

                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === object);

                node.update({ value: false });
                assert(node.data.value === false);
                assert('foo' in node.satellite === false);
                assert(satellite.delegate === object);

                node.update({ value: true });
                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === object);
              }
            },
            {
              name: 'delegate should be overrided by descriptor value if specified',
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

                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === node);

                node.update({ value: false });
                assert(node.data.value === false);
                assert('foo' in node.satellite === false);
                assert(satellite.delegate === null);

                node.update({ value: true });
                assert(node.data.value === true);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === node);
              }
            },
            {
              name: 'should apply autoDelegate if no delegate in descriptor',
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

                assert(node.data.value === object);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === node);
                assert(delegateChangedCount === 1);

                node.update({ value: null });
                assert(node.data.value === null);
                assert('foo' in node.satellite === false);
                assert(satellite.delegate === null);
                assert(delegateChangedCount === 2);

                node.update({ value: object });
                assert(node.data.value === object);
                assert(node.satellite.foo === satellite);
                assert(satellite.delegate === node);
                assert(delegateChangedCount === 3);
              }
            },
            {
              name: 'should ignore autoDelegate if delegate is specified in descriptor',
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
            }
          ]
        },
        {
          name: 'owner changing',
          test: [
            {
              name: 'should not reset owner',
              test: function(){
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: satellite
                    }
                  }
                });

                assert(catchWarnings(function(){
                  satellite.setOwner();
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should not change owner',
              test: function(){
                var newOwner = new Node();
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: satellite
                    }
                  }
                });

                assert(catchWarnings(function(){
                  satellite.setOwner(newOwner);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(newOwner) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should not change owner even if detached',
              test: function(){
                var newOwner = new Node();
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      existsIf: 'data.value',
                      instance: satellite
                    }
                  }
                });

                assert(catchWarnings(function(){
                  satellite.setOwner(newOwner);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(newOwner) === false);
                assert(checkNode(satellite) === false);
                assert(satellite.owner === null);
              }
            },
            {
              name: 'should not move to another owner',
              test: function(){
                var newOwner = new Node();
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: satellite
                    }
                  }
                });

                assert(catchWarnings(function(){
                  newOwner.setSatellite('name', satellite);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(newOwner) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert(satellite.owner === node);
              }
            },
            {
              name: 'should not change name inside owner',
              test: function(){
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: satellite
                    }
                  }
                });

                assert(catchWarnings(function(){
                  node.setSatellite('name', satellite);
                }) !== false);

                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(node.satellite.test === satellite);
                assert('test' in node.satellite[AUTO]);
                assert(node.satellite.name !== satellite);
                assert('name' in node.satellite[AUTO] === false);
                assert(satellite.owner === node);
              }
            }
          ]
        },
        {
          name: 'destroy and links',
          test: [
            {
              name: 'satellite should unlink from it\'s owner on destroy',
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
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert('test' in node.satellite);
                assert('test' in node.satellite[AUTO]);
                assert(satellite.owner === node);
                assert(satelliteDestroyed === false);

                // should unlink from owner
                satellite.destroy();
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO] === false);
                assert(satelliteDestroyed === true);
                assert(satellite.owner === null);
              }
            },
            {
              name: 'satellite with exitstIf should unlink from it\'s owner on destroy',
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
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);
                assert(satellite.owner === null);
                assert(satelliteDestroyed === false);

                // should unlink from owner
                satellite.destroy();
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO] === false);
                assert(satelliteDestroyed === true);
                assert(satellite.owner === null);
              }
            },
            {
              name: 'should be destroyed on owner destroy',
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
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert('test' in node.satellite === false);
                assert('test' in node.satellite[AUTO]);
                assert(satellite.owner === null);
                assert(satelliteDestroyed === false);

                // should unlink from owner
                node.destroy();
                assert(checkNode(node) === false);
                assert(checkNode(satellite) === false);
                assert(satelliteDestroyed === true);
                assert(satellite.owner === null);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Various types of value for instance',
      test: [
        {
          name: 'function & factory',
          test: [
            {
              name: 'should accept any function as factory',
              test: function(){
                var satellite = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: function(){
                        return satellite;
                      }
                    }
                  }
                });

                assert(node.satellite.test === satellite);
              }
            },
            {
              name: 'should pass owner to factory function',
              test: function(){
                var node = new Node({
                  foo: new Node(),
                  satellite: {
                    test: {
                      instance: function(owner){
                        return owner.foo;
                      }
                    }
                  }
                });

                assert(node.satellite.test === node.foo);
              }
            },
            {
              name: 'should work with factories as expected',
              test: function(){
                var foo = new Node();
                var bar = new Node();
                var node = new Node({
                  data: {
                    test: foo
                  },
                  satellite: {
                    test: Value.factory('update', 'data.test')
                  }
                });

                assert(node.satellite.test === foo);

                node.update({
                  test: bar
                });
                assert(node.satellite.test === bar);

                node.update({
                  test: null
                });
                assert(node.satellite.test === undefined);

                node.update({
                  test: foo
                });
                assert(node.satellite.test === foo);
              }
            },
            {
              name: 'should convert string to simple getter',
              test: function(){
                var node = new Node({
                  foo: new Node(),
                  satellite: {
                    test: {
                      instance: 'foo'
                    }
                  }
                });

                assert(node.satellite.test === node.foo);
              }
            },
            {
              name: 'function could return class it should be used to build instance',
              test: function(){
                var NodeSubclass = Node.subclass();
                var node = new Node({
                  satellite: {
                    test: function(){
                      return NodeSubclass;
                    }
                  }
                });

                assert(node.satellite.test instanceof NodeSubclass);
              }
            },
            {
              name: 'should be invoked only once',
              test: [
                {
                  name: 'instance',
                  test: function(){
                    var count = 0;
                    var satellite = new Node();
                    var node = new Node({
                      satellite: {
                        test: {
                          existsIf: 'data.exists',
                          instance: function(){
                            count++;
                            return satellite;
                          }
                        }
                      }
                    });

                    assert(count === 0);
                    assert(node.satellite.test === undefined);

                    node.update({
                      exists: true
                    });
                    assert(count === 1);
                    assert(node.satellite.test === satellite);

                    node.update({
                      exists: false
                    });
                    assert(count === 1);
                    assert(node.satellite.test === undefined);

                    node.update({
                      exists: true
                    });
                    assert(count === 1);
                    assert(node.satellite.test === satellite);
                  }
                },
                {
                  name: 'class',
                  test: function(){
                    var count = 0;
                    var FirstClass;
                    var node = new Node({
                      satellite: {
                        test: {
                          existsIf: 'data.exists',
                          instance: function(){
                            var Class = Node.subclass({});
                            count++;
                            if (!FirstClass)
                              FirstClass = Class;
                            return Class;
                          }
                        }
                      }
                    });

                    assert(count === 0);
                    assert(node.satellite.test === undefined);

                    node.update({
                      exists: 1
                    });
                    assert(count === 1);
                    assert(node.satellite.test instanceof FirstClass);

                    node.update({
                      exists: 2
                    });
                    assert(count === 1);
                    assert(node.satellite.test instanceof FirstClass);

                    node.update({
                      exists: 0
                    });
                    assert(count === 1);
                    assert(node.satellite.test === undefined);

                    node.update({
                      exists: 3
                    });
                    assert(count === 1);
                    assert(node.satellite.test instanceof FirstClass);
                  }
                },
                {
                  name: 'should corrupt other object with same config',
                  test: function(){
                    var count = 0;
                    var NodeSubclass = Node.subclass({
                      satellite: {
                        fn: Value.factory('node'),
                        cls: {
                          existsIf: function(owner){
                            return !owner.data.nonExists;
                          },
                          instance: function(owner){
                            count++;
                            return Node.subclass({
                              test: owner
                            });
                          }
                        }
                      }
                    });

                    var fooSatellite = new Node();
                    var foo = new NodeSubclass({
                      node: fooSatellite
                    });
                    var barSatellite = new Node();
                    var bar = new NodeSubclass({
                      node: barSatellite
                    });

                    assert(count === 2);
                    assert(foo.satellite.fn === fooSatellite);
                    assert(foo.satellite.cls.test === foo);
                    assert(bar.satellite.fn === barSatellite);
                    assert(bar.satellite.cls.test === bar);

                    foo.update({ nonExists: true });
                    assert(count === 2);
                    assert(foo.satellite.cls === undefined);

                    foo.update({ nonExists: false });
                    assert(count === 2);
                    assert(foo.satellite.cls.test === foo);
                  }
                }
              ]
            }
          ]
        },
        {
          name: 'bb-value',
          test: [
            {
              name: 'should resolve bb-value for instance property',
              test: function(){
                var token = new basis.Token();
                var foo = new Node();
                var bar = new Node();
                var node = new Node({
                  satellite: {
                    test: {
                      instance: token
                    }
                  }
                });

                assert(node.satellite.test === undefined);
                assert('test' in node.satellite == false);

                token.set(foo);
                assert(node.satellite.test === foo);

                token.set(bar);
                assert(node.satellite.test === bar);

                token.set(null);
                assert(node.satellite.test === undefined);
                assert('test' in node.satellite == false);

                token.set(foo);
                assert(node.satellite.test === foo);
              }
            },
            {
              name: 'should works fine with existsIf',
              test: function(){
                var foo = new Node();
                var token = new basis.Token(foo);
                var exists = new basis.Token(true);
                var node = new Node({
                  satellite: {
                    test: {
                      existsIf: exists,
                      instance: token
                    }
                  }
                });

                assert(node.satellite.test === foo);

                token.set();
                assert(node.satellite.test === undefined);

                token.set(foo);
                assert(node.satellite.test === foo);

                token.set();
                assert(node.satellite.test === undefined);

                exists.set(false);
                assert(node.satellite.test === undefined);

                token.set(foo);
                assert(node.satellite.test === undefined);

                exists.set(true);
                assert(node.satellite.test === foo);
              }
            },
            {
              name: 'should use resource content when bb-value returns resource',
              test: function(){
                var foo = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });
                var bar = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });

                var token = new basis.Token('foo');
                var node = new Node({
                  satellite: {
                    test: token.as(function(name){
                      return name == 'foo' ? foo : bar;
                    })
                  }
                });

                assert(node.satellite.test === foo.fetch());

                token.set('bar');
                assert(node.satellite.test === bar.fetch());

                token.set('foo');
                assert(node.satellite.test === foo.fetch());
              }
            },
            {
              name: 'complex case with value resolve and destroy',
              test: function(){
                var foo = new Node();
                var bar = new Node();
                var baz = new Node();
                var bbValue = Value.from(bar, 'delegateChanged', 'delegate');
                var node = new Node({
                  satellite: {
                    test: {
                      instance: bbValue
                    }
                  }
                });

                assert(node.satellite.test === undefined);
                assert('test' in node.satellite == false);

                bar.setDelegate(foo);
                assert(node.satellite.test === foo);

                foo.destroy();
                assert(node.satellite.test === undefined);
                assert('test' in node.satellite == false);

                bar.setDelegate(baz);
                assert(node.satellite.test === baz);
              }
            },
            {
              name: 'node should lost satellite delivered by bb-value when another node capture it value via bb-value',
              test: function(){
                var foo = new Node();
                var token = new basis.Token(foo);
                var node = new Node({
                  satellite: {
                    test: {
                      instance: token
                    }
                  }
                });

                assert(node.satellite.test === foo);

                var anotherNode = new Node({
                  satellite: {
                    test: token
                  }
                });

                assert(node.satellite.test === foo);
                assert(node.satellite.test.delegate === null);
                assert(anotherNode.satellite.test === undefined);
                assert(anotherNode.satellite[AUTO].test === undefined);
              }
            },
            {
              name: 'node should not lost satellite delivered by bb-value when another node capture it value',
              test: function(){
                var foo = new Node();
                var token = new basis.Token(foo);
                var node = new Node({
                  satellite: {
                    test: {
                      instance: token
                    }
                  }
                });

                assert(node.satellite.test === foo);

                var anotherNode = new Node({
                  satellite: {
                    test: foo
                  }
                });

                assert(node.satellite.test === foo);
                assert(node.satellite.test.delegate === null);
                assert(anotherNode.satellite.test === undefined);
                assert(anotherNode.satellite[AUTO] === undefined);
              }
            }
          ]
        },
        {
          name: 'resource as instance value',
          test: [
            {
              name: 'should accept resource as instance value',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });

                var node = new Node({
                  satellite: {
                    foo: {
                      instance: resource
                    }
                  }
                });

                assert('foo' in node.satellite);
                assert(node.satellite.foo instanceof Node);
                assert(node.satellite.foo === resource.fetch());
              }
            },
            {
              name: 'should accept resource as implicit instance value',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });

                var node = new Node({
                  satellite: {
                    foo: resource
                  }
                });

                assert('foo' in node.satellite);
                assert(node.satellite.foo instanceof Node);
                assert(node.satellite.foo === resource.fetch());
              }
            },
            {
              name: 'resource should be resolved only when used',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });

                var node = new Node({
                  satellite: {
                    foo: {
                      existsIf: 'data.exist',
                      instance: resource
                    }
                  }
                });

                assert('foo' in node.satellite === false);
                assert(node.satellite.foo === undefined);
                assert(resource.isResolved() === false);

                node.update({
                  exist: true
                });
                assert('foo' in node.satellite);
                assert(node.satellite.foo instanceof Node);
                assert(node.satellite.foo === resource.fetch());
              }
            },
            {
              name: 'resource could return class and it should be used to build instance',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  module.exports = Node.subclass();
                });

                var node = new Node({
                  satellite: {
                    foo: resource
                  }
                });

                assert('foo' in node.satellite);
                assert(node.satellite.foo instanceof Node);
                assert(node.satellite.foo instanceof resource.fetch());
              }
            },
            {
              name: 'node should not lost satellite delivered by resource when another node try to capture it',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  module.exports = new Node();
                });

                var node = new Node({
                  satellite: {
                    test: {
                      instance: resource
                    }
                  }
                });

                assert(node.satellite.test === resource.fetch());

                var delegate = new Node();
                var anotherNode = new Node({
                  satellite: {
                    test: {
                      delegate: delegate,
                      instance: resource
                    }
                  }
                });

                assert(node.satellite.test === resource.fetch());
                assert(node.satellite.test.delegate === null);
                assert(anotherNode.satellite.test === undefined);
                assert(anotherNode.satellite[AUTO].test === undefined);
              }
            },
            {
              name: 'transpiled es6 module resource as instance value',
              test: function(){
                var resource = basis.resource.virtual('js', function(exports, module){
                  Object.defineProperty(module.exports, '__esModule', { value: true });
                  module.exports.default = new Node();
                });

                var node = new Node({
                  satellite: {
                    foo: resource
                  }
                });

                assert('foo' in node.satellite);
                assert(node.satellite.foo instanceof Node);
                assert(node.satellite.foo === resource.fetch().default);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'edge cases',
      test: [
        {
          name: 'should no warnings on node destroy with satellite that has a Value.from() instances',
          test: function(){
            var node = new Node({
              satellite: {
                foo: new Node()
              }
            });

            Value.from(node.satellite.foo, 'ownerChanged', 'owner');

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            assert(warning === false);
          }
        },
        {
          name: 'should no warnings on node destroy with satellite that has a Value.from().pipe() instances',
          test: function(){
            var node = new Node({
              satellite: {
                foo: new Node()
              }
            });

            Value.from(node, 'satelliteChanged', 'satellite.foo').pipe('update', 'data.data');

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.satellite.foo.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            assert(warning === false);
          }
        },
        {
          name: 'should no warnings on node destroy with satellite that has a Value.from().pipe() instances',
          test: function(){
            var node = new Node({
              childNodes: [
                new Node({
                  selected: Value.factory('update', 'data.foo')
                })
              ]
            });

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.firstChild.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            assert(warning === false);
          }
        }
      ]
    }
  ]
};
