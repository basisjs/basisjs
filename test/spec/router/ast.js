// PLAIN_PARAM(name)
// ANY_PARAM(name)
// WORD(name)
// GROUP(options)

module.exports = {
  name: 'parsePath AST',
  init: function(){
    var AST = basis.require('basis.router.ast');
    var parsePath = AST.parsePath;

    function plain(name) {
      return { type: AST.TYPE.PLAIN_PARAM, name: name };
    }
    function any(name) {
      return { type: AST.TYPE.ANY_PARAM, name: name };
    }
    function word(name) {
      return { type: AST.TYPE.WORD, name: name };
    }
    function group() {
      return { type: AST.TYPE.GROUP, options: basis.array.from(arguments) };
    }
    function option() {
      return { type: AST.TYPE.GROUP_OPTION, children: basis.array.from(arguments) };
    }

    function ast(path) {
      return JSON.stringify(parsePath(path).AST);
    }
    function str(obj) {
      return JSON.stringify(obj);
    }
  },
  test: [
    {
      name: 'simple case',
      test: function(){
        var actual = ast('foo/:bar/*baz');
        var expected = str([
          word('foo/'),
          plain('bar'),
          word('/'),
          any('baz')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'word with extra chars',
      test: function(){
        var actual = ast('/[]?{}/:bar/|+-.^');
        var expected = str([
          word('/[]?{}/'),
          plain('bar'),
          word('/|+-.^')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'group with one child',
      test: function(){
        var actual = ast('page/sub(/)(:rest)(complex/*sub)');
        var expected = str([
          word('page/sub'),
          group(
            option(
              word('/')
            )
          ),
          group(
            option(
              plain('rest')
            )
          ),
          group(
            option(
              word('complex/'),
              any('sub')
            )
          )
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'word with non-closing bracket',
      test: function(){
        var actual = ast('page/sub)(');
        var expected = str([
          word('page/sub)(')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'group with multiple options',
      test: function(){
        var actual = ast('page/(:foo|bar|*baz)/end');
        var expected = str([
          word('page/'),
          group(
            option(
              plain('foo')
            ),
            option(
              word('bar')
            ),
            option(
              any('baz')
            )
          ),
          word('/end')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'recursive group',
      test: function(){
        var actual = ast('page/(:foo|(bar|:spam(/))|*baz)/end');
        var expected = str([
          word('page/'),
          group(
            option(
              plain('foo')
            ),
            option(
              group(
                option(
                  word('bar')
                ),
                option(
                  plain('spam'),
                  group(
                    option(
                      word('/')
                    )
                  )
                )
              )
            ),
            option(
              any('baz')
            )
          ),
          word('/end')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'escaping',
      test: function(){
        var actual = ast('page\\/\\(\\:foo\\|bar\\|\\*baz\\)\\/\\end\\\\');
        var expected = str([
          word('page/(:foo|bar|*baz)/end\\')
        ]);
        assert(actual == expected);
      }
    },
    {
      name: 'regexp - groups and params',
      test: function(){
        var actual = parsePath('page/(:foo|(bar|:spam(/))|*baz)/end').regexp;
        var expected = /^page\/(?:([^\/]+)|(?:bar|([^\/]+)(?:\/)?)?|(.*?))?\/end$/i.toString();
        assert(actual == expected);
      }
    },
    {
      name: 'regexp - escaping',
      test: function(){
        // page\/\(\:foo\|bar\|\*baz\)\/\end\\
        var actual = parsePath('page\\/\\(\\:foo\\|bar\\|\\*baz\\)\\/\\end\\\\').regexp;
        var expected = /^page\/\(\:foo\|bar\|\*baz\)\/\end\\$/i.toString();
        assert(actual == expected);
      }
    },
    {
      name: 'regexp - symbols',
      test: function(){
        var actual = parsePath('/[]?{}/:bar/|+-.^').regexp;
        var expected = /^\/\[\]\?\{\}\/([^\/]+)\/\|\+\-\.\^$/i.toString();
        assert(actual == expected);
      }
    }
  ]
};
