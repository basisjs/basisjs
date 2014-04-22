require('basis.data.index');
require('basis.ui');

var uiInfo = require('devpanel.api.ui');
var instanceMap = uiInfo.instanceMap;
var splitByParent = new basis.data.dataset.Split({
  source: uiInfo.instances,
  rule: 'data.parent'
});

var ViewNode = basis.ui.Node.subclass({
  template: resource('./template/item.tmpl'),
  collapsed: true,
  binding: {
    namespace: 'namespace',
    name: 'mainName',
    id: 'data.id',
    satelliteName: 'data:',
    nestedViewCount: function(node){
      return basis.data.index.count(node.subset);
    }
  },
  action: {
    toggle: function(event){
      this.collapsed = !this.collapsed;
      this.updateBind('collapsed');
      this.setDataSource(!this.collapsed ? this.subset : null);
    }
  },
  childClass: basis.Class.SELF,
  groupingClass: {
    rule: function(node){
      if (node.data.satelliteName)
        return -1;
      if (node.data.groupNode)
        return instanceMap[node.data.groupNode];
      return 0;
    },
    sorting: 'data.id',
    childClass: {
      template: resource('./template/group.tmpl'),
      binding: {
        title: 'data:',
        isGroup: {
          events: 'update',
          getter: function(node){
            console.log(node);
            return node.data.id > 0;
          }
        }
      }
    },
    groupingClass: basis.Class.SELF,

    emit_update: function(delta){
      basis.ui.Node.prototype.groupingClass.prototype.emit_update.call(this, delta);

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
      basis.ui.Node.prototype.groupingClass.prototype.init.call(this);
      if (this.data.grouping)
        this.setGrouping({
          delegate: instanceMap[this.data.grouping]
        });
    }
  },

  emit_update: function(delta){
    basis.ui.Node.emit_update.call(this, delta);

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
    basis.ui.Node.prototype.init.call(this);

    var name = this.data.instance.constructor.className.split('.');
    this.instanceId = this.data.instance.basisObjectId;
    this.mainName = name.pop();
    this.namespace = name.length ? name.join('.') : '';
    this.subset = splitByParent.getSubset(this.data.instance.basisObjectId, true);
    if (this.data.grouping)
      this.setGrouping({
        delegate: instanceMap[this.data.grouping]
      });
  },
  destroy: function(){
    this.subset = null;
    basis.ui.Node.prototype.destroy.call(this);
  }
});

var view = new basis.ui.Node({
  container: document.body,
  template: resource('./template/view.tmpl'),
  childClass: ViewNode,
  dataSource: splitByParent.getSubset(null, true)
});
