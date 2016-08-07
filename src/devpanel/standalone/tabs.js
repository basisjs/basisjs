var Value = require('basis.data').Value;
var KeyObjectMap = require('basis.data').KeyObjectMap;
var Node = require('basis.ui').Node;
var defineTemplate = require('basis.template').define;
var DEFAULT_TAB = 'basisjs.devtool.defaultTab';
var storage = global.localStorage || {};

// main view
var tabs = new Node({
  template: resource('./template/tabs.tmpl'),
  selection: true,
  childClass: {
    template: defineTemplate('app.ui.tab', resource('./template/tab.tmpl')),
    binding: {
      caption: 'caption'
    }
  },
  childNodes: [
    require('../view/template-info/tab.js'),
    require('../view/ui/tab.js'),
    require('../view/warnings/tab.js'),
    require('../view/file-graph/tab.js')
  ]
});

// restore last selected tab
tabs.selection.set(tabs.getChild(storage[DEFAULT_TAB], 'caption'));

// select first tab if selection is empty and store current tab to storage
Value.query(tabs, 'selection.pick()').link(tabs, function(selected){
  if (selected)
    storage[DEFAULT_TAB] = selected.caption;
  else
    this.selection.set(this.firstChild);
});

// resolve lazy view
var lazyView = new KeyObjectMap({
  create: function(tab){
    return new(tab.view());
  }
});

tabs.selectedTabView = Value
  .query(tabs, 'selection.pick()')
  .as(lazyView.resolve.bind(lazyView));

window.xx =  tabs.selectedTabView;

module.exports = tabs;
