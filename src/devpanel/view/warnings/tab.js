var count = require('basis.data.index').count;
var Warning = require('type').Warning;

module.exports = {
  caption: 'Warnings',
  view: resource('./view/index.js'),

  template: resource('./tab.tmpl'),
  binding: {
    count: count(Warning.all)
  }
};
