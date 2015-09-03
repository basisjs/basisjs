var Node = require('basis.ui').Node;
var HtmlTemplate = require('basis.template.html').Template;

// create an UI node
var node = new Node({
  template: new HtmlTemplate(
    'Hello world'
  )
});

// append it's element to document body
document.body.appendChild(node.element);
