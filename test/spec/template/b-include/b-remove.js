module.exports = {
  name: '<b:remove>',
  test: [
    {
      name: 'nothing happen if no reference',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'remove element if no ref attribute',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove/></b:include>');

        assert(text(b) === text(''));
      }
    },
    {
      name: 'remove empty element token',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

        assert(text(b) === text('<span></span>'));
      }
    },
    {
      name: 'remove element token with nodes',
      test: function(){
        var a = createTemplate('<span><span{foo}><span/></span></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

        assert(text(b) === text('<span></span>'));
      }
    },
    {
      name: 'remove text token',
      test: function(){
        var a = createTemplate('<span>{foo}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

        assert(text(b) === text('<span></span>'));
      }
    },
    {
      name: 'remove comment token',
      test: function(){
        var a = createTemplate('<span><!--{foo}--></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

        assert(text(b) === text('<span></span>'));
      }
    },
    {
      name: 'remove root element',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="element"/></b:include>');

        assert(text(b) === text(''));
      }
    },
    {
      name: 'remove content should be ignored',
      test: function(){
        var a = createTemplate('<span><span{foo}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo">content</b:remove></b:include>');

        assert(text(b) === text('<span></span>'));
      }
    }
  ]
};
