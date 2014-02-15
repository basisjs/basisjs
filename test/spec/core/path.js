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

        this.is('/', basis.path.dirname('c:'));
        this.is('/', basis.path.dirname('c:/asd'));
        this.is('/', basis.path.dirname('c:/asd/'));
        this.is('/asd', basis.path.dirname('c:/asd/asd'));
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
        this.is('', basis.path.normalize(''));
        this.is('', basis.path.normalize('.'));
        this.is('/', basis.path.normalize('/'));

        this.is('/foo/bar/baz/asdf', basis.path.normalize('/foo/bar//baz/asdf/quux/..'));
        this.is('fixtures/b/c.js', basis.path.normalize('./fixtures///b/../b/c.js'));
        this.is('/bar', basis.path.normalize('/foo/../../../bar'));
        this.is('/bar/baz', basis.path.normalize('/foo/../../../bar/baz'));
        this.is('/bar', basis.path.normalize('/../../../bar'));
        this.is('/', basis.path.normalize('/../../../'));
        this.is('/', basis.path.normalize('/foo/../../../'));
        this.is('bar', basis.path.normalize('foo/../../../bar'));
        this.is('', basis.path.normalize('foo/../../../'));
        this.is('bar/baz', basis.path.normalize('foo/../../../bar/baz'));
        this.is('/bar', basis.path.normalize('/foo/../../../bar/'));
        this.is('/bar/baz', basis.path.normalize('/foo/../../../bar/baz/'));
        this.is('bar', basis.path.normalize('foo/../../../bar'));
        this.is('bar/baz', basis.path.normalize('foo/../../../bar/baz/'));
        this.is('a/b', basis.path.normalize('a//b//../b'));
        this.is('a/b/c', basis.path.normalize('a//b//./c'));
        this.is('a/b', basis.path.normalize('a//b//.'));
        this.is('a/b', basis.path.normalize('a/b/'));

        this.is('/', basis.path.normalize('http://'));
        this.is('/', basis.path.normalize('http:'));

        this.is('/', basis.path.normalize('http://localhost'));
        this.is('/asd', basis.path.normalize('http://localhost/asd'));
        this.is('/asd', basis.path.normalize('http://localhost/asd/'));
        this.is('/', basis.path.normalize('http://localhost/asd/../..'));
        this.is('/foo', basis.path.normalize('http://localhost/asd//../../../foo'));
        this.is('/asd/asd', basis.path.normalize('http://localhost/asd/asd'));

        this.is('/', basis.path.normalize('http://user@localhost:8080'));
        this.is('/asd', basis.path.normalize('http://user@localhost:8080/asd'));
        this.is('/asd', basis.path.normalize('http://user@localhost:8080/asd/'));
        this.is('/', basis.path.normalize('http://user@localhost:8080/asd/../../'));
        this.is('/foo', basis.path.normalize('http://user@localhost:8080/asd//../../../foo'));
        this.is('/asd/asd', basis.path.normalize('http://user@localhost:8080/asd/asd'));

        this.is('/', basis.path.normalize('c:'));
        this.is('/asd', basis.path.normalize('c:/asd'));
        this.is('/asd', basis.path.normalize('c:/asd/'));
        this.is('/', basis.path.normalize('c:/asd/../..'));
        this.is('/foo', basis.path.normalize('c:/asd//../../foo'));
        this.is('/asd/asd', basis.path.normalize('c:/asd/asd'));
      }
    },
    {
      name: 'relative',
      test: function(){
        assert(basis.path.relative('foo', 'foo') == '');
        assert(basis.path.relative('foo/bar', 'foo/bar') == '');
        assert(basis.path.relative('', '') == '');
        assert(basis.path.relative('/', '/') == '');
        assert(basis.path.relative('.', '.') == '');
        assert(basis.path.relative('./', '.') == '');
        assert(basis.path.relative('.', './') == '');

        assert(basis.path.relative('/var/lib', '/var') == '..');
        assert(basis.path.relative('/var/lib', '/bin') == '../../bin');
        assert(basis.path.relative('/var/lib', '/var/lib') == '');
        assert(basis.path.relative('/var/lib', '/var/apache') == '../apache');
        assert(basis.path.relative('/var/', '/var/lib') == 'lib');
        assert(basis.path.relative('/', '/var/lib') == 'var/lib');
        assert(basis.path.relative('/var/foo', '/') == '../..');
        assert(basis.path.relative('/foo', '/var') == '../var');

        assert(basis.path.relative('foo/bar', '/foo/lib') == '/foo/lib');
        assert(basis.path.relative('/foo/bar', 'foo/lib') == '/foo/bar');
        assert(basis.path.relative('foo/bar', '/') == '/');
        assert(basis.path.relative('/', 'foo/lib') == '/');

        assert(basis.path.relative('foo/bar', 'foo/lib') == '../lib');
        assert(basis.path.relative('foo/bar', 'for/lib') == '../../for/lib');
        assert(basis.path.relative('foo/bar', 'bar/lib') == '../../bar/lib');
        assert(basis.path.relative('foo/bar', 'foo/bar/baz') == 'baz');
        assert(basis.path.relative('foo/bar', 'foo') == '..');

        assert(basis.path.relative('..', 'bar') == '../bar');
        assert(basis.path.relative('bar', '..') == '..');
      }
    },
    {
      name: 'resolve',
      test: function(){
        assert(basis.path.resolve('/var/lib', '../', 'file/') == '/var/file');
        assert(basis.path.resolve('/var/lib', '/../', 'file/') == '/file');
        assert(basis.path.resolve('a/b/c/', '../../..') == basis.path.baseURI.replace(/\/$/, ''));
        assert(basis.path.resolve('.') == basis.path.baseURI.replace(/\/$/, ''));
        assert(basis.path.resolve('/some/dir', '.', '/absolute/') == '/absolute');
      }
    }
  ]
};
