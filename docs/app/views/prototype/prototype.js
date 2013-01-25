
  basis.require('app.core');
  basis.require('app.ext.view');
  basis.require('app.ext.jsdoc');

  var namespace = module.path;

  var DOM = basis.dom;
  var getter = basis.getter;
  var classList = basis.cssom.classList;

  var mapDO = app.core.mapDO;
  var View = app.ext.view.View;
  var PrototypeJsDocPanel = app.ext.jsdoc.PrototypeJsDocPanel;

  var PROTOTYPE_ITEM_WEIGHT = {
    'event': 1,
    'property': 2,
    'method': 3
  };

  var PROTOTYPE_ITEM_TITLE = {
    'event': 'Events',
    'property': 'Properties',
    'method': 'Methods'
  };


 /**
  * @class
  */
  var PrototypeItem = basis.ui.Node.subclass({
    className: 'PrototypeProperty',
    nodeType: 'property',

    template: resource('template/prototypeItem.tmpl'),

    binding: {
      jsdocs: 'satellite:',
      nodeType: 'nodeType',
      title: 'data:key.replace(/^event_/, "")',
      path: {
        events: 'update',
        getter: function(node){
          return node.host.data.fullPath + '.prototype.' + node.data.key;
        }
      }
    },

    satelliteConfig: {
      jsdocs: {
        delegate: function(owner){
          return app.core.JsDocEntity.getSlot(owner.data.cls.docsProto_[owner.data.key].path);
        },
        instanceOf: PrototypeJsDocPanel/*JsDocPanel.subclass({
          event_update: function(delta){
            JsDocPanel.prototype.event_update.call(this, delta);

            var owner = this.owner;
            var tags = this.data.tags;
            if (tags)
            {
              classList(owner.element).add('hasJsDoc');
              var type = tags.type || (tags.returns && tags.returns.type);
              if (type)
              {
                DOM.insert(owner.tmpl.types, [
                  DOM.createElement('SPAN.splitter', ':'),
                  app.view.parseTypes(type.replace(/^\s*\{|\}\s*$/g, ''))
                ]);
              }
            }
          }
        }) */
      }
    }
  });

  var specialMethod = {
    init: 'constructor',
    destroy: 'destructor'
  };

 /**
  * @class
  */
  var PrototypeMethod = PrototypeItem.subclass({
    className: 'PrototypeMethod',
    nodeType: 'method',
    template: resource('template/prototypeMethod.tmpl'),

    binding: {
      args: function(node){
        return app.core.getFunctionDescription(mapDO[node.data.path].data.obj).args;
      },
      mark: function(node){
        return specialMethod[node.data.key];
      }
    }
  });

 /**
  * @class
  */
  var PrototypeSpecialMethod = PrototypeMethod.subclass({
    className: 'PrototypeSpecialMethod',
    template: resource('template/prototypeSpecialMethod.tmpl')
  });

 /**
  * @class
  */
  var PrototypeEvent = PrototypeMethod.subclass({
    className: 'PrototypeEvent',
    nodeType: 'event'
  });


  var PROTOTYPE_GROUPING_TYPE = {
    type: 'type',
    groupGetter: getter('data.kind'),
    sorting: getter('data.id', PROTOTYPE_ITEM_WEIGHT),
    childClass: {
      titleGetter: getter('data.id', PROTOTYPE_ITEM_TITLE)
    }
  };

  var PROTOTYPE_GROUPING_IMPLEMENTATION = {
    type: 'class',
    groupGetter: function(node){
      //console.log(node.data, node.data.key, node.data.cls.className, mapDO[node.data.cls.className]);
      var key = node.data.key;
      var tag = node.data.tag;
      var cls;
      if (tag == 'override')
      {
        cls = node.data.implementCls;
        if (!cls)
        {
          var cursor = node.data.cls.superClass_;
          while (cursor)
          {
            var cfg = cursor.docsProto_ && cursor.docsProto_[key];
            if (cfg && cfg.tag == 'implement')
            { 
              cls = mapDO[cfg.cls.className];
              node.data.implementCls = cls;
              break;
            }
            cursor = cursor.superClass_;
          }
        }
      }
      else
        cls = mapDO[node.data.cls.className];

      return cls || mapDO['basis.Class'];
    },
    childClass: {
      titleGetter: getter('data.fullPath')
    },
    sorting: function(group){
      return group.delegate && group.delegate.basisObjectId;
    }
  };

 /**
  * @class
  */
  var viewPrototype = new View({
    title: 'Prototype',
    viewHeader: 'Prototype',
    template: resource('template/prototypeView.tmpl'),

    binding: {
      groupingType: {
        events: 'groupingChanged',
        getter: function(node){
          return node.grouping ? node.grouping.type : '';
        }
      }
    },

    event_update: function(delta){
      View.prototype.event_update.call(this, delta);

      if (this.data.obj)
      {
        var d = new Date();

        //console.profile();
        var clsVector = app.core.getInheritance(this.data.obj);
        if (!this.clsVector)
          this.clsVector = new basis.data.Dataset();

        this.clsVector.set(clsVector.map(function(item){
          return mapDO[item.cls.className];
        }));

        this.setChildNodes(
          Object
            .values(mapDO[this.data.fullPath].data.obj.docsProto_)
            .map(function(val){
              return {
                data: val,
                host: this
              };
            }, this)
            .filter(Boolean)
        );
        //console.profileEnd();
        console.log('time: ', new Date - d, ' for ', this.childNodes.length);
      }
    },

    childClass: PrototypeItem,
    childFactory: function(config){
      var childClass;

      switch (config.data.kind){
        case 'event': childClass = PrototypeEvent; break;
        case 'method': childClass = specialMethod[config.data.key] ? PrototypeSpecialMethod : PrototypeMethod; break;
        default:
          childClass = PrototypeItem;
      }

      return new childClass(config);
    },

    groupingClass: {
      className: namespace + '.ViewPrototypeGroupingNode',
      childClass: {
        className: namespace + '.ViewPrototypePartitionNode',

        template: resource('template/prototypeViewGroup.tmpl'),

        binding: {
          groupEmpty: {
            events: 'childNodesModified',
            getter: function(object){
              return object.nodes.length ? '' : 'groupEmpty';
            }
          }
        }
      }
    },

    satelliteConfig: {
      viewOptions: {
        instanceOf: app.ext.view.ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Type',
                onselect: function(){
                  owner.setSorting('data.key');
                  owner.setGrouping(PROTOTYPE_GROUPING_TYPE);
                }
              },
              {
                title: 'Implementation',
                selected: true,
                onselect: function(){
                  owner.setSorting(function(node){
                    return (PROTOTYPE_ITEM_WEIGHT[node.data.kind] || 0) + '_' + node.data.key;
                  });
                  owner.setGrouping(PROTOTYPE_GROUPING_IMPLEMENTATION);
                }
              }
            ]
          };
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = viewPrototype;
