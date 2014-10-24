module.exports = {
  name: 'basis.ua',

  init: function(){
    var cookie = basis.require('basis.ua.cookie');

    var cookieName = 'test-cookie-' + basis.genUID();
  },

  test: [
    {
      name: 'Cookie',
      test: [
        {
          name: 'set',
          test: function(){
            cookie.set(cookieName, 1);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie));

            cookie.set(cookieName, 'basis-test');
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*basis-test\\s*(;|$)')).test(document.cookie));

            cookie.set(cookieName);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=?\\s*(;|$)')).test(document.cookie));
          }
        },
        {
          name: 'get',
          test: function(){
            cookie.set(cookieName, 1);
            assert(cookie.get(cookieName) === '1');

            cookie.set(cookieName, 'basis-test');
            assert(cookie.get(cookieName) === 'basis-test');

            cookie.set(cookieName);
            assert(cookie.get(cookieName) === '');

            cookie.set(cookieName, 'Привет мир');
            assert(cookie.get(cookieName) === 'Привет мир');
          }
        },
        {
          name: 'remove',
          test: function(){
            cookie.set(cookieName, 1);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie) === true);

            cookie.remove(cookieName);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie) === false);
            assert((new RegExp(cookieName)).test(document.cookie) === false);
          }
        },
        {
          name: 'remove by path',
          test: function(){
            var path = location.pathname.replace(/\/[^\/]+$/, '/');

            // set with path
            cookie.set(cookieName, 1, 0, path);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie) === true);

            // no effect for remove without path
            cookie.remove(cookieName);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie) === true);
            assert((new RegExp(cookieName)).test(document.cookie) === true);

            // remove
            cookie.remove(cookieName, path);
            assert((new RegExp('(^|\;)\\s*' + cookieName + '\\s*=\\s*1\\s*(;|$)')).test(document.cookie) === false);
            assert((new RegExp(cookieName)).test(document.cookie) === false);
          }
        }
      ]
    },
    {
      name: 'clear test cookies',
      test: function(){
        document.cookie = cookieName + '=;expires=' + new Date(0);
        assert(new RegExp(cookieName).test(document.cookie) == false);
      }
    }
  ]
};
