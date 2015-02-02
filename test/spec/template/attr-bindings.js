module.exports = {
  name: 'attribute bindings',
  test: [
    {
      name: 'expression in regular attribute',
      test: function(){
        var t = createTemplate('<span title="{foo}{bar}"/>');
        var instance = t.createInstance();

        assert(instance.element.title == '');

        instance.set('foo', 'x');
        assert(instance.element.title == 'xundefined'); // bar is undefined

        instance.set('bar', 'x');
        assert(instance.element.title == 'xx');

        instance.set('foo', '');
        assert(instance.element.title == 'x');

        instance.set('bar', 'xx');
        assert(instance.element.title == 'xx');

      }
    },
    {
      name: 'expression in style',
      test: function(){
        var t = createTemplate('<span style="display: {foo}{bar}"/>');
        var instance = t.createInstance();

        assert(instance.element.style.display == '');

        instance.set('foo', 'blo');
        assert(instance.element.style.display == ''); // 'blo' is not a valid value

        instance.set('bar', 'ck');
        assert(instance.element.style.display == 'block');

        instance.set('foo', 'inline');
        assert(instance.element.style.display == 'block'); // 'inlineblock' is not a valid value

        instance.set('bar', '');
        assert(instance.element.style.display == 'inline');

        instance.set('foo', '');
        assert(instance.element.style.display == '');

        instance.set('bar', 'inline');
        assert(instance.element.style.display == 'inline');

      }
    },
    {
      name: 'b:show',
      test: [
        {
          name: 'should be hidden if value is empty',
          test: function(){
            var t = createTemplate('<span b:show=""/>');
            assert(t.createInstance().element.style.display == 'none');
          }
        },
        {
          name: 'when value has non-binding parts or not specified, should be visible',
          test: function(){
            var t = createTemplate('<span b:show/>');
            assert(t.createInstance().element.style.display == '');

            var t = createTemplate('<span b:show="true"/>');
            assert(t.createInstance().element.style.display == '');

            var t = createTemplate('<span b:show="false"/>');
            assert(t.createInstance().element.style.display == '');

            var t = createTemplate('<span b:show="true{foo}"/>');
            assert(t.createInstance().element.style.display == '');
          }
        },
        {
          name: 'when value for binding is not set yet, element should be invisible',
          test: function(){
            var t = createTemplate('<span b:show="{foo}"/>');
            assert(t.createInstance().element.style.display == 'none');

            var t = createTemplate('<span b:show="{foo}{bar}"/>');
            assert(t.createInstance().element.style.display == 'none');
          }
        },
        {
          name: 'single binding',
          test: function(){
            var t = createTemplate('<span b:show="{foo}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.display == 'none');

            instance.set('foo', false);
            assert(instance.element.style.display == 'none');

            instance.set('foo', true);
            assert(instance.element.style.display == '');

            instance.set('foo', 'foo');
            assert(instance.element.style.display == '');

            instance.set('foo', undefined);
            assert(instance.element.style.display == 'none');
          }
        },
        {
          name: 'single string binding',
          test: function(){
            var t = createTemplate('<span b:show="{foo}"/>');
            var instance = t.createInstance();

            instance.set('foo', 'foo');
            assert(instance.element.style.display == '');

            instance.set('foo', undefined);
            assert(instance.element.style.display == 'none');
          }
        },
        {
          name: 'expression',
          test: function(){
            var t = createTemplate('<span b:show="{foo}{bar}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.display == 'none');

            instance.set('foo', 0);  // 0 + undefined -> false
            assert(instance.element.style.display == 'none');

            instance.set('bar', 1);  // 0 + 1 -> true
            assert(instance.element.style.display == '');

            instance.set('bar', -1); // 0 + -1 -> true
            assert(instance.element.style.display == '');

            instance.set('foo', 1);  // 1 + -1 -> false
            assert(instance.element.style.display == 'none');

            instance.set('bar', 1);  // 1 + 1 -> true
            assert(instance.element.style.display == '');

            instance.set('bar', -1);  // 1 + -1 -> false
            assert(instance.element.style.display == 'none');

            instance.set('bar', 0);  // 1 + 0 -> true
            assert(instance.element.style.display == '');

            instance.set('foo', 0);  // 0 + 0 -> false
            assert(instance.element.style.display == 'none');
          }
        }
      ]
    },
    {
      name: 'b:hide',
      test: [
        {
          name: 'should be visible if value is empty',
          test: function(){
            var t = createTemplate('<span b:hide=""/>');
            assert(t.createInstance().element.style.display == '');
          }
        },
        {
          name: 'when value has non-binding parts or not specified, should be hidden',
          test: function(){
            var t = createTemplate('<span b:hide/>');
            assert(t.createInstance().element.style.display == 'none');

            var t = createTemplate('<span b:hide="true"/>');
            assert(t.createInstance().element.style.display == 'none');

            var t = createTemplate('<span b:hide="false"/>');
            assert(t.createInstance().element.style.display == 'none');

            var t = createTemplate('<span b:hide="true{foo}"/>');
            assert(t.createInstance().element.style.display == 'none');
          }
        },
        {
          name: 'when value for binding is not set yet, element should visible',
          test: function(){
            var t = createTemplate('<span b:hide="{foo}"/>');
            assert(t.createInstance().element.style.display == '');

            var t = createTemplate('<span b:hide="{foo}{bar}"/>');
            assert(t.createInstance().element.style.display == '');
          }
        },
        {
          name: 'single string binding',
          test: function(){
            var t = createTemplate('<span b:hide="{foo}"/>');
            var instance = t.createInstance();

            instance.set('foo', undefined);
            assert(instance.element.style.display == '');

            instance.set('foo', 'foo');
            assert(instance.element.style.display == 'none');
          }
        },
        {
          name: 'single binding',
          test: function(){
            var t = createTemplate('<span b:hide="{foo}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.display == '');

            instance.set('foo', true);
            assert(instance.element.style.display == 'none');

            instance.set('foo', false);
            assert(instance.element.style.display == '');
          }
        },
        {
          name: 'expression',
          test: function(){
            var t = createTemplate('<span b:hide="{foo}{bar}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.display == '');

            instance.set('foo', 0);  // 0 + undefined -> false
            assert(instance.element.style.display == '');

            instance.set('bar', 1);  // 0 + 1 -> true
            assert(instance.element.style.display == 'none');

            instance.set('bar', -1); // 0 + -1 -> true
            assert(instance.element.style.display == 'none');

            instance.set('foo', 1);  // 1 + -1 -> false
            assert(instance.element.style.display == '');

            instance.set('bar', 1);  // 1 + 1 -> true
            assert(instance.element.style.display == 'none');

            instance.set('bar', -1);  // 1 + -1 -> false
            assert(instance.element.style.display == '');

            instance.set('bar', 0);  // 1 + 0 -> true
            assert(instance.element.style.display == 'none');

            instance.set('foo', 0);  // 0 + 0 -> false
            assert(instance.element.style.display == '');
          }
        }
      ]
    },
    {
      name: 'b:visible',
      test: [
        {
          name: 'should be hidden if value is empty',
          test: function(){
            var t = createTemplate('<span b:visible=""/>');
            assert(t.createInstance().element.style.visibility == 'hidden');
          }
        },
        {
          name: 'when value has non-binding parts or not specified, should be visible',
          test: function(){
            var t = createTemplate('<span b:visible/>');
            assert(t.createInstance().element.style.visibility == '');

            var t = createTemplate('<span b:visible="true"/>');
            assert(t.createInstance().element.style.visibility == '');

            var t = createTemplate('<span b:visible="false"/>');
            assert(t.createInstance().element.style.visibility == '');

            var t = createTemplate('<span b:visible="true{foo}"/>');
            assert(t.createInstance().element.style.visibility == '');
          }
        },
        {
          name: 'when value for binding is not set yet, element should be invisible',
          test: function(){
            var t = createTemplate('<span b:visible="{foo}"/>');
            assert(t.createInstance().element.style.visibility == 'hidden');

            var t = createTemplate('<span b:visible="{foo}{bar}"/>');
            assert(t.createInstance().element.style.visibility == 'hidden');
          }
        },
        {
          name: 'single binding',
          test: function(){
            var t = createTemplate('<span b:visible="{foo}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', false);
            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', true);
            assert(instance.element.style.visibility == '');

            instance.set('foo', 'foo');
            assert(instance.element.style.visibility == '');

            instance.set('foo', undefined);
            assert(instance.element.style.visibility == 'hidden');
          }
        },
        {
          name: 'single string binding',
          test: function(){
            var t = createTemplate('<span b:visible="{foo}"/>');
            var instance = t.createInstance();

            instance.set('foo', 'foo');
            assert(instance.element.style.visibility == '');

            instance.set('foo', undefined);
            assert(instance.element.style.visibility == 'hidden');
          }
        },
        {
          name: 'expression',
          test: function(){
            var t = createTemplate('<span b:visible="{foo}{bar}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', 0);  // 0 + undefined -> false
            assert(instance.element.style.visibility == 'hidden');

            instance.set('bar', 1);  // 0 + 1 -> true
            assert(instance.element.style.visibility == '');

            instance.set('bar', -1); // 0 + -1 -> true
            assert(instance.element.style.visibility == '');

            instance.set('foo', 1);  // 1 + -1 -> false
            assert(instance.element.style.visibility == 'hidden');

            instance.set('bar', 1);  // 1 + 1 -> true
            assert(instance.element.style.visibility == '');

            instance.set('bar', -1);  // 1 + -1 -> false
            assert(instance.element.style.visibility == 'hidden');

            instance.set('bar', 0);  // 1 + 0 -> true
            assert(instance.element.style.visibility == '');

            instance.set('foo', 0);  // 0 + 0 -> false
            assert(instance.element.style.visibility == 'hidden');
          }
        }
      ]
    },
    {
      name: 'b:hidden',
      test: [
        {
          name: 'should be visible if value is empty',
          test: function(){
            var t = createTemplate('<span b:hidden=""/>');
            assert(t.createInstance().element.style.visibility == '');
          }
        },
        {
          name: 'when value has non-binding parts or not specified, should be hidden',
          test: function(){
            var t = createTemplate('<span b:hidden/>');
            assert(t.createInstance().element.style.visibility == 'hidden');

            var t = createTemplate('<span b:hidden="true"/>');
            assert(t.createInstance().element.style.visibility == 'hidden');

            var t = createTemplate('<span b:hidden="false"/>');
            assert(t.createInstance().element.style.visibility == 'hidden');

            var t = createTemplate('<span b:hidden="true{foo}"/>');
            assert(t.createInstance().element.style.visibility == 'hidden');
          }
        },
        {
          name: 'when value for binding is not set yet, element should visible',
          test: function(){
            var t = createTemplate('<span b:hidden="{foo}"/>');
            assert(t.createInstance().element.style.visibility == '');

            var t = createTemplate('<span b:hidden="{foo}{bar}"/>');
            assert(t.createInstance().element.style.visibility == '');
          }
        },
        {
          name: 'single string binding',
          test: function(){
            var t = createTemplate('<span b:hidden="{foo}"/>');
            var instance = t.createInstance();

            instance.set('foo', undefined);
            assert(instance.element.style.visibility == '');

            instance.set('foo', 'foo');
            assert(instance.element.style.visibility == 'hidden');
          }
        },
        {
          name: 'single binding',
          test: function(){
            var t = createTemplate('<span b:hidden="{foo}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.visibility == '');

            instance.set('foo', true);
            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', false);
            assert(instance.element.style.visibility == '');
          }
        },
        {
          name: 'expression',
          test: function(){
            var t = createTemplate('<span b:hidden="{foo}{bar}"/>');
            var instance = t.createInstance();

            assert(instance.element.style.visibility == '');

            instance.set('foo', 0);  // 0 + undefined -> false
            assert(instance.element.style.visibility == '');

            instance.set('bar', 1);  // 0 + 1 -> true
            assert(instance.element.style.visibility == 'hidden');

            instance.set('bar', -1); // 0 + -1 -> true
            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', 1);  // 1 + -1 -> false
            assert(instance.element.style.visibility == '');

            instance.set('bar', 1);  // 1 + 1 -> true
            assert(instance.element.style.visibility == 'hidden');

            instance.set('bar', -1);  // 1 + -1 -> false
            assert(instance.element.style.visibility == '');

            instance.set('bar', 0);  // 1 + 0 -> true
            assert(instance.element.style.visibility == 'hidden');

            instance.set('foo', 0);  // 0 + 0 -> false
            assert(instance.element.style.visibility == '');
          }
        }
      ]
    }
  ]
};
