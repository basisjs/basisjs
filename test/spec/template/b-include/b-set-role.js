module.exports = {
  name: '<b:set-role>',
  test: [
    {
      name: 'should set role',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span title="a" role-marker="role"/>'));
      }
    },
    {
      name: 'should replace existing role attribute',
      test: function(){
        var a = createTemplate('<span title="a" b:role="test"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span title="a" role-marker="role"/>'));
      }
    },
    {
      name: 'should set sub-role',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role value="sub"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span title="a" role-marker="role/sub"/>'));
      }
    },
    {
      name: 'should set role by ref',
      test: function(){
        var a = createTemplate('<span{a}/><span{b}/><span{c}/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role ref="b"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span/><span role-marker="role"/><span/>'));
      }
    },
    {
      name: 'should not set role to special ref',
      test: function(){
        var a = createTemplate('<span><b:content/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role ref=":content"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span/>'));
        assert(b.decl_.warns && b.decl_.warns.length === 1);
      }
    },
    {
      name: 'should not set role to non-element',
      test: function(){
        var a = createTemplate('[{a}{b}{c}]');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-role ref="b"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('[{a}{b}{c}]'));
        assert(b.decl_.warns && b.decl_.warns.length === 1);
      }
    }
  ]
};
