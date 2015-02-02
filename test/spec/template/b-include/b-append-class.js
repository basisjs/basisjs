module.exports = {
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
};
