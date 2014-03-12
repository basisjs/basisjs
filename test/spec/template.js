module.exports = {
  name: 'basis.template',

  html: __dirname + 'template.html',
  init: function(){
    basis.require('basis.dom');
    basis.require('basis.template.html');

    var createTemplate = function(source){
      return new basis.template.html.Template(source);
    };

    var text = function(template, binding){
      if (typeof template == 'string')
        template = createTemplate(template);

      var tmpl = template.createInstance();
      if (binding)
        for (var key in binding)
          tmpl.set(key, binding[key]);

      var fragment = tmpl.element.parentNode;
      var cursor = fragment.firstChild;
      var res = '';
      while (cursor)
      {
        res += basis.dom.outerHTML(cursor);
        cursor = cursor.nextSibling;
      }

      return res;
    };
  },

  test: [
    {
      name: 'Source',
      test: [
        {
          name: 'Path resolving',
          test: [
            {
              name: 'Template baseURI on theme change, when templates on different locations',
              test: function(){
                basis.template.theme('base').define('test', basis.resource('./foo/1.tmpl'));
                basis.template.theme('custom').define('test', basis.resource('./foo/custom/2.tmpl'));
                basis.template.setTheme('base');

                var tmpl = new basis.template.html.Template(basis.template.get('test'));
                tmpl.createInstance(); // trigger for template parsing
                this.is(1, tmpl.resources.length);
                this.is(basis.path.resolve('foo/1.css'), tmpl.resources[0]);

                basis.template.setTheme('custom');
                this.is(1, tmpl.resources.length);
                this.is(basis.path.resolve('foo/custom/2.css'), tmpl.resources[0]);
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Create',
      test: [
        {
          name: 'style attribute',
          test: [
            {
              name: 'use multiple property several times',
              test: function(){
                var tmpl = createTemplate('<span style="color: red; color: green">');
                var el = document.createElement('div');
                el.innerHTML = '<span style="color: red; color: green;"></span>';

                this.is(el.innerHTML, text(tmpl));
              }
            },
            {
              name: 'should keep property order',
              test: function(){
                var tmpl = createTemplate('<span style="color: {foo}; color: green">');
                var el = document.createElement('div');

                el.innerHTML = '<span style="color: green;"></span>';
                this.is(el.innerHTML, text(tmpl));

                el.innerHTML = '<span style="color: red;"></span>';
                this.is(el.innerHTML, text(tmpl, { foo: 'red' }));                
              }
            }
          ]
        }
      ]
    },    
    {
      name: '<b:include>',
      test: [
        {
          name: 'Attribute modification',
          test: [
            {
              name: '<b:include> with attributes',
              test: [
                {
                  name: '<b:include class> when class attribute does not exist',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"></b:include>');

                    /*nestedTemplate({
                      include: '<span title="a"/>',
                      attrs: {
                        class: 'b'
                      }
                    });*/

                    this.is(text('<span title="a" class="b"/>'), text(b));
                  }
                },
                {
                  name: '<b:include class> class when class attribute exists',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"></b:include>');

                    this.is(text('<span class="a b"/>'), text(b));
                  }
                },
                {
                  name: '<b:include class> class with binding',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b}"></b:include>');

                    this.is(text('<span class="a b"/>'), text(b, { b: 'b' }));

                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} {b2}"></b:include>');

                    this.is(text('<span class="a b b2"/>'), text(b, { b: 'b', b2: 'b2' }));
                  }
                },
                {
                  name: '<b:include class> class binding and value',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="{b} c"></b:include>');

                    this.is(text('<span class="a c b"/>'), text(b, { b: 'b' }));

                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" class="a2 {b} {b2} c"></b:include>');

                    this.is(text('<span class="a a2 c b b2"/>'), text(b, { b: 'b', b2: 'b2' }));
                  }
                },
                {
                  name: '<b:include id> when id attribute does not exist',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"></b:include>');

                    this.is(text('<span title="a" id="b"/>'), text(b));
                  }
                },
                {
                  name: '<b:include id> when id exists',
                  test: function(){
                    var a = createTemplate('<span id="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '" id="b"></b:include>');

                    this.is(text('<span id="b"/>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:replace>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo">x</b:replace></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'replace root element if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace>x</b:replace></b:include>');

                    this.is(text('x'), text(b));
                  }
                },
                {
                  name: 'replace token with single node',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo">x</b:replace></b:include>');

                    this.is(text('<span>x</span>'), text(b));
                  }
                },
                {
                  name: 'replace root element',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="element">x</b:replace></b:include>');

                    this.is(text('x'), text(b));
                  }
                },
                {
                  name: 'replace token with multiple nodes',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:replace ref="foo"><br/>x<br/></b:replace></b:include>');

                    this.is(text('<span><br/>x<br/></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:remove>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'remove element if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove/></b:include>');

                    this.is(text(''), text(b));
                  }
                },
                {
                  name: 'remove empty element token',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

                    this.is(text('<span></span>'), text(b));
                  }
                },
                {
                  name: 'remove element token with nodes',
                  test: function(){
                    var a = createTemplate('<span><span{foo}><span/></span></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

                    this.is(text('<span></span>'), text(b));
                  }
                },
                {
                  name: 'remove text token',
                  test: function(){
                    var a = createTemplate('<span>{foo}</span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

                    this.is(text('<span></span>'), text(b));
                  }
                },
                {
                  name: 'remove comment token',
                  test: function(){
                    var a = createTemplate('<span><!--{foo}--></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo"/></b:include>');

                    this.is(text('<span></span>'), text(b));
                  }
                },
                {
                  name: 'remove root element',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="element"/></b:include>');

                    this.is(text(''), text(b));
                  }
                },
                {
                  name: 'remove content should be ignored',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:remove ref="foo">content</b:remove></b:include>');

                    this.is(text('<span></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:before>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'nothing happen if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before>x</b:before></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'before token with single node',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo">x</b:before></b:include>');

                    this.is(text('<span>x<span/></span>'), text(b));
                  }
                },
                {
                  name: 'before root element',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="element">x</b:before></b:include>');

                    this.is(text('x<span/>'), text(b));
                  }
                },
                {
                  name: 'before token with multiple nodes',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:before ref="foo"><br/>x<br/></b:before></b:include>');

                    this.is(text('<span><br/>x<br/><span/></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:after>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'nothing happen if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after>x</b:after></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'after token with single node',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo">x</b:after></b:include>');

                    this.is(text('<span><span/>x</span>'), text(b));
                  }
                },
                {
                  name: 'after root element',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="element">x</b:after></b:include>');

                    this.is(text('<span/>x'), text(b));
                  }
                },
                {
                  name: 'after token with multiple nodes',
                  test: function(){
                    var a = createTemplate('<span><span{foo}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:after ref="foo"><br/>x<br/></b:after></b:include>');

                    this.is(text('<span><span/><br/>x<br/></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:prepend>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="foo">x</b:prepend></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'prepend to element if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend>x</b:prepend></b:include>');

                    this.is(text('<span>x</span>'), text(b));
                  }
                },
                {
                  name: 'nothing happen if ref node is not an element',
                  test: function(){
                    var a = createTemplate('<span>{foo}</span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="foo">x</b:prepend></b:include>');

                    this.is(text('<span>{foo}</span>'), text(b));

                    var a = createTemplate('text');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend>x</b:prepend></b:include>');

                    this.is(text('text'), text(b));
                  }
                },
                {
                  name: 'prepend token with single node when no children',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element">x</b:prepend></b:include>');

                    this.is(text('<span>x</span>'), text(b));
                  }
                },
                {
                  name: 'prepend token with single node',
                  test: function(){
                    var a = createTemplate('<span><span/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element">x</b:prepend></b:include>');

                    this.is(text('<span>x<span/></span>'), text(b));
                  }
                },
                {
                  name: 'prepend token with multiple nodes when no children',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element"><br/>x<br/></b:prepend></b:include>');

                    this.is(text('<span><br/>x<br/></span>'), text(b));
                  }
                },
                {
                  name: 'prepend token with multiple nodes',
                  test: function(){
                    var a = createTemplate('<span><span/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:prepend ref="element"><br/>x<br/></b:prepend></b:include>');

                    this.is(text('<span><br/>x<br/><span/></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:append>',
              test: [
                {
                  name: 'nothing happen if no reference',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'append to element if no ref attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

                    this.is(text('<span>x</span>'), text(b));
                  }
                },
                {
                  name: 'nothing happen if ref node is not an element',
                  test: function(){
                    var a = createTemplate('<span>{foo}</span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="foo">x</b:append></b:include>');

                    this.is(text('<span>{foo}</span>'), text(b));

                    var a = createTemplate('text');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append>x</b:append></b:include>');

                    this.is(text('text'), text(b));
                  }
                },
                {
                  name: 'append token with single node when no children',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

                    this.is(text('<span>x</span>'), text(b));
                  }
                },
                {
                  name: 'append token with single node',
                  test: function(){
                    var a = createTemplate('<span><span/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element">x</b:append></b:include>');

                    this.is(text('<span><span/>x</span>'), text(b));
                  }
                },
                {
                  name: 'append token with multiple nodes when no children',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

                    this.is(text('<span><br/>x<br/></span>'), text(b));
                  }
                },
                {
                  name: 'append token with multiple nodes',
                  test: function(){
                    var a = createTemplate('<span><span/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append ref="element"><br/>x<br/></b:append></b:include>');

                    this.is(text('<span><span/><br/>x<br/></span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:set-attr>',
              test: [
                {
                  name: 'non-exists',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

                    this.is(text('<span title="b"/>'), text(b));
                  }
                },
                {
                  name: 'exists',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="b"/></b:include>');

                    this.is(text('<span title="b"/>'), text(b));
                  }
                },
                {
                  name: 'set attribute with binding',
                  test: function(){
                    var a = createTemplate('<span title="x"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span title="a b"/>'), text(b, { b: 'b' }));
                  }
                },
                {
                  name: 'averride attribute with binding',
                  test: function(){
                    var a = createTemplate('<span title="{a}-"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="title" value="a {b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span title="a b"/>'), text(b, { a: 'a', b: 'b' }));
                  }
                },
                {
                  name: 'id attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="id" value="b"/></b:include>');

                    this.is(text('<span title="a" id="b"/>'), text(b));
                  }
                },
                {
                  name: 'class attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="b"/></b:include>');

                    this.is(text('<span class="b"/>'), text(b));
                  }
                },
                {
                  name: 'set class value with binding',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a b"/>'), text(b, { b: 'b' }));
                  }
                },
                {
                  name: 'override class with binding',
                  test: function(){
                    var a = createTemplate('<span class="{foo}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a"/>'), text(b, { foo: 'foo' }));
                  }
                },
                {
                  name: 'override class with binding by value with binding',
                  test: function(){
                    var a = createTemplate('<span class="{foo}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a b"/>'), text(b, { foo: 'foo', b: 'b' }));
                  }
                },
                {
                  name: 'set class value with binding when b:define used',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:set-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a"/>'), text(b, { b: 'b' }));
                    this.is(text('<span class="a foo"/>'), text(b, { b: 'foo' }));
                  }
                },
                {
                  name: 'non-exists event-* attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

                    this.is(text('<span event-click="bar"/>'), text(b));
                  }
                },
                {
                  name: 'exists event-* attribute',
                  test: function(){
                    var a = createTemplate('<span event-click="foo"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-attr name="event-click" value="bar"/></b:include>');

                    this.is(text('<span event-click="bar"/>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:append-attr>',
              test: [
                {
                  name: 'non-exists',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

                    this.is(text('<span title="b"/>'), text(b));
                  }
                },
                {
                  name: 'exists',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="b"/></b:include>');

                    this.is(text('<span title="ab"/>'), text(b));
                  }
                },
                {
                  name: 'append value with binding',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span title="a-b"/>'), text(b, { b: 'b' }));
                  }
                },
                {
                  name: 'append to value with binding value with binding',
                  test: function(){
                    var a = createTemplate('<span title="{a}-"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-{b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span title="a--b"/>'), text(b, { a: 'a', b: 'b' }));
                  }
                },
                {
                  name: 'append to value with binding value w/o binding',
                  test: function(){
                    var a = createTemplate('<span title="{a}-"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="title" value="-b"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span/>'), text(b, { b: 'b' }));
                    this.is(text('<span title="a--b"/>'), text(b, { a: 'a' }));
                  }
                },
                {
                  name: 'id attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="id" value="b"/></b:include>');

                    this.is(text('<span title="a" id="b"/>'), text(b));
                  }
                },
                {
                  name: 'class attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="b"/></b:include>');

                    this.is(text('<span class="b"/>'), text(b));
                  }
                },
                {
                  name: 'append class value with binding',
                  test: function(){
                    var a = createTemplate('<span class="foo"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="foo a"/>'), text(b));
                    this.is(text('<span class="foo a b"/>'), text(b, { b: 'b' }));
                  }
                },
                {
                  name: 'append to class with binding value with binding',
                  test: function(){
                    var a = createTemplate('<span class="foo {bar}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="foo a"/>'), text(b));
                    this.is(text('<span class="foo a bar b"/>'), text(b, { bar: 'bar', b: 'b' }));
                  }
                },
                {
                  name: 'append class value with binding when b:define used',
                  test: function(){
                    var a = createTemplate('<span class="foo"/>');
                    var b = createTemplate('<b:define name="b" type="enum" values="foo bar"/><b:include src="#' + a.templateId + '"><b:append-attr name="class" value="a {b}"/></b:include>');

                    this.is(text('<span class="foo a"/>'), text(b));
                    this.is(text('<span class="foo a"/>'), text(b, { b: 'b' }));
                    this.is(text('<span class="foo a bar"/>'), text(b, { b: 'bar' }));
                  }
                },
                {
                  name: 'non-exists event-* attribute',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

                    this.is(text('<span event-click="bar"/>'), text(b));
                  }
                },
                {
                  name: 'exists event-* attribute',
                  test: function(){
                    var a = createTemplate('<span event-click="foo"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="event-click" value="bar"/></b:include>');

                    this.is(text('<span event-click="foo bar"/>'), text(b));
                  }
                },
                {
                  name: 'style attribute',
                  test: [
                    {
                      name: 'non-exists',
                      test: function(){
                        var a = createTemplate('<span/>');
                        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: red"/></b:include>');

                        this.is(text('<span style="color: red"/>'), text(b));
                      }
                    },
                    {
                      name: 'exists',
                      test: function(){
                        var a = createTemplate('<span style="color: red"/>');
                        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

                        this.is(text('<span style="color: red; width: 10px"/>'), text(b));
                      }
                    },
                    {
                      name: 'should drop previous property when append existing one',
                      test: [
                        {
                          name: 'no binding',
                          test: function(){
                            var a = createTemplate('<span style="color: red"/>');
                            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: green"/></b:include>');

                            this.is(text('<span style="color: red; color: green"/>'), text(b));
                          }
                        },
                        {
                          name: 'no binding append binding',
                          test: function(){
                            var a = createTemplate('<span style="color: red"/>');
                            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {foo}"/></b:include>');

                            this.is(text('<span style="color: red"/>'), text(b));
                            this.is(text('<span style="color: green"/>'), text(b, { foo: 'green' }));
                          },
                        },
                        {
                          name: 'binding append no binding',
                          test: function(){
                            var a = createTemplate('<span style="color: {foo}"/>');
                            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: green"/></b:include>');

                            this.is(text('<span style="color: green"/>'), text(b));
                            this.is(text('<span style="color: red"/>'), text(b, { foo: 'red' }));
                          }
                        },
                        {
                          name: 'binding append binding',
                          test: function(){
                            var a = createTemplate('<span style="color: {foo}"/>');
                            var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="color: {bar}"/></b:include>');

                            this.is(text('<span/>'), text(b));
                            this.is(text('<span/>'), text(b, { foo: 'red' }));
                            this.is(text('<span style="color: green"/>'), text(b, { foo: 'red', bar: 'green' }));
                            this.is(text('<span style="color: green"/>'), text(b, { bar: 'green', foo: 'red' }));
                          }
                        }
                      ]
                    },
                    {
                      name: 'add with binding to w/o binding',
                      test: function(){
                        var a = createTemplate('<span style="color: red"/>');
                        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {foo}"/></b:include>');

                        this.is(text('<span style="color: red"/>'), text(b));
                        this.is(text('<span style="color: red; width: 10px"/>'), text(b, { foo: '10px' }));
                      }
                    },
                    {
                      name: 'add with binding to with binding',
                      test: function(){
                        var a = createTemplate('<span style="color: {foo}"/>');
                        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: {bar}"/></b:include>');

                        this.is(text('<span/>'), text(b));
                        this.is(text('<span style="color: red; width: 10px"/>'), text(b, { foo: 'red', bar: '10px' }));
                      }
                    },
                    {
                      name: 'add w/o binding to with binding',
                      test: function(){
                        var a = createTemplate('<span style="color: {foo}"/>');
                        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:append-attr name="style" value="width: 10px"/></b:include>');

                        this.is(text('<span style="width: 10px"/>'), text(b));
                        this.is(text('<span style="width: 10px; color: red;"/>'), text(b, { foo: 'red' }));
                      }
                    }
                  ]
                }
              ]
            },
            {
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
            },
            {
              name: '<b:class>/<b:append-class>',
              test: [
                {
                  name: 'class not exists',
                  test: function(){
                    // no attrs at all
                    var a1 = createTemplate('<span/>');
                    var b1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="b"/></b:include>');

                    this.is(text('<span class="b"/>'), text(b1));

                    // has an attribute
                    var a2 = createTemplate('<span title="a"/>');
                    var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="b"/></b:include>');

                    this.is(text('<span title="a" class="b"/>'), text(b2));
                  }
                },
                {
                  name: 'class exists',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="b"/></b:include>');

                    this.is(text('<span class="a b"/>'), text(b));
                  }
                },
                {
                  name: 'class not exists by reference',
                  test: function(){
                    var a = createTemplate('<span><b{reference}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

                    this.is(text('<span><b class="b"/></span>'), text(b));
                  }
                },
                {
                  name: 'class exists by reference',
                  test: function(){
                    var a = createTemplate('<span><b{reference} class="a"/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

                    this.is(text('<span><b class="a b"/></span>'), text(b));
                  }
                },
                {
                  name: 'class not exists, set class with binding',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span class="b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b} {c}"/></b:include>');
                    this.is(text('<span/>'), text(c));
                    this.is(text('<span class="b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class not exists, set class with value & binding',
                  test: function(){
                    var a = createTemplate('<span/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="a {b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} {c} y"/></b:include>');
                    this.is(text('<span class="x y"/>'), text(c));
                    this.is(text('<span class="x y b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="x y b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class exists, set class with binding',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b));
                    this.is(text('<span class="a b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b} {c}"/></b:include>');
                    this.is(text('<span class="a"/>'), text(c));
                    this.is(text('<span class="a b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="a b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class exists and with binding, set class with binding',
                  test: function(){
                    // only binding
                    var a1 = createTemplate('<span class="{a2}"/>');
                    var b1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="{b}"/></b:include>');

                    this.is(text('<span/>'), text(b1));
                    this.is(text('<span class="a2"/>'), text(b1, { a2: 'a2' }));
                    this.is(text('<span class="b"/>'), text(b1, { b: 'b' }));
                    this.is(text('<span class="a2 b"/>'), text(b1, { a2: 'a2', b: 'b' }));

                    // add several bindings
                    var c1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="{b} {c}"/></b:include>');
                    this.is(text('<span/>'), text(c1));
                    this.is(text('<span class="a2"/>'), text(c1, { a2: 'a2' }));
                    this.is(text('<span class="b"/>'), text(c1, { b: 'b' }));
                    this.is(text('<span class="b c"/>'), text(c1, { b: 'b', c: 'c' }));
                    this.is(text('<span class="a2 b c"/>'), text(c1, { a2: 'a2', b: 'b', c: 'c' }));

                    // value & binding
                    var a2 = createTemplate('<span class="a {a2}"/>');
                    var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b}"/></b:include>');

                    this.is(text('<span class="a"/>'), text(b2));
                    this.is(text('<span class="a a2"/>'), text(b2, { a2: 'a2' }));
                    this.is(text('<span class="a b"/>'), text(b2, { b: 'b' }));
                    this.is(text('<span class="a a2 b"/>'), text(b2, { a2: 'a2', b: 'b' }));

                    // add several bindings
                    var c2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b} {c}"/></b:include>');
                    this.is(text('<span class="a"/>'), text(c2));
                    this.is(text('<span class="a a2"/>'), text(c2, { a2: 'a2' }));
                    this.is(text('<span class="a b"/>'), text(c2, { b: 'b' }));
                    this.is(text('<span class="a b c"/>'), text(c2, { b: 'b', c: 'c' }));
                    this.is(text('<span class="a a2 b c"/>'), text(c2, { a2: 'a2', b: 'b', c: 'c' }));

                    // multiple value & binding
                    var a2 = createTemplate('<span class="a {a2} a3 {a4}"/>');
                    var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b}"/></b:include>');

                    this.is(text('<span class="a a3"/>'), text(b2));
                    this.is(text('<span class="a a3 a2"/>'), text(b2, { a2: 'a2' }));
                    this.is(text('<span class="a a3 a2 a4"/>'), text(b2, { a2: 'a2', a4: 'a4' }));
                    this.is(text('<span class="a a3 b"/>'), text(b2, { b: 'b' }));
                    this.is(text('<span class="a a3 a2 a4 b"/>'), text(b2, { a2: 'a2', a4: 'a4',  b: 'b' }));

                    // add several bindings
                    var c2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b} {c}"/></b:include>');
                    this.is(text('<span class="a a3"/>'), text(c2));
                    this.is(text('<span class="a a3 a2"/>'), text(c2, { a2: 'a2' }));
                    this.is(text('<span class="a a3 a2 a4"/>'), text(c2, { a2: 'a2', a4: 'a4' }));
                    this.is(text('<span class="a a3 b"/>'), text(c2, { b: 'b' }));
                    this.is(text('<span class="a a3 b c"/>'), text(c2, { b: 'b', c: 'c' }));
                    this.is(text('<span class="a a3 a2 a4 b c"/>'), text(c2, { a2: 'a2', a4: 'a4', b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class exists and with binding, set class with binding & value',
                  test: function(){
                    var a = createTemplate('<span class="a {a2}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} y"/></b:include>');

                    this.is(text('<span class="a x y"/>'), text(b));
                    this.is(text('<span class="a x y a2"/>'), text(b, { a2: 'a2' }));
                    this.is(text('<span class="a x y b"/>'), text(b, { b: 'b' }));
                    this.is(text('<span class="a x y a2 b"/>'), text(b, { a2: 'a2', b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} {c} y"/></b:include>');
                    this.is(text('<span class="a x y"/>'), text(c));
                    this.is(text('<span class="a x y a2"/>'), text(c, { a2: 'a2' }));
                    this.is(text('<span class="a x y a2 b"/>'), text(c, { a2: 'a2', b: 'b' }));
                    this.is(text('<span class="a x y b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="a x y b c"/>'), text(c, { b: 'b', c: 'c' }));
                    this.is(text('<span class="a x y a2 b c"/>'), text(c, { a2: 'a2', b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'ignore name attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class name="title" value="b"/></b:include>');

                    this.is(text('<span title="a" class="b"/>'), text(b));
                  }
                },
                {
                  name: 'ignore if no value attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class/></b:include>');

                    this.is(text('<span title="a"/>'), text(b));
                  }
                },
                {
                  name: 'ignore set on non-element node',
                  test: function(){
                    var a = createTemplate('{a}');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="b"/></b:include>');

                    this.is(text('{a}'), text(b));
                  }
                },
                {
                  name: 'ignore set on non-element node by reference',
                  test: function(){
                    var a = createTemplate('<span>{reference}</span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

                    this.is(text('<span>{reference}</span>'), text(b));
                  }
                }
              ]
            },
            {
              name: '<b:set-class>',
              test: [
                {
                  name: 'class not exists',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="b"/></b:include>');

                    this.is(text('<span title="a" class="b"/>'), text(b));
                  }
                },
                {
                  name: 'class exists',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="b"/></b:include>');

                    this.is(text('<span class="b"/>'), text(b));
                  }
                },
                {
                  name: 'class not exists by reference',
                  test: function(){
                    var a = createTemplate('<span><b{reference}/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class ref="reference" value="b"/></b:include>');

                    this.is(text('<span><b class="b"/></span>'), text(b));
                  }
                },
                {
                  name: 'class exists by reference',
                  test: function(){
                    var a = createTemplate('<span><b{reference} class="a"/></span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class ref="reference" value="b"/></b:include>');

                    this.is(text('<span><b class="b"/></span>'), text(b));
                  }
                },
                {
                  name: 'class exists, empty value removes class attr',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value=""/></b:include>');

                    this.is(text('<span/>'), text(b));

                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class/></b:include>');

                    this.is(text('<span/>'), text(b));

                    var a = createTemplate('<span class="{a}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value=""/></b:include>');

                    this.is(text('<span/>'), text(b));
                  }
                },
                {
                  name: 'class not exists, set class with binding',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b}"/></b:include>');

                    this.is(text('<span title="a"/>'), text(b));
                    this.is(text('<span title="a" class="b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b} {c}"/></b:include>');
                    this.is(text('<span title="a"/>'), text(c));
                    this.is(text('<span title="a" class="b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span title="a" class="b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class not exists, set class with value & binding',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="a {b}"/></b:include>');

                    this.is(text('<span title="a" class="a"/>'), text(b));
                    this.is(text('<span title="a" class="a b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="x {b} {c} y"/></b:include>');
                    this.is(text('<span title="a" class="x y"/>'), text(c));
                    this.is(text('<span title="a" class="x y b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span title="a" class="x y b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class exists, set class with binding',
                  test: function(){
                    var a = createTemplate('<span class="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span class="b"/>'), text(b, { b: 'b' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b} {c}"/></b:include>');
                    this.is(text('<span/>'), text(c));
                    this.is(text('<span class="b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="b c"/>'), text(c, { b: 'b', c: 'c' }));
                  }
                },
                {
                  name: 'class exists and with binding, set class with binding',
                  test: function(){
                    var a = createTemplate('<span class="a {a2}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b}"/></b:include>');

                    this.is(text('<span/>'), text(b));
                    this.is(text('<span class="b"/>'), text(b, { b: 'b' }));
                    this.is(text('<span class="b"/>'), text(b, { b: 'b', a2: 'a2' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="{b} {c}"/></b:include>');
                    this.is(text('<span/>'), text(c));
                    this.is(text('<span class="b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="b c"/>'), text(c, { b: 'b', c: 'c' }));
                    this.is(text('<span class="b c"/>'), text(c, { b: 'b', c: 'c', a2: 'a2' }));
                  }
                },
                {
                  name: 'class exists and with binding, set class with binding & value',
                  test: function(){
                    var a = createTemplate('<span class="a {a2}"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="x {b} y"/></b:include>');

                    this.is(text('<span class="x y"/>'), text(b));
                    this.is(text('<span class="x y b"/>'), text(b, { b: 'b' }));
                    this.is(text('<span class="x y b"/>'), text(b, { b: 'b', a2: 'a2' }));

                    // several bindings
                    var c = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="x {b} {c} y"/></b:include>');
                    this.is(text('<span class="x y"/>'), text(c));
                    this.is(text('<span class="x y b"/>'), text(c, { b: 'b' }));
                    this.is(text('<span class="x y b c"/>'), text(c, { b: 'b', c: 'c' }));
                    this.is(text('<span class="x y b c"/>'), text(c, { b: 'b', c: 'c', a2: 'a2' }));
                  }
                },
                {
                  name: 'ignore name attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class name="title" value="b"/></b:include>');

                    this.is(text('<span title="a" class="b"/>'), text(b));
                  }
                },
                {
                  name: 'ignore if no value attribute',
                  test: function(){
                    var a = createTemplate('<span title="a"/>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class/></b:include>');

                    this.is(text('<span title="a"/>'), text(b));
                  }
                },
                {
                  name: 'ignore set on non-element node',
                  test: function(){
                    var a = createTemplate('{a}');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class value="b"/></b:include>');

                    this.is(text('{a}'), text(b));
                  }
                },
                {
                  name: 'ignore set on non-element node by reference',
                  test: function(){
                    var a = createTemplate('<span>{reference}</span>');
                    var b = createTemplate('<b:include src="#' + a.templateId + '"><b:set-class ref="reference" value="b"/></b:include>');

                    this.is(text('<span>{reference}</span>'), text(b));
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
