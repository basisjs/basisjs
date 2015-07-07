module.exports = {
  name: 'basis.resource',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();
    var baseURI = basis.config.modules.basis.path;
  },

  test: [
    {
      name: 'basis.resource()',
      test: [
        {
          name: 'define',
          test: function(){
            assert(basis.resource('./test.js') === basis.resource('./foo/../test.js'));
          }
        }
      ]
    },
    {
      name: 'basis.resource.resolveURI()',
      test: [
        {
          name: 'w/o baseURI',
          test: function(){
            var localBaseUri = basis.path.normalize(basis.path.baseURI);

            assert(basis.resource.resolveURI('foo/bar') === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('/foo/bar') === '/foo/bar');
            assert(basis.resource.resolveURI('./foo/bar') === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('././foo/bar') === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('../foo/bar') === basis.path.resolve(localBaseUri, '../foo/bar'));
            assert(basis.resource.resolveURI('../foo/../bar') === basis.path.resolve(localBaseUri, '../bar'));
            assert(basis.resource.resolveURI('//foo/../bar') === '/bar');
            assert(basis.resource.resolveURI('./foo:bar') === localBaseUri + '/foo:bar');
            assert(basis.resource.resolveURI('./:foo:bar') === localBaseUri + '/:foo:bar');

            assert(basis.resource.resolveURI('foo/bar', null) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('/foo/bar', null) === '/foo/bar');
            assert(basis.resource.resolveURI('./foo/bar', null) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('././foo/bar', null) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('../foo/bar', null) === basis.path.resolve(localBaseUri, '../foo/bar'));
            assert(basis.resource.resolveURI('../foo/../bar', null) === basis.path.resolve(localBaseUri, '../bar'));
            assert(basis.resource.resolveURI('//foo/../bar', null) === '/bar');
            assert(basis.resource.resolveURI('./foo:bar', null) === localBaseUri + '/foo:bar');
            assert(basis.resource.resolveURI('./:foo:bar', null) === localBaseUri + '/:foo:bar');
          }
        },
        {
          name: 'with baseURI',
          test: function(){
            var localBaseUri = '/baseURI/test';
            assert(basis.resource.resolveURI('foo/bar', localBaseUri) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('/foo/bar', localBaseUri) === '/foo/bar');
            assert(basis.resource.resolveURI('./foo/bar', localBaseUri) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('././foo/bar', localBaseUri) === localBaseUri + '/foo/bar');
            assert(basis.resource.resolveURI('../foo/bar', localBaseUri) === basis.path.resolve(localBaseUri, '..') + '/foo/bar');
            assert(basis.resource.resolveURI('../foo/../bar', localBaseUri) === basis.path.resolve(localBaseUri, '..') + '/bar');
            assert(basis.resource.resolveURI('//foo/../bar', localBaseUri) === '/bar');
            assert(basis.resource.resolveURI('./foo:bar', localBaseUri) === localBaseUri + '/foo:bar');
            assert(basis.resource.resolveURI('./:foo:bar', localBaseUri) === localBaseUri + '/:foo:bar');
          }
        },
        {
          name: 'with root namespace prefix',
          test: function(){
            assert(basis.resource.resolveURI('basis:foo/bar') === baseURI + '/foo/bar');
            assert(basis.resource.resolveURI('basis:/foo/bar') === baseURI + '/foo/bar');
            assert(basis.resource.resolveURI('basis:./foo/bar') === baseURI + '/foo/bar');
            assert(basis.resource.resolveURI('basis:././foo/bar') === baseURI + '/foo/bar');
            assert(basis.resource.resolveURI('basis:../foo/bar') === baseURI + '/foo/bar');
            assert(basis.resource.resolveURI('basis:../foo/../bar') === baseURI + '/bar');
            assert(basis.resource.resolveURI('basis://foo/../bar') === baseURI + '/bar');
            assert(basis.resource.resolveURI('basis:foo:bar') === baseURI + '/foo:bar');
            assert(basis.resource.resolveURI('basis::foo:bar') === baseURI + '/:foo:bar');
            assert(basis.resource.resolveURI('http://example.com/foo/bar') === basis.path.baseURI + 'http/example.com/foo/bar');
          }
        }
      ]
    }
  ]
};
