module.exports = {
  name: '<b:append-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

        assert(text(b) === text('<span title="b"/>'));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

        assert(text(b) === text('<span title="ab"/>'));
      }
    },
    {
      name: 'append value with binding',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { b: 'b' }) === text('<span title="a-b"/>'));
      }
    },
    {
      name: 'append to value with binding value with binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { a: 'a', b: 'b' }) === text('<span title="a--b"/>'));
      }
    },
    {
      name: 'append to value with binding value w/o binding',
      test: function(){
        var a = createTemplate('<span title="{a}-"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-b"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { b: 'b' }) === text('<span/>'));
        assert(text(b, { a: 'a' }) === text('<span title="a--b"/>'));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="id" value="b"/></b:include>');

        assert(text(b) === text('<span title="a" id="b"/>'));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="b"/></b:include>');

        assert(text(b) === text('<span class="b"/>'));
      }
    },
    {
      name: 'append class value with binding',
      test: function(){
        var a = createTemplate('<span class="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="foo a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="foo a b"/>'));
      }
    },
    {
      name: 'append to class with binding value with binding',
      test: function(){
        var a = createTemplate('<span class="foo {bar}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="foo a"/>'));
        assert(text(b, { bar: 'bar', b: 'b' }) === text('<span class="foo a bar b"/>'));
      }
    },
    {
      name: 'append class value with binding when b:define used',
      test: function(){
        var a = createTemplate('<span class="foo"/>');
        var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="foo a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="foo a"/>'));
        assert(text(b, { b: 'bar' }) === text('<span class="foo a bar"/>'));
      }
    },
    {
      name: 'non-exists event-* attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

        assert(text(b) === text('<span event-click="bar"/>'));
      }
    },
    {
      name: 'exists event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

        assert(text(b) === text('<span event-click="foo bar"/>'));
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

            assert(text(b) === text('<span style="color: red"/>'));
          }
        },
        {
          name: 'exists',
          test: function(){
            var a = createTemplate('<span style="color: red"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

            assert(text(b) === text('<span style="color: red; width: 10px"/>'));
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

                assert(text(b) === text('<span style="color: red; color: green"/>'));
              }
            },
            {
              name: 'no binding append binding',
              test: function(){
                var a = createTemplate('<span style="color: red"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {foo}"/></b:include>');

                assert(text(b) === text('<span style="color: red"/>'));
                assert(text(b, { foo: 'green' }) === text('<span style="color: green"/>'));
              },
            },
            {
              name: 'binding append no binding',
              test: function(){
                var a = createTemplate('<span style="color: {foo}"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: green"/></b:include>');

                assert(text(b) === text('<span style="color: green"/>'));
                assert(text(b, { foo: 'red' }) === text('<span style="color: red"/>'));
              }
            },
            {
              name: 'binding append binding',
              test: function(){
                var a = createTemplate('<span style="color: {foo}"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {bar}"/></b:include>');

                assert(text(b) === text('<span/>'));
                assert(text(b, { foo: 'red' }) === text('<span/>'));
                assert(text(b, { foo: 'red', bar: 'green' }) === text('<span style="color: green"/>'));
                assert(text(b, { bar: 'green', foo: 'red' }) === text('<span style="color: green"/>'));
              }
            }
          ]
        },
        {
          name: 'add with binding to w/o binding',
          test: function(){
            var a = createTemplate('<span style="color: red"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {foo}"/></b:include>');

            assert(text(b) === text('<span style="color: red"/>'));
            assert(text(b, { foo: '10px' }) === text('<span style="color: red; width: 10px"/>'));
          }
        },
        {
          name: 'add with binding to with binding',
          test: function(){
            var a = createTemplate('<span style="color: {foo}"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {bar}"/></b:include>');

            assert(text(b) === text('<span/>'));
            assert(text(b, { foo: 'red', bar: '10px' }) === text('<span style="color: red; width: 10px"/>'));
          }
        },
        {
          name: 'add w/o binding to with binding',
          test: function(){
            var a = createTemplate('<span style="color: {foo}"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

            assert(text(b) === text('<span style="width: 10px"/>'));
            assert(text(b, { foo: 'red' }) === text('<span style="width: 10px; color: red;"/>'));
          }
        }
      ]
    }
  ]
};
