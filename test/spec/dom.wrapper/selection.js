module.exports = {
  name: 'selection',
  test: [
    {
      name: 'basic',
      test: [
        {
          name: 'created node should be non-selected by default',
          test: function(){
            var node = new Node();

            assert(node.selected === false);
          }
        },
        {
          name: 'should be possible specify selected on node create, no events should be emited',
          test: function(){
            var events = [];
            var node = new Node({
              selected: true,
              debug_emit: function(evt){
                if (evt.type == 'select' || evt.type == 'unselect')
                  events.push(evt.type);
              }
            });

            assert(node.selected === true);
            assert([], events);
          }
        },
        {
          name: 'should not change selected on destroy, no events should be emited',
          test: function(){
            var events = [];
            var node = new Node({
              selected: true,
              debug_emit: function(evt){
                if (evt.type == 'select' || evt.type == 'unselect')
                  events.push(evt.type);
              }
            });

            node.destroy();

            assert(node.selected === true);
            assert([], events);
          }
        },
        {
          name: 'when selected changed method should returns true and false otherwise, no events if no changes',
          test: function(){
            // helper class
            var TestNode = Node.subclass({
              init: function(){
                this.events = [];
                Node.prototype.init.call(this);
              },
              debug_emit: function(evt){
                if (evt.type == 'select' || evt.type == 'unselect')
                  this.events.push(evt.type);
              }
            });

            //
            // main part
            //

            // selected
            var node = new TestNode();
            assert(node.select() === true);
            assert(node.select() === false);
            assert(node.select(true) === false);
            assert(['select'], node.events);

            var node = new TestNode();
            assert(node.select(true) === true);
            assert(node.select(true) === false);
            assert(node.select() === false);
            assert(['select'], node.events);

            var node = new TestNode();
            assert(node.setSelected(true) === true);
            assert(node.setSelected(true) === false);
            assert(node.setSelected(true, true) === false);
            assert(['select'], node.events);

            var node = new TestNode();
            assert(node.setSelected(true, true) === true);
            assert(node.setSelected(true, true) === false);
            assert(node.setSelected(true) === false);
            assert(['select'], node.events);

            // unselect
            var node = new TestNode({ selected: true });
            assert(node.unselect() === true);
            assert(node.unselect() === false);
            assert(['unselect'], node.events);

            var node = new TestNode({ selected: true });
            assert(node.setSelected(false) === true);
            assert(node.setSelected(false) === false);
            assert(node.setSelected(false, true) === false);
            assert(['unselect'], node.events);

            var node = new TestNode({ selected: true });
            assert(node.setSelected(false, true) === true);
            assert(node.setSelected(false, true) === false);
            assert(node.setSelected(false) === false);
            assert(['unselect'], node.events);

          }
        }
      ]
    },
    {
      name: 'selection',
      test: [
        {
          name: 'create',
          test: [
            {
              name: 'should not create by default',
              test: function(){
                var node = new Node();

                assert(node.selection === null);
              }
            },
            {
              name: 'any truthly value for selection should be a config',
              test: function(){
                var nodes = [
                  new Node({
                    selection: true
                  }),
                  new Node({
                    selection: { foo: 'foo' }
                  }),
                  new Node({
                    selection: new Node({
                      foo: 'foo'
                    })
                  }),
                  new Node({
                    selection: new Dataset({
                      foo: 'foo'
                    })
                  })
                ];

                for (var i = 0; i < nodes.length; i++)
                {
                  var node = nodes[i];

                  assert(node.selection != null);
                  assert(node.selection instanceof Selection);
                  assert(node.selection.multiple === false);
                }

                assert(nodes.filter(function(node){
                  return node.selection.foo === 'foo';
                }).length == nodes.length - 1);
              }
            },
            {
              name: 'instances of Selection should be used as selection',
              test: function(){
                var selection = new Selection();
                var node = new Node({
                  selection: selection
                });

                assert(node.selection === selection);
              }
            },
            {
              name: 'any truthly value for setSelection should be a config',
              test: function(){
                var nodes = [];
                var values = [
                  true,
                  { foo: 'foo' },
                  new Node({ foo: 'foo' }),
                  new Dataset({ foo: 'foo' })
                ];

                for (var i = 0; i < values.length; i++)
                {
                  var node = new Node();

                  nodes.push(node);
                  node.setSelection(values[i]);

                  assert(node.selection != null);
                  assert(node.selection instanceof Selection);
                  assert(node.selection.multiple === false);
                }

                assert(nodes.filter(function(node){
                  return node.selection.foo === 'foo';
                }).length == nodes.length - 1);
              }
            },
            {
              name: 'instances of Selection should be used as selection',
              test: function(){
                var selection = new Selection();
                var node = new Node();

                node.setSelection(selection);
                assert(node.selection === selection);
              }
            }
          ]
        },
        {
          name: 'contextSelection',
          test: [
            {
              name: 'should spread context to children when create with childNodes',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: true,
                  childNodes: [
                    foo = new Node(),
                    bar = new Node({
                      childNodes: [
                        baz = new Node()
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);
              }
            },
            {
              name: 'should not spread context to children of satellites',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: true,
                  satellite: {
                    foo: foo = new Node({
                      childNodes: [
                        bar = new Node({
                          childNodes: [
                            baz = new Node()
                          ]
                        })
                      ]
                    })
                  }
                });

                assert(foo.contextSelection === null);
                assert(bar.contextSelection === null);
                assert(baz.contextSelection === null);
              }
            },
            {
              name: 'should correctly update context on tree changes',
              test: function(){
                var foo = new Node();
                var bar = new Node();
                var baz = new Node();
                var node = new Node({
                  selection: true
                });

                node.appendChild(foo);
                node.appendChild(bar);
                bar.appendChild(baz);

                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);

                node.removeChild(bar);
                assert(bar.contextSelection === null);
                assert(baz.contextSelection === null);
                assert(foo.contextSelection === node.selection);

                node.removeChild(foo);
                assert(foo.contextSelection === null);
              }
            },
            {
              name: 'should update context on node selection changes',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  childNodes: [
                    foo = new Node(),
                    bar = new Node({
                      childNodes: [
                        baz = new Node()
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === null);
                assert(bar.contextSelection === null);
                assert(baz.contextSelection === null);

                node.setSelection(new Selection());
                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);

                bar.setSelection(new Selection());
                assert(bar.selection !== node.selection);
                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === bar.selection);

                bar.setSelection();
                assert(bar.selection === null);
                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);
              }
            },
            {
              name: 'should clear selection context on destroy',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: true,
                  childNodes: [
                    foo = new Node(),
                    bar = new Node({
                      childNodes: [
                        baz = new Node()
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === node.selection);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);

                bar.destroy();
                assert(bar.contextSelection === null);
                assert(baz.contextSelection === null);

                node.destroy();
                assert(node.contextSelection === null);
                assert(foo.contextSelection === null);
              }
            },
            {
              name: 'should not add non-selected children to context selection',
              test: function(){
                var node = new Node({
                  selection: true,
                  childNodes: [
                    new Node(),
                    new Node({
                      childNodes: [
                        new Node()
                      ]
                    })
                  ]
                });

                assert(node.firstChild.contextSelection === node.selection);
                assert(node.selection.getItems().length === 0);
              }
            },
            {
              name: 'should add only last added child to context selection',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: false },
                  childNodes: [
                    foo = new Node({ selected: true }),
                    bar = new Node({
                      selected: true,
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === node.selection);
                assert([bar], node.selection.getItems());
                assert(foo.selected === false);
                assert(bar.selected === true);
                assert(baz.selected === false);
              }
            },
            {
              name: 'should add all selected children to context selection if selection has multiple mode',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({ selected: true }),
                    bar = new Node({
                      selected: true,
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === node.selection);
                assert(node.selection.getItems().length === 3);
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);
              }
            },
            {
              name: 'should keep selected when change context selection',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({ selected: true }),
                    bar = new Node({
                      selected: true,
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                node.removeChild(bar);
                assert(bar.contextSelection === null);
                assert(baz.contextSelection === null);
                assert(bar.selected === true);
                assert(baz.selected === true);

                node.appendChild(bar);
                assert(bar.contextSelection === node.selection);
                assert(baz.contextSelection === node.selection);
                assert(bar.selected === true);
                assert(baz.selected === true);
              }
            },
            {
              name: 'should add all selected children to context selection mix selection',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({ selected: true }),
                    bar = new Node({
                      selected: true,
                      selection: true,
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                assert(foo.contextSelection === node.selection);
                assert(node.selection.getItems().length === 2);
                assert([baz], bar.selection.getItems());
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);
              }
            },
            {
              name: 'selected children should move to new selection on context selection changes',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({ selected: true }),
                    bar = new Node({
                      selected: true,
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                bar.setSelection(new Selection());
                assert(bar.selection !== node.selection);
                assert(baz.contextSelection = bar.selection);
                assert(bar.contextSelection = node.selection);
                assert(node.selection.getItems().length === 2);
                assert([baz], bar.selection.getItems());
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);

                bar.setSelection();
                assert(bar.selection === null);
                assert(baz.contextSelection = node.selection);
                assert(bar.contextSelection = node.selection);
                assert(node.selection.getItems().length === 3);
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);
              }
            },
            {
              name: 'should no select/unselect events on destroy',
              test: function(){
                // helper class
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                // main part
                var foo;
                var node = new TestNode({
                  selection: true,
                  childNodes: [
                    foo = new TestNode({ selected: true })
                  ]
                });

                assert(foo.selected === true);
                assert([], foo.events);

                foo.destroy();

                assert(foo.selected === true);
                assert([], foo.events);
              }
            }
          ]
        },
        {
          name: 'Selection instance',
          test: [
            {
              name: 'should drop reference from nodes on destroy',
              test: function(){
                var selection = new Selection();
                var foo = new Node({ selection: selection });
                var bar = new Node({ selection: selection });

                assert(foo.selection === selection);
                assert(bar.selection === selection);

                selection.destroy();
                assert(foo.selection === null);
                assert(bar.selection === null);
              }
            },
            {
              name: 'Selection#add',
              test: [
                {
                  name: 'single node',
                  test: [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(foo);
                        assert([foo], node.selection.getItems());

                        node.selection.add(bar);
                        assert([bar], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(foo);
                        assert([foo], node.selection.getItems());

                        node.selection.add(bar);
                        assert([foo, bar], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'array of nodes',
                  test:  [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(node.childNodes);
                        assert([foo], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(node.childNodes);
                        assert([foo, bar], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'should not add nodes with wrong contextSelection',
                  test: [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var baz = new Node();
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(baz);
                        assert([], node.selection.getItems());

                        node.selection.add([bar, baz, foo]);
                        assert([bar], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var baz = new Node();
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.add(baz);
                        assert([], node.selection.getItems());

                        node.selection.add([bar, baz, foo]);
                        assert([bar, foo], node.selection.getItems());
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'Selection#set',
              test: [
                {
                  name: 'single node',
                  test: [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(foo);
                        assert([foo], node.selection.getItems());

                        node.selection.set(bar);
                        assert([bar], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(foo);
                        assert([foo], node.selection.getItems());

                        node.selection.set(bar);
                        assert([bar], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'array of nodes',
                  test:  [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([foo], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([foo, bar], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'empty array should clear selection',
                  test:  [
                    {
                      name: 'single mode',
                      test: function(){
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            new Node(),
                            new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([node.firstChild], node.selection.getItems());

                        node.selection.set([]);
                        assert([], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([foo, bar], node.selection.getItems());

                        node.selection.set([]);
                        assert([], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'empty list after filter should clear selection',
                  test:  [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo = new Node();
                        var bar = new Node();
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            new Node(),
                            new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([node.firstChild], node.selection.getItems());

                        node.selection.set([foo, bar]);
                        assert([], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo = new Node();
                        var bar = new Node();
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            new Node(),
                            new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([node.firstChild, node.lastChild], node.selection.getItems());

                        node.selection.set([foo, bar]);
                        assert([], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'no argument should clear selection',
                  test:  [
                    {
                      name: 'single mode',
                      test: function(){
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            new Node(),
                            new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([node.firstChild], node.selection.getItems());

                        node.selection.set();
                        assert([], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(node.childNodes);
                        assert([foo, bar], node.selection.getItems());

                        node.selection.set();
                        assert([], node.selection.getItems());
                      }
                    }
                  ]
                },
                {
                  name: 'should not add nodes with wrong contextSelection',
                  test: [
                    {
                      name: 'single mode',
                      test: function(){
                        var foo;
                        var bar;
                        var baz = new Node();
                        var node = new Node({
                          selection: true,
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(baz);
                        assert([], node.selection.getItems());

                        node.selection.set([bar, baz, foo]);
                        assert([bar], node.selection.getItems());
                      }
                    },
                    {
                      name: 'multiple mode',
                      test: function(){
                        var foo;
                        var bar;
                        var baz = new Node();
                        var node = new Node({
                          selection: { multiple: true },
                          childNodes: [
                            foo = new Node(),
                            bar = new Node()
                          ]
                        });

                        node.selection.set(baz);
                        assert([], node.selection.getItems());

                        node.selection.set([bar, baz, foo]);
                        assert([bar, foo], node.selection.getItems());
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'bb-value for selected',
      test: [
        {
          name: 'basic',
          test: [
            {
              name: 'should resolve selected to false on init and no change on destroy, no events',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var values = [
                  new basis.Token(),
                  new basis.Token(new basis.Token()),
                  new Value({ value: false }),
                  Value.factory(function(){
                    return false;
                  })
                ];

                for (var i = 0; i < values.length; i++)
                {
                  var node = new TestNode({
                    selected: values[i]
                  });

                  assert(node.selected === false);
                  assert(node.selectedRA_ !== null);
                  assert([], node.events);

                  node.destroy();

                  assert(node.selected === false);
                  assert(node.selectedRA_ === null);
                  assert([], node.events);
                }
              }
            },
            {
              name: 'should resolve selected to true on init, no events',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var values = [
                  new basis.Token(true),
                  new basis.Token(new basis.Token(1)),
                  new Value({ value: true }),
                  Value.factory(function(){
                    return true;
                  })
                ];

                for (var i = 0; i < values.length; i++)
                {
                  var node = new TestNode({
                    selected: values[i]
                  });

                  assert(node.selected === true);
                  assert(node.selectedRA_ !== null);
                  assert([], node.events);

                  node.destroy();

                  assert(node.selected === true);
                  assert(node.selectedRA_ === null);
                  assert([], node.events);
                }
              }
            },
            {
              name: 'should update when bb-value changed',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var bbValue = new basis.Token(true);
                var node = new TestNode({
                  selected: bbValue
                });

                assert(node.selected === true);
                assert([], node.events);

                bbValue.set(123);
                assert(node.selected === true);
                assert([], node.events);

                bbValue.set(false);
                assert(node.selected === false);
                assert(['unselect'], node.events);

                bbValue.set(true);
                assert(node.selected === true);
                assert(['unselect', 'select'], node.events);
              }
            },
            {
              name: 'should link/unlink bb-values',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var foo = new basis.Token(true);
                var bar = new basis.Token(true);
                var node = new TestNode({
                  selected: foo
                });

                assert(node.selected === true);
                assert([], node.events);

                node.setSelected(true);
                assert(node.selected === true);
                assert([], node.events);

                foo.set(false); // should no effect
                assert(node.selected === true);
                assert([], node.events);

                node.setSelected(bar);
                assert(node.selected === true);
                assert([], node.events);

                bar.set(false);
                assert(node.selected === false);
                assert(['unselect'], node.events);

                foo.set(true);
                node.setSelected(foo);
                assert(node.selected === true);
                assert(['unselect', 'select'], node.events);

                bar.set(false);
                assert(node.selected === true);
                assert(['unselect', 'select'], node.events);
              }
            }
          ]
        },
        {
          name: 'select/unselect',
          test: [
            {
              name: 'select() methods should drop bb-value',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var tokenTrue = new basis.Token(true);
                var tokenFalse = new basis.Token(false);
                var node = new TestNode({
                  selected: tokenTrue
                });

                assert(node.selected === true);

                node.select();
                assert(node.selected === true);
                assert([], node.events);

                tokenTrue.set(false);
                assert(node.selected === true);
                assert([], node.events);

                node.setSelected(tokenFalse);
                assert(node.selected === false);
                assert(['unselect'], node.events);

                node.select();
                assert(node.selected === true);
                assert(['unselect', 'select'], node.events);

                tokenFalse.set(true);
                assert(node.selected === true);
                assert(['unselect', 'select'], node.events);
              }
            },
            {
              name: 'unselect() methods should drop bb-value',
              test: function(){
                var TestNode = Node.subclass({
                  init: function(){
                    this.events = [];
                    Node.prototype.init.call(this);
                  },
                  debug_emit: function(evt){
                    if (evt.type == 'select' || evt.type == 'unselect')
                      this.events.push(evt.type);
                  }
                });

                var tokenTrue = new basis.Token(true);
                var tokenFalse = new basis.Token(false);
                var node = new TestNode({
                  selected: tokenFalse
                });

                assert(node.selected === false);

                node.unselect();
                assert(node.selected === false);
                assert([], node.events);

                tokenFalse.set(true);
                assert(node.selected === false);
                assert([], node.events);

                node.setSelected(tokenTrue);
                assert(node.selected === true);
                assert(['select'], node.events);

                node.unselect();
                assert(node.selected === false);
                assert(['select', 'unselect'], node.events);

                tokenTrue.set(123);
                assert(node.selected === false);
                assert(['select', 'unselect'], node.events);
              }
            }
          ]
        },
        {
          name: 'selection & contextSelection',
          test: [
            {
              name: 'node with bb-value as selected should not be added to selection',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({
                      selected: new basis.Token(true)
                    }),
                    bar = new Node({
                      selected: new basis.Token(true),
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                assert([baz], node.selection.getItems());
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);

                node.selection.add([foo, baz]);
                assert([baz], node.selection.getItems());
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === true);

                node.selection.set([foo, bar]);
                assert([], node.selection.getItems());
                assert(foo.selected === true);
                assert(bar.selected === true);
                assert(baz.selected === false);
              }
            },
            {
              name: 'node with bb-value as selected should not be affected by context selection changed',
              test: function(){
                var foo;
                var bar;
                var baz;
                var node = new Node({
                  selection: { multiple: true },
                  childNodes: [
                    foo = new Node({
                      selected: new basis.Token(true)
                    }),
                    bar = new Node({
                      selected: new basis.Token(true),
                      childNodes: [
                        baz = new Node({ selected: true })
                      ]
                    })
                  ]
                });

                assert([baz], node.selection.getItems());
                assert(foo.contextSelection === node.selection);
                assert(foo.selected === true);
                assert(bar.contextSelection === node.selection);
                assert(bar.selected === true);
                assert(baz.contextSelection === node.selection);
                assert(baz.selected === true);

                var nodes = basis.array(node.childNodes);
                node.clear(true);

                assert([], node.selection.getItems());
                assert(foo.contextSelection === null);
                assert(foo.selected === true);
                assert(foo.selectedRA_ != null);
                assert(bar.contextSelection === null);
                assert(bar.selected === true);
                assert(bar.selectedRA_ != null);
                assert(baz.contextSelection === null);
                assert(baz.selected === true);

                node.setChildNodes(nodes);

                assert([baz], node.selection.getItems());
                assert(foo.contextSelection === node.selection);
                assert(foo.selected === true);
                assert(foo.selectedRA_ != null);
                assert(bar.contextSelection === node.selection);
                assert(bar.selected === true);
                assert(bar.selectedRA_ != null);
                assert(baz.contextSelection === node.selection);
                assert(baz.selected === true);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'destroy child with own selection',
      test: function(){
        var selectedChild = new Node({ selected: true });
        var parent = new Node({
          selection: true,
          childNodes: [selectedChild, new Node, new Node]
        });

        assert(selectedChild.selected === true);
        assert(parent.selection.pick() === selectedChild);

        var selectedSubchild = new Node({ selected: true });
        var child = new Node({
          selection: true,
          childNodes: [selectedSubchild, new Node, new Node]
        });

        assert(selectedSubchild.selected === true);
        assert([selectedSubchild], child.selection.getItems());

        parent.appendChild(child);

        assert(selectedChild.selected === true);
        assert([selectedChild], parent.selection.getItems());
        assert(selectedSubchild.selected === true);
        assert([selectedSubchild], child.selection.getItems());

        child.destroy();
      }
    },
    {
      name: 'destroy selected child with own selection',
      test: function(){
        var parent = new Node({
          selection: true,
          childNodes: [new Node, new Node, new Node]
        });

        var child = new Node({
          selection: true,
          selected: true,
          childNodes: [new Node({ selected: true }), new Node, new Node]
        });

        parent.appendChild(child);

        assert(child.firstChild.selected === true);
        assert(parent.lastChild.selected === true);

        child.destroy();

        assert(parent.selection.itemCount == 0);
      }
    }
  ]
};
