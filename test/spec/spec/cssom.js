module.exports = {
  name: 'basis.cssom',

  html: __dirname + 'cssom.html',
  init: function(){
    basis.require('basis.dom');
    basis.require('basis.cssom');

    var DOM = basis.dom;
    var createElement = basis.dom.createElement;

    var cssom = basis.cssom;
    var cssRule = basis.cssom.createRule;

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
            var styleSheet = cssom.getStyleSheet('testStyleSheet');
            this.is(false, !!styleSheet);

            styleSheet = cssom.getStyleSheet('testStyleSheet', true);
            this.is(true, !!styleSheet);
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
            this.is(200, pg.clientWidth);
            this.is(200, pg2.clientWidth);

            rule.clear();
          }
        },
        {
          name: 'setProperty',
          test: function(){
            var rule = cssRule('#playground');
            rule.setStyle({ width: '200px' });
            this.is(200, pg.clientWidth);
            rule.setStyle({ width: '300px !important' });
            this.is(300, pg.clientWidth);
            rule.setStyle({ width: '200px !important' });
            this.is(200, pg.clientWidth);
            rule.setStyle({ width: '100px' });
            this.is(100, pg.clientWidth);
            rule.setStyle({ width: '150px', height: '100px !important' });
            this.is(150, pg.clientWidth);
            this.is(100, pg.clientHeight);
            rule.setStyle({ width: '200px !important', height: '200px !important' });
            this.is(200, pg.clientWidth);
            this.is(200, pg.clientHeight);

            rule = cssRule('#playground2');
            rule.setStyle({ width: '300px !important' });
            this.is(300, pg2.clientWidth);
          }
        },
        {
          name: 'clear #1',
          test: function(){
            var el = document.body.appendChild(createElement('.test_clear1[style="padding:0 !important;border:none !important"]'));

            var rule = cssRule('.test_clear1');

            rule.setStyle({ width: '200px', height: '200px' });
            this.is(200, el.offsetWidth);
            this.is(200, el.offsetHeight);

            rule.clear();
            this.is(true, el.offsetWidth != 200);
            this.is(true, el.offsetHeight != 200);

          }
        },
        {
          name: 'clear #2',
          test: function(){
            var el = document.body.appendChild(createElement('.test_clear2[style="padding:0 !important;border:none !important"]'));

            rule = cssRule('.test_clear2');

            rule.setStyle({ height: '100px !important' });
            this.is(100, el.offsetHeight);

            rule.clear();
            this.is(0, el.offsetHeight);
          }
        }
      ]
    }
  ]
};
