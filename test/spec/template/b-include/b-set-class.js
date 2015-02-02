module.exports = {
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
};
