
  basis.require('app.core');
  basis.require('app.ext.view');

  var classList = basis.cssom.classList;

  var clsById = app.core.clsList.map(function(cls){
    return new basis.data.DataObject({
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
    template: resource('template/namespaceNode.tmpl'),

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

    templateUpdate: function(tmpl, eventName, delta){
      if (!eventName || 'clsId' in delta)
        this.setDataSource(namespaceClsSplitBySuper.getSubset(this.data.clsId));
    },

    sorting: basis.getter('data.className.split(".").pop()')
  });

  ViewNSNode.prototype.childClass = ViewNSNode;

  var viewNamespaceMap = new app.ext.view.View({
    viewHeader: 'Namespace class map',
    title: 'Namespace class map',

    template: resource('template/namespaceMap.tmpl'),

    binding: {
      classMap: 'satellite:'
    },

    satelliteConfig: {
      classMap: {
        instanceOf: basis.ui.Node.subclass({
          template: '<ul class="firstLevel"/>',
          dataSource: namespaceClsSplitBySuper.getSubset(0, true),
          childClass: ViewNSNode
        })
      }
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
              dsClsList[cls.docsUid_] = new basis.data.DataObject({
                part: 'self',
                delegate: clsById[cls.docsUid_]
              });

              if (!dsClsList[cls.docsSuperUid_])
              {
                dsClsList[cls.docsSuperUid_] = new basis.data.DataObject({
                  part: 'parent',
                  delegate: clsById[cls.docsSuperUid_]
                });
              }

              for (var i = 0; i < clsById.length; i++)
                if (clsById[i].data.superClsId === cls.docsUid_)
                  dsClsList[i] = new basis.data.DataObject({
                    part: 'subclass',
                    delegate: clsById[i]
                  });
            }
          }

          namespaceClassDS.set(Object.values(dsClsList));
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = viewNamespaceMap;
