module.exports = {
  name: 'namespaces',
  init: function(){
    var namespaceURI = {
      html: document.documentElement.namespaceURI,
      xmlns: 'http://www.w3.org/2000/xmlns',
      xlink: 'http://www.w3.org/1999/xlink',
      svg: 'http://www.w3.org/2000/svg'
    };
    var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
    var createTemplate = api.createTemplate;
  },
  test: [
    {
      name: 'xhtml namespace',
      test: function(){
        var t = createTemplate('<div/>');
        var instance = t.createInstance();
        assert(instance.element.namespaceURI == namespaceURI.html);
      }
    },
    {
      name: 'svg namespace',
      test: function(){
        var t = createTemplate('<svg/>');
        var instance = t.createInstance();
        assert(instance.element.namespaceURI == namespaceURI.html);

        var t = createTemplate('<svg:svg/>');
        var instance = t.createInstance();
        assert(instance.element.namespaceURI == namespaceURI.svg);

        var t = createTemplate('<svg:svg><circle></svg:svg>');
        var instance = t.createInstance();
        assert(instance.element.childNodes[0].namespaceURI == namespaceURI.html);

        var t = createTemplate('<svg:svg><svg:circle></svg:svg>');
        var instance = t.createInstance();
        assert(instance.element.childNodes[0].namespaceURI == namespaceURI.svg);
      }
    },
    {
      name: 'xlink attribute namespace',
      test: function(){
        var t = createTemplate('<foo xlink:href="#bar"/>');
        var instance = t.createInstance();
        assert(instance.element.namespaceURI == namespaceURI.html);
        assert(instance.element.attributes[0].namespaceURI == namespaceURI.xlink);
      }
    },
    {
      name: 'xlink attribute with binding namespace',
      test: function(){
        var t = createTemplate('<foo xlink:href="#bar-{qux}"/>');
        var instance = t.createInstance();
        instance.set('qux', 'baz');
        assert(instance.element.attributes[0].value == '#bar-baz');
        assert(instance.element.namespaceURI == namespaceURI.html);
        assert(instance.element.attributes[0].namespaceURI == namespaceURI.xlink);
      }
    }
  ]
};
