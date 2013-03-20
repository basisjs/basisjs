basis.require('basis.ui');
basis.require('basis.template.html');

// create an UI node
var node = new basis.ui.Node({
  template: new basis.template.html.Template(
    '<h1>I\'m basisjs ui node!</h1>'
  )
});

// append it's element to document body
document.body.appendChild(node.element);