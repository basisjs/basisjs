module.exports = {
  name: '<b:replace>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo">x</b:replace></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'replace root element if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace>x</b:replace></b:include>');

        assert(text(b) === text('x'));
      }
    },
    {
      name: 'replace token with single node',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo">x</b:replace></b:include>');

        assert(text(b) === text('<span>x</span>'));
      }
    },
    {
      name: 'replace root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="element">x</b:replace></b:include>');

        assert(text(b) === text('x'));
      }
    },
    {
      name: 'replace token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo"><br/>x<br/></b:replace></b:include>');

        assert(text(b) === text('<span><br/>x<br/></span>'));
      }
    }
  ]
};
