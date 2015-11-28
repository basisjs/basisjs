module.exports = {
  name: 'basis.tracker',

  init: function(){
    basis = window.basis.createSandbox();

    var isPathMatchSelector = basis.require('basis.tracker').isPathMatchSelector;
  },
  test: [
    {
      name: 'isPathMatchSelector',
      test: [
        {
          name: 'simple cases - role match',
          test: function(){
            var match = [
              {
                path: [],
                selector: []
              },
              {
                path: ['a'],
                selector: []
              },
              {
                path: ['a'],
                selector: ['a']
              },
              {
                path: ['a', 'b'],
                selector: ['b']
              },
              {
                path: ['a', 'b'],
                selector: ['a', 'b']
              },
              {
                path: ['a', 'b', 'c'],
                selector: ['a', 'c']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['b', 'd']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['a', 'b', 'd']
              }
            ];

            for (var i = 0, test; test = match[i]; i++)
              assert(isPathMatchSelector(test.path, test.selector) === true);
          }
        },
        {
          name: 'simple cases - non-match',
          test: function(){
            var nonmatch = [
              {
                path: [],
                selector: ['a']
              },
              {
                path: ['a', 'b'],
                selector: ['a']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['a', 'c']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['x', 'a', 'b', 'd']
              },
              {
                path: ['a', 'b', 'c', 'd'],
                selector: ['x', 'a', 'b', 'd']
              }
            ];

            for (var i = 0, test; test = nonmatch[i]; i++)
              assert(isPathMatchSelector(test.path, test.selector) === false);
          }
        }
      ]
    }
  ]
};
