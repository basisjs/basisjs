module.exports = {
  name: 'Util functions',

  init: function(){
    var A = [1, 2, 3, 4, 5];
    var B = [5, 4, 3, 2, 1];
    var C = [1, 2, 3];
    var D = [4, 5];
    var E = [1, 2, 3, 2, 3, 2, 1];
  },

  test: [
    {
      name: 'Array',
      test: [
        {
          name: 'Class methods',
          test: [
            {
              name: 'basis.array.from()',
              test: function(){
                this.is(A, basis.array.from(A));
                this.is(false, A === basis.array.from(A));
              }
            },
            {
              name: 'basis.array.create()',
              test: function(){
                this.is([undefined, undefined, undefined], basis.array.create(3));

                this.is([1, 1, 1], basis.array.create(3, 1));

                this.is(['1', '1', '1'], basis.array.create(3, '1'));

                this.is([], basis.array.create());

                this.is([0, 1, 2], basis.array.create(3, basis.fn.$self));
                this.is([true, true, true], basis.array.create(3, basis.fn.$true));
              }
            }
          ]
        },
        {
          name: 'JavaScript 1.6',
          test: [
            {
              name: 'indexOf()',
              test: function(){
                this.is(-1, E.indexOf());
                this.is(2,  E.indexOf(3));
                this.is(4,  E.indexOf(3, 3));
                this.is(4,  E.indexOf(3, 4));
                this.is(-1, E.indexOf(3, 5));
                this.is(-1, E.indexOf('3'));
                this.is(-1, E.indexOf(33));
              }
            },
            {
              name: 'lastIndexOf()',
              test: function(){
                this.is(-1, E.lastIndexOf());
                this.is(4,  E.lastIndexOf(3));
                this.is(-1, E.lastIndexOf('3'));
                this.is(-1, E.lastIndexOf(33));
              }
            },
            {
              name: 'forEach()',
              test: function(){
                var tmp = '';
                var T = basis.array.from(C);
                // must return array or undefined???
                this.is(undefined, T.forEach(function(item){ tmp += item * 2; }));
                this.is(C, T, true);

                this.is('246', tmp);

                var T = basis.array.from(C);
                T.forEach(function(item, index, array){ array[index] *= 2; });
                this.is([2, 4, 6], T);
              }
            },
            {
              name: 'every()',
              test: function(){
                var T = [1, 2, 3, 4, 5];
                this.is(true,  T.every(function(item){ return item > 0; }));
                this.is(A, T, true);

                this.is(false, T.every(function(item){ return item > 1; }));

                T[100] = 1;
                this.is(true, T.every(function(item){ return typeof item != 'undefined'; }));

                var counter = 0;
                this.is(true, T.every(function(item){ counter++; return true; }));
                this.is(A.length + 1, counter);
              }
            },
            {
              name: 'some()',
              test: function(){
                var T = [1, 2, 3, 4, 5];
                this.is(true,  T.some(function(item){ return item > 4; }));
                this.is(A, T, true);

                this.is(false, T.some(function(item){ return item > 10; }));

                T[100] = 1;
                this.is(false, T.some(function(item){ return typeof item == 'undefined'; }));

                var counter = 0;
                this.is(false, T.some(function(item){ counter++; return false; }));
                this.is(A.length + 1, counter);
              }
            },
            {
              name: 'filter()',
              test: function(){
                var T = [1, 2, 3, 4, 5];
                this.is([1, 3, 5], T.filter(function(item){ return item % 2; }));
                this.is(A, T, true);

                T[100] = 1;
                this.is([1, 2, 3, 4, 5, 1], T.filter(basis.fn.$true));
                this.is([1, 2, 3, 4, 5, 1], T.filter(basis.fn.$self));

                this.is([], T.filter(basis.fn.$false));

                var counter = 0;
                this.is([], T.filter(function(item){ counter++; }));
                this.is(A.length + 1, counter);
              }
            },
            {
              name: 'map()',
              test: function(){
                var T = basis.array.from(C);
                this.is([2, 4, 6], T.map(function(item){ return item * 2; }));
                this.is(T, C, true);

                T[5] = 1;
                this.is([2, 4, 6, undefined, undefined, 2], T.map(function(item){ return item * 2; }));

                var counter = 0;
                this.is([undefined, undefined, undefined, undefined, undefined, undefined], T.map(function(item){ counter++; }));
                this.is(4, counter);
              }
            },
            {
              name: 'reduce()',
              test: function(){
                var T = [0, 1, 2, 3, 4];
                this.is(10, T.reduce(function(previousValue, currentValue, index, array){
                  return previousValue + currentValue;
                }));
                this.is([0, 1, 2, 3, 4], T);

                this.is(20, T.reduce(function(previousValue, currentValue, index, array){
                  return previousValue + currentValue;
                }, 10));

                var T = [[0, 1], [2, 3], [4, 5]];
                this.is([0, 1, 2, 3, 4, 5], T.reduce(function(a, b){
                  return a.concat(b);
                }, []));
              }
            }
          ]
        },
        {
          name: 'Extractors',
          test: [
            {
              name: 'flatten()',
              test: function(){
                this.is([0, 1, 2, 3, 3.5, 4, 5, 6], basis.array.flatten([0, C, 3.5, D, 6]));

                var T = [1, 2, 3];
                this.is([1, T, 2, 2, T, 3], basis.array.flatten([[1, T, 2], 2, [T, 3]]));

                var T = [];
                this.is([1, 2], basis.array.flatten([1, T, 2]));
                this.is([1, T, 2], basis.array.flatten([1, [T], 2]));
              }
            },
            {
              name: 'repeat()',
              test: function(){
                this.is([], basis.array.repeat([]));
                this.is([], basis.array.repeat([], 0));
                this.is([], basis.array.repeat([], 3));

                this.is([], basis.array.repeat([1]));
                this.is([], basis.array.repeat([1], 0));
                this.is([1, 1, 1], basis.array.repeat([1], 3));

                this.is([], basis.array.repeat([1, 2, 3]));
                this.is([], basis.array.repeat([1, 2, 3], 0));
                this.is([1, 2, 3, 1, 2, 3, 1, 2, 3], basis.array.repeat([1, 2, 3], 3));
              }
            },
            {
              name: 'search()',
              test: function(){
                var T = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, basis.array.search(T, 2));
                this.is(T[1], basis.array.search(T, T[1]));
                this.is(T[1], basis.array.search(T, 1.0, basis.getter('value')));
                this.is(undefined, basis.array.search(T, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.search(T, '2', basis.getter('value')));
                this.is(T[2], basis.array.search(T, 2, basis.getter('value')));
                this.is(T[T.length - 1], basis.array.search(T, 2, basis.getter('value'), 3));
                this.is(T[T.length - 1], basis.array.search(T, 2, 'value', 3));

                var T = [];
                T[3] = { value: 3 };
                T[7] = { value: 5 };
                T[9] = { value: 3 };
                this.is(undefined, basis.array.search(T, 2));
                this.is(undefined, basis.array.search(T, 2, basis.getter('value')));
                this.is(T[3], basis.array.search(T, 3.0, basis.getter('value')));
                this.is(undefined, basis.array.search(T, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.search(T, '3', basis.getter('value')));
                this.is(T[3], basis.array.search(T, 3, basis.getter('value')));
                this.is(T[9], basis.array.search(T, 3, basis.getter('value'), 4));
              }
            },
            {
              name: 'lastSearch()',
              test: function(){
                var T = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, basis.array.lastSearch(T, 2));
                this.is(T[1], basis.array.lastSearch(T, T[1]));
                this.is(T[1], basis.array.lastSearch(T, 1.0, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(T, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(T, '2', basis.getter('value')));
                this.is(T[T.length - 1], basis.array.lastSearch(T, 2, basis.getter('value')));
                this.is(T[2], basis.array.lastSearch(T, 2, basis.getter('value'), 3));
                this.is(T[2], basis.array.lastSearch(T, 2, 'value', 3));
                this.is(T[2], basis.array.lastSearch(T, 2, 'value', 4));
                this.is(T[2], basis.array.lastSearch(T, 2, 'value', 5));
                this.is(T[T.length - 1], basis.array.lastSearch(T, 2, 'value', 6));

                var T = [];
                T[3] = { value: 3 };
                T[7] = { value: 5 };
                T[9] = { value: 3 };
                this.is(undefined, basis.array.lastSearch(T, 2));
                this.is(undefined, basis.array.lastSearch(T, 2, basis.getter('value')));
                this.is(T[9], basis.array.lastSearch(T, 3.0, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(T, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(T, '3', basis.getter('value')));
                this.is(T[9], basis.array.lastSearch(T, 3, basis.getter('value')));
                this.is(T[3], basis.array.lastSearch(T, 3, basis.getter('value'), 4));
              }
            }
          ]
        },
        {
          name: 'Collection for',
          test: [
            {
              name: 'add()',
              test: function(){
                var T = [1, 2, 3, 4, 5];;
                this.is(true,  basis.array.add(T, '3'));
                this.is(false, basis.array.add(T, 3));
                this.is(true,  basis.array.add(T, 7));
              }
            },
            {
              name: 'remove()',
              test: function(){
                var T = [1, 2, 3, 4, 5];;
                this.is(false, basis.array.remove(T, '3'));
                this.is(true,  basis.array.remove(T, 3));
                this.is(false, basis.array.remove(T, 7));
              }
            },
            {
              name: 'has()',
              test: function(){
                var T = [1, 2, 3, 4, 5];
                this.is(false, basis.array.has(T, '3'));
                this.is(true,  basis.array.has(T, 3));
                this.is(false, basis.array.has(T, 23));
              }
            }
          ]
        }
      ]
    },
    {
      name: 'String',
      test: [
        {
          name: 'toObject()',
          test: function(){
            var fn = function(val){
              return val;
            };

            this.is({ a: 123, b: 234 }, basis.string.toObject('{ a: 123, b: 234 }'));
            this.is([1, 2, 3, 4, 5], basis.string.toObject('[1, 2, 3, 4, 5]'));
            this.is(fn.toString(), basis.string.toObject(fn.toString()).toString());
          }
        },
        {
          name: 'repeat()',
          test: function(){
            this.is('', basis.string.repeat(''));
            this.is('', basis.string.repeat('', 0));
            this.is('', basis.string.repeat('', 3));

            this.is('', basis.string.repeat('a'));
            this.is('', basis.string.repeat('a', 0));
            this.is('aaa', basis.string.repeat('a', 3));

            this.is('', basis.string.repeat('abc'));
            this.is('', basis.string.repeat('abc', 0));
            this.is('abcabcabc', basis.string.repeat('abc', 3));
          }
        },
        {
          name: 'qw()',
          test: function(){
            var S = '  foo foo-bar foo:bar bar ';
            this.is(['foo', 'foo-bar', 'foo:bar', 'bar'], basis.string.qw(S));

            var S = ' \t foo \n\n\nbar\r\n\r';
            this.is(['foo', 'bar'], basis.string.qw(S));

            this.is([], basis.string.qw(''));

            var S = ' \t \n\n\n \r\n\r';
            this.is([], basis.string.qw(S));
          }
        },
        {
          name: 'forRegExp()',
          test: function(){
          }
        },
        {
          name: 'toRegExp()',
          test: function(){
          
          }
        },
        {
          name: 'sprintf()',
          test: function(){
          
          }
        },
        {
          name: 'format()',
          test: function(){
          
          }
        },
        {
          name: 'trimLeft()',
          test: function(){
            this.is('x \n ', ' \n x \n '.trimLeft());
          }
        },
        {
          name: 'trimRight()',
          test: function(){
            this.is(' \n x', ' \n x \n '.trimRight());
          }
        },
        {
          name: 'trim()',
          test: function(){
            this.is('x', ' \n x \n '.trim());
          }
        },
        {
          name: 'capitalize()',
          test: function(){
            this.is('Foo', basis.string.capitalize('foo'));
            this.is('Foo', basis.string.capitalize('fOO'));
            this.is('Foobar', basis.string.capitalize('fooBar'));
            this.is('Foo-bar', basis.string.capitalize('foo-bar'));

            this.is('\u041F\u0440\u0438\u0432\u0435\u0442', basis.string.capitalize('\u043F\u0440\u0438\u0432\u0435\u0442'));
            this.is('\u041F\u0440\u0438\u0432\u0435\u0442', basis.string.capitalize('\u043F\u0440\u0438\u0412\u0435\u0442'));
          }
        },
        {
          name: 'camelize()',
          test: function(){
            this.is('foo', basis.string.camelize('foo'));
            this.is('fooBar', basis.string.camelize('foo-bar'));
            this.is('FooBar', basis.string.camelize('-foo-bar'));
            this.is('Foo', basis.string.camelize('-foo'));

            this.is('\u043F\u0440\u0438\u0432\u0435\u0442', basis.string.camelize('\u043F\u0440\u0438\u0432\u0435\u0442'));
            this.is('\u043F\u0440\u0438\u0412\u0435\u0442', basis.string.camelize('\u043F\u0440\u0438-\u0432\u0435\u0442'));
            this.is('\u041F\u0440\u0438\u0412\u0435\u0442', basis.string.camelize('-\u043F\u0440\u0438-\u0432\u0435\u0442'));
            this.is('\u041F\u0440\u0438', basis.string.camelize('-\u043F\u0440\u0438'));
          }
        },
        {
          name: 'dasherize()',
          test: function(){
            this.is('foo', basis.string.dasherize('foo'));
            this.is('foo-bar', basis.string.dasherize('fooBar'));
            this.is('-foo-bar', basis.string.dasherize('FooBar'));
            this.is('-foo', basis.string.dasherize('Foo'));

            // unicode unsupported
          }
        }
      ]
    },
    {
      name: 'Number',
      test: [
        {
          name: 'group',
          test: function(){
            var N = 1;
            this.is('1', basis.number.group(N));
            this.is('1', basis.number.group(N, 5));

            var N = -1;
            this.is('-1', basis.number.group(N));
            this.is('-1', basis.number.group(N, 5));

            var N = 1234567890;
            this.is('1 234 567 890', basis.number.group(N));
            this.is('12 34 56 78 90', basis.number.group(N, 2));
            this.is('1 234 567 890', basis.number.group(N, 3));
            this.is('12 3456 7890', basis.number.group(N, 4));
            this.is('1234567890', basis.number.group(N, 10));
            this.is('1234567890', basis.number.group(N, 15));

            this.is('1-234-567-890', basis.number.group(N, undefined, '-'));
            this.is('1-234-567-890', basis.number.group(N, 3, '-'));

            var N = -1234567890;
            this.is('-1 234 567 890', basis.number.group(N));
            this.is('-12 34 56 78 90', basis.number.group(N, 2));
            this.is('-1 234 567 890', basis.number.group(N, 3));
            this.is('-12 3456 7890', basis.number.group(N, 4));
            this.is('-1234567890', basis.number.group(N, 10));
            this.is('-1234567890', basis.number.group(N, 15));

            this.is('-1-234-567-890', basis.number.group(N, undefined, '-'));
            this.is('-1-234-567-890', basis.number.group(N, 3, '-'));

            var N = 1.1;
            this.is('1.1', basis.number.group(N));
            this.is('1.1', basis.number.group(N, 1));
            this.is('1.1', basis.number.group(N, 2));
            this.is('1.1', basis.number.group(N, 5));

            var N = -1.1;
            this.is('-1.1', basis.number.group(N));
            this.is('-1.1', basis.number.group(N, 1));
            this.is('-1.1', basis.number.group(N, 2));
            this.is('-1.1', basis.number.group(N, 5));

            var N = 1234567890.12345;
            this.is('1 234 567 890.12345', basis.number.group(N));
            this.is('12 34 56 78 90.12345', basis.number.group(N, 2));
            this.is('1 234 567 890.12345', basis.number.group(N, 3));
            this.is('1"234"567"890.12345', basis.number.group(N, 3, '"'));
            this.is('12 3456 7890.12345', basis.number.group(N, 4));
            this.is('1234567890.12345', basis.number.group(N, 10));
            this.is('1234567890.12345', basis.number.group(N, 15));

            var N = -1234567890.12345;
            this.is('-1 234 567 890.12345', basis.number.group(N));
            this.is('-12 34 56 78 90.12345', basis.number.group(N, 2));
            this.is('-1 234 567 890.12345', basis.number.group(N, 3));
            this.is('-1"234"567"890.12345', basis.number.group(N, 3, '"'));
            this.is('-12 3456 7890.12345', basis.number.group(N, 4));
            this.is('-1234567890.12345', basis.number.group(N, 10));
            this.is('-1234567890.12345', basis.number.group(N, 15));
          }
        },
        {
          name: 'lead()',
          test: function(){
            var N = 123;
            this.is('123', basis.number.lead(N));
            this.is('123', basis.number.lead(N, 0));
            this.is('123', basis.number.lead(N, 1));
            this.is('123', basis.number.lead(N, 2));
            this.is('123', basis.number.lead(N, 3));
            this.is('00123', basis.number.lead(N, 5));
            this.is('##123', basis.number.lead(N, 5, '#'));

            var N = -123;
            this.is('-123', basis.number.lead(N));
            this.is('-123', basis.number.lead(N, 0));
            this.is('-123', basis.number.lead(N, 1));
            this.is('-123', basis.number.lead(N, 2));
            this.is('-123', basis.number.lead(N, 3));
            this.is('-00123', basis.number.lead(N, 5));
            this.is('-##123', basis.number.lead(N, 5, '#'));

            var N = 123.23;
            this.is('123.23', basis.number.lead(N));
            this.is('123.23', basis.number.lead(N, 0));
            this.is('123.23', basis.number.lead(N, 1));
            this.is('123.23', basis.number.lead(N, 2));
            this.is('123.23', basis.number.lead(N, 3));
            this.is('000123.23', basis.number.lead(N, 6));
            this.is('00000123.23', basis.number.lead(N, 8));
            this.is('#####123.23', basis.number.lead(N, 8, '#'));

            var N = -123.23;
            this.is('-123.23', basis.number.lead(N));
            this.is('-123.23', basis.number.lead(N, 0));
            this.is('-123.23', basis.number.lead(N, 1));
            this.is('-123.23', basis.number.lead(N, 2));
            this.is('-123.23', basis.number.lead(N, 3));
            this.is('-000123.23', basis.number.lead(N, 6));
            this.is('-00000123.23', basis.number.lead(N, 8));
            this.is('-#####123.23', basis.number.lead(N, 8, '#'));
          }
        }
      ]
    }
  ]
};
