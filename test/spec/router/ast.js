// PLAIN_PARAM(name)
// ANY_PARAM(name)
// WORD(name)
// GROUP(options)

module.exports = {
  name: 'AST',
  init: function(){
    var AST = basis.require('basis.router.ast');
    var parsePath = AST.parsePath;
    var stringify = AST.stringify;

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
      name: 'parsePath',
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
            var actual = parsePath('page/(:foo|(bar|:spam(/))|*baz)/end').regexp.toString();
            var expected = new RegExp('^page\/(?:([^/]+)|(?:bar|([^/]+)(?:\/)?)?|(.*?))?\/end$', 'i').toString();
            assert(actual == expected);
          }
        },
        {
          name: 'regexp - escaping',
          test: function(){
            // page\/\(\:foo\|bar\|\*baz\)\/\end\\
            var actual = parsePath('page\\/\\(\\:foo\\|bar\\|\\*baz\\)\\/\\end\\\\').regexp.toString();
            var expected = new RegExp('^page\\/\\(\\:foo\\|bar\\|\\*baz\\)\\/\\end\\\\$', 'i').toString();
            assert(actual == expected);
          }
        },
        {
          name: 'regexp - symbols',
          test: function(){
            var actual = parsePath('/[]?{}/:bar/|+-.^').regexp.toString();
            var expected = new RegExp('^\\/\\[\\]\\?\\{\\}\\/([^/]+)\\/\\|\\+\\-\\.\\^$', 'i').toString();
            assert(actual == expected);
          }
        }
      ]
    },
    {
      name: 'stringify',
      test: [
        {
          name: 'word',
          test: function(){
            var actual = stringify([
              word('myword')
            ], {}, {});
            var expected = 'myword';
            assert(actual == expected);
          }
        },
        {
          name: 'plain param',
          test: function(){
            var actual = stringify([
              plain('plainParam')
            ], {
              plainParam: 'plainParam value'
            }, {
              plainParam: true // plainParam has modified value
            });
            var expected = 'plainParam%20value';
            assert(actual == expected);
          }
        },
        {
          name: 'any param',
          test: function(){
            var actual = stringify([
              any('anyParam')
            ], {
              anyParam: 'anyParam/value'
            }, {
              anyParam: true // anyParam has modified value
            });
            var expected = 'anyParam%2Fvalue';
            assert(actual == expected);
          }
        },
        {
          name: 'omits optional group without params',
          test: function(){
            var actual = stringify([
              word('begin'),
              group(
                option(
                  word('/end')
                )
              )
            ], {}, {});
            var expected = 'begin';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional group with any param',
          test: function(){
            var actual = stringify([
              word('begin'),
              group(
                option(
                  word('/'),
                  any('id')
                )
              )
            ], {
              id: 42
            }, {
              id: true // id has modified value
            });
            var expected = 'begin/42';
            assert(actual == expected);
          }
        },
        {
          name: 'omits optional group with plain param with default value',
          test: function(){
            var actual = stringify([
              word('begin'),
              group(
                option(
                  word('/'),
                  plain('id')
                )
              )
            ], {
              id: -1
            }, {
              id: false // id has default value
            });
            var expected = 'begin';
            assert(actual == expected);
          }
        },
        {
          name: 'omits optional group with any param with default value - recursive',
          test: function(){
            var actual = stringify([
              word('begin'),
              group(
                option(
                  word('/'),
                  plain('id')
                )
              )
            ], {
              id: 1
            }, {
              id: false // id has default value
            });
            var expected = 'begin';
            assert(actual == expected);
          }
        },
        {
          name: 'omits optional group with multiple options if there is no params between them',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  word('foo')
                ),
                option(
                  word('bar')
                ),
                option(
                  word('baz')
                )
              )
            ], {}, {});
            var expected = 'page/';
            assert(actual == expected);
          }
        },
        {
          name: 'omits optional group with multiple options if there is no nondefault params',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  word('foo')
                ),
                option(
                  plain('plainParam')
                ),
                option(
                  any('anyParam')
                )
              )
            ], {
              plainParam: 'plain',
              anyParam: 'any'
            }, {
              plainParam: false, // plainParam has default value
              anyParam: false // anyParam has default value
            });
            var expected = 'page/';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional group with specified param only',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  word('foo')
                ),
                option(
                  plain('plainParam')
                ),
                option(
                  any('anyParam')
                )
              )
            ], {
              plainParam: 'plain',
              anyParam: 'any'
            }, {
              plainParam: false, // plainParam has default value
              anyParam: true // anyParam has modified value
            });
            var expected = 'page/any';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional group with specified param only - recursive',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  word('foo')
                ),
                option(
                  group(
                    option(
                      word('bar')
                    ),
                    option(
                      plain('plainParam')
                    )
                  )
                ),
                option(
                  any('anyParam')
                )
              )
            ], {
              plainParam: 'plain',
              anyParam: 'any param'
            }, {
              plainParam: true, // plainParam has modified value
              anyParam: true // anyParam has modified value
            });
            var expected = 'page/plain?anyParam=any%20param';
            assert(actual == expected);
          }
        },
        {
          name: 'writes multiple optional params to query',
          test: function(){
            var actual = stringify([
              word('page/')
            ], {
              plainParam: 'plain',
              anyParam: 'any param'
            }, {
              plainParam: true, // plainParam has modified value
              anyParam: true // anyParam has modified value
            });
            var expected = 'page/?plainParam=plain&anyParam=any%20param';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional groups with default params in case they precedes a nondefault param',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  plain('first'),
                  word('/')
                )
              ),
              group(
                option(
                  plain('second'),
                  word('/')
                )
              ),
              group(
                option(
                  plain('third'),
                  word('/')
                )
              ),
              group(
                option(
                  plain('fourth'),
                  word('/')
                )
              )
            ], {
              first: 1,
              second: 2,
              third: 3,
              fourth: 4
            }, {
              first: false, // first has default value
              second: false, // second has default value
              third: true, // third has modified value
              fourth: false // fourth has default value
            });

            var expected = 'page/1/2/3/';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional group with default params in case they precedes a required plain param',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  plain('first'),
                  word('/')
                )
              ),
              plain('second')
            ], {
              first: 1,
              second: 2
            }, {
              first: false, // first has default value
              second: false // second has default value
            });

            var expected = 'page/1/2';
            assert(actual == expected);
          }
        },
        {
          name: 'writes optional group with default params in case they precedes a word',
          test: function(){
            var actual = stringify([
              word('page/'),
              group(
                option(
                  plain('first'),
                  word('/')
                )
              ),
              word('second')
            ], {
              first: 1
            }, {
              first: false // first has default value
            });

            var expected = 'page/1/second';
            assert(actual == expected);
          }
        }
      ]
    }
  ]
};
