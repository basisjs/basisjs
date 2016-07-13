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
    },
    {
      name: 'implicit <b:content> usage',
      test: function(){
        var includeTemplate = createTemplate(
          '<div>' +
            'includeTemplateContent' +
          '</div>'
        );
        var template = createTemplate(
          '<b:include src="#' + includeTemplate.templateId + '">' +
            'test' +
          '</b:include>'
        );

        assert(text(template) === text('<div>includeTemplateContent</div>test'));
      }
    },
    {
      name: 'transformation compatibility',
      test: [
        {
          name: 'b:replace inside b:content',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  '<span{marker}>Content to replace</span>' +
                '</b:content>' +
              '</div>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                '<b:replace ref="marker">New content</b:replace>' +
              '</b:include>'
            );

            assert(text(template) === text('<div>New content</div>'));
          }
        },
        {
          name: 'b:remove inside b:content',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  '<span{marker}>Content to remove</span>' +
                '</b:content>' +
              '</div>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                '<b:remove ref="marker"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<div></div>'));
          }
        },
        {
          name: 'b:before, b:after',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  '{marker}' +
                '</b:content>' +
              '</div>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                '<b:before ref="marker">before</b:before>' +
                '<b:after ref="marker">after</b:after>' +
              '</b:include>'
            );

            assert(text(template) === text('<div><b:content>before{marker}after</b:content></div>'));
          }
        },
        {
          name: 'b:append, b:prepend',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  '<span{marker}>brown fox</span>' +
                '</b:content>' +
              '</div>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                '<b:prepend ref="marker">the quick </b:prepend>' +
                '<b:append ref="marker"> jumps over</b:append>' +
              '</b:include>'
            );

            assert(text(template) === text('<div><b:content><span{marker}>the quick brown fox jumps over</span></b:content></div>'));
          }
        }
      ]
    },
    {
      name: 'multiple b:content declarations',
      test: [
        {
          name: 'last wins',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  'i like' +
                '</b:content>' + ' ' +
                '<b:content>' +
                  'trains' +
                '</b:content>' +
              '</div>'
            );

            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                'brains' +
              '</b:include>'
            );

            assert(text(template) === text('<div>i like brains</div>'));
          }
        },
        {
          name: 'nested wins',
          test: function(){
            var includeTemplate = createTemplate(
              '<div>' +
                '<b:content>' +
                  'i like ' +
                  '<b:content>' +
                    'trains' +
                  '</b:content>' +
                '</b:content>' +
              '</div>'
            );

            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                'brains' +
              '</b:include>'
            );

            assert(text(template) === text('<div>i like brains</div>'));
          }
        }
      ]
    },
    {
      name: 'inheritance',
      test: [
        {
          name: 'should inherit explicit <b:content> through includes',
          test: function(){
            var templateOne = createTemplate(
              '<div>' +
                '<b:content>' +
                  'original' +
                '</b:content>' +
              '</div>'
            );

            var templateTwo = createTemplate(
              '<b:include src="#' + templateOne.templateId + '">' +
                'failure' +
              '</b:include>'
            );

            var templateThree = createTemplate(
              '<b:include src="#' + templateTwo.templateId + '">' +
                'success' +
              '</b:include>'
            );

            assert(text(templateThree) === text('<div>success</div>'));
          }
        },
        {
          name: 'explicit <b:content> should win',
          test: function(){
            var templateA = createTemplate(
              '<span class="a">' +
                '<b:content>' +
                  'explicit' +
                '</b:content>' +
              '</span>'
            );

            var templateB = createTemplate(
              '<span class="b">' +
                'no content' +
              '</span>'
            );

            var twoTemplates = createTemplate(
              '<b:include src="#' + templateA.templateId + '"/>' +
              '<b:include src="#' + templateB.templateId + '"/>'
            );

            var templateWithMerge = createTemplate(
              '<div>' +
                '<b:include src="#' + twoTemplates.templateId + '">' +
                  'success' +
                '</b:include>' +
              '</div>'
            );

            assert(text(templateWithMerge) === text(
              '<div>' +
                '<span class="a">' +
                  'success' +
                '</span>' +
                '<span class="b">' +
                  'no content' +
                '</span>' +
              '</div>'
            ));
          }
        },
        {
          name: 'explicit <b:content> should override explicit <b:content> from includes',
          test: function(){
            var templateA = createTemplate(
              '<span class="a">' +
                '<b:content>' +
                  'explicit' +
                '</b:content>' +
              '</span>'
            );

            var templateB = createTemplate(
              '<span class="b">' +
                'no content' +
              '</span>'
            );

            var twoTemplates = createTemplate(
              '<b:content/>' +
              '<b:include src="#' + templateA.templateId + '"/>' +
              '<b:include src="#' + templateB.templateId + '"/>'
            );

            var templateWithMerge = createTemplate(
              '<div>' +
                '<b:include src="#' + twoTemplates.templateId + '">' +
                  'success' +
                '</b:include>' +
              '</div>'
            );

            assert(text(templateWithMerge) === text(
              '<div>' +
                'success' +
                '<span class="a">' +
                  'explicit' +
                '</span>' +
                '<span class="b">' +
                  'no content' +
                '</span>' +
              '</div>'
            ));
          }
        },
        {
          name: 'should correctly inject explicit <b:content> to include',
          test: function(){
            var templateA = createTemplate(
              '<span class="a">' +
                'no content' +
              '</span>'
            );

            var templateB = createTemplate(
              '<span class="b">' +
                '<b:content/>' +
              '</span>'
            );

            var twoTemplates = createTemplate(
              '<b:include src="#' + templateA.templateId + '">' +
                '<b:prepend>' +
                  '<b:content/>' +
                '</b:prepend>' +
              '</b:include>' +
              '<b:include src="#' + templateB.templateId + '"/>'
            );

            var templateWithMerge = createTemplate(
              '<div>' +
                '<b:include src="#' + twoTemplates.templateId + '">' +
                  'success' +
                '</b:include>' +
              '</div>'
            );

            assert(text(templateWithMerge) === text(
              '<div>' +
                '<span class="a">' +
                  'success' +
                  'no content' +
                '</span>' +
                '<span class="b">' +
                '</span>' +
              '</div>'
            ));
          }
        }
      ]
    }
  ]
};
