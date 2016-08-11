var DataObject = require('basis.data').Object;
var KeyObjectMap = require('basis.data').KeyObjectMap;
var Dataset = require('basis.data').Dataset;
var Split = require('basis.data.dataset').Split;
var Node = require('basis.ui').Node;
var count = require('basis.data.index').count;
var api = require('api');
var uiApi = require('../api.js');
var fileApi = require('api').ns('file');
var instances = new Dataset();
var instanceMap = {};
var hoverTimer;

function processData(data){
  if (!data)
    return;

  var inserted = data.updated;
  var deleted = data.deleted;

  if (inserted)
    inserted.forEach(function(item){
      if (item.id in instanceMap === false)
        instanceMap[item.id] = new DataObject({ data: item });
      else
        instanceMap[item.id].update(item);
    });

  if (deleted)
    deleted.forEach(function(id){
      delete instanceMap[id];
    });

  instances.setAndDestroyRemoved(basis.object.values(instanceMap));
}

function initData(data){
  var old = instanceMap;

  instanceMap = {};
  data.instances.forEach(function(item){
    if (item.id in old)
    {
      instanceMap[item.id] = old[item.id];
      instanceMap[item.id].update(item);
    }
    else
    {
      instanceMap[item.id] = new DataObject({ data: item });
    }
  });

  instances.setAndDestroyRemoved(basis.object.values(instanceMap));
}

var splitByParent = new Split({
  source: instances,
  rule: 'data.parent'
});

var ViewNode = Node.subclass({
  collapsed: true,

  template: resource('./template/item.tmpl'),
  binding: {
    id: 'data:',
    loc: 'data:',
    namespace: 'namespace',
    name: 'mainName',
    satelliteName: 'data:',
    role: 'data:',
    equalNames: {
      events: 'update',
      getter: function(node){
        return node.data.role == node.data.satelliteName;
      }
    },
    nestedViewCount: function(node){
      return count(node.subset);
    }
  },
  action: {
    toggle: function(){
      this.collapsed = !this.collapsed;
      this.updateBind('collapsed');
      this.setDataSource(!this.collapsed ? this.subset : null);
    },
    openLoc: function(){
      fileApi.open(this.data.loc);
    },
    enter: function(){
      uiApi.hover(this.data.id);
      clearTimeout(hoverTimer);
    },
    leave: function(){
      hoverTimer = setTimeout(function(){
        uiApi.hover(null);
      }, 50);
    }
  },

  childClass: basis.Class.SELF,
  childFactory: function(config){
    return map.resolve(config.delegate);
  },
  sorting: function(node){
    return node.data.childIndex == -1
      ? node.data.satelliteName || node.data.role
      : node.data.childIndex;
  },
  groupingClass: {
    rule: function(node){
      if (node.data.satelliteName)
        return -1;
      if (node.data.groupNode)
        return instanceMap[node.data.groupNode];
      return 0;
    },
    sorting: 'data.childIndex',
    childClass: {
      template: resource('./template/group.tmpl'),
      binding: {
        title: 'data:',
        isGroup: {
          events: 'update',
          getter: function(node){
            return node.data.id > 0;
          }
        }
      }
    },
    groupingClass: basis.Class.SELF,

    emit_update: function(delta){
      Node.prototype.groupingClass.prototype.emit_update.call(this, delta);

      if ('grouping' in delta)
      {
        if (this.data.grouping)
          this.setGrouping({
            delegate: instanceMap[this.data.grouping]
          });
        else
          this.setGrouping();
      }
    },
    init: function(){
      Node.prototype.groupingClass.prototype.init.call(this);
      if (this.data.grouping)
        this.setGrouping({
          delegate: instanceMap[this.data.grouping]
        });
    }
  },

  emit_update: function(delta){
    Node.prototype.emit_update.call(this, delta);

    if ('grouping' in delta)
    {
      if (this.data.grouping)
        this.setGrouping({
          delegate: instanceMap[this.data.grouping]
        });
      else
        this.setGrouping();
    }
  },

  init: function(){
    Node.prototype.init.call(this);

    var name = this.data.className.split('.');

    this.mainName = name.pop();
    this.namespace = name.length ? name.join('.') : '';
    this.subset = splitByParent.getSubset(this.data.id, true);

    if (this.data.grouping)
      this.setGrouping({
        delegate: instanceMap[this.data.grouping]
      });
  },
  destroy: function(){
    this.subset = null;
    Node.prototype.destroy.call(this);
  }
});

var map = new KeyObjectMap({
  create: function(delegate){
    return new ViewNode({ delegate: delegate });
  }
});
var templates = require('basis.template').define('devpanel.ui', {
  view: resource('./template/view.tmpl')
});
require('basis.template').theme('standalone').define('devpanel.ui', {
  view: resource('./template/standalone.tmpl')
});

module.exports = Node.subclass({
  template: templates.view,
  binding: {
    instanceCount: count(instances),
    withLoc: count(instances, 'data.loc')
  },

  dataSource: splitByParent.getSubset(null, true),
  childClass: ViewNode,
  childFactory: function(config){
    return map.resolve(config.delegate);
  },
  sorting: 'data.id',

  init: function(){
    Node.prototype.init.call(this);

    uiApi.channel.link(this, processData);
    api.connected.link(this, function(connected){
      if (connected)
        uiApi.init(initData);
    });
  }
});
