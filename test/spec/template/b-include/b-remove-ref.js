module.exports = {
  name: '<b:remove-ref>',
  test: [
    {
      name: 'should remove reference',
      test: function(){
        var a = createTemplate('<span{test}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-ref name="test"/>' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert('test' in instance === false);
      }
    },
    {
      name: 'should not drop other reference',
      test: function(){
        var a = createTemplate('<span{foo|bar}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-ref name="foo"/>' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert('test' in instance === false);
      }
    },
    {
      name: 'should remove reference by reference',
      test: function(){
        var a = createTemplate('<span{a}/><span{b|c} title="b"/><span{d}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-ref ref="b" name="c"/>' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert('a' in instance === true);
        assert('b' in instance === true);
        assert('c' in instance === false);
        assert('d' in instance === true);
      }
    },
    {
      name: 'ref attribute is not required',
      test: function(){
        var a = createTemplate('<span{a}/><span{b|c} title="b"/><span{d}/>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">' +
            '<b:remove-ref name="c"/>' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert('a' in instance === true);
        assert('b' in instance === true);
        assert('c' in instance === false);
        assert('d' in instance === true);
      }
    },
    {
      name: 'should not work with special references',
      test: function(){
        var a = createTemplate('<span{foo}><b:content/></span>');
        var b = createTemplate(
          '<b:include src="#' + a.templateId + '">\n' +
          '  <b:remove-ref name=":content"/>\n' +
          '</b:include>'
        );

        var instance = b.createInstance();
        assert(b.decl_.warns.length === 1);
        assert(String(b.decl_.warns[0]) === '<b:remove-ref> can\'t to be applied to special reference `:content`');
        assert(b.decl_.warns[0].loc === ':2:3');
      }
    }
  ]
};
