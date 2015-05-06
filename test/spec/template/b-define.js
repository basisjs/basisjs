module.exports = {
  name: '<b:define>',
  test: [
    {
      name: 'should warn on bindings with no <b:define>',
      test: [
        {
          name: 'basic case',
          test: function(){
            var template = createTemplate('<span class="{foo} prefix_{bar} prefix_{anim:baz}"/>', true);

            assert(template.decl_.warns.length === 3);
          }
        },
        {
          name: 'should contains warnings from included templates',
          test: function(){
            var include = createTemplate('<span class="{foo} prefix_{bar} prefix_{anim:baz}"/>');
            var template = createTemplate('<b:include src="#' + include.templateId + '"/>', true);

            assert(template.decl_.warns.length === 3);
          }
        },
        {
          name: 'should work well with buildin names',
          test: function(){
            var template = createTemplate('<span class="{toString}"/>', true);
            assert(template.decl_.warns.length === 1);

            var template = createTemplate('<b:define name="toString" type="bool"/>', true);
            assert(template.decl_.warns.length === 1);

            var template = createTemplate('<b:define name="toString" type="bool"/><span class="{toString}"/>', true);
            assert(template.decl_.warns === false);
          }
        }
      ]
    },
    {
      name: 'define <b:define>',
      test: [
        {
          name: 'errors',
          test: [
            {
              name: 'should warn with no attributes',
              test: function(){
                var template = createTemplate(
                  '<b:define/>' +
                  '<span/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 2);
              }
            },
            {
              name: 'should warn with no `type` attribute',
              test: function(){
                var template = createTemplate(
                  '<b:define name="foo"/>' +
                  '<span/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 1);
              }
            },
            {
              name: 'should warn with no `name` attribute',
              test: function(){
                var template = createTemplate(
                  '<b:define type="bool"/>' +
                  '<span/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 1);
              }
            },
            {
              name: 'should warn with wrong type',
              test: function(){
                var template = createTemplate(
                  '<b:define name="foo" type="baz"/>' +
                  '<span/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 1);
              }
            },
            {
              name: 'should warn when unused',
              test: function(){
                var template = createTemplate(
                  '<b:define name="foo" type="bool"/>' +
                  '<span/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 1);
              }
            },
            {
              name: 'should warn if already declared',
              test: function(){
                var template = createTemplate(
                  '<b:define name="foo" type="enum" values="bar"/>' +
                  '<b:define name="foo" type="bool"/>' +
                  '<span class="{foo}"/>'
                );

                assert(text(template) === text('<span></span>'));
                assert(template.decl_.warns.length === 1);
              }
            }
          ]
        },
        {
          name: 'normal',
          test: [
            {
              name: 'bool',
              test: [
                {
                  name: 'should add class only if value truthly',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="bool"/>' +
                      '<span class="{foo} prefix_{foo}"/>',
                      true
                    );

                    assert(template.decl_.warns === false);

                    assert(text(template) === text('<span></span>'));
                    assert(text(template, { foo: true }) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(template, { foo: false }) === text('<span></span>'));
                    assert(text(template, { foo: 123 }) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(template, { foo: 0 }) === text('<span></span>'));
                    assert(text(template, { foo: {} }) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(template, { foo: NaN }) === text('<span></span>'));
                    assert(text(template, { foo: [] }) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(template, { foo: '' }) === text('<span></span>'));
                    assert(text(template, { foo: 'string' }) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(template, { foo: undefined }) === text('<span></span>'));
                    assert(text(template, { foo: null }) === text('<span></span>'));
                  }
                },
                {
                  name: 'when default attribute present and set to true should add classes by default',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="bool" default="true"/>' +
                      '<span class="{foo} prefix_{foo}"/>',
                      true
                    );

                    assert(template.decl_.warns === false);

                    assert(text(template) === text('<span class="foo prefix_foo"></span>'));
                    assert(text(
                      '<b:define name="foo" type="bool" default="foo"/>' +
                      '<span class="{foo} prefix_{foo}"/>'
                      ) === text('<span></span>'));
                    assert(text(
                      '<b:define name="foo" type="bool" default="yes"/>' +
                      '<span class="{foo} prefix_{foo}"/>'
                      ) === text('<span></span>'));
                    assert(text(
                      '<b:define name="foo" type="bool" default="false"/>' +
                      '<span class="{foo} prefix_{foo}"/>'
                      ) === text('<span></span>'));
                    assert(text(
                      '<b:define name="foo" type="bool" default="true"/>' +
                      '<span class="bar {foo} prefix_{foo}"/>',
                      { foo: false }
                      ) === text('<span class="bar"></span>'));
                  }
                },
                {
                  name: 'when from is used, should use name as value for class',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" from="bar" type="bool" default="true"/>' +
                      '<span class="static {foo} prefix_{foo}"/>',
                      true
                    );

                    assert(template.decl_.warns === false);
                    assert(text(template) === text('<span class="static foo prefix_foo"></span>'));
                    assert(text(template, { bar: false }) === text('<span class="static"></span>'));
                    assert(text(
                      '<b:define name="foo" from="bar" type="bool"/>' +
                      '<span class="{foo} prefix_{foo}"/>'
                      ) === text('<span></span>'));
                    assert(text(
                      '<b:define name="foo" from="bar" type="bool"/>' +
                      '<span class="{foo} prefix_{foo}"/>',
                      { bar: true }
                      ) === text('<span class="foo prefix_foo"></span>'));
                  }
                }
                // {
                //   name: 'should warn when default has no value',
                //   test: function(){
                //     var template = createTemplate(
                //       '<b:define name="foo" type="bool" default/>' +
                //       '<span class="{foo}"/>'
                //     );

                //     assert(text(template) === text('<span></span>'));
                //     assert(template.decl_.warns.length === 1);
                //   }
                // }
              ]
            },
            {
              name: 'enum',
              test: [
                {
                  name: 'should set only specified values',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values="bar 1"/>' +
                      '<span class="{foo}"/>',
                      true
                    );

                    assert(template.decl_.warns === false);
                    assert(text(template) === text('<span></span>'));
                    assert(text(template, { foo: 'bar' }) === text('<span class="bar"></span>'));
                    assert(text(template, { foo: 'baz' }) === text('<span></span>'));
                    assert(text(template, { foo: '1' }) === text('<span class="1"></span>'));
                    assert(text(template, { foo: 1 }) === text('<span class="1"></span>'));
                    assert(text(template, { foo: 123 }) === text('<span></span>'));
                    assert(text(template, { foo: undefined }) === text('<span></span>'));
                  }
                },
                {
                  name: 'should set value from default',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values="bar baz" default="baz"/>' +
                      '<span class="{foo} prefix_{foo}"/>',
                      true
                    );

                    assert(template.decl_.warns === false);
                    assert(text(template) === text('<span class="baz prefix_baz"></span>'));
                    assert(text(template, { foo: 'bar' }) === text('<span class="bar prefix_bar"></span>'));
                    assert(text(template, { foo: undefined }) === text('<span class="baz prefix_baz"></span>'));

                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values="bar baz" default="baz"/>' +
                      '<span class="xxx {foo} prefix_{foo}"/>'
                    );
                    assert(text(template) === text('<span class="xxx baz prefix_baz"></span>'));
                    assert(text(template, { foo: 'baz' }) === text('<span class="xxx baz prefix_baz"></span>'));
                    assert(text(template, { foo: 'zzz' }) === text('<span class="xxx"></span>'));
                    assert(text(template, { foo: undefined }) === text('<span class="xxx baz prefix_baz"></span>'));
                    assert(text(template, { foo: false }) === text('<span class="xxx"></span>'));
                  }
                },
                {
                  name: 'should warn when no `values` attribute',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="enum"/>',
                      true
                    );

                    assert(template.decl_.warns.length === 1);
                  }
                },
                {
                  name: 'should warn when `values` attribute has wrong value',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values/>',
                      true
                    );

                    assert(template.decl_.warns.length === 1);

                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values=""/>',
                      true
                    );

                    assert(template.decl_.warns.length === 1);

                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values="  "/>',
                      true
                    );

                    assert(template.decl_.warns.length === 1);
                  }
                },
                // {
                //   name: 'should warn on dublicate values in `values`',
                //   test: function(){
                //     var template = createTemplate(
                //       '<b:define name="foo" type="enum" values="bar bar"/>' +
                //       '<span class="{foo}"/>',
                //       true
                //     );

                //     assert(template.decl_.warns.length === 1);

                //     var template = createTemplate(
                //       '<b:define name="foo" type="enum" values="bar baz bar baz"/>' +
                //       '<span class="{foo}"/>',
                //       true
                //     );

                //     assert(template.decl_.warns.length === 2);
                //   }
                // },
                {
                  name: 'should warn when default has value not in values list',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" type="enum" values="bar baz" default="zzz"/>' +
                      '<span class="{foo}"/>'
                    );

                    assert(text(template) === text('<span></span>'));
                    assert(template.decl_.warns.length === 1);
                  }
                },
                {
                  name: 'use with `from`',
                  test: function(){
                    var template = createTemplate(
                      '<b:define name="foo" from="bar" type="enum" values="baz qux"/>' +
                      '<span class="{foo} prefix_{foo}"/>'
                    );

                    assert(text(template, { bar: 'qux' }) === text('<span class="qux prefix_qux"></span>'));
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: '<b:define> scope',
      test: [
        {
          name: '<b:define> in includes should not apply to outside',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<span class="{foo}"/>' +
                '<b:include src="#' + include.templateId + '"/>' +
              '<span class="{foo}"/>'
            );

            assert(text(template) === text('<span></span><span class="foo"></span><span></span>'));
            assert(template.decl_.warns.length === 2);
          }
        },
        {
          name: '<b:define> should not apply to included subtrees',
          test: function(){
            var include = createTemplate(
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo}"/>' +
                '<b:include src="#' + include.templateId + '"/>' +
              '<span class="{foo}"/>'
            );

            assert(text(template) === text('<span class="foo"></span><span></span><span class="foo"></span>'));
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: '<b:define> should not override <b:define> in included subtrees',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:define name="foo" type="bool"/>' +
              '<span class="{foo}"/>' +
                '<b:include src="#' + include.templateId + '"/>' +
              '<span class="{foo}"/>'
            );

            assert(text(template) === text('<span></span><span class="foo"></span><span></span>'));
            assert(template.decl_.warns === false);
          }
        },
        {
          name: '<b:define> in including source should not apply to added attribute bindings',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:include src="#' + include.templateId + '" class="prefix_{foo}">' +
                '<b:class value="prefix2_{foo}"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span class="foo"></span>'));
            assert(template.decl_.warns.length === 2);
          }
        },
        {
          name: '<b:define> should apply to added attribute bindings, but not to included subtree',
          test: function(){
            var include = createTemplate(
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<b:include src="#' + include.templateId + '" class="prefix_{foo}">' +
                '<b:class value="prefix2_{foo}"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span class="prefix_foo prefix2_foo"></span>'));
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: '<b:define> in including source should not apply to inserting content',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:include src="#' + include.templateId + '">' +
                '<b:append>' +
                  '<span class="{foo}"/>' +
                '</b:append>' +
              '</b:include>'
            );

            assert(text(template) === text('<span class="foo"><span></span></span>'));
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: '<b:define> should apply to inserting content but not to subtree',
          test: function(){
            var include = createTemplate(
              '<span class="{foo}"/>'
            );
            var template = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<b:include src="#' + include.templateId + '">' +
                '<b:append>' +
                  '<span class="{foo}"/>' +
                '</b:append>' +
              '</b:include>'
            );

            assert(text(template) === text('<span><span class="foo"></span></span>'));
            assert(template.decl_.warns.length === 1);
          }
        },
        {
          name: '<b:define type="bool"> should no left values when binding removing',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="bool" default="true"/>' +
              '<span class="{foo} prefix_{foo} left_{foo}"/>'
            );
            var template = createTemplate(
              '<b:include src="#' + include.templateId + '">' +
                '<b:remove-class value="{foo}"/>' +
                '<b:remove-class value="prefix_{foo}"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span class="left_foo"/>'));
          }
        },
        {
          name: '<b:define type="bool"> should no left values when binding removing',
          test: function(){
            var include = createTemplate(
              '<b:define name="foo" type="enum" values="foo bar" default="bar"/>' +
              '<span class="{foo} prefix_{foo} left_{foo}"/>'
            );
            var template = createTemplate(
              '<b:include src="#' + include.templateId + '">' +
                '<b:remove-class value="{foo}"/>' +
                '<b:remove-class value="prefix_{foo}"/>' +
              '</b:include>'
            );

            assert(text(template) === text('<span class="left_bar"/>'));
          }
        }
      ]
    }
    // {
    //   name: 'values intersection',
    //   test: [
    //     {
    //       name: 'should warn when intersect with static classes',
    //       test: function(){
    //         var template = createTemplate(
    //           '<b:define name="foo" type="bool"/>' +
    //           '<b:define name="enum" type="enum" values="bar baz foo"/>' +
    //           '<span class="foo baz {foo} {enum} bar"/>',
    //           true
    //         );

    //         assert(template.decl_.warns.length === 3);
    //       },
    //     },
    //     {
    //       name: 'should not warn when no intersection with static classes',
    //       test: function(){
    //         var template = createTemplate(
    //           '<b:define name="foo" type="bool"/>' +
    //           '<b:define name="enum" type="enum" values="bar baz foo"/>' +
    //           '<span class="a_foo b_baz c_{foo} d_{enum} e_baz"/>',
    //           true
    //         );

    //         assert(template.decl_.warns === false);
    //       }
    //     }
    //   ]
    // }
  ]
};
