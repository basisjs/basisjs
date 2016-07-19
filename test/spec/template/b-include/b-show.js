module.exports = {
  name: '<b:show>',
  test: [
    {
      name: 'simple case',
      test: function(){
        var nested = createTemplate('<span/>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.element.style.display == 'none');

        instance.set('foo', true);
        assert(instance.element.style.display == '');
      }
    },
    {
      name: 'simple case with reference',
      test: function(){
        var nested = createTemplate('<span><span{test}/></span>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show ref="test" expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.test.style.display == 'none');

        instance.set('foo', true);
        assert(instance.test.style.display == '');
      }
    },
    {
      name: 'should override another b:show',
      test: function(){
        var nested = createTemplate('<span b:show="{bar}"/>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.element.style.display == 'none');

        instance.set('bar', true);
        assert(instance.element.style.display == 'none');

        instance.set('foo', true);
        assert(instance.element.style.display == '');
      }
    },
    {
      name: 'should override another b:show by reference',
      test: function(){
        var nested = createTemplate('<span><span{test} b:show="{bar}"/></span>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show ref="test" expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.test.style.display == 'none');

        instance.set('bar', true);
        assert(instance.test.style.display == 'none');

        instance.set('foo', true);
        assert(instance.test.style.display == '');
      }
    },
    {
      name: 'should override b:hide',
      test: function(){
        var nested = createTemplate('<span b:hide="{bar}"/>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.element.style.display == 'none');

        instance.set('foo', true);
        instance.set('bar', true);
        assert(instance.element.style.display == '');
      }
    },
    {
      name: 'should override b:hide',
      test: function(){
        var nested = createTemplate('<span><span{test} b:hide="{bar}"/></span>');
        var t = createTemplate('<b:include src="#' + nested.templateId + '"><b:show ref="test" expr="{foo}"/></b:include>');
        var instance = t.createInstance();

        assert(instance.test.style.display == 'none');

        instance.set('foo', true);
        instance.set('bar', true);
        assert(instance.test.style.display == '');
      }
    },
    {
      name: 'should override b:hide instruction',
      test: function(){
        var nested = createTemplate('<span/>');
        var t = createTemplate(
          '<b:include src="#' + nested.templateId + '">' +
            '<b:hide expr="{foo}"/>' +
            '<b:show expr="{foo}"/>' +
          '</b:include>'
        );
        var instance = t.createInstance();

        assert(instance.element.style.display == 'none');

        instance.set('foo', true);
        assert(instance.element.style.display == '');
      }
    },
    {
      name: 'should override b:hide instruction by static value',
      test: function(){
        var nested = createTemplate('<span/>');
        var t = createTemplate(
          '<b:include src="#' + nested.templateId + '">' +
            '<b:hide expr="{foo}"/>' +
            '<b:show expr="true"/>' +
          '</b:include>'
        );
        var instance = t.createInstance();

        assert(instance.element.style.display == '');

        instance.set('foo', true);
        assert(instance.element.style.display == '');
      }
    }
  ]
};
