module.exports = {
  name: 'basis.getter',

  init: function(){
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
        var g = basis.getter('foo');
        assert(g(longPath) === longPath.foo);

        var g = basis.getter('foo.bar');
        assert(g(longPath) === longPath.foo.bar);

        var g = basis.getter('foo.bar.baz');
        assert(g(longPath) === longPath.foo.bar.baz);

        var g = basis.getter('foo.bar.baz.basis');
        assert(g(longPath) === longPath.foo.bar.baz.basis);

        var g = basis.getter('foo.bar.baz.basis.js');
        assert(g(longPath) === longPath.foo.bar.baz.basis.js);
      }
    },
    {
      name: 'create from function',
      test: function(){
        var g = basis.getter(function(object){
          return object.a;
        });
        assert(g(data[0]) === 11);

        var g = basis.getter(function(object){
          return object.foo;
        }).as('bar');
        assert(g(longPath) === longPath.foo.bar);
      }
    },
    {
      name: 'create from getter',
      test: function(){
        var g = basis.getter('a');
        var g2 = basis.getter(g);
        assert(g, g2);
        assert(g(data[0]) === 11);
        assert(g2(data[0]) === 11);

        var g = basis.getter('foo').as('bar');
        var g2 = basis.getter(g);
        assert(g === g2);
        assert(g2(longPath) === longPath.foo.bar);

        var g = basis.getter('foo').as('bar');
        var g2 = basis.getter(g).as(basis.fn.$self);
        assert(g !== g2);
        assert(g(longPath) === longPath.foo.bar);
        assert(g2(longPath) === longPath.foo.bar);

        var g = basis.getter('foo');
        var g2 = basis.getter(g).as('bar');
        assert(g !== g2);
        assert(g(longPath) === longPath.foo);
        assert(g2(longPath) === longPath.foo.bar);

        var g = basis.getter('foo').as('bar');
        var g2 = basis.getter(g).as('baz');
        assert(g !== g2);
        assert(g(longPath) === longPath.foo.bar);
        assert(g2(longPath) === longPath.foo.bar.baz);
      }
    },
    {
      name: 'source',
      test: function(){
        var fn = function(){};
        var fn2 = function(){};
        var obj = {};

        assert(basis.getter(fn)[basis.getter.SOURCE] === fn);
        assert(basis.getter('foo')[basis.getter.SOURCE] === 'foo');

        assert(basis.getter(basis.getter(fn))[basis.getter.SOURCE] === fn);
        assert(basis.getter(basis.getter('foo'))[basis.getter.SOURCE] === 'foo');

        assert(basis.getter(fn).as(fn2)[basis.getter.SOURCE] === fn2);
        assert(basis.getter(fn).as('foo')[basis.getter.SOURCE] === 'foo');
        assert(basis.getter('foo').as('bar')[basis.getter.SOURCE] === 'bar');
        assert(basis.getter('foo').as(fn)[basis.getter.SOURCE] === fn);
        assert(basis.getter(fn).as(obj)[basis.getter.SOURCE] === obj);
        assert(basis.getter('foo').as(obj)[basis.getter.SOURCE] === obj);
      }
    },
    {
      name: 'use on array',
      test: function(){
        var g = basis.getter('a');
        assert(data.map(g).join(',') === '11,12,13,,15,,,');
        assert(data.map(g).filter(basis.fn.$isNotNull).join(',') === '11,12,13,15');
      }
    },
    {
      name: 'comparation',
      test: function(){
        assert(basis.getter('a') === basis.getter('a'));

        assert(basis.getter(basis.fn.$self) === basis.getter(basis.fn.$self));
        assert(!basis.fn.$self.getter);
        assert(!basis.fn.$self.__extend__);

        /* jscs: disable */
        assert(basis.getter(function(){ return 1; }) !== basis.getter(function(){ return 1; }));
        assert(basis.getter(function(){ return 1; }) !== basis.getter(function(){ return 2; }));

        assert(basis.getter(function(){ return 1; }).as(Number) !== basis.getter(function(){ return 1; }).as(Number));
        assert(basis.getter(function(){ return 1; }).as(Number) !== basis.getter(function(){ return 2; }).as(Number));

        assert(basis.getter(function(){ return 1; }).as('f') !== basis.getter(function(){ return 1; }).as('f'));
        assert(basis.getter(function(){ return 1; }).as('f') !== basis.getter(function(){ return 2; }).as('f'));

        assert(basis.getter(function(){ return 1; }).as('f') !== basis.getter(function(){ return 1; }).as('fs'));
        /* jscs: enable */

        assert(basis.getter('a').as(Number) !== basis.getter('a'));
        assert(basis.getter('a').as(Number) === basis.getter('a').as(Number));
        assert(basis.getter(basis.fn.$self).as(Number) === basis.getter(basis.fn.$self).as(Number));
        assert(basis.getter(basis.fn.$self).as('asd') === basis.getter(basis.fn.$self).as('asd'));
        assert(basis.getter(basis.fn.$self).as(String) !== basis.getter(basis.fn.$self).as(Number));

        //assert(basis.getter(basis.fn.$self).as('') === basis.getter(basis.fn.$self).as(''));
        //assert(basis.getter('a').as('') === basis.getter('a').as(''));
        //assert(basis.getter('a').as('') !== basis.getter('a').as('f'));

        assert(basis.getter('a').as(Number) === basis.getter('a').as(Number));
        assert(basis.getter('a').as(Number) !== basis.getter('a').as(Number).as(Number));

        assert(basis.getter('a').as(basis.getter('b').as(Number)) === basis.getter('a').as(basis.getter('b').as(Number)));
        assert(basis.getter('a').as(basis.getter('b').as(Number)) !== basis.getter('a').as(basis.getter('a').as(Number)));
        assert(basis.getter('a').as(basis.getter('b').as(Number)) !== basis.getter('a').as(basis.getter('b')));
      }
    },
    {
      name: 'non-cacheable comparation',
      test: function(){
        var object = {};
        var array = {};

        assert(basis.getter('a').as({}) !== basis.getter('a').as({}));
        assert(basis.getter('a').as(object) !== basis.getter('a').as(object));

        assert(basis.getter('a').as([]) !== basis.getter('a').as([]));
        assert(basis.getter('a').as(array) !== basis.getter('a').as(array));
      }
    },
    {
      name: 'extensible',
      test: function(){
        var __extend__ = basis.getter('x').__extend__;
        var func = function(){};
        var g = basis.getter('random');

        assert(typeof __extend__ == 'function');

        assert(basis.getter('a').__extend__ === __extend__);
        assert(basis.getter('a').as('x').__extend__ === __extend__);
        assert(basis.getter('a').as(function(){}).__extend__ === __extend__);
        assert(basis.getter('a').as({}).__extend__ === __extend__);
        assert(basis.getter('a').as([]).__extend__ === __extend__);

        assert(basis.getter(basis.fn.$true).__extend__ === __extend__);
        assert(basis.getter(basis.fn.$true).as('x').__extend__ === __extend__);
        assert(basis.getter(basis.fn.$true).as(function(){}).__extend__ === __extend__);
        assert(basis.getter(basis.fn.$true).as({}).__extend__ === __extend__);
        assert(basis.getter(basis.fn.$true).as([]).__extend__ === __extend__);

        assert(basis.getter(function(){}).__extend__ === __extend__);
        assert(basis.getter(function(){}).as('x').__extend__ === __extend__);
        assert(basis.getter(function(){}).as(function(){}).__extend__ === __extend__);
        assert(basis.getter(function(){}).as({}).__extend__ === __extend__);
        assert(basis.getter(function(){}).as([]).__extend__ === __extend__);

        assert(basis.getter(g).__extend__ === __extend__);
        assert(basis.getter(g).as('x').__extend__ === __extend__);
        assert(basis.getter(g).as(g).__extend__ === __extend__);
        assert(basis.getter(g).as({}).__extend__ === __extend__);
        assert(basis.getter(g).as([]).__extend__ === __extend__);

        assert(basis.getter('a').__extend__() === basis.getter());
        assert(basis.getter('a').__extend__() === basis.fn.nullGetter);
        assert(basis.getter('a').__extend__('a') === basis.getter('a'));
        assert(basis.getter('a').__extend__(func) === basis.getter(func));
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

        assert(basis.getter(a).as(b).as(c).as(d)('') === 'abcd');
        assert(basis.getter(a).as(b).as(c).as(d) === basis.getter(a).as(b).as(c).as(d));
        assert(basis.getter(a).as(c).as(d).as(b)('') === 'acdb');
        assert(basis.getter(a).as(c).as(d).as(b) === basis.getter(a).as(c).as(d).as(b));
        assert(basis.getter(a).as(b).as(b).as(a)('') === 'abba');
        assert(basis.getter(a).as(b).as(b).as(a) === basis.getter(a).as(b).as(b).as(a));
        assert(basis.getter(b).as(a).as(a).as(d)('') === 'baad');
        assert(basis.getter(b).as(a).as(a).as(d) === basis.getter(b).as(a).as(a).as(d));

        assert(basis.getter('foo').as('bar').as('baz')(obj) === obj.foo.bar.baz);
        assert(basis.getter('foo').as('bar').as('baz') === basis.getter('foo').as('bar').as('baz'));
        assert(basis.getter('foo').as('qux').as('baz')(obj) === obj.foo.qux.baz);
        assert(basis.getter('foo').as('qux').as('baz') === basis.getter('foo').as('qux').as('baz'));
        assert(basis.getter('bar').as('foo').as('baz')(obj) === obj.bar.foo.baz);
        assert(basis.getter('bar').as('foo').as('baz') === basis.getter('bar').as('foo').as('baz'));
        assert(basis.getter('baz').as('baz').as('bar').as('bar')(obj) === obj.baz.baz.bar.bar);
        assert(basis.getter('baz').as('baz').as('bar').as('bar') === basis.getter('baz').as('baz').as('bar').as('bar'));

        assert(basis.getter(a).as('length').as(c).as(d)('') === '1cd');
        assert(basis.getter(a).as('length').as(c).as(d) === basis.getter(a).as('length').as(c).as(d));
        assert(basis.getter(b).as(a).as('length').as(a).as(a)('') === '2aa');
        assert(basis.getter(b).as(a).as('length').as(a).as(a) === basis.getter(b).as(a).as('length').as(a).as(a));
        assert(basis.getter(b).as('length').as(c).as(a)('') === '1ca');
        assert(basis.getter(b).as('length').as(c).as(a) === basis.getter(b).as('length').as(c).as(a));
      }
    }
  ]
};
