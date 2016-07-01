module.exports = {
  name: '<b:content>',
  test: [
    {
      name: 'basic usage',
      test: [
        {
          name: 'empty <b:content/>',
          test: [
            {
              name: 'on top level',
              test: function(){
                var template = createTemplate(
                  '<b:content/>'
                );

                assert(text(template) === text('{element}'));
              }
            },
            {
              name: 'inside element',
              test: function(){
                var template = createTemplate(
                  '<span>' +
                    '<b:content/>' +
                  '</span>'
                );

                assert(text(template) === text('<span></span>'));
              }
            }
          ]
        },
        {
          name: 'with content',
          test: [
            {
              name: 'on top level',
              test: function(){
                var template = createTemplate(
                  '<b:content>' +
                    'test<br/>' +
                  '</b:content>'
                );

                assert(text(template) === text('test<br/>'));
              }
            },
            {
              name: 'inside element',
              test: function(){
                var template = createTemplate(
                  '<span>' +
                    '<b:content>' +
                      'test<br/>' +
                    '</b:content>' +
                  '</span>'
                );

                assert(text(template) === text('<span>test<br/></span>'));
              }
            }
          ]
        }
      ]
    },
    {
      name: 'with <b:include>',
      test: [
        {
          name: 'should insert to <b:content> point',
          test: function(){
            var includeTemplate = createTemplate(
              '<span>' +
                '<b:content/>' +
              '</span>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                'test<br/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span>test<br/></span>'));
          }
        },
        {
          name: 'should left untouched <b:content> content when no free nodes inside include',
          test: function(){
            var includeTemplate = createTemplate(
              '<span>' +
                '<b:content>content</b:content>' +
              '</span>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '"/>'
            );

            assert(text(template) === text('<span>content</span>'));
          }
        },
        {
          name: 'should replace <b:content> content when free nodes inside include',
          test: function(){
            var includeTemplate = createTemplate(
              '<span>' +
                '<b:content>content</b:content>' +
              '</span>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                'test<br/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span>test<br/></span>'));
          }
        }
      ]
    }
  ]
};
