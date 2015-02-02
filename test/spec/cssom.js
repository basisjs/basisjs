module.exports = {
  name: 'basis.cssom',

  html: __dirname + 'cssom.html',
  init: function(){
    var DOM = basis.require('basis.dom');
    var createElement = DOM.createElement;

    var cssom = basis.require('basis.cssom');
    var cssRule = cssom.createRule;

    var pg = DOM.get('playground');
    var pg2 = DOM.get('playground2');
  },

  test: [
    {
      name: 'CssStyleSheet',
      test: [
        {
          name: 'getStyleSheet',
          test: function(){
            assert(cssom.getStyleSheet('testStyleSheet') === undefined);
            assert(cssom.getStyleSheet('testStyleSheet', true) !== undefined);
          }
        }
      ]
    },
    {
      name: 'CssRule',
      test: [
        {
          name: 'create',
          test: function(){
            var rule = cssRule('#playground, #playground2');

            rule.setStyle({ width: '200px !important' });
            assert(pg.clientWidth === 200);
            assert(pg2.clientWidth === 200);

            rule.clear();
          }
        },
        {
          name: 'setProperty',
          test: function(){
            var rule = cssRule('#playground');

            rule.setStyle({ width: '200px' });
            assert(pg.clientWidth === 200);
            rule.setStyle({ width: '300px !important' });
            assert(pg.clientWidth === 300);
            rule.setStyle({ width: '200px !important' });
            assert(pg.clientWidth === 200);
            rule.setStyle({ width: '100px' });
            assert(pg.clientWidth === 100);
            rule.setStyle({ width: '150px', height: '100px !important' });
            assert(pg.clientWidth === 150);
            assert(pg.clientHeight === 100);
            rule.setStyle({ width: '200px !important', height: '200px !important' });
            assert(pg.clientWidth === 200);
            assert(pg.clientHeight === 200);

            rule = cssRule('#playground2');
            rule.setStyle({ width: '300px !important' });
            assert(pg2.clientWidth === 300);
          }
        },
        {
          name: 'clear #1',
          test: function(){
            var el = document.body.appendChild(createElement('.test_clear1[style="padding:0 !important;border:none !important"]'));
            var rule = cssRule('.test_clear1');

            rule.setStyle({ width: '200px', height: '200px' });
            assert(el.offsetWidth === 200);
            assert(el.offsetHeight === 200);

            rule.clear();
            assert(el.offsetWidth !== 200);
            assert(el.offsetHeight !== 200);
          }
        },
        {
          name: 'clear #2',
          test: function(){
            var el = document.body.appendChild(createElement('.test_clear2[style="padding:0 !important;border:none !important"]'));
            var rule = cssRule('.test_clear2');

            rule.setStyle({ height: '100px !important' });
            assert(el.offsetHeight === 100);

            rule.clear();
            assert(el.offsetHeight === 0);
          }
        }
      ]
    }
  ]
};
