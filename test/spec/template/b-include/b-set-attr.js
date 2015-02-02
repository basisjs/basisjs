module.exports = {
  name: '<b:set-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

        this.is(text('<span title="b"/>'), text(b));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

        this.is(text('<span title="b"/>'), text(b));
      }
    },
    {
      name: 'set attribute with binding',
      test: function(){
        var a = createTemplate('<span title="x"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

        this.is(text('<span/>'), text(b));
        this.is(text('<span title="a b"/>'), text(b, { b: 'b' }));
      }
    },
    {
      name: 'averride attribute with binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

        this.is(text('<span/>'), text(b));
        this.is(text('<span title="a b"/>'), text(b, { a: 'a', b: 'b' }));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="id" value="b"/></b:include>');

        this.is(text('<span title="a" id="b"/>'), text(b));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="b"/></b:include>');

        this.is(text('<span class="b"/>'), text(b));
      }
    },
    {
      name: 'set class value with binding',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="a"/>'), text(b));
        this.is(text('<span class="a b"/>'), text(b, { b: 'b' }));
      }
    },
    {
      name: 'override class with binding',
      test: function(){
        var a = createTemplate('<span class="{foo}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a"/></b:include>');

        this.is(text('<span class="a"/>'), text(b));
        this.is(text('<span class="a"/>'), text(b, { foo: 'foo' }));
      }
    },
    {
      name: 'override class with binding by value with binding',
      test: function(){
        var a = createTemplate('<span class="{foo}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="a"/>'), text(b));
        this.is(text('<span class="a b"/>'), text(b, { foo: 'foo', b: 'b' }));
      }
    },
    {
      name: 'set class value with binding when b:define used',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="a"/>'), text(b));
        this.is(text('<span class="a"/>'), text(b, { b: 'b' }));
        this.is(text('<span class="a foo"/>'), text(b, { b: 'foo' }));
      }
    },
    {
      name: 'non-exists event-* attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

        this.is(text('<span event-click="bar"/>'), text(b));
      }
    },
    {
      name: 'exists event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

        this.is(text('<span event-click="bar"/>'), text(b));
      }
    }
  ]
};
