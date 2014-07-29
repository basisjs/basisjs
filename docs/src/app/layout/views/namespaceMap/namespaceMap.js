
  var View = require('app.ext.view').View;
  var DataObject = require('basis.data').Object;
  var Dataset = require('basis.data').Dataset;
  var Value = require('basis.data').Value;
  var Split = require('basis.data.dataset').Split;
  var Node = require('basis.ui').Node;

  var clsById = require('app.core').clsList.map(function(cls){
    return new DataObject({
      data: {
        className: cls.className,
        clsId: cls.docsUid_,
        superClsId: cls.docsSuperUid_
      }
    });
  });

  var namespaceClassDS = new Dataset();
  var namespaceClsSplitBySuper = new Split({
    source: namespaceClassDS,
    rule: function(object){
      return object.part != 'parent' ? object.data.superClsId : 0;
    }
  });

  var ViewNSNode = Node.subclass({
    template: resource('./template/namespaceNode.tmpl'),
    binding: {
      path: 'data:className',
      part: 'delegate.part', // static property
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
      }
    },

    dataSource: Value.factory('update', function(node){
      return namespaceClsSplitBySuper.getSubset(node.data.clsId);
    }),
    childClass: basis.Class.SELF,
    sorting: function(child){
      return child.data.className.split('.').pop();
    }
  });

  var viewNamespaceMap = new View({
    viewHeader: 'Namespace class map',
    title: 'Namespace class map',

    template: resource('./template/namespaceMap.tmpl'),
    binding: {
      classMap: new Node({
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
          var result = {};

          for (var cls in clsList)
          {
            cls = clsList[cls];
            if (basis.Class.isClass(cls))
            {
              result[cls.docsUid_] = new DataObject({
                part: 'self',
                delegate: clsById[cls.docsUid_]
              });

              if (!result[cls.docsSuperUid_])
              {
                result[cls.docsSuperUid_] = new DataObject({
                  part: 'parent',
                  delegate: clsById[cls.docsSuperUid_]
                });
              }

              for (var i = 0; i < clsById.length; i++)
                if (clsById[i].data.superClsId === cls.docsUid_)
                  result[i] = new DataObject({
                    part: 'subclass',
                    delegate: clsById[i]
                  });
            }
          }

          namespaceClassDS.sync(basis.object.values(result));
        }
      }
    }
  });

  //
  // exports
  //

  module.exports = viewNamespaceMap;
