require('basis.data.index');
require('basis.ui');

var uiInfo = require('devpanel.api.ui');
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
    id: 'instanceId',
    satelliteName: 'data:',
    nestedViewCount: function(node){
      return basis.data.index.count(node.subset);
    }
  },
  action: {
    toggle: function(event){
      this.collapsed = !this.collapsed;
      this.updateBind('collapsed');
      this.setDataSource(this.collapsed
        ? null
        : this.subset);
    }
  },
  childClass: basis.Class.SELF,
  init: function(){
    basis.ui.Node.prototype.init.call(this);

    var name = this.data.instance.constructor.className.split('.');
    this.instanceId = this.data.instance.basisObjectId;
    this.mainName = name.pop();
    this.namespace = name.length ? name.join('.') : '';
    this.subset = splitByParent.getSubset(this.data.instance.basisObjectId, true);
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
