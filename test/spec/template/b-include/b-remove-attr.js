module.exports = {
  name: '<b:remove-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="class"/></b:include>');

        assert(text(b) === text('<span title="a"/>'));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="title"/></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span class="a b"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="class"/></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span id="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="id"/></b:include>');

        assert(text(b) === text('<span/>'));
      }
    },
    {
      name: 'event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="click"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="event-click"/></b:include>');

        assert(text(b) === text('<span{field}/>'));
      }
    },
    {
      name: 'style attribute',
      test: function(){
        var a = createTemplate('<span style="width: 100px;"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="style"/></b:include>');

        assert(text(b) === text('<span{field}/>'));
      }
    }
  ]
};
