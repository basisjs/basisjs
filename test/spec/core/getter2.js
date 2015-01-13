module.exports = {
  name: 'basis.getter2',

  init: function(){
    var getter = basis.getter;
    var data = [
      { a: 11, b: 21, c: 31 },
      { a: 12, b: 22 },
      { a: 13, c: 33 },
      { b: 24, c: 34 },
      { a: 15 },
      { b: 26 },
      { c: 37 },
      { d: { a: 1, b: 2, c: 3 } }
    ];

    var longPath = {
      foo: {
        bar: {
          baz: {
            basis: {
              js: {}
            }
          }
        }
      }
    };
  },

  test: [
    {
      name: 'create from path',
      test: function(){
        var g = getter('foo');
        assert(g(longPath) === longPath.foo);

        var g = getter('foo.bar');
        assert(g(longPath) === longPath.foo.bar);

        var g = getter('foo.bar.baz');
        assert(g(longPath) === longPath.foo.bar.baz);

        var g = getter('foo.bar.baz.basis');
        assert(g(longPath) === longPath.foo.bar.baz.basis);

        var g = getter('foo.bar.baz.basis.js');
        assert(g(longPath) === longPath.foo.bar.baz.basis.js);
      }
    },
    {
      name: 'create from function',
      test: function(){
        var g = getter(function(object){
          return object.a;
        });
        assert(g(data[0]) === 11);

        var g = getter(function(object){
          return object.foo;
        }).as('bar');
        assert(g(longPath) === longPath.foo.bar);
      }
    },
    {
      name: 'create from getter',
      test: function(){
        var g = getter('a');
        var g2 = getter(g);
        assert(g, g2);
        assert(g(data[0]) === 11);
        assert(g2(data[0]) === 11);

        var g = getter('foo').as('bar');
        var g2 = getter(g);
        assert(g === g2);
        assert(g2(longPath) === longPath.foo.bar);

        var g = getter('foo').as('bar');
        var g2 = getter(g).as(basis.fn.$self);
        assert(g !== g2);
        assert(g(longPath) === longPath.foo.bar);
        assert(g2(longPath) === longPath.foo.bar);

        var g = getter('foo');
        var g2 = getter(g).as('bar');
        assert(g !== g2);
        assert(g(longPath) === longPath.foo);
        assert(g2(longPath) === longPath.foo.bar);

        var g = getter('foo').as('bar');
        var g2 = getter(g).as('baz');
        assert(g !== g2);
        assert(g(longPath) === longPath.foo.bar);
        assert(g2(longPath) === longPath.foo.bar.baz);
      }
    },
    {
      name: 'backward capability',
      test: function(){
        var g = getter('a');
        var g2 = getter(g);
        this.is(g, g2);
        this.is(11, g(data[0]));
        this.is(11, g2(data[0]));

        var g = getter('a', '[{0}]');
        var g2 = getter(g);
        this.is(true, g === g2);
        this.is('[11]', g(data[0]));
        this.is('[11]', g2(data[0]));

        var g = getter('a', '[{0}]');
        var g2 = getter(g, basis.fn.$self);
        this.is(false, g === g2);
        this.is('[11]', g(data[0]));
        this.is('[11]', g2(data[0]));

        var g = getter('a');
        var g2 = getter(g, '[{0}]');
        this.is(false, g === g2);
        this.is(11, g(data[0]));
        this.is('[11]', g2(data[0]));

        var g = getter('a', '[{0}]');
        var g2 = getter(g, '{{0}}');
        this.is(false, g === g2);
        this.is('[11]', g(data[0]));
        this.is('{[11]}', g2(data[0]));

        var g = getter('a', 'value: {0:.2}');
        assert(g(data[0]) === 'value: 11.00');
      }
    },
    {
      name: 'use on array',
      test: function(){
        var g = getter('a');
        assert(data.map(g).join(',') === '11,12,13,,15,,,');
        assert(data.map(g).filter(basis.fn.$isNotNull).join(',') === '11,12,13,15');
      }
    },
    {
      name: 'comparation',
      test: function(){
        assert(getter('a') === getter('a'));

        assert(getter(basis.fn.$self) === getter(basis.fn.$self));
        assert(!basis.fn.$self.getter);
        assert(!basis.fn.$self.__extend__);

        assert(getter(function(){ return 1; }) !== getter(function(){ return 1; }));
        assert(getter(function(){ return 1; }) !== getter(function(){ return 2; }));

        assert(getter(function(){ return 1; }).as(Number) !== getter(function(){ return 1; }).as(Number));
        assert(getter(function(){ return 1; }).as(Number) !== getter(function(){ return 2; }).as(Number));

        assert(getter(function(){ return 1; }).as('') !== getter(function(){ return 1; }).as(''));
        assert(getter(function(){ return 1; }).as('') !== getter(function(){ return 2; }).as(''));

        assert(getter(function(){ return 1; }).as('f') !== getter(function(){ return 1; }).as('f'));
        assert(getter(function(){ return 1; }).as('f') !== getter(function(){ return 2; }).as('f'));

        assert(getter(function(){ return 1; }).as('f') !== getter(function(){ return 1; }).as('fs'));

        assert(getter('a').as(Number) !== getter('a'));
        assert(getter('a').as(Number) === getter('a').as(Number));
        assert(getter(basis.fn.$self).as(Number) === getter(basis.fn.$self).as(Number));
        assert(getter(basis.fn.$self).as('') === getter(basis.fn.$self).as(''));
        assert(getter(basis.fn.$self).as('asd') === getter(basis.fn.$self).as('asd'));
        assert(getter(basis.fn.$self).as(String) !== getter(basis.fn.$self).as(Number));

        assert(getter('a').as('') === getter('a').as(''));
        assert(getter('a').as('') !== getter('a').as('f'));

        assert(getter('a').as(Number) === getter('a').as(Number));
        assert(getter('a').as(Number) !== getter('a').as(Number).as(Number));

        assert(getter('a').as(getter('b').as(Number)) === getter('a').as(getter('b').as(Number)));
        assert(getter('a').as(getter('b').as(Number)) !== getter('a').as(getter('a').as(Number)));
        assert(getter('a').as(getter('b').as(Number)) !== getter('a').as(getter('b')));
      }
    },
    {
      name: 'non-cacheable comparation',
      test: function(){
        var object = {};
        var array = {};

        assert(getter('a').as({}) !== getter('a').as({}));
        assert(getter('a').as(object) !== getter('a').as(object));

        assert(getter('a').as([]) !== getter('a').as([]));
        assert(getter('a').as(array) !== getter('a').as(array));
      }
    },
    {
      name: 'extensible',
      test: function(){
        var __extend__ = getter('').__extend__;
        var func = function(){};
        var g = getter('random');

        assert(typeof __extend__ == 'function');

        assert(getter('a').__extend__ === __extend__);
        assert(getter('a').as('').__extend__ === __extend__);
        assert(getter('a').as(function(){}).__extend__ === __extend__);
        assert(getter('a').as({}).__extend__ === __extend__);
        assert(getter('a').as([]).__extend__ === __extend__);

        assert(getter(basis.fn.$true).__extend__ === __extend__);
        assert(getter(basis.fn.$true).as('').__extend__ === __extend__);
        assert(getter(basis.fn.$true).as(function(){}).__extend__ === __extend__);
        assert(getter(basis.fn.$true).as({}).__extend__ === __extend__);
        assert(getter(basis.fn.$true).as([]).__extend__ === __extend__);

        assert(getter(function(){}).__extend__ === __extend__);
        assert(getter(function(){}).as('').__extend__ === __extend__);
        assert(getter(function(){}).as(function(){}).__extend__ === __extend__);
        assert(getter(function(){}).as({}).__extend__ === __extend__);
        assert(getter(function(){}).as([]).__extend__ === __extend__);

        assert(getter(g).__extend__ === __extend__);
        assert(getter(g).as('').__extend__ === __extend__);
        assert(getter(g).as(g).__extend__ === __extend__);
        assert(getter(g).as({}).__extend__ === __extend__);
        assert(getter(g).as([]).__extend__ === __extend__);

        assert(getter('a').__extend__() === getter());
        assert(getter('a').__extend__() === basis.fn.nullGetter);
        assert(getter('a').__extend__('a') === getter('a'));
        assert(getter('a').__extend__(func) === getter(func));
      }
    },
    {
      name: 'long chains with same functions',
      test: function(){
        var a = function(value){
          return value + 'a';
        };
        var b = function(value){
          return value + 'b';
        };
        var c = function(value){
          return value + 'c';
        };
        var d = function(value){
          return value + 'd';
        };
        var obj = {
          foo: {
            bar: {
              baz: {}
            },
            qux: {
              baz: {}
            }
          },
          bar: {
            foo: {
              baz: {}
            }
          },
          baz: {
            baz: {
              bar: {
                bar: {}
              }
            }
          }
        };

        assert(getter(a).as(b).as(c).as(d)('') === 'abcd');
        assert(getter(a).as(b).as(c).as(d) === getter(a).as(b).as(c).as(d));
        assert(getter(a).as(c).as(d).as(b)('') === 'acdb');
        assert(getter(a).as(c).as(d).as(b) === getter(a).as(c).as(d).as(b));
        assert(getter(a).as(b).as(b).as(a)('') === 'abba');
        assert(getter(a).as(b).as(b).as(a) === getter(a).as(b).as(b).as(a));
        assert(getter(b).as(a).as(a).as(d)('') === 'baad');
        assert(getter(b).as(a).as(a).as(d) === getter(b).as(a).as(a).as(d));

        assert(getter('foo').as('bar').as('baz')(obj) === obj.foo.bar.baz);
        assert(getter('foo').as('bar').as('baz') === getter('foo').as('bar').as('baz'));
        assert(getter('foo').as('qux').as('baz')(obj) === obj.foo.qux.baz);
        assert(getter('foo').as('qux').as('baz') === getter('foo').as('qux').as('baz'));
        assert(getter('bar').as('foo').as('baz')(obj) === obj.bar.foo.baz);
        assert(getter('bar').as('foo').as('baz') === getter('bar').as('foo').as('baz'));
        assert(getter('baz').as('baz').as('bar').as('bar')(obj) === obj.baz.baz.bar.bar);
        assert(getter('baz').as('baz').as('bar').as('bar') === getter('baz').as('baz').as('bar').as('bar'));

        assert(getter(a).as('length').as(c).as(d)('') === '1cd');
        assert(getter(a).as('length').as(c).as(d) === getter(a).as('length').as(c).as(d));
        assert(getter(b).as(a).as('length').as(a).as(a)('') === '2aa');
        assert(getter(b).as(a).as('length').as(a).as(a) === getter(b).as(a).as('length').as(a).as(a));
        assert(getter(b).as('length').as(c).as(a)('') === '1ca');
        assert(getter(b).as('length').as(c).as(a) === getter(b).as('length').as(c).as(a));
      }
    }
  ]
};
