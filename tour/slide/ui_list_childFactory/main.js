basis.require('basis.ui');

var Item = basis.ui.Node.subclass({
  binding: {
    caption: 'caption'
  }
});

var Checkbox = Item.subclass({
  className: 'Checkbox',
  template:
    '<li><input type="checkbox"/> {caption}</li>'
});

var Radio = Item.subclass({
  className: 'Radio',
  template:
    '<li><input type="radio"/> {caption}</li>'
});

var list = new basis.ui.Node({
  container: document.body,
  template:
    '<ul/>',

  childClass: Item,
  childFactory: function(config){
    var childClass = Item;
    switch (config.type)
    {
      case 'check': childClass = Checkbox; break;
      case 'radio': childClass = Radio; break;
    }
    return new childClass(config);
  },
  childNodes: [
    { type: 'check', caption: 'foo' },
    { type: 'radio', caption: 'bar' }
  ]
});
