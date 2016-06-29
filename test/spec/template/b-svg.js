module.exports = {
  name: '<b:svg>',
  test: [
    {
      name: 'basic usage',
      test: function(){
        var template = createTemplate(
          '<b:svg/>'
        );

        assert(text(template) === text('<svg:svg><svg:use></svg:use></svg:svg>'));
      }
    },
    {
      name: '`use` attribute',
      test: [
        {
          name: 'no value',
          test: function(){
            var template = createTemplate(
              '<b:svg use/>'
            );

            var actual = text(template);
            var expected = normalizeNS(actual, text('<svg:svg><svg:use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href=""></svg:use></svg:svg>'));

            assert(actual === expected);
          }
        },
        {
          name: 'static value',
          test: function(){
            var template = createTemplate(
              '<b:svg use="test"/>'
            );

            var actual = text(template);
            var expected = normalizeNS(actual, text('<svg:svg><svg:use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="test"></svg:use></svg:svg>'))

            assert(actual === expected);
          }
        },
        {
          name: 'binding in `use` attribute',
          test: function(){
            var template = createTemplate(
              '<b:svg use="test{binding}"/>'
            );

            var actual = text(template);
            var expected = normalizeNS(actual, text('<svg:svg><svg:use></svg:use></svg:svg>'));

            assert(actual === expected);

            var actual = text(text(template, { binding: 123 }));
            var expected = normalizeNS(actual, text('<svg:svg><svg:use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="test123"></svg:use></svg:svg>'));

            assert(actual === expected);
          }
        },
      ]
    },
    {
      name: '`src` attribute',
      test: [
        {
          name: 'no value',
          test: function(){
            var template = createTemplate(
              '<b:svg src/>'
            );

            assert(text(template) === text('<svg:svg><svg:use></svg:use></svg:svg>'));
            assert(template.decl_.warns.length === 1);
            assert(template.resources.length === 0);
          }
        },
        {
          name: 'with value',
          test: function(){
            var template = createTemplate(
              '<b:svg src="test"/>'
            );

            assert(text(template) === text('<svg:svg><svg:use></svg:use></svg:svg>'));
            assert(template.decl_.warns === false);
            assert(template.resources.length === 1);
            assert(template.resources[0].url === basis.path.resolve('test'));
          }
        }
      ]
    },
    {
      name: 'should add any attribute on svg root',
      test: function(){
        var template = createTemplate(
          '<b:svg class="foo {bar}" a="123" b="{bar}"/>'
        );

        assert(text(template) === text('<svg:svg class="foo" a="123"><svg:use></svg:use></svg:svg>'));
        assert(text(template, { bar: 'test' }) === text('<svg:svg class="foo test" a="123" b="test"><svg:use></svg:use></svg:svg>'));
      }
    }
  ]
};
