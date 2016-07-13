module.exports = {
  name: 'declaration',
  test: [
    {
      name: 'when remove reference binding shouldn\'t be lost',
      test: function(){
        var tokens = JSON.stringify(
          nsTemplate.makeDeclaration(
            '<div{ref}>' +
              '<div{ref}/>' +
            '</div>'
          ).tokens
        );

        assert(tokens === '[[1,"ref",["element"],"div",[1,1,["ref"],"div"]],[9,0]]');
      }
    },
    {
      name: 'the same style from different includes should produce single resource',
      test: function(){
        var template = new nsTemplate.Template(
          '<b:style src="../fixture/isolate_style.css"/>' +
          '<div/>'
        );
        var decl = nsTemplate.makeDeclaration(
          '<b:include src="#' + template.templateId + '"/>' +
          '<b:include src="#' + template.templateId + '"/>'
        );

        assert(decl.styles.length === 2);
        assert(decl.resources.length === 1);
      }
    },
    {
      name: 'l10n',
      test: [
        {
          name: 'should not wrong match to l10n tokens',
          test: function(){
            var decl = nsTemplate.makeDeclaration(
              '<span title="{l10n}"/>' +
              '<span title="{l10n:}"/>'
            );

            assert(Array.isArray(decl.l10n));
            assert(decl.l10n.length == 0);
          }
        }
      ]
    },
    {
      name: 'style order',
      test: [
        {
          name: 'styles from includes should try to preserve order',
          test: function(){
            var template1 = new nsTemplate.Template(
              '<b:style src="../fixture/foo.css"/>' +
              '<b:style src="../fixture/bar.css"/>' +
              '<div/>'
            );
            var template2 = new nsTemplate.Template(
              '<b:style src="../fixture/foo.css"/>' +
              '<div/>'
            );
            var decl = nsTemplate.makeDeclaration(
              '<b:include src="#' + template1.templateId + '"/>' +
              '<b:include src="#' + template2.templateId + '"/>'
            );

            assert(decl.styles.length === 3);
            assert(decl.resources.length === 2);
            assert.deep([
              { type: 'style', url: basis.path.resolve('../fixture/foo.css') },
              { type: 'style', url: basis.path.resolve('../fixture/bar.css') }
            ], decl.resources);
          }
        },
        {
          name: 'styles in root template should comes last',
          test: function(){
            var template1 = new nsTemplate.Template(
              '<b:style src="../fixture/foo.css"/>' +
              '<b:style src="../fixture/bar.css"/>' +
              '<div/>'
            );
            var template2 = new nsTemplate.Template(
              '<b:style src="../fixture/foo.css"/>' +
              '<div/>'
            );
            var decl = nsTemplate.makeDeclaration(
              '<b:style src="../fixture/foo.css"/>' +
              '<b:include src="#' + template1.templateId + '"/>' +
              '<b:include src="#' + template2.templateId + '"/>'
            );

            assert(decl.styles.length === 4);
            assert(decl.resources.length === 2);
            assert.deep([
              { type: 'style', url: basis.path.resolve('../fixture/bar.css') },
              { type: 'style', url: basis.path.resolve('../fixture/foo.css') }
            ], decl.resources);
          }
        }
      ]
    }
  ]
};
