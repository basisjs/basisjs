module.exports = {
  name: 'declaration issues',
  test: [
    {
      name: 'found issues',
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
    }
  ]
};
