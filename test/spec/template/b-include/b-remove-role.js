module.exports = {
  name: '<b:remove-role>',
  test: [
    {
      name: 'should remove role',
      test: function(){
        var a = createTemplate('<span title="a" b:role/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-role/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span title="a"/>'));
      }
    },
    {
      name: 'should remove sub-role',
      test: function(){
        var a = createTemplate('<span title="a" b:role="sub"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-role/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span title="a"/>'));
      }
    },
    {
      name: 'should remove role by ref',
      test: function(){
        var a = createTemplate('<span{a} b:role/><span{b} b:role/><span{c} b:role/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-role ref="b"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span role-marker="role"/><span/><span role-marker="role"/>'));
      }
    },
    {
      name: 'should work with special ref',
      test: function(){
        var a = createTemplate('<span><b:content/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-role ref=":content"/></b:include>');

        assert(text(b, { $role: 'role' }) === text('<span/>'));
        assert(b.decl_.warns === false);
      }
    }
  ]
};
