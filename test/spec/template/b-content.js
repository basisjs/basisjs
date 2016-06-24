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
    }
  ]
};
