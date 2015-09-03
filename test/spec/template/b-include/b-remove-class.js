module.exports = {
  name: '<b:remove-class>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="foo"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span title="a"/>'));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span class="foo bar"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="foo"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span class="bar"/>'));
      }
    },
    {
      name: 'remove non-exists class should no effect',
      test: function(){
        var a = createTemplate('<span class="foo bar"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="baz"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span class="foo bar"/>'));
      }
    },
    {
      name: 'remove several static classes',
      test: function(){
        var a = createTemplate('<span class="foo bar baz"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="foo baz"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span class="bar"/>'));
      }
    },
    {
      name: 'remove class bindings',
      test: function(){
        var a = createTemplate('<span class="{foo} bar baz"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="{foo}"/>' +
          '</b:include>'
        );

        assert(text(b, { foo: true }) === text('<span class="bar baz"/>'));
      }
    },
    {
      name: 'remove several class bindings',
      test: function(){
        var a = createTemplate('<span class="{foo} bar prefix_{baz}"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="prefix_{baz} {foo}"/>' +
          '</b:include>'
        );

        assert(text(b, { foo: true, baz: true }) === text('<span class="bar"/>'));
      }
    },
    {
      name: 'remove from non-element should no effect but warning',
      test: function(){
        var a = createTemplate('text');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="foo"/>' +
          '</b:include>'
        );

        assert(text(b) === text('text'));
        assert(b.decl_.warns.length === 1);
      }
    },
    {
      name: 'should no remove static classes when remove classes with bindings',
      test: function(){
        var a = createTemplate('<span class="prefix_foo foo_{bar} baz"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="prefix_{foo} foo_{bar} {baz}"/>' +
          '</b:include>'
        );

        assert(text(b, { bar: true }) === text('<span class="prefix_foo baz"/>'));
      }
    },
    {
      name: 'should remove bindings with <b:define> applied',
      test: function(){
        var a = createTemplate(
          '<b:define name="foo" type="bool" default="true"/>' +
          '<b:define name="bar" type="enum" values="foo bar baz qux" default="baz"/>' +
          '<b:define name="baz" from="foo" type="bool" default="true"/>' +
          '<b:define name="qux" from="bar" type="enum" values="foo bar baz qux" default="qux"/>' +
          '<span class="foo_{foo} {foo} bar_{bar} {bar} baz_{baz} {baz} qux_{qux} {qux}"/>'
        );
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-class value="foo_{foo} {foo} bar_{bar} {bar} baz_{baz} {baz} qux_{qux} {qux}"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span/>'));
        assert(text(b, { foo: true, bar: 'baz' }) === text('<span/>'));
      }
    }
  ]
};
