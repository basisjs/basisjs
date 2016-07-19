var Node = require('basis.ui').Node;

var BaseItem = Node.subclass({
  binding: {
    caption: 'caption'
  }
});
var classMap = {
  check: BaseItem.subclass({
    template: '<li><input type="checkbox"/> {caption}</li>'
  }),
  radio: BaseItem.subclass({
    template: '<li><input type="radio"/> {caption}</li>'
  })
};

var list = new Node({
  container: document.body,
  template: '<ul/>',

  childClass: BaseItem,
  childFactory: function(config){
    var ChildClass = classMap[config.type] || BaseItem;
    return new ChildClass(config);
  },
  childNodes: [
    { type: 'check', caption: 'foo' },
    { type: 'radio', caption: 'bar' }
  ]
});
