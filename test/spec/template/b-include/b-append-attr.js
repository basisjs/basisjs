module.exports = {
  name: '<b:append-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

        this.is(text('<span title="b"/>'), text(b));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

        this.is(text('<span title="ab"/>'), text(b));
      }
    },
    {
      name: 'append value with binding',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

        this.is(text('<span/>'), text(b));
        this.is(text('<span title="a-b"/>'), text(b, { b: 'b' }));
      }
    },
    {
      name: 'append to value with binding value with binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

        this.is(text('<span/>'), text(b));
        this.is(text('<span title="a--b"/>'), text(b, { a: 'a', b: 'b' }));
      }
    },
    {
      name: 'append to value with binding value w/o binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-b"/></b:include>');

        this.is(text('<span/>'), text(b));
        this.is(text('<span/>'), text(b, { b: 'b' }));
        this.is(text('<span title="a--b"/>'), text(b, { a: 'a' }));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="id" value="b"/></b:include>');

        this.is(text('<span title="a" id="b"/>'), text(b));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="b"/></b:include>');

        this.is(text('<span class="b"/>'), text(b));
      }
    },
    {
      name: 'append class value with binding',
      test: function(){
        var a = createTemplate('<span class="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="foo a"/>'), text(b));
        this.is(text('<span class="foo a b"/>'), text(b, { b: 'b' }));
      }
    },
    {
      name: 'append to class with binding value with binding',
      test: function(){
        var a = createTemplate('<span class="foo {bar}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="foo a"/>'), text(b));
        this.is(text('<span class="foo a bar b"/>'), text(b, { bar: 'bar', b: 'b' }));
      }
    },
    {
      name: 'append class value with binding when b:define used',
      test: function(){
        var a = createTemplate('<span class="foo"/>');
        var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        this.is(text('<span class="foo a"/>'), text(b));
        this.is(text('<span class="foo a"/>'), text(b, { b: 'b' }));
        this.is(text('<span class="foo a bar"/>'), text(b, { b: 'bar' }));
      }
    },
    {
      name: 'non-exists event-* attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

        this.is(text('<span event-click="bar"/>'), text(b));
      }
    },
    {
      name: 'exists event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

        this.is(text('<span event-click="foo bar"/>'), text(b));
      }
    },
    {
      name: 'style attribute',
      test: [
        {
          name: 'non-exists',
          test: function(){
            var a = createTemplate('<span/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: red"/></b:include>');

            this.is(text('<span style="color: red"/>'), text(b));
          }
        },
        {
          name: 'exists',
          test: function(){
            var a = createTemplate('<span style="color: red"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

            this.is(text('<span style="color: red; width: 10px"/>'), text(b));
          }
        },
        {
          name: 'should drop previous property when append existing one',
          test: [
            {
              name: 'no binding',
              test: function(){
                var a = createTemplate('<span style="color: red"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: green"/></b:include>');

                this.is(text('<span style="color: red; color: green"/>'), text(b));
              }
            },
            {
              name: 'no binding append binding',
              test: function(){
                var a = createTemplate('<span style="color: red"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {foo}"/></b:include>');

                this.is(text('<span style="color: red"/>'), text(b));
                this.is(text('<span style="color: green"/>'), text(b, { foo: 'green' }));
              },
            },
            {
              name: 'binding append no binding',
              test: function(){
                var a = createTemplate('<span style="color: {foo}"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: green"/></b:include>');

                this.is(text('<span style="color: green"/>'), text(b));
                this.is(text('<span style="color: red"/>'), text(b, { foo: 'red' }));
              }
            },
            {
              name: 'binding append binding',
              test: function(){
                var a = createTemplate('<span style="color: {foo}"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {bar}"/></b:include>');

                this.is(text('<span/>'), text(b));
                this.is(text('<span/>'), text(b, { foo: 'red' }));
                this.is(text('<span style="color: green"/>'), text(b, { foo: 'red', bar: 'green' }));
                this.is(text('<span style="color: green"/>'), text(b, { bar: 'green', foo: 'red' }));
              }
            }
          ]
        },
        {
          name: 'add with binding to w/o binding',
          test: function(){
            var a = createTemplate('<span style="color: red"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {foo}"/></b:include>');

            this.is(text('<span style="color: red"/>'), text(b));
            this.is(text('<span style="color: red; width: 10px"/>'), text(b, { foo: '10px' }));
          }
        },
        {
          name: 'add with binding to with binding',
          test: function(){
            var a = createTemplate('<span style="color: {foo}"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {bar}"/></b:include>');

            this.is(text('<span/>'), text(b));
            this.is(text('<span style="color: red; width: 10px"/>'), text(b, { foo: 'red', bar: '10px' }));
          }
        },
        {
          name: 'add w/o binding to with binding',
          test: function(){
            var a = createTemplate('<span style="color: {foo}"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

            this.is(text('<span style="width: 10px"/>'), text(b));
            this.is(text('<span style="width: 10px; color: red;"/>'), text(b, { foo: 'red' }));
          }
        }
      ]
    }
  ]
};
