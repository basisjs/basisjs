module.exports = {
  name: '<b:template>',
  test: [
    {
      name: 'warnings',
      test: [
        {
          name: 'name attribute is required',
          test: function(){
            var template = createTemplate(
              '<b:template/>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(String(template.decl_.warns[0]) === '<b:template> has no `name` attribute');
          }
        },
        {
          name: 'template name should be unique',
          test: function(){
            var template = createTemplate(
              '<b:template name="foo"/>' +
              '<b:template name="foo"/>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(String(template.decl_.warns[0]) === '<b:template> with name `foo` is already defined');
          }
        },
        {
          name: 'template name should not start with number',
          test: function(){
            var template = createTemplate(
              '<b:template name="123"/>',
              true
            );

            assert(template.decl_.warns.length === 1);
            assert(String(template.decl_.warns[0]) === '<b:template> name can\'t starts with number');
          }
        }
      ]
    },
    {
      name: 'content should be ignored',
      test: [
        {
          name: 'in template inself',
          test: function(){
            var template = createTemplate(
              'foo' +
              '<b:template name="test">' +
                'baz' +
              '</b:template>' +
              'bar'
            );

            assert(text(template) === text('foobar'));
          }
        },
        {
          name: 'when include template',
          test: function(){
            var includeTemplate = createTemplate(
              '[incl' +
              '<b:template name="test">' +
                'baz' +
              '</b:template>' +
              'ude]'
            );
            var template = createTemplate(
              'foo' +
              '<b:include src="#' + includeTemplate.templateId + '"/>' +
              'bar'
            );

            assert(text(template) === text('foo[include]bar'));
          }
        },
        {
          name: 'should not affect refs map',
          test: function(){
            var includeTemplate = createTemplate(
              '<div{ref}/><div{ref}/>' +
              '<b:template name="test">' +
                '<div{ref/}>' +
              '</b:template>'
            );
            var template = createTemplate(
              '<b:include src="#' + includeTemplate.templateId + '">' +
                '<b:class ref="ref" value="test"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<div/><div class="test"/>'));
          }
        },
        {
          name: 'should not styles or isolate',
          test: function(){
            var template = createTemplate(
              '<div class="test"/>' +
              '<b:template name="test">' +
                '<b:style src="./foo.css"/>' +
                '<b:isolate/>' +
              '</b:template>'
            );

            assert(text(template) === text('<div class="test"/>'));
            assert(template.decl_.styles.length === 0);
          }
        }
      ]
    },
    {
      name: 'local usage',
      test: [
        {
          name: 'basic',
          test: function(){
            var template = createTemplate(
              '<b:template name="test">' +
                'test' +
              '</b:template>' +
              '[<b:include src="#test"/>]'
            );

            assert(text(template) === text('[test]'));
          }
        },
        {
          name: 'should add style',
          test: function(){
            var template = createTemplate(
              '<b:template name="test">' +
                '<b:style src="./test.css"/>' +
                'test' +
              '</b:template>' +
              '[<b:include src="#test"/>]'
            );

            assert(text(template) === text('[test]'));
            assert(template.decl_.styles.length === 1);
          }
        },
        {
          name: '<b:isolate> inside template should has no effect',
          test: function(){
            var template = createTemplate(
              '<b:template name="test">' +
                '<b:isolate prefix="xxx__"/>' +
                '<span class="inside"/>' +
              '</b:template>' +
              '<div class="outside"/>' +
              '[<b:include src="#test"/>]'
            );

            assert(text(template) === text('<div class="outside"></div>[<span class="inside"></span>]'));
          }
        },
        {
          name: '<b:isolate> outside template should effect to template content',
          test: function(){
            var template = createTemplate(
              '<b:isolate prefix="xxx__"/>' +
              '<b:template name="test">' +
                '<span class="inside"/>' +
              '</b:template>' +
              '<div class="outside"/>' +
              '[<b:include src="#test"/>]'
            );

            assert(text(template) === text('<div class="xxx__outside"></div>[<span class="xxx__inside"></span>]'));
          }
        },
        {
          name: 'includes should not has a side effect',
          test: function(){
            var template = createTemplate(
              '<b:template name="test">' +
                '<span class="foo"/>' +
              '</b:template>' +
              '[<b:include src="#test" class="bar"><b:append>test</b:append></b:include>]' +
              '[<b:include src="#test" class="baz"/>]'
            );

            assert(text(template) === text(
              '[<span class="foo bar">test</span>]' +
              '[<span class="foo baz"></span>]'
            ));
          }
        }
      ]
    }
  ]
};
