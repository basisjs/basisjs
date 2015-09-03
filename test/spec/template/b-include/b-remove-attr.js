module.exports = {
  name: '<b:remove-attr>',
  test: [
    {
      name: 'non-exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="class"/></b:include>');

        this.is(text('<span title="a"/>'), text(b));
      }
    },
    {
      name: 'exists',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="title"/></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'class attribute',
      test: function(){
        var a = createTemplate('<span class="a b"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="class"/></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'id attribute',
      test: function(){
        var a = createTemplate('<span id="foo"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="id"/></b:include>');

        this.is(text('<span/>'), text(b));
      }
    },
    {
      name: 'event-* attribute',
      test: function(){
        var a = createTemplate('<span event-click="click"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="event-click"/></b:include>');

        this.is(text('<span{field}/>'), text(b));
      }
    },
    {
      name: 'style attribute',
      test: function(){
        var a = createTemplate('<span style="width: 100px;"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove-attr name="style"/></b:include>');

        this.is(text('<span{field}/>'), text(b));
      }
    }
  ]
};
