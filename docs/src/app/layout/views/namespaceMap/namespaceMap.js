
  basis.require('app.core');
  basis.require('app.ext.view');

  var clsById = app.core.clsList.map(function(cls){
    return new basis.data.Object({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    });
  });

  var namespaceClassDS = new basis.data.Dataset();
  var namespaceClsSplitBySuper = new basis.data.dataset.Split({
    source: namespaceClassDS,
    rule: function(object){
      return object.part != 'parent' ? object.data.superClsId : 0;
    }
  });

  var ViewNSNode = basis.ui.Node.subclass({
    template: resource('./template/namespaceNode.tmpl'),
    binding: {
      path: 'data:className',
      namespace: {
        events: 'update',
        getter: function(node){
          var p = node.data.className.split('.');
          p.pop();
          return p.join('.');
        }
      },
      className: {
        events: 'update',
        getter: function(node){
          return node.data.className.split('.').pop();
        }
      },
      part: {
        events: 'delegateChanged',
        getter: function(object){
          return object.delegate && object.delegate.part;
        }
      }
    },

    dataSource: basis.data.Value.factory('update', function(node){
      return namespaceClsSplitBySuper.getSubset(node.data.clsId);
    }),
    sorting: basis.getter('data.className.split(".").pop()'),
    childClass: basis.Class.SELF
  });

  var viewNamespaceMap = new app.ext.view.View({
    viewHeader: 'Namespace class map',
    title: 'Namespace class map',

    template: resource('./template/namespaceMap.tmpl'),
    binding: {
      classMap: new basis.ui.Node({
        template: '<ul class="firstLevel"/>',
        dataSource: namespaceClsSplitBySuper.getSubset(0, true),
        childClass: ViewNSNode
      })
    },
    
    handler: {
      delegateChanged: function(){
        var namespace = this.data.obj;
        if (namespace)
        {
          var clsList = namespace.exports;
          var dsClsList = {};

          for (var cls in clsList)
          {
            cls = clsList[cls];
            if (basis.Class.isClass(cls))
            {
              dsClsList[cls.docsUid_] = new basis.data.Object({
                part: 'self',
                delegate: clsById[cls.docsUid_]
              });

              if (!dsClsList[cls.docsSuperUid_])
              {
                dsClsList[cls.docsSuperUid_] = new basis.data.Object({
                  part: 'parent',
                  delegate: clsById[cls.docsSuperUid_]
                });
              }

              for (var i = 0; i < clsById.length; i++)
                if (clsById[i].data.superClsId === cls.docsUid_)
                  dsClsList[i] = new basis.data.Object({
                    part: 'subclass',
                    delegate: clsById[i]
                  });
            }
          }

          namespaceClassDS.set(basis.object.values(dsClsList));
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = viewNamespaceMap;
