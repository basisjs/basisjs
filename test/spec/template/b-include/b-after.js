module.exports = {
  name: '<b:after>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'nothing happen if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after>x</b:after></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'after token with single node',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

        this.is(text('<span><span/>x</span>'), text(b));
      }
    },
    {
      name: 'after root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="element">x</b:after></b:include>');

        this.is(text('<span/>x'), text(b));
      }
    },
    {
      name: 'after token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo"><br/>x<br/></b:after></b:include>');

        this.is(text('<span><span/><br/>x<br/></span>'), text(b));
      }
    }
  ]
};
