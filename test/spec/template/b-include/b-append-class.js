module.exports = {
  name: '<b:class>/<b:append-class>',
  test: [
    {
      name: 'class not exists',
      test: function(){
        // no attrs at all
        var a1 = createTemplate('<span/>');
        var b1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="b"/></b:include>');

        assert(text(b1) === text('<span class="b"/>'));

        // has an attribute
        var a2 = createTemplate('<span title="a"/>');
        var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="b"/></b:include>');

        assert(text(b2) === text('<span title="a" class="b"/>'));
      }
    },
    {
      name: 'class exists',
      test: function(){
        var a = createTemplate('<span class="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="b"/></b:include>');

        assert(text(b) === text('<span class="a b"/>'));
      }
    },
    {
      name: 'class not exists by reference',
      test: function(){
        var a = createTemplate('<span><b{reference}/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

        assert(text(b) === text('<span><b class="b"/></span>'));
      }
    },
    {
      name: 'class exists by reference',
      test: function(){
        var a = createTemplate('<span><b{reference} class="a"/></span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

        assert(text(b) === text('<span><b class="a b"/></span>'));
      }
    },
    {
      name: 'class not exists, set class with binding',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b}"/></b:include>');

        assert(text(b) === text('<span/>'));
        assert(text(b, { b: 'b' }) === text('<span class="b"/>'));

        // several bindings
        var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b} {c}"/></b:include>');
        assert(text(c) === text('<span/>'));
        assert(text(c, { b: 'b' }) === text('<span class="b"/>'));
        assert(text(c, { b: 'b', c: 'c' }) === text('<span class="b c"/>'));
      }
    },
    {
      name: 'class not exists, set class with value & binding',
      test: function(){
        var a = createTemplate('<span/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="a {b}"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="a b"/>'));

        // several bindings
        var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} {c} y"/></b:include>');
        assert(text(c) === text('<span class="x y"/>'));
        assert(text(c, { b: 'b' }) === text('<span class="x y b"/>'));
        assert(text(c, { b: 'b', c: 'c' }) === text('<span class="x y b c"/>'));
      }
    },
    {
      name: 'class exists, set class with binding',
      test: function(){
        var a = createTemplate('<span class="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b}"/></b:include>');

        assert(text(b) === text('<span class="a"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="a b"/>'));

        // several bindings
        var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="{b} {c}"/></b:include>');
        assert(text(c) === text('<span class="a"/>'));
        assert(text(c, { b: 'b' }) === text('<span class="a b"/>'));
        assert(text(c, { b: 'b', c: 'c' }) === text('<span class="a b c"/>'));
      }
    },
    {
      name: 'class exists and with binding, set class with binding',
      test: function(){
        // only binding
        var a1 = createTemplate('<span class="{a2}"/>');
        var b1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="{b}"/></b:include>');

        assert(text(b1) === text('<span/>'));
        assert(text(b1, { a2: 'a2' }) === text('<span class="a2"/>'));
        assert(text(b1, { b: 'b' }) === text('<span class="b"/>'));
        assert(text(b1, { a2: 'a2', b: 'b' }) === text('<span class="a2 b"/>'));

        // add several bindings
        var c1 = createTemplate('<b:include src="#' + a1.templateId + '"><b:class value="{b} {c}"/></b:include>');
        assert(text(c1) === text('<span/>'));
        assert(text(c1, { a2: 'a2' }) === text('<span class="a2"/>'));
        assert(text(c1, { b: 'b' }) === text('<span class="b"/>'));
        assert(text(c1, { b: 'b', c: 'c' }) === text('<span class="b c"/>'));
        assert(text(c1, { a2: 'a2', b: 'b', c: 'c' }) === text('<span class="a2 b c"/>'));

        // value & binding
        var a2 = createTemplate('<span class="a {a2}"/>');
        var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b}"/></b:include>');

        assert(text(b2) === text('<span class="a"/>'));
        assert(text(b2, { a2: 'a2' }) === text('<span class="a a2"/>'));
        assert(text(b2, { b: 'b' }) === text('<span class="a b"/>'));
        assert(text(b2, { a2: 'a2', b: 'b' }) === text('<span class="a a2 b"/>'));

        // add several bindings
        var c2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b} {c}"/></b:include>');
        assert(text(c2) === text('<span class="a"/>'));
        assert(text(c2, { a2: 'a2' }) === text('<span class="a a2"/>'));
        assert(text(c2, { b: 'b' }) === text('<span class="a b"/>'));
        assert(text(c2, { b: 'b', c: 'c' }) === text('<span class="a b c"/>'));
        assert(text(c2, { a2: 'a2', b: 'b', c: 'c' }) === text('<span class="a a2 b c"/>'));

        // multiple value & binding
        var a2 = createTemplate('<span class="a {a2} a3 {a4}"/>');
        var b2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b}"/></b:include>');

        assert(text(b2) === text('<span class="a a3"/>'));
        assert(text(b2, { a2: 'a2' }) === text('<span class="a a3 a2"/>'));
        assert(text(b2, { a2: 'a2', a4: 'a4' }) === text('<span class="a a3 a2 a4"/>'));
        assert(text(b2, { b: 'b' }) === text('<span class="a a3 b"/>'));
        assert(text(b2, { a2: 'a2', a4: 'a4',  b: 'b' }) === text('<span class="a a3 a2 a4 b"/>'));

        // add several bindings
        var c2 = createTemplate('<b:include src="#' + a2.templateId + '"><b:class value="{b} {c}"/></b:include>');
        assert(text(c2) === text('<span class="a a3"/>'));
        assert(text(c2, { a2: 'a2' }) === text('<span class="a a3 a2"/>'));
        assert(text(c2, { a2: 'a2', a4: 'a4' }) === text('<span class="a a3 a2 a4"/>'));
        assert(text(c2, { b: 'b' }) === text('<span class="a a3 b"/>'));
        assert(text(c2, { b: 'b', c: 'c' }) === text('<span class="a a3 b c"/>'));
        assert(text(c2, { a2: 'a2', a4: 'a4', b: 'b', c: 'c' }) === text('<span class="a a3 a2 a4 b c"/>'));
      }
    },
    {
      name: 'class exists and with binding, set class with binding & value',
      test: function(){
        var a = createTemplate('<span class="a {a2}"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} y"/></b:include>');

        assert(text(b) === text('<span class="a x y"/>'));
        assert(text(b, { a2: 'a2' }) === text('<span class="a x y a2"/>'));
        assert(text(b, { b: 'b' }) === text('<span class="a x y b"/>'));
        assert(text(b, { a2: 'a2', b: 'b' }) === text('<span class="a x y a2 b"/>'));

        // several bindings
        var c = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="x {b} {c} y"/></b:include>');
        assert(text(c) === text('<span class="a x y"/>'));
        assert(text(c, { a2: 'a2' }) === text('<span class="a x y a2"/>'));
        assert(text(c, { a2: 'a2', b: 'b' }) === text('<span class="a x y a2 b"/>'));
        assert(text(c, { b: 'b' }) === text('<span class="a x y b"/>'));
        assert(text(c, { b: 'b', c: 'c' }) === text('<span class="a x y b c"/>'));
        assert(text(c, { a2: 'a2', b: 'b', c: 'c' }) === text('<span class="a x y a2 b c"/>'));
      }
    },
    {
      name: 'ignore name attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class name="title" value="b"/></b:include>');

        assert(text(b) === text('<span title="a" class="b"/>'));
      }
    },
    {
      name: 'ignore if no value attribute',
      test: function(){
        var a = createTemplate('<span title="a"/>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class/></b:include>');

        assert(text(b) === text('<span title="a"/>'));
      }
    },
    {
      name: 'ignore set on non-element node',
      test: function(){
        var a = createTemplate('{a}');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class value="b"/></b:include>');

        assert(text(b) === text('{a}'));
      }
    },
    {
      name: 'ignore set on non-element node by reference',
      test: function(){
        var a = createTemplate('<span>{reference}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '"><b:class ref="reference" value="b"/></b:include>');

        assert(text(b) === text('<span>{reference}</span>'));
      }
    },
    {
      name: 'should override duplicate classes',
      test: function(){
        var a = createTemplate('<span class="b c">{reference}</span>');
        var b = createTemplate('<b:include src="#' + a.templateId + '" class="a b"/>');

        assert(text(b) === text('<span class="c a b">{reference}</span>'));
      }
    }
  ]
};
