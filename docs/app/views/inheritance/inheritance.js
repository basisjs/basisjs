
  basis.require('app.core');
  basis.require('app.ext.view');

  var getter = basis.getter;
  var classList = basis.cssom.classList;

  var mapDO = app.core.mapDO;

  var InheritanceItem = basis.ui.Node.subclass({
    className: module.path + '.InheritanceItem',
    template: resource('template/inheritanceItem.tmpl'),

    binding: {
      className: 'data:title',
      namespace: 'data:',
      fullPath: 'data:',
      tag: 'data:tag || "none"'
    },
    event_match: function(){
      this.tmpl.set('absent', '');
    },
    event_unmatch: function(){
      this.tmpl.set('absent', 'absent');
    }
  });

  var viewInheritance = new app.ext.view.View({
    title: 'Inheritance',
    viewHeader: 'Inheritance',

    childClass: InheritanceItem,

    template: resource('template/inheritanceView.tmpl'),

    groupingClass: {
      childClass: {
        template: resource('template/inheritanceGroup.tmpl'),

        binding: {
          title: 'data:'
        }
      }
    },

    matchFunction: function(node){
      return node.data.match;
    },

    handler: {
      groupingChanged: function(){
        this.tmpl.set('show_namespace', this.grouping ? '' : 'show-namespace');
        //classList(this.tmpl.content).bool('show-namespace', !this.grouping);
      },
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
              group = new basis.data.DataObject({
                data: {
                  title: namespace,
                  namespace: namespace
                }
              });
              groupId++;
            }

            list.push(new basis.data.DataObject({
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

    satelliteConfig: {
      viewOptions: {
        instanceOf: app.ext.view.ViewOptions,
        config: function(owner){
          return {
            title: 'Group by',
            childNodes: [
              {
                title: 'Namespace',
                selected: true,
                onselect: function(){
                  owner.setGrouping({
                    groupGetter: getter('delegate.group'),
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
