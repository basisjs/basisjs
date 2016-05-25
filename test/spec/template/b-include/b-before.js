module.exports = {
  name: '<b:before>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'nothing happen if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before>x</b:before></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'before token with single node',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

        this.is(text('<span>x<span/></span>'), text(b));
      }
    },
    {
      name: 'before root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="element">x</b:before></b:include>');

        this.is(text('x<span/>'), text(b));
      }
    },
    {
      name: 'before token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo"><br/>x<br/></b:before></b:include>');

        this.is(text('<span><br/>x<br/><span/></span>'), text(b));
      }
    }
  ]
};
