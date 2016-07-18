module.exports = {
  name: '<b:prepend>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="foo">x</b:prepend></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'prepend to element if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend>x</b:prepend></b:include>');

        assert(text(b) === text('<span>x</span>'));
      }
    },
    {
      name: 'nothing happen if ref node is not an element',
      test: function(){
        var a = createTemplate('<span>{foo}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="foo">x</b:prepend></b:include>');

        assert(text(b) === text('<span>{foo}</span>'));

        var a = createTemplate('text');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend>x</b:prepend></b:include>');

        assert(text(b) === text('text'));
      }
    },
    {
      name: 'prepend token with single node when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element">x</b:prepend></b:include>');

        assert(text(b) === text('<span>x</span>'));
      }
    },
    {
      name: 'prepend token with single node',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element">x</b:prepend></b:include>');

        assert(text(b) === text('<span>x<span/></span>'));
      }
    },
    {
      name: 'prepend token with multiple nodes when no children',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element"><br/>x<br/></b:prepend></b:include>');

        assert(text(b) === text('<span><br/>x<br/></span>'));
      }
    },
    {
      name: 'prepend token with multiple nodes',
      test: function(){
        var a = createTemplate('<span><span/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element"><br/>x<br/></b:prepend></b:include>');

        assert(text(b) === text('<span><br/>x<br/><span/></span>'));
      }
    }
  ]
};
