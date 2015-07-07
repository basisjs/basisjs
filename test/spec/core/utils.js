module.exports = {
  name: 'Util functions',

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
                var a = [1, 2, 3, 4, 5];
                this.is(a, basis.array.from(a));
                this.is(false, a === basis.array.from(a));
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
                var a = [1, 2, 3, 2, 3, 2, 1];

                this.is(-1, a.indexOf());
                this.is(2,  a.indexOf(3));
                this.is(4,  a.indexOf(3, 3));
                this.is(4,  a.indexOf(3, 4));
                this.is(-1, a.indexOf(3, 5));
                this.is(-1, a.indexOf('3'));
                this.is(-1, a.indexOf(33));
              }
            },
            {
              name: 'lastIndexOf()',
              test: function(){
                var a = [1, 2, 3, 2, 3, 2, 1];

                this.is(-1, a.lastIndexOf());
                this.is(4,  a.lastIndexOf(3));
                this.is(-1, a.lastIndexOf('3'));
                this.is(-1, a.lastIndexOf(33));
              }
            },
            {
              name: 'forEach()',
              test: function(){
                var tmp = '';
                var a = [1, 2, 3];
                // must return array or undefined???
                this.is(undefined, a.forEach(function(item){ tmp += item * 2; }));
                this.is([1, 2, 3], a);
                this.is('246', tmp);

                a.forEach(function(item, index, array){ array[index] *= 2; });
                this.is([2, 4, 6], a);
              }
            },
            {
              name: 'every()',
              test: function(){
                var a = [1, 2, 3, 4, 5];
                this.is(true,  a.every(function(item){
                  return item > 0;
                }));
                this.is([1, 2, 3, 4, 5], a);

                this.is(false, a.every(function(item){
                  return item > 1;
                }));

                a[100] = 1;
                this.is(true, a.every(function(item){
                  return typeof item != 'undefined';
                }));

                var counter = 0;
                this.is(true, a.every(function(item){
                  counter++;
                  return true;
                }));
                this.is(6, counter);
              }
            },
            {
              name: 'some()',
              test: function(){
                var a = [1, 2, 3, 4, 5];
                this.is(true,  a.some(function(item){
                  return item > 4;
                }));
                this.is([1, 2, 3, 4, 5], a);

                this.is(false, a.some(function(item){
                  return item > 10;
                }));

                a[100] = 1;
                this.is(false, a.some(function(item){
                  return typeof item == 'undefined';
                }));

                var counter = 0;
                this.is(false, a.some(function(item){
                  counter++;
                  return false;
                }));
                this.is(6, counter);
              }
            },
            {
              name: 'filter()',
              test: function(){
                var a = [1, 2, 3, 4, 5];
                this.is([1, 3, 5], a.filter(function(item){
                  return item % 2;
                }));
                this.is([1, 2, 3, 4, 5], a);

                a[100] = 1;
                this.is([1, 2, 3, 4, 5, 1], a.filter(basis.fn.$true));
                this.is([1, 2, 3, 4, 5, 1], a.filter(basis.fn.$self));

                this.is([], a.filter(basis.fn.$false));

                var counter = 0;
                this.is([], a.filter(function(item){ counter++; }));
                this.is(6, counter);
              }
            },
            {
              name: 'map()',
              test: function(){
                var a = [1, 2, 3];
                this.is([2, 4, 6], a.map(function(item){
                  return item * 2;
                }));
                this.is([1, 2, 3], a);

                a[5] = 1;
                this.is([2, 4, 6, undefined, undefined, 2], a.map(function(item){
                  return item * 2;
                }));

                var counter = 0;
                this.is([undefined, undefined, undefined, undefined, undefined, undefined], a.map(function(item){ counter++; }));
                this.is(4, counter);
              }
            },
            {
              name: 'reduce()',
              test: function(){
                var a = [0, 1, 2, 3, 4];
                this.is(10, a.reduce(function(previousValue, currentValue, index, array){
                  return previousValue + currentValue;
                }));
                this.is([0, 1, 2, 3, 4], a);

                this.is(20, a.reduce(function(previousValue, currentValue, index, array){
                  return previousValue + currentValue;
                }, 10));

                var a = [[0, 1], [2, 3], [4, 5]];
                this.is([0, 1, 2, 3, 4, 5], a.reduce(function(a, b){
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
                this.is([0, 1, 2, 3, 3.5, 4, 5, 6], basis.array.flatten([0, [1, 2, 3], 3.5, [4, 5], 6]));

                var a = [1, 2, 3];
                this.is([1, a, 2, 2, a, 3], basis.array.flatten([[1, a, 2], 2, [a, 3]]));

                var a = [];
                this.is([1, 2], basis.array.flatten([1, a, 2]));
                this.is([1, a, 2], basis.array.flatten([1, [a], 2]));
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
                var a = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, basis.array.search(a, 2));
                this.is(a[1], basis.array.search(a, a[1]));
                this.is(a[1], basis.array.search(a, 1.0, basis.getter('value')));
                this.is(undefined, basis.array.search(a, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.search(a, '2', basis.getter('value')));
                this.is(a[2], basis.array.search(a, 2, basis.getter('value')));
                this.is(a[a.length - 1], basis.array.search(a, 2, basis.getter('value'), 3));
                this.is(a[a.length - 1], basis.array.search(a, 2, 'value', 3));

                var a = [];
                a[3] = { value: 3 };
                a[7] = { value: 5 };
                a[9] = { value: 3 };
                this.is(undefined, basis.array.search(a, 2));
                this.is(undefined, basis.array.search(a, 2, basis.getter('value')));
                this.is(a[3], basis.array.search(a, 3.0, basis.getter('value')));
                this.is(undefined, basis.array.search(a, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.search(a, '3', basis.getter('value')));
                this.is(a[3], basis.array.search(a, 3, basis.getter('value')));
                this.is(a[9], basis.array.search(a, 3, basis.getter('value'), 4));
              }
            },
            {
              name: 'lastSearch()',
              test: function(){
                var a = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 2, b: 1 }];
                this.is(undefined, basis.array.lastSearch(a, 2));
                this.is(a[1], basis.array.lastSearch(a, a[1]));
                this.is(a[1], basis.array.lastSearch(a, 1.0, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(a, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(a, '2', basis.getter('value')));
                this.is(a[a.length - 1], basis.array.lastSearch(a, 2, basis.getter('value')));
                this.is(a[2], basis.array.lastSearch(a, 2, basis.getter('value'), 3));
                this.is(a[2], basis.array.lastSearch(a, 2, 'value', 3));
                this.is(a[2], basis.array.lastSearch(a, 2, 'value', 4));
                this.is(a[2], basis.array.lastSearch(a, 2, 'value', 5));
                this.is(a[a.length - 1], basis.array.lastSearch(a, 2, 'value', 6));

                var a = [];
                a[3] = { value: 3 };
                a[7] = { value: 5 };
                a[9] = { value: 3 };
                this.is(undefined, basis.array.lastSearch(a, 2));
                this.is(undefined, basis.array.lastSearch(a, 2, basis.getter('value')));
                this.is(a[9], basis.array.lastSearch(a, 3.0, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(a, 1.5, basis.getter('value')));
                this.is(undefined, basis.array.lastSearch(a, '3', basis.getter('value')));
                this.is(a[9], basis.array.lastSearch(a, 3, basis.getter('value')));
                this.is(a[3], basis.array.lastSearch(a, 3, basis.getter('value'), 4));
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
                var a = [1, 2, 3, 4, 5];;
                this.is(true,  basis.array.add(a, '3'));
                this.is(false, basis.array.add(a, 3));
                this.is(true,  basis.array.add(a, 7));
              }
            },
            {
              name: 'remove()',
              test: function(){
                var a = [1, 2, 3, 4, 5];;
                this.is(false, basis.array.remove(a, '3'));
                this.is(true,  basis.array.remove(a, 3));
                this.is(false, basis.array.remove(a, 7));
              }
            },
            {
              name: 'has()',
              test: function(){
                var a = [1, 2, 3, 4, 5];
                this.is(false, basis.array.has(a, '3'));
                this.is(true,  basis.array.has(a, 3));
                this.is(false, basis.array.has(a, 23));
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
