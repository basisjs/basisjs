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
      name: 'definitions should apply for <b:content>\'s content',
      test: [
        {
          name: 'l10n',
          test: function(){
            var dictUrl = basis.resource('./test.l10n').url;
            var template = createTemplate(
              '<b:l10n src="./test.l10n"/>' +
              '{l10n:test}' +
              '<b:content>' +
                '{l10n:test}' +
              '</b:content>'
            );

            assert(text(template) === '{test@' + dictUrl + '}{test@' + dictUrl + '}');
          }
        },
        {
          name: '<b:define>',
          test: function(){
            var template = createTemplate(
              '<b:define name="test" type="bool"/>' +
              '<span class="t-{test}"/>' +
              '<b:content>' +
                '<span class="t-{test}"/>' +
              '</b:content>'
            );

            assert(text(template, { test: 1 }) === text('<span class="t-test"/><span class="t-test"/>'));
          }
        },
        {
          name: '<b:define>',
          test: function(){
            var template = createTemplate(
              '<b:style ns="foo"></b:style>' +
              '<span class="foo:test"/>' +
              '<b:content>' +
                '<span class="foo:test"/>' +
              '</b:content>'
            );
            var instance = template.createInstance();
            var className = instance.element.className;

            assert(className !== 'foo:test');
            assert(/^\S+test$/.test(className));
            assert(text(instance) === text('<span class="' + className + '"/><span class="' + className + '"/>'));
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
        },
        {
          name: 'should correctly inject explicit <b:content> inside element to include',
          test: function(){
            var templateA = createTemplate(
              '<span class="a">' +
                'no content' +
              '</span>'
            );

            var templateB = createTemplate(
              '<b:include src="#' + templateA.templateId + '">' +
                '<span class="b">' +
                  '<b:content/>' +
                '</span>' +
              '</b:include>'
            );

            var template = createTemplate(
              '<div>' +
                '<b:include src="#' + templateB.templateId + '">' +
                  'success' +
                '</b:include>' +
              '</div>'
            );

            assert(text(template) === text(
              '<div>' +
                '<span class="a">' +
                  'no content' +
                '</span>' +
                '<span class="b">' +
                  'success' +
                '</span>' +
              '</div>'
            ));
          }
        }
      ]
    },
    {
      name: 'special tags inside <b:include> should insert into <b:content>',
      test: [
        {
          name: '<b:include>',
          test: function(){
            var a = createTemplate('<span title="a"><b:content/></span>');
            var b = createTemplate('<span title="b"/>');
            var c = createTemplate(
              '<b:include src="#' + a.templateId + '">' +
                '<b:include src="#' + b.templateId + '"/>' +
              '</b:include>'
            );

            assert(text(c) === '<span title="a"><span title="b"></span></span>');
          }
        },
        {
          name: '<b:content>',
          test: function(){
            var a = createTemplate(
              '<span title="a">' +
                '<b:content>' +
                  'should be replaced' +
                '</b:content>' +
              '</span>'
            );
            var b = createTemplate(
              '<b:include src="#' + a.templateId + '">' +
                'Hello&#32;' +
                '<b:content/>' +
              '</b:include>'
            );
            var c = createTemplate(
              '<b:include src="#' + b.templateId + '">' +
                'world!!' +
              '</b:include>'
            );

            assert(text(c) === '<span title="a">Hello world!!</span>');
          }
        }
      ]
    }
  ]
};
