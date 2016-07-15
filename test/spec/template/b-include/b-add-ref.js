module.exports = {
  name: '<b:add-ref>',
  test: [
    {
      name: 'should add reference',
      test: function(){
        var a = createTemplate('<span title="test"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:add-ref name="test"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span title="test"/>'));

        var instance = b.createInstance();
        assert(instance.test === instance.element);
        assert(instance.test.title === 'test');
      }
    },
    {
      name: 'should not drop other reference',
      test: function(){
        var a = createTemplate('<span{foo}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:add-ref name="test"/>' +
            '<b:set-attr ref="foo" name="title" value="test"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span title="test"/>'));

        var instance = b.createInstance();
        assert(instance.test === instance.element);
        assert(instance.foo === instance.test);
        assert(instance.test.title === 'test');
      }
    },
    {
      name: 'should add reference by reference',
      test: function(){
        var a = createTemplate('<span{a}/><span{b} title="b"/><span{c}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:add-ref ref="b" name="test"/>' +
          '</b:include>'
        );

        assert(text(b) === text('<span/><span title="b"/><span/>'));

        var instance = b.createInstance();
        assert(instance.test === instance.b);
        assert(instance.test.title === 'b');
      }
    },
    {
      name: 'should not apply to special reference',
      test: function(){
        var a = createTemplate('<span{foo} title="foo"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">\n' +
          '  <b:add-ref ref=":content" name="foo"/>\n' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert(':content' in instance === false);
        assert(instance.foo === instance.element);
        assert(instance.foo.title === 'foo');

        assert(b.decl_.warns.length === 1);
        assert(String(b.decl_.warns[0]) === '<b:add-ref> can\'t to be applied to special reference `:content`');
        assert(b.decl_.warns[0].loc === ':2:3');
      }
    },
    {
      name: 'should not add special references',
      test: function(){
        var a = createTemplate('<span{foo} title="foo"/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">\n' +
          '  <b:add-ref name=":content"/>\n' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert(':content' in instance === false);
        assert(instance.foo === instance.element);
        assert(instance.foo.title === 'foo');

        assert(b.decl_.warns.length === 1);
        assert(String(b.decl_.warns[0]) === 'Bad reference name for <b:add-ref>: :content');
        assert(b.decl_.warns[0].loc === ':2:3');
      }
    }
  ]
};
