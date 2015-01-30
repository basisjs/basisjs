module.exports = {
  name: 'declaration',
  test: [
    {
      name: 'when remove reference binding shouldn\'t be lost',
      test: function(){
        var tokens = JSON.stringify(
          basis.template.makeDeclaration(
            '<div{ref}>' +
              '<div{ref}/>' +
            '</div>'
          ).tokens
        );

        assert(tokens === '[[1,"ref",["element"],"div",[1,1,["ref"],"div"]]]');
      }
    },
    {
      name: 'the same style from different includes should produce single resource',
      test: function(){
        var template = new basis.template.Template(
          '<b:style src="../fixture/isolate_style.css"/>' +
          '<div/>'
        );
        var decl = basis.template.makeDeclaration(
          '<b:include src="#' + template.templateId + '"/>' +
          '<b:include src="#' + template.templateId + '"/>'
        );

        assert(decl.styles.length === 2);
        assert(decl.resources.length === 1);
      }
    }
  ]
};
