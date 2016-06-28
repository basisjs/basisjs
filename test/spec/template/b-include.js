module.exports = {
  name: '<b:include>',
  test: [
    {
      name: 'Various kind of sources',
      test: [
        {
          name: 'file reference <b:include src="./foo.tmpl">',
          test: function(){
            var template = createTemplate('<b:include src="./test.tmpl"/>');

            assert(text(template) == text('resource test'));

            // included source change
            var newContent = 'updated resource test';
            basis.resource('./test.tmpl').update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'namespaced file reference <b:include src="ns:./foo.tmpl">',
          test: function(){
            var template = createTemplate('<b:include src="fixture:test.tmpl"/>');

            assert(text(template) == text('fixture template'));

            // included source change
            var newContent = 'updated fixture test';
            basis.resource('fixture:test.tmpl').update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'script reference <b:include src="id:foo">',
          test: function(){
            var template = createTemplate('<b:include src="id:test-template"/>');

            assert(text(template) == text('script test'));
          }
        },
        {
          name: 'template reference <b:include src="#123">',
          test: function(){
            var sourceTemplate = createTemplate('reference test');
            var template = createTemplate('<b:include src="#' + sourceTemplate.templateId + '"/>');

            assert(text(template) == text('reference test'));

            // included source change
            var newContent = 'updated reference test';
            sourceTemplate.setSource(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'template with resource reference <b:include src="#123">',
          test: function(){
            var resource = basis.resource.virtual('tmpl', 'template with resource');
            var sourceTemplate = createTemplate(resource);
            var template = createTemplate('<b:include src="#' + sourceTemplate.templateId + '"/>');

            assert(text(template) == text('template with resource'));

            // included source change
            var newContent = 'updated template with resource';
            resource.update(newContent);
            assert(text(template) == text(newContent));
          }
        },
        {
          name: 'namespace <b:include src="foo.bar"/>',
          test: function(){
            var resource = basis.resource.virtual('tmpl', 'namespace test');
            nsTemplate.define('include.source.namespace.test', resource);
            var template = createTemplate('<b:include src="include.source.namespace.test"/>');

            assert(text(template) == text('namespace test'));

            // included source change
            var newContent = 'updated namespace test';
            resource.update(newContent);
            assert(text(template) == text(newContent));
          }
        }
      ]
    },
    {
      name: 'Attributes',
      test: [
        {
          name: '<b:include class> when class attribute does not exist',
          test: function(){
            var a = createTemplate('<span title="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"></b:include>');

            assert(text(b) === text('<span title="a" class="b"/>'));
          }
        },
        {
          name: '<b:include class> class when class attribute exists',
          test: function(){
            var a = createTemplate('<span class="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"></b:include>');

            assert(text(b) === text('<span class="a b"/>'));
          }
        },
        {
          name: '<b:include class> class with binding',
          test: function(){
            var a = createTemplate('<span class="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b}"></b:include>');

            assert(text(b, { b: 'b' }) === text('<span class="a b"/>'));

            var a = createTemplate('<span class="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} {b2}"></b:include>');

            assert(text(b, { b: 'b', b2: 'b2' }) === text('<span class="a b b2"/>'));
          }
        },
        {
          name: '<b:include class> class binding and value',
          test: function(){
            var a = createTemplate('<span class="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} c"></b:include>');

            assert(text(b, { b: 'b' }) === text('<span class="a c b"/>'));

            var a = createTemplate('<span class="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" class="a2 {b} {b2} c"></b:include>');

            assert(text(b, { b: 'b', b2: 'b2' }) === text('<span class="a a2 c b b2"/>'));
          }
        },
        {
          name: '<b:include id> when id attribute does not exist',
          test: function(){
            var a = createTemplate('<span title="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"></b:include>');

            assert(text(b) === text('<span title="a" id="b"/>'));
          }
        },
        {
          name: '<b:include id> when id exists',
          test: function(){
            var a = createTemplate('<span id="a"/>');
            var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"></b:include>');

            assert(text(b) === text('<span id="b"/>'));
          }
        }
      ]
    },
    {
      name: 'Subtree mofication',
      test: [
        require('./b-include/b-replace.js'),
        require('./b-include/b-remove.js'),
        require('./b-include/b-before.js'),
        require('./b-include/b-after.js'),
        require('./b-include/b-prepend.js'),
        require('./b-include/b-append.js')
      ]
    },
    {
      name: 'Attribute modification',
      test: [
        require('./b-include/b-set-attr.js'),
        require('./b-include/b-append-attr.js'),
        require('./b-include/b-remove-attr.js'),
        require('./b-include/b-append-class.js'),
        require('./b-include/b-set-class.js'),
        require('./b-include/b-remove-class.js'),
        require('./b-include/b-set-role.js'),
        require('./b-include/b-remove-role.js')
      ]
    }
  ]
};
