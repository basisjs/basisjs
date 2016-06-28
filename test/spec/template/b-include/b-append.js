module.exports = {
  name: '<b:append>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'append to element if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

        assert(text(b) === text('<span>x</span>'));
      }
    },
    {
      name: 'nothing happen if ref node is not an element',
      test: function(){
        var a = createTemplate('<span>{foo}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

        assert(text(b) === text('<span>{foo}</span>'));

        var a = createTemplate('text');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

        assert(text(b) === text('text'));
      }
    },
    {
      name: 'append token with single node when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

        assert(text(b) === text('<span>x</span>'));
      }
    },
    {
      name: 'append token with single node',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

        assert(text(b) === text('<span><span/>x</span>'));
      }
    },
    {
      name: 'append token with multiple nodes when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

        assert(text(b) === text('<span><br/>x<br/></span>'));
      }
    },
    {
      name: 'append token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

        assert(text(b) === text('<span><span/><br/>x<br/></span>'));
      }
    }
  ]
};
