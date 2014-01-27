module.exports = {
  name: 'basis.path',

  // some test imported from node.js test suite
  // url: https://github.com/joyent/node/blob/master/test/simple/test-path.js
  test: [
    {
      name: 'basename',
      test: function(){
        this.is('test-path.js', basis.path.basename('some/path/test-path.js'));
        this.is('test-path', basis.path.basename('some/path/test-path.js', '.js'));
        this.is('', basis.path.basename(''));
        this.is('basename.ext', basis.path.basename('/dir/basename.ext'));
        this.is('basename.ext', basis.path.basename('/basename.ext'));
        this.is('basename.ext', basis.path.basename('basename.ext'));
        this.is('basename.ext', basis.path.basename('basename.ext/'));
        this.is('basename.ext', basis.path.basename('basename.ext//'));
      }
    },
    {
      name: 'dirname',
      test: function(){
        this.is('/a', basis.path.dirname('/a/b/'));
        this.is('/a', basis.path.dirname('/a/b'));
        this.is('/', basis.path.dirname('/a'));
        this.is('a', basis.path.dirname('a/b/'));
        this.is('a', basis.path.dirname('a/b'));
        this.is('.', basis.path.dirname('a'));
        this.is('.', basis.path.dirname(''));
        this.is('/', basis.path.dirname('/'));
        this.is('/', basis.path.dirname('////'));
        this.is('/', basis.path.dirname('/a/b/..'));
        this.is('/', basis.path.dirname('/a/b/../'));
        this.is('/', basis.path.dirname('/a/../b'));
        this.is('/', basis.path.dirname('/a/../b/'));
        this.is('/a', basis.path.dirname('/../a/b'));
        this.is('/a', basis.path.dirname('/../a/b/'));
        this.is('.', basis.path.dirname('a/b/..'));
        this.is('.', basis.path.dirname('a/b/../'));
        this.is('.', basis.path.dirname('a/../b'));
        this.is('.', basis.path.dirname('a/../b/'));
        this.is('a', basis.path.dirname('../a/b'));
        this.is('a', basis.path.dirname('../a/b/'));
      }
    },
    {
      name: 'extname',
      test: function(){
        this.is('', basis.path.extname(''));
        this.is('', basis.path.extname('/path/to/file'));
        this.is('.ext', basis.path.extname('/path/to/file.ext'));
        this.is('.ext', basis.path.extname('/path.to/file.ext'));
        this.is('', basis.path.extname('/path.to/file'));
        this.is('', basis.path.extname('/path.to/.file'));
        this.is('.ext', basis.path.extname('/path.to/.file.ext'));
        this.is('.ext', basis.path.extname('/path/to/f.ext'));
        this.is('.ext', basis.path.extname('/path/to/..ext'));
        this.is('', basis.path.extname('file'));
        this.is('.ext', basis.path.extname('file.ext'));
        this.is('', basis.path.extname('.file'));
        this.is('.ext', basis.path.extname('.file.ext'));
        this.is('', basis.path.extname('/file'));
        this.is('.ext', basis.path.extname('/file.ext'));
        this.is('', basis.path.extname('/.file'));
        this.is('.ext', basis.path.extname('/.file.ext'));
        this.is('.ext', basis.path.extname('.path/file.ext'));
        this.is('.ext', basis.path.extname('file.ext.ext'));
        this.is('.', basis.path.extname('file.'));
        this.is('', basis.path.extname('.'));
        this.is('', basis.path.extname('./'));
        this.is('.ext', basis.path.extname('.file.ext'));
        this.is('', basis.path.extname('.file'));
        this.is('.', basis.path.extname('.file.'));
        this.is('.', basis.path.extname('.file..'));
        this.is('', basis.path.extname('..'));
        this.is('', basis.path.extname('../'));
        this.is('.ext', basis.path.extname('..file.ext'));
        this.is('.file', basis.path.extname('..file'));
        this.is('.', basis.path.extname('..file.'));
        this.is('.', basis.path.extname('..file..'));
        this.is('.', basis.path.extname('...'));
        this.is('.ext', basis.path.extname('...ext'));
        this.is('.', basis.path.extname('....'));
        this.is('.ext', basis.path.extname('file.ext/'));
        this.is('.ext', basis.path.extname('file.ext//'));
        this.is('', basis.path.extname('file/'));
        this.is('', basis.path.extname('file//'));
        this.is('.', basis.path.extname('file./'));
        this.is('.', basis.path.extname('file.//'));

        this.is('', basis.path.extname('.\\'));
        this.is('.\\', basis.path.extname('..\\'));
        this.is('.ext\\', basis.path.extname('file.ext\\'));
        this.is('.ext\\\\', basis.path.extname('file.ext\\\\'));
        this.is('', basis.path.extname('file\\'));
        this.is('', basis.path.extname('file\\\\'));
        this.is('.\\', basis.path.extname('file.\\'));
        this.is('.\\\\', basis.path.extname('file.\\\\'));
      }
    },
    {
      name: 'normalize',
      test: function(){
        this.is('/foo/bar/baz/asdf', basis.path.normalize('/foo/bar//baz/asdf/quux/..'));
        this.is('fixtures/b/c.js', basis.path.normalize('./fixtures///b/../b/c.js'));
        this.is('/bar', basis.path.normalize('/foo/../../../bar'));
        this.is('/bar/baz', basis.path.normalize('/foo/../../../bar/baz'));
        this.is('bar', basis.path.normalize('foo/../../../bar'));
        this.is('bar/baz', basis.path.normalize('foo/../../../bar/baz'));
        this.is('a/b', basis.path.normalize('a//b//../b'));
        this.is('a/b/c', basis.path.normalize('a//b//./c'));
        this.is('a/b', basis.path.normalize('a//b//.'));
      }
    },
    {
      name: 'relative',
      test: function(){
        tests = [
          ['/var/lib', '/var', '..'],
          ['/var/lib', '/bin', '../../bin'],
          ['/var/lib', '/var/lib', ''],
          ['/var/lib', '/var/apache', '../apache'],
          ['/var/', '/var/lib', 'lib'],
          ['/', '/var/lib', 'var/lib']
        ];

        for (var i = 0, test; test = tests[i]; i++)
          this.is(test[2], basis.path.relative(test[0], test[1]));
      }
    },
    {
      name: 'resolve',
      test: function(){
        var tests = [
          [['/var/lib', '../', 'file/'], '/var/file'],
          [['/var/lib', '/../', 'file/'], '/file'],
          [['a/b/c/', '../../..'], basis.path.dirname(location.pathname)],
          [['.'], basis.path.dirname(location.pathname)],
          [['/some/dir', '.', '/absolute/'], '/absolute']
        ];

        for (var i = 0, test; test = tests[i]; i++)
          this.is(test[1], basis.path.resolve.apply(null, test[0]));
      }
    }
  ]
};
