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
                this.is([0, 1, 2, 3, 3.5, 4, 5, 6], [0, C, 3.5, D, 6].flatten());

                var T = [1, 2, 3];
                this.is([1, T, 2, 2, T, 3], [[1, T, 2], 2, [T, 3]].flatten());

                var T = [];
                this.is([1, 2], [1, T, 2].flatten());
                this.is([1, T, 2], [1, [T], 2].flatten());
              }
            },
            {
              name: 'repeat()',
              test: function(){
                this.is([], [].repeat());
                this.is([], [].repeat(0));
                this.is([], [].repeat(3));

                this.is([], [1].repeat());
                this.is([], [1].repeat(0));
                this.is([1, 1, 1], [1].repeat(3));

                this.is([], [1, 2, 3].repeat());
                this.is([], [1, 2, 3].repeat(0));
                this.is([1, 2, 3, 1, 2, 3, 1, 2, 3], [1, 2, 3].repeat(3));
              }
            },
            {
              name: 'search()',
              test: function(){
                var T = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, T.search(2));
                this.is(T[1], T.search(T[1]));
                this.is(T[1], T.search(1.0, basis.getter('value')));
                this.is(undefined, T.search(1.5, basis.getter('value')));
                this.is(undefined, T.search('2', basis.getter('value')));
                this.is(T[2], T.search(2, basis.getter('value')));
                this.is(T[T.length - 1], T.search(2, basis.getter('value'), 3));
                this.is(T[T.length - 1], T.search(2, 'value', 3));

                var T = [];
                T[3] = { value: 3 };
                T[7] = { value: 5 };
                T[9] = { value: 3 };
                this.is(undefined, T.search(2));
                this.is(undefined, T.search(2, basis.getter('value')));
                this.is(T[3], T.search(3.0, basis.getter('value')));
                this.is(undefined, T.search(1.5, basis.getter('value')));
                this.is(undefined, T.search('3', basis.getter('value')));
                this.is(T[3], T.search(3, basis.getter('value')));
                this.is(T[9], T.search(3, basis.getter('value'), 4));
              }
            },
            {
              name: 'lastSearch()',
              test: function(){
                var T = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, T.lastSearch(2));
                this.is(T[1], T.lastSearch(T[1]));
                this.is(T[1], T.lastSearch(1.0, basis.getter('value')));
                this.is(undefined, T.lastSearch(1.5, basis.getter('value')));
                this.is(undefined, T.lastSearch('2', basis.getter('value')));
                this.is(T[T.length - 1], T.lastSearch(2, basis.getter('value')));
                this.is(T[2], T.lastSearch(2, basis.getter('value'), 3));
                this.is(T[2], T.lastSearch(2, 'value', 3));
                this.is(T[2], T.lastSearch(2, 'value', 4));
                this.is(T[2], T.lastSearch(2, 'value', 5));
                this.is(T[T.length - 1], T.lastSearch(2, 'value', 6));

                var T = [];
                T[3] = { value: 3 };
                T[7] = { value: 5 };
                T[9] = { value: 3 };
                this.is(undefined, T.lastSearch(2));
                this.is(undefined, T.lastSearch(2, basis.getter('value')));
                this.is(T[9], T.lastSearch(3.0, basis.getter('value')));
                this.is(undefined, T.lastSearch(1.5, basis.getter('value')));
                this.is(undefined, T.lastSearch('3', basis.getter('value')));
                this.is(T[9], T.lastSearch(3, basis.getter('value')));
                this.is(T[3], T.lastSearch(3, basis.getter('value'), 4));
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
                this.is(true,  T.add('3'));
                this.is(false, T.add(3));
                this.is(true,  T.add(7));
              }
            },
            {
              name: 'remove()',
              test: function(){
                var T = [1, 2, 3, 4, 5];;
                this.is(false, T.remove('3'));
                this.is(true,  T.remove(3));
                this.is(false, T.remove(7));
              }
            },
            {
              name: 'has()',
              test: function(){
                var T = [1, 2, 3, 4, 5];
                this.is(false, T.has('3'));
                this.is(true,  T.has(3));
                this.is(false, T.has(23));
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
            var fn = function(val){ return val; };
            this.is({ a: 123, b: 234 }, '{ a: 123, b: 234 }'.toObject());
            this.is([1, 2, 3, 4, 5], '[1, 2, 3, 4, 5]'.toObject());
            this.is(fn.toString(), fn.toString().toObject().toString());
          }
        },
        {
          name: 'repeat()',
          test: function(){
            this.is('', ''.repeat());
            this.is('', ''.repeat(0));
            this.is('', ''.repeat(3));

            this.is('', 'a'.repeat());
            this.is('', 'a'.repeat(0));
            this.is('aaa', 'a'.repeat(3));

            this.is('', 'abc'.repeat());
            this.is('', 'abc'.repeat(0));
            this.is('abcabcabc', 'abc'.repeat(3));
          }
        },
        {
          name: 'qw()',
          test: function(){
            var S = '  foo foo-bar foo:bar bar ';
            this.is(['foo', 'foo-bar', 'foo:bar', 'bar'], S.qw());

            var S = ' \t foo \n\n\nbar\r\n\r';
            this.is(['foo', 'bar'], S.qw());

            this.is([], ''.qw());

            var S = ' \t \n\n\n \r\n\r';
            this.is([], S.qw());
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
            this.is('Foo', 'foo'.capitalize());
            this.is('Foo', 'fOO'.capitalize());
            this.is('Foobar', 'fooBar'.capitalize());
            this.is('Foo-bar', 'foo-bar'.capitalize());

            this.is('\u041F\u0440\u0438\u0432\u0435\u0442', '\u043F\u0440\u0438\u0432\u0435\u0442'.capitalize());
            this.is('\u041F\u0440\u0438\u0432\u0435\u0442', '\u043F\u0440\u0438\u0412\u0435\u0442'.capitalize());
          }
        },
        {
          name: 'camelize()',
          test: function(){
            this.is('foo', 'foo'.camelize());
            this.is('fooBar', 'foo-bar'.camelize());
            this.is('FooBar', '-foo-bar'.camelize());
            this.is('Foo', '-foo'.camelize());

            this.is('\u043F\u0440\u0438\u0432\u0435\u0442', '\u043F\u0440\u0438\u0432\u0435\u0442'.camelize());
            this.is('\u043F\u0440\u0438\u0412\u0435\u0442', '\u043F\u0440\u0438-\u0432\u0435\u0442'.camelize());
            this.is('\u041F\u0440\u0438\u0412\u0435\u0442', '-\u043F\u0440\u0438-\u0432\u0435\u0442'.camelize());
            this.is('\u041F\u0440\u0438', '-\u043F\u0440\u0438'.camelize());
          }
        },
        {
          name: 'dasherize()',
          test: function(){
            this.is('foo', 'foo'.dasherize());
            this.is('foo-bar', 'fooBar'.dasherize());
            this.is('-foo-bar', 'FooBar'.dasherize());
            this.is('-foo', 'Foo'.dasherize());

            // unicode unsupport
            //this.is('\u043F\u0440\u0438\u0432\u0435\u0442', '\u043F\u0440\u0438\u0432\u0435\u0442'.dasherize());
            //this.is('\u043F\u0440\u0438-\u0432\u0435\u0442', '\u043F\u0440\u0438\u0412\u0435\u0442'.dasherize());
            //this.is('-\u043F\u0440\u0438-\u0432\u0435\u0442', '\u041F\u0440\u0438\u0412\u0435\u0442'.dasherize());
            //this.is('-\u043F\u0440\u0438', '\u041F\u0440\u0438'.dasherize());
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
            this.is('1', N.group());
            this.is('1', N.group(5));

            var N = -1;
            this.is('-1', N.group());
            this.is('-1', N.group(5));

            var N = 1234567890;
            this.is('1 234 567 890', N.group());
            this.is('12 34 56 78 90', N.group(2));
            this.is('1 234 567 890', N.group(3));
            this.is('12 3456 7890', N.group(4));
            this.is('1234567890', N.group(10));
            this.is('1234567890', N.group(15));

            this.is('1-234-567-890', N.group(undefined, '-'));
            this.is('1-234-567-890', N.group(3, '-'));

            var N = -1234567890;
            this.is('-1 234 567 890', N.group());
            this.is('-12 34 56 78 90', N.group(2));
            this.is('-1 234 567 890', N.group(3));
            this.is('-12 3456 7890', N.group(4));
            this.is('-1234567890', N.group(10));
            this.is('-1234567890', N.group(15));

            this.is('-1-234-567-890', N.group(undefined, '-'));
            this.is('-1-234-567-890', N.group(3, '-'));

            var N = 1.1;
            this.is('1.1', N.group());
            this.is('1.1', N.group(1));
            this.is('1.1', N.group(2));
            this.is('1.1', N.group(5));

            var N = -1.1;
            this.is('-1.1', N.group());
            this.is('-1.1', N.group(1));
            this.is('-1.1', N.group(2));
            this.is('-1.1', N.group(5));

            var N = 1234567890.12345;
            this.is('1 234 567 890.12345', N.group());
            this.is('12 34 56 78 90.12345', N.group(2));
            this.is('1 234 567 890.12345', N.group(3));
            this.is('1"234"567"890.12345', N.group(3, '"'));
            this.is('12 3456 7890.12345', N.group(4));
            this.is('1234567890.12345', N.group(10));
            this.is('1234567890.12345', N.group(15));

            var N = -1234567890.12345;
            this.is('-1 234 567 890.12345', N.group());
            this.is('-12 34 56 78 90.12345', N.group(2));
            this.is('-1 234 567 890.12345', N.group(3));
            this.is('-1"234"567"890.12345', N.group(3, '"'));
            this.is('-12 3456 7890.12345', N.group(4));
            this.is('-1234567890.12345', N.group(10));
            this.is('-1234567890.12345', N.group(15));
          }
        },
        {
          name: 'lead()',
          test: function(){
            var N = 123;
            this.is('123', N.lead());
            this.is('123', N.lead(0));
            this.is('123', N.lead(1));
            this.is('123', N.lead(2));
            this.is('123', N.lead(3));
            this.is('00123', N.lead(5));
            this.is('##123', N.lead(5, '#'));

            var N = -123;
            this.is('-123', N.lead());
            this.is('-123', N.lead(0));
            this.is('-123', N.lead(1));
            this.is('-123', N.lead(2));
            this.is('-123', N.lead(3));
            this.is('-00123', N.lead(5));
            this.is('-##123', N.lead(5, '#'));

            var N = 123.23;
            this.is('123.23', N.lead());
            this.is('123.23', N.lead(0));
            this.is('123.23', N.lead(1));
            this.is('123.23', N.lead(2));
            this.is('123.23', N.lead(3));
            this.is('000123.23', N.lead(6));
            this.is('00000123.23', N.lead(8));
            this.is('#####123.23', N.lead(8, '#'));

            var N = -123.23;
            this.is('-123.23', N.lead());
            this.is('-123.23', N.lead(0));
            this.is('-123.23', N.lead(1));
            this.is('-123.23', N.lead(2));
            this.is('-123.23', N.lead(3));
            this.is('-000123.23', N.lead(6));
            this.is('-00000123.23', N.lead(8));
            this.is('-#####123.23', N.lead(8, '#'));
          }
        }
      ]
    }
  ]
};
