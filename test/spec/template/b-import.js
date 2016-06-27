module.exports = {
  name: '<b:import>',
  test: [
    {
      name: 'basic usage',
      test: function(){
        var importTemplate = createTemplate(
          '<b:template name="hello">hello</b:template>' +
          '<b:template name="world">world</b:template>'
        );
        var template = createTemplate(
          '<b:import src="#' + importTemplate.templateId + '"/>' +
          '<hello/> <world/>'
        );

        assert(text(template) === 'hello world');
      }
    },
    {
      name: 'styles and isolate',
      test: [
        {
          name: '',
          test: function(){
            function deobfuscate(html){
              return html.replace(/([a-z0-9]+)__pill/g, function(m, prefix){
                if (!clsMap[prefix])
                  clsMap[prefix] = 'prefix' + clsIdx++;
                return clsMap[prefix] + '__pill';
              });
            }

            var importTemplate = createTemplate(
              '<b:template name="red-pill">' +
                '<b:style>.pill { color: red }</b:style>' +
                '<span class="pill"/>' +
              '</b:template>' +
              '<b:template name="blue-pill">' +
                '<b:style>.pill { color: blue }</b:style>' +
                '<span class="pill"/>' +
              '</b:template>'
            );
            var template1 = createTemplate(
              '<b:import src="#' + importTemplate.templateId + '"/>' +
              '<blue-pill/><red-pill/><red-pill/>'
            );
            var template2 = createTemplate(
              '<b:import src="#' + importTemplate.templateId + '"/>' +
              '<blue-pill/><red-pill/><red-pill/>'
            );

            var clsMap = {};
            var clsIdx = 1;
            var text1 = deobfuscate(text(template1));
            var text2 = deobfuscate(text(template2));

            assert(text1 === text2);
            assert(text1 ===
              '<span class="prefix1__pill"></span>' +
              '<span class="prefix2__pill"></span>' +
              '<span class="prefix2__pill"></span>');
            assert(template1.decl_.styles.length === 2);
          }
        }
      ]
    }
  ]
};
