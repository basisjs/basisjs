module.exports = {
  name: '<b:after>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'nothing happen if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after>x</b:after></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'after token with single node',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

        assert(text(b) === text('<span><span/>x</span>'));
      }
    },
    {
      name: 'after root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="element">x</b:after></b:include>');

        assert(text(b) === text('<span/>x'));
      }
    },
    {
      name: 'after token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo"><br/>x<br/></b:after></b:include>');

        assert(text(b) === text('<span><span/><br/>x<br/></span>'));
      }
    }
  ]
};
