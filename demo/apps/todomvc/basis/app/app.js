var Node = require('basis.ui').Node;
var Value = require('basis.data').Value;
var header = require('../header/header');
var list = require('../list/list');
var footer = require('../footer/footer');
var Task = require('../task');

new Node({
  container: document.body,
  template: resource('./app.tmpl'),
  binding: {
    header: header,
    list: list,
    footer: 'satellite:'
  },
  satellite: {
    footer: {
      instance: footer,
      existsIf: Value.query(Task.all, 'itemCount')
    }
  }
});
