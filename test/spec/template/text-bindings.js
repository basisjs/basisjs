module.exports = {
  name: 'text bindings',
  test: [
    {
      name: 'simple',
      test: function(){
        var t = createTemplate('<span>foo {bar} baz</span>');

        assert(text('<span>foo {bar} baz</span>'), text(t));
        assert(text('<span>foo 123 baz</span>'), text(t, { bar: 123 }));
      }
    }
  ]
};
