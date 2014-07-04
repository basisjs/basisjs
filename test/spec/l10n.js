module.exports = {
  name: 'basis.l10n',

  html: __dirname + 'l10n.html',  // to properly load .l10n file
  init: function(){
    basis.require('basis.l10n');
    basis.require('basis.ui');
  },

  test: [
    {
      name: 'fallback',
      test: [
        {
          name: 'basic',
          test: function(){
            var res = JSON.parse(basis.require('./l10n.l10n').resource.get(true));
            var dict = basis.l10n.dictionary('l10n', basis.resource.virtual('l10n', res));
            basis.l10n.setCulture('en-US');
            assert(dict.token('value').value === 'base');

            basis.l10n.setCultureList('en-US a/b b/c c');

            basis.l10n.setCulture('c');
            assert(dict.token('value').value === 'base');
            basis.l10n.setCulture('b');
            assert(dict.token('value').value === 'base');
            basis.l10n.setCulture('a');
            assert(dict.token('value').value === 'base');

            res.c = { value: 'c' };
            dict.resource.update(JSON.stringify(res));
            basis.l10n.setCulture('c');
            assert(dict.token('value').value === 'c');

            basis.l10n.setCulture('b');
            assert(dict.token('value').value === 'c');
            basis.l10n.setCulture('a');
            assert(dict.token('value').value === 'c');

            res.b = { value: 'b' };
            dict.resource.update(JSON.stringify(res));
            assert(dict.token('value').value === 'b');
            basis.l10n.setCulture('b');
            assert(dict.token('value').value === 'b');
            basis.l10n.setCulture('c');
            assert(dict.token('value').value === 'c');

            res.a = { value: 'a' };
            dict.resource.update(JSON.stringify(res));
            basis.l10n.setCulture('a');
            assert(dict.token('value').value === 'a');
            basis.l10n.setCulture('b');
            assert(dict.token('value').value === 'b');
            basis.l10n.setCulture('c');
            assert(dict.token('value').value === 'c');
          }
        },
        {
          name: 'fallback and compute token',
          test: function(){
            basis.l10n.setCultureList('a/b b');

            var dict = basis.l10n.dictionary(basis.resource.virtual('l10n', {
              a: {
                token: {
                  key1: 'a'
                }
              },
              b: {
                token: {
                  key1: 'b1',
                  key2: 'b2'
                }
              }
            }));

            var checkToken = dict.token('token').computeToken();

            // base culture A
            checkToken.set('key1');
            assert(basis.l10n.getCulture() === 'a');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture B
            basis.l10n.setCulture('b');
            assert(basis.l10n.getCulture() === 'b');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'b1');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');

            // set culture A
            basis.l10n.setCulture('a');
            assert(basis.l10n.getCulture() === 'a');
            assert(checkToken.get() === 'b2');

            checkToken.set('key1');
            assert(checkToken.get() === 'a');

            checkToken.set('key2');
            assert(checkToken.get() === 'b2');
          }
        }
      ]
    },
    {
      name: 'dictionary',
      test: function(){
        assert(basis.l10n.dictionary('./l10n.l10n') === basis.l10n.dictionary('./l10n.l10n'));
        assert(basis.l10n.dictionary(basis.resource('./l10n.l10n')) === basis.l10n.dictionary('./l10n.l10n'));

        // path should be normalized
        assert(basis.l10n.dictionary('./foo/../l10n.l10n') === basis.l10n.dictionary('./l10n.l10n'));
        // file extension should be replaced for `.l10n`
        assert(basis.l10n.dictionary('./l10n.l10n') === basis.l10n.dictionary('./l10n.whatever'));
        // if no extension, then `.l10n` should be appended
        assert(basis.l10n.dictionary('./l10n.l10n') === basis.l10n.dictionary('./l10n'));
      }
    },
    {
      name: 'dictionary from static data (experimental, under consideration)',
      test: function(){
        var staticdata = { 'ru-RU': { test: 'Test' } };
        var dict = basis.l10n.dictionary(staticdata);
        assert(dict instanceof basis.l10n.Dictionary);

        // static data should produce the same dictionary (under consideration)
        assert(basis.l10n.dictionary(staticdata) !== basis.l10n.dictionary(staticdata));

        // check dictionary
        basis.l10n.setCultureList('en-US ru-RU');

        basis.l10n.setCulture('en-US');
        assert(dict.token('test').value === undefined);

        basis.l10n.setCulture('ru-RU');
        assert(dict.token('test').value === 'Test');
      }
    },
    {
      name: 'culture/Culture',
      test: function(){
        basis.l10n.setCultureList('en-US ru-RU');

        basis.l10n.setCulture('en-US');
        assert(basis.l10n.getCulture() === 'en-US');
        assert(basis.l10n.culture.value === 'en-US');
        assert(basis.l10n.culture.get() === 'en-US');
        assert(basis.l10n.culture().name === 'en-US');

        basis.l10n.setCulture('ru-RU');
        assert(basis.l10n.getCulture() === 'ru-RU');
        assert(basis.l10n.culture.value === 'ru-RU');
        assert(basis.l10n.culture.get() === 'ru-RU');
        assert(basis.l10n.culture().name === 'ru-RU');

        basis.l10n.culture.set('en-US');
        assert(basis.l10n.getCulture() === 'en-US');
        assert(basis.l10n.culture.value === 'en-US');
        assert(basis.l10n.culture.get() === 'en-US');
        assert(basis.l10n.culture().name === 'en-US');

        // create culture
        assert((new basis.l10n.Culture('en-US')).name === 'en-US');
        assert((new basis.l10n.Culture('en-US')) !== (new basis.l10n.Culture('en-US')));

        // culture helper
        assert(basis.l10n.culture('ru-RU') === basis.l10n.culture('ru-RU'));
        assert(basis.l10n.culture() === basis.l10n.culture(basis.l10n.getCulture()));
        assert(basis.l10n.culture() instanceof basis.l10n.Culture);
      }
    }
  ]
};
