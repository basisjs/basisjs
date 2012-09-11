
  basis.require('app.core');

  var nav = resource('nav.js')();
  
  module.exports = new basis.ui.tree.Tree({
    id: 'SearchTree',
    selection: {},
    sorting: Function.getter('data.title', String.toLowerCase),

    grouping: nav.nodeTypeGrouping,

    childClass: basis.ui.tree.Node.subclass({
      template: resource('template/searchTreeItem.tmpl'),

      binding: {
        args: function(node){
          if (/^(function|method|class)$/.test(node.data.kind))
            return basis.dom.createElement('SPAN.args', app.core.getFunctionDescription(node.data.obj).args.quote('('));
        },
        namespace: function(node){
          return node.data.kind != 'namespace' ? node.data.path : '';
        }
      },

      action: {
        select: function(){
          this.select();
        }
      },

      init: function(){
        basis.ui.tree.Node.prototype.init.call(this);

        this.nodeType = nav.kindNodeType[this.data.kind];
        basis.cssom.classList(this.tmpl.content).add(this.data.kind.capitalize() + '-Content');
      }
    })
  });
