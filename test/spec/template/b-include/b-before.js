module.exports = {
  name: '<b:before>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'nothing happen if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before>x</b:before></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'before token with single node',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

        assert(text(b) === text('<span>x<span/></span>'));
      }
    },
    {
      name: 'before root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="element">x</b:before></b:include>');

        assert(text(b) === text('x<span/>'));
      }
    },
    {
      name: 'before token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo"><br/>x<br/></b:before></b:include>');

        assert(text(b) === text('<span><br/>x<br/><span/></span>'));
      }
    }
  ]
};
