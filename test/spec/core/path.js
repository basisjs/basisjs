module.exports = {
  name: 'basis.path',

  // some test imported from node.js test suite
  // url: https://github.com/joyent/node/blob/master/test/simple/test-path.js
  test: [
    {
      name: 'basename',
      test: function(){
        assert(basis.path.basename('some/path/test-path.js') == 'test-path.js');
        assert(basis.path.basename('some/path/test-path.js', '.js') == 'test-path');
        assert(basis.path.basename('some/path/test-path.js', '.foo') == 'test-path.js');
        assert(basis.path.basename('') == '');
        assert(basis.path.basename('/dir/basename.ext') == 'basename.ext');
        assert(basis.path.basename('/basename.ext') == 'basename.ext');
        assert(basis.path.basename('basename.ext') == 'basename.ext');
        assert(basis.path.basename('basename.ext/') == 'basename.ext');
        assert(basis.path.basename('basename.ext//') == 'basename.ext');
      }
    },
    {
      name: 'dirname',
      test: function(){
        assert(basis.path.dirname('/a/b/') == '/a');
        assert(basis.path.dirname('/a/b') == '/a');
        assert(basis.path.dirname('/a') == '/');
        assert(basis.path.dirname('a/b/') == 'a');
        assert(basis.path.dirname('a/b') == 'a');
        assert(basis.path.dirname('a') == '.');
        assert(basis.path.dirname('') == '.');
        assert(basis.path.dirname('/') == '/');
        assert(basis.path.dirname('////') == '/');
        assert(basis.path.dirname('/a/b/..') == '/');
        assert(basis.path.dirname('/a/b/../') == '/');
        assert(basis.path.dirname('/a/../b') == '/');
        assert(basis.path.dirname('/a/../b/') == '/');
        assert(basis.path.dirname('/../a/b') == '/a');
        assert(basis.path.dirname('/../a/b/') == '/a');
        assert(basis.path.dirname('a/b/..') == '.');
        assert(basis.path.dirname('a/b/../') == '.');
        assert(basis.path.dirname('a/../b') == '.');
        assert(basis.path.dirname('a/../b/') == '.');
        assert(basis.path.dirname('../a/b') == 'a');
        assert(basis.path.dirname('../a/b/') == 'a');

        assert(basis.path.dirname('c:') == '/');
        assert(basis.path.dirname('c:/asd') == '/');
        assert(basis.path.dirname('c:/asd/') == '/');
        assert(basis.path.dirname('c:/asd/asd') == '/asd');
      }
    },
    {
      name: 'extname',
      test: function(){
        assert(basis.path.extname('') == '');
        assert(basis.path.extname('/path/to/file') == '');
        assert(basis.path.extname('/path/to/file.ext') == '.ext');
        assert(basis.path.extname('/path.to/file.ext') == '.ext');
        assert(basis.path.extname('/path.to/file') == '');
        assert(basis.path.extname('/path.to/.file') == '');
        assert(basis.path.extname('/path.to/.file.ext') == '.ext');
        assert(basis.path.extname('/path/to/f.ext') == '.ext');
        assert(basis.path.extname('/path/to/..ext') == '.ext');
        assert(basis.path.extname('file') == '');
        assert(basis.path.extname('file.ext') == '.ext');
        assert(basis.path.extname('.file') == '');
        assert(basis.path.extname('.file.ext') == '.ext');
        assert(basis.path.extname('/file') == '');
        assert(basis.path.extname('/file.ext') == '.ext');
        assert(basis.path.extname('/.file') == '');
        assert(basis.path.extname('/.file.ext') == '.ext');
        assert(basis.path.extname('.path/file.ext') == '.ext');
        assert(basis.path.extname('file.ext.ext') == '.ext');
        assert(basis.path.extname('file.') == '.');
        assert(basis.path.extname('.') == '');
        assert(basis.path.extname('./') == '');
        assert(basis.path.extname('.file.ext') == '.ext');
        assert(basis.path.extname('.file') == '');
        assert(basis.path.extname('.file.') == '.');
        assert(basis.path.extname('.file..') == '.');
        assert(basis.path.extname('..') == '');
        assert(basis.path.extname('../') == '');
        assert(basis.path.extname('..file.ext') == '.ext');
        assert(basis.path.extname('..file') == '.file');
        assert(basis.path.extname('..file.') == '.');
        assert(basis.path.extname('..file..') == '.');
        assert(basis.path.extname('...') == '.');
        assert(basis.path.extname('...ext') == '.ext');
        assert(basis.path.extname('....') == '.');
        assert(basis.path.extname('file.ext/') == '.ext');
        assert(basis.path.extname('file.ext//') == '.ext');
        assert(basis.path.extname('file/') == '');
        assert(basis.path.extname('file//') == '');
        assert(basis.path.extname('file./') == '.');
        assert(basis.path.extname('file.//') == '.');

        assert(basis.path.extname('.\\') == '');
        assert(basis.path.extname('..\\') == '.\\');
        assert(basis.path.extname('file.ext\\') == '.ext\\');
        assert(basis.path.extname('file.ext\\\\') == '.ext\\\\');
        assert(basis.path.extname('file\\') == '');
        assert(basis.path.extname('file\\\\') == '');
        assert(basis.path.extname('file.\\') == '.\\');
        assert(basis.path.extname('file.\\\\') == '.\\\\');
      }
    },
    {
      name: 'normalize',
      test: function(){
        assert(basis.path.normalize('') == '');
        assert(basis.path.normalize('.') == '');
        assert(basis.path.normalize('/') == '/');

        assert(basis.path.normalize('/foo/bar//baz/asdf/quux/..') == '/foo/bar/baz/asdf');
        assert(basis.path.normalize('./fixtures///b/../b/c.js') == 'fixtures/b/c.js');
        assert(basis.path.normalize('/foo/../../../bar') == '/bar');
        assert(basis.path.normalize('/foo/../../../bar/baz') == '/bar/baz');
        assert(basis.path.normalize('/../../../bar') == '/bar');
        assert(basis.path.normalize('/../../../') == '/');
        assert(basis.path.normalize('/foo/../../../') == '/');
        assert(basis.path.normalize('foo/../../../bar') == 'bar');
        assert(basis.path.normalize('foo/../../../') == '');
        assert(basis.path.normalize('foo/../../../bar/baz') == 'bar/baz');
        assert(basis.path.normalize('/foo/../../../bar/') == '/bar');
        assert(basis.path.normalize('/foo/../../../bar/baz/') == '/bar/baz');
        assert(basis.path.normalize('foo/../../../bar') == 'bar');
        assert(basis.path.normalize('foo/../../../bar/baz/') == 'bar/baz');
        assert(basis.path.normalize('a//b//../b') == 'a/b');
        assert(basis.path.normalize('a//b//./c') == 'a/b/c');
        assert(basis.path.normalize('a//b//.') == 'a/b');
        assert(basis.path.normalize('a/b/') == 'a/b');

        assert(basis.path.normalize('http://') == '/');
        assert(basis.path.normalize('http:') == '/');

        assert(basis.path.normalize('http://localhost') == '/');
        assert(basis.path.normalize('http://localhost/asd') == '/asd');
        assert(basis.path.normalize('http://localhost/asd/') == '/asd');
        assert(basis.path.normalize('http://localhost/asd/../..') == '/');
        assert(basis.path.normalize('http://localhost/asd//../../../foo') == '/foo');
        assert(basis.path.normalize('http://localhost/asd/asd') == '/asd/asd');

        assert(basis.path.normalize('http://user@localhost:8080') == '/');
        assert(basis.path.normalize('http://user@localhost:8080/asd') == '/asd');
        assert(basis.path.normalize('http://user@localhost:8080/asd/') == '/asd');
        assert(basis.path.normalize('http://user@localhost:8080/asd/../../') == '/');
        assert(basis.path.normalize('http://user@localhost:8080/asd//../../../foo') == '/foo');
        assert(basis.path.normalize('http://user@localhost:8080/asd/asd') == '/asd/asd');

        assert(basis.path.normalize('c:') == '/');
        assert(basis.path.normalize('c:/asd') == '/asd');
        assert(basis.path.normalize('c:/asd/') == '/asd');
        assert(basis.path.normalize('c:/asd/../..') == '/');
        assert(basis.path.normalize('c:/asd//../../foo') == '/foo');
        assert(basis.path.normalize('c:/asd/asd') == '/asd/asd');
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
        assert(basis.path.resolve('/', 'dir/file.ext') == '/dir/file.ext');
      }
    }
  ]
};
