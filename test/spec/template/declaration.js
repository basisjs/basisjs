module.exports = {
  name: 'declaration',
  test: [
    {
      name: 'empty declaration',
      test: function(){
        var tokens = JSON.stringify(
          nsTemplate.makeDeclaration('').tokens
        );

        assert(tokens === '[[3,0,["element"],""],[9,0]]');
      }
    },
    {
      name: 'references and bindings',
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
          name: 'single reference',
          test: function(){
            var tokens = JSON.stringify(
              nsTemplate.makeDeclaration(
                '<div>' +
                  '<div{foo}/>' +
                  '{bar}' +
                  '<!--{baz}-->' +
                '</div>'
              ).tokens
            );

            assert(tokens === '[[1,0,["element"],"div",[1,1,["foo"],"div"],[3,1,["bar"]],[8,1,["baz"]]],[9,0]]');
          }
        },
        {
          name: 'multiple references',
          test: function(){
            var tokens = JSON.stringify(
              nsTemplate.makeDeclaration(
                '<div>' +
                  '<div{foo|a}/>' +
                  '{bar|b}' +
                  '<!--{baz|c}-->' +
                '</div>'
              ).tokens
            );

            assert(tokens === '[[1,0,["element"],"div",[1,1,["foo","a"],"div"],[3,1,["bar","b"]],[8,1,["baz","c"]]],[9,0]]');
          }
        }
      ]
    },
    {
      name: 'b:ref',
      test: [
        {
          name: 'should add references to element',
          test: function(){
            var tokens = JSON.stringify(
              nsTemplate.makeDeclaration(
                '<div{ref}>' +
                  '<div b:ref="ref"/>' +
                  '<div b:ref="foo bar"/>' +
                  '<div b:ref="baz"/>' +
                '</div>'
              ).tokens
            );

            assert(tokens === '[[1,"ref",["element"],"div",[1,1,["ref"],"div"],[1,1,["foo","bar"],"div"],[1,1,["baz"],"div"]],[9,0]]');
          }
        },
        {
          name: 'should override references set by `<element{ref}>`',
          test: function(){
            var tokens = JSON.stringify(
              nsTemplate.makeDeclaration(
                '<div>' +
                  '<div{a} b:ref="b"/>' +
                '</div>'
              ).tokens
            );

            assert(tokens === '[[1,0,["element"],"div",[1,1,["a","b"],"div"]],[9,0]]');
          }
        },
        {
          name: 'should keep {element} reference when override references',
          test: function(){
            var tokens = JSON.stringify(
              nsTemplate.makeDeclaration(
                '<div b:ref="b"/>'
              ).tokens
            );

            assert(tokens === '[[1,1,["b","element"],"div"],[9,0]]');
          }
        }
      ]
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
