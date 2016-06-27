module.exports = {
  name: '<b:svg>',
  test: [
    {
      name: 'basic usage',
      test: function(){
        var template = createTemplate(
          '<b:text>hello world</b:text>'
        );

        assert(text(template) === text('hello world'));
      }
    },
    {
      name: 'inside element',
      test: function(){
        var template = createTemplate(
          '<span><b:text>hello world</b:text></span>'
        );

        assert(text(template) === text('<span>hello world</span>'));
      }
    },
    {
      name: 'should trim whitespaces by default',
      test: function(){
        var template = createTemplate(
          '<b:text>\n  hello \n  world\n</b:text>'
        );

        assert(text(template) === '  hello \n  world');
      }
    },
    {
      name: 'should not trim whitespaces when notrim attribute is exists',
      test: function(){
        var template = createTemplate(
          '<b:text notrim>\n  hello \n  world\n</b:text>'
        );

        assert(text(template) === '\n  hello \n  world\n');
      }
    },
    {
      name: 'should not trim whitespaces when notrim attribute is exists',
      test: function(){
        var includeTemplate = createTemplate(
          '<b:text ref="foo">test</b:text>' +
          '<b:text ref="bar"/>'
        );
        var template = createTemplate(
          '[<b:include src="#' + includeTemplate.templateId + '">' +
            '<b:after ref="foo">1</b:after>' +
            '<b:before ref="bar">2</b:before>' +
          '</b:include>]'
        );

        assert(text(template, { foo: 'foo', bar: 'bar' }) === text('[foo12bar]'));
      }
    },
    {
      name: 'should add `element` reference',
      test: function(){
        var includeTemplate = createTemplate(
          '<b:text>hello </b:text>'
        );
        var template = createTemplate(
          '[<b:include src="#' + includeTemplate.templateId + '">' +
            '<b:after>world</b:after>' +
          '</b:include>]'
        );

        assert(text(template) === text('[hello world]'));
      }
    },
    {
      name: 'edge cases',
      test: [
        {
          name: 'single element',
          test: function(){
            var template = createTemplate(
              '[<b:text/>]'
            );

            assert(text(template) === text('[]'));
          }
        },
        {
          name: 'single element',
          test: function(){
            var template = createTemplate(
              '[<b:text></b:text>]'
            );

            assert(text(template) === text('[]'));
          }
        },
        {
          name: 'empty ref attribute',
          test: function(){
            var template = createTemplate(
              '[<b:text ref="">test</b:text>]'
            );

            assert(text(template) === text('[test]'));
          }
        }
      ]
    }
  ]
};
