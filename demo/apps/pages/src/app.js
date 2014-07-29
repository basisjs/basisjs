var Template = require('basis.template.html').Template;
var Node = require('basis.ui').Node;
var router = require('basis.router');
/** @cut */ require('basis.devpanel');

module.exports = require('basis.app').create({
  init: function(){
    var pages = {
      404: {
        header: 'Page not found',
        template: new Template(resource('./app/template/page/404.tmpl'))
      },
      foo: {
        header: 'Page #foo',
        template: new Template(resource('./app/template/page/foo.tmpl'))
      },
      bar: {
        header: 'Page #bar',
        template: new Template(resource('./app/template/page/bar.tmpl'))
      },
      baz: {
        header: 'Page #baz',
        template: new Template(resource('./app/template/page/baz.tmpl'))
      }
    };

    var toolbar = new basis.ui.Node({
      template: resource('./app/template/toolbar.tmpl'),
      childClass: {
        template: resource('./app/template/toolbar-tab.tmpl'),
        binding: {
          name: 'name'
        },
        action: {
          select: function(){
            router.navigate(this.name);
          }
        }
      },
      childNodes: basis.object.keys(pages).map(function(name){
        return { name: name };
      })
    });

    var pagesView = new basis.ui.Node({
      header: new basis.Token(''),
      template: resource('./app/template/layout.tmpl'),
      binding: {
        header: 'header',
        red: resource('./module/red/index.js'),
        green: resource('./module/green/index.js'),
        blue: resource('./module/blue/index.js'),
        yellow: resource('./module/yellow/index.js')
      }
    });

    router.add(':page', function(page){
      var page = pages[page] || pages['404'];
      pagesView.header.set(page.header);
      pagesView.setTemplate(page.template);
    });
    router.start();

    return new basis.ui.Node({
      template: resource('./app/template/layout.tmpl'),
      binding: {
        toolbar: toolbar,
        pages: pagesView
      }
    });
  }
});
