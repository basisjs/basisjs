var Node = require('basis.ui').Node;

var demos = require('basis.data').wrap(
  require('./demo.json').reduce(function(result, group){
    return result.concat(group.demos.map(function(demo, idx){
      return basis.object.merge(demo, {
        id: result.length + idx,
        group: group.title,
        image: demo.image || demo.url.replace('.html', '.png')
      });
    }));
  }, []),
  true
);

var DemoItem = Node.subclass({
  template: require('basis.template').switcher('update', function(node){
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

      childClass: DemoItem,
      childNodes: demos,

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
