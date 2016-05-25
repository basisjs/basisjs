
  var getter = basis.getter;
  var Node = require('basis.ui').Node;
  var View = require('app.ext.view').View;
  var ViewOptions = require('app.ext.view').ViewOptions;
  var DataObject = require('basis.data').Object;
  var mapDO = require('app.core').mapDO;

  var InheritanceItem = Node.subclass({
    className: module.path + '.InheritanceItem',
    template: resource('./template/inheritanceItem.tmpl'),

    binding: {
      className: 'data:title',
      namespace: 'data:',
      fullPath: 'data:',
      tag: 'data:tag || "none"'
    },
    emit_match: function(){
      this.tmpl.set('absent', '');
    },
    emit_unmatch: function(){
      this.tmpl.set('absent', 'absent');
    }
  });

  var viewInheritance = new View({
    title: 'Inheritance',
    viewHeader: 'Inheritance',

    template: resource('./template/inheritanceView.tmpl'),
    binding: {
      showNamespace: {
        events: 'groupingChanged',
        getter: function(node){
          return !node.grouping;
        }
      }
    },

    groupingClass: {
      childClass: {
        template: resource('./template/inheritanceGroup.tmpl'),
        binding: {
          title: 'data:'
        }
      }
    },
    childClass: InheritanceItem,

    matchFunction: function(node){
      return node.data.match;
    },

    handler: {
      update: function(){
        this.clear();

        var key = this.data.key;
        if (key)
        {
          var isClass = this.data.kind == 'class';
          var cursor = isClass ? this.data.obj : (mapDO[this.data.path.replace(/.prototype$/, '')] || { data: { obj: null } }).data.obj;
          var groupId = 0;
          var group = null;
          var lastNamespace;
          var list = [];
          while (cursor)
          {
            var fullPath = cursor.className;
            var namespace = (fullPath || 'unknown').replace(/\.[^\.]+$|^[^\.]+$/, '');
            var proto = cursor.docsProto_ && cursor.docsProto_.hasOwnProperty(key) ? cursor.docsProto_[key] : null;

            if (namespace != lastNamespace)
            {
              lastNamespace = namespace;
              group = new DataObject({
                data: {
                  title: namespace,
                  namespace: namespace
                }
              });
              groupId++;
            }

            list.push(new DataObject({
              group: group,
              data: {
                match: isClass || (proto && proto.tag),
                cls: cursor,
                namespace: namespace,
                fullPath: fullPath,
                title: (fullPath || 'unknown').match(/[^\.]+$/)[0],
                tag: proto ? proto.tag : ''
              }
            }));

            cursor = cursor.superClass_;
          }

          this.setChildNodes(list.reverse());
        }
      }
    },

    satellite: {
      viewOptions: {
        instance: ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Namespace',
                selected: true,
                onselect: function(){
                  owner.setGrouping({
                    rule: 'delegate.group',
                    childClass: {
                      titleGetter: getter('data.title')
                    }
                  });
                }
              },
              {
                title: 'None',
                onselect: function(){
                  owner.setGrouping();
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
  module.exports = viewInheritance;
