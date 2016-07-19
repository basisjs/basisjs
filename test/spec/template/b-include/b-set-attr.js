module.exports = {
  name: '<b:set-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

        assert(text(b) === text('<span title="b"/>'));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

        assert(text(b) === text('<span title="b"/>'));
      }
    },
    {
      name: 'set attribute with binding',
      test: function(){
        var a = createTemplate('<span title="x"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { b: 'b' }) === text('<span title="a b"/>'));
      }
    },
    {
      name: 'averride attribute with binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { a: 'a', b: 'b' }) === text('<span title="a b"/>'));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="id" value="b"/></b:include>');

        assert(text(b) === text('<span title="a" id="b"/>'));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="b"/></b:include>');

        assert(text(b) === text('<span class="b"/>'));
      }
    },
    {
      name: 'set class value with binding',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="a b"/>'));
      }
    },
    {
      name: 'override class with binding',
      test: function(){
        var a = createTemplate('<span class="{foo}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { foo: 'foo' }) === text('<span class="a"/>'));
      }
    },
    {
      name: 'override class with binding by value with binding',
      test: function(){
        var a = createTemplate('<span class="{foo}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { foo: 'foo', b: 'b' }) === text('<span class="a b"/>'));
      }
    },
    {
      name: 'set class value with binding when b:define used',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="a"/>'));
        assert(text(b, { b: 'foo' }) === text('<span class="a foo"/>'));
      }
    },
    {
      name: 'non-exists event-* attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

        assert(text(b) === text('<span event-click="bar"/>'));
      }
    },
    {
      name: 'exists event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

        assert(text(b) === text('<span event-click="bar"/>'));
      }
    }
  ]
};
