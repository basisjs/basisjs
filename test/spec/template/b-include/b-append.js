module.exports = {
  name: '<b:append>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'append to element if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

        this.is(text('<span>x</span>'), text(b));
      }
    },
    {
      name: 'nothing happen if ref node is not an element',
      test: function(){
        var a = createTemplate('<span>{foo}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

        this.is(text('<span>{foo}</span>'), text(b));

        var a = createTemplate('text');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

        this.is(text('text'), text(b));
      }
    },
    {
      name: 'append token with single node when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

        this.is(text('<span>x</span>'), text(b));
      }
    },
    {
      name: 'append token with single node',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

        this.is(text('<span><span/>x</span>'), text(b));
      }
    },
    {
      name: 'append token with multiple nodes when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

        this.is(text('<span><br/>x<br/></span>'), text(b));
      }
    },
    {
      name: 'append token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

        this.is(text('<span><span/><br/>x<br/></span>'), text(b));
      }
    }
  ]
};
