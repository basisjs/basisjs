var Value = require('basis.data').Value;
var Split = require('basis.data.dataset').Split;
var Node = require('basis.ui').Node;
var count = require('basis.data.index').count;
var getBoundingRect = require('basis.layout').getBoundingRect;
var uiInfo = require('devpanel.api.ui');
var instanceMap = uiInfo.instanceMap;

var splitByParent = new Split({
  source: uiInfo.instances,
  rule: 'data.parent'
});

var hoverTimer;
var hoverView = new Value();
var overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.transition = 'all .05s';
overlay.style.zIndex = 10000;
overlay.style.background = 'rgba(110, 163, 217, .7)';
overlay.style.pointerEvents = 'none';
var hoverEl = new Value({
  handler: {
    change: function(){
      if (this.value)
      {
        var rect = getBoundingRect(this.value);
        if (rect)
        {
          overlay.style.left = rect.left + 'px';
          overlay.style.top = rect.top + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
          document.body.appendChild(overlay);
          return;
        }
      }

      if (overlay.parentNode)
        overlay.parentNode.removeChild(overlay);
    }
  }
});

hoverView.link(hoverEl, function(value){
  this.set(value ? value.data.instance.element : null);
});

var ViewNode = Node.subclass({
  template: resource('./template/item.tmpl'),
  collapsed: true,
  binding: {
    id: 'data.id',
    loc: 'data.loc',
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
      var basisjsTools = global.basisjsToolsFileSync;
      if (basisjsTools && typeof basisjsTools.openFile == 'function')
        basisjsTools.openFile(this.data.loc);
    },
    enter: function(){
      hoverView.set(this);
      clearTimeout(hoverTimer);
    },
    leave: function(){
      hoverTimer = setTimeout(function(){
        hoverView.set(null);
      }, 50);
    }
  },
  childClass: basis.Class.SELF,
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

    var className = this.data.instance.constructor.className || 'unknown';
    var name = className.split('.');

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

new Node({
  container: document.body,

  template: resource('./template/view.tmpl'),
  binding: {
    instanceCount: count(uiInfo.instances),
    withLoc: count(uiInfo.instances, 'data.loc')
  },

  childClass: ViewNode,
  dataSource: splitByParent.getSubset(null, true),
  sorting: 'data.id'
});
