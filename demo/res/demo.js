var Dataset = require('basis.data').Dataset;
var DataObject = require('basis.data').Object;
var Node = require('basis.ui').Node;
var templateSwitcher = require('basis.template').switcher;

var demos = new Dataset({
  items: require('./demo.json').reduce(function(result, group){
    return result.concat(group.demos.map(function(demo, idx){
      return new DataObject({
        data: basis.object.extend(demo, {
          id: result.length + idx,
          group: group.title,
          image: demo.image || demo.url.replace('.html', '.png')
        })
      });
    }));
  }, [])
});

var DemoItem = Node.subclass({
  template: templateSwitcher('update', function(node){
    return node.data.wow
      ? resource('./template/item-wow.tmpl')
      : resource('./template/item.tmpl');
  }),
  binding: {
    title: 'data:',
    wow: 'data:',
    url: 'data:',
    imageUrl: 'data:image'
  },
  action: {
    setDefaultImage: function(){
      this.update({
        image: 'res/img/noimg.png'
      });
    }
  }
});

require('basis.app').create({
  init: function(){
    return new Node({
      template: resource('./template/list.tmpl'),

      dataSource: demos,
      childClass: DemoItem,

      sorting: 'data.id',
      grouping: {
        rule: 'data.group',
        childClass: {
          template: resource('./template/group.tmpl')
        }
      }
    });
  }
});
