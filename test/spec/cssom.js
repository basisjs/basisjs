module.exports = {
  name: 'basis.cssom',

  html: __dirname + '/cssom.html',
  init: function(){
    var DOM = basis.require('basis.dom');
    var createElement = DOM.createElement;

    var cssom = basis.require('basis.cssom');
    var cssRule = cssom.createRule;

    var pg = DOM.get('playground');
    var pg2 = DOM.get('playground2');

    function createBlock(){
      var id = '#' + basis.genUID();
      var element = document.body.appendChild(createElement(id));

      return {
        id: id,
        element: element
      };
    }
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
            var foo = createBlock();
            var bar = createBlock();
            var rule = cssRule([foo.id, bar.id]);

            rule.setStyle({ width: '200px !important' });
            assert(foo.element.clientWidth === 200);
            assert(bar.element.clientWidth === 200);

            rule.clear();
          }
        },
        {
          name: 'setProperty',
          test: function(){
            var block = createBlock();
            var rule = cssRule(block.id);

            rule.setStyle({ width: '200px' });
            assert(block.element.clientWidth === 200);
            rule.setStyle({ width: '300px !important' });
            assert(block.element.clientWidth === 300);
            rule.setStyle({ width: '200px !important' });
            assert(block.element.clientWidth === 200);
            rule.setStyle({ width: '100px' });
            assert(block.element.clientWidth === 100);
            rule.setStyle({ width: '150px', height: '100px !important' });
            assert(block.element.clientWidth === 150);
            assert(block.element.clientHeight === 100);
            rule.setStyle({ width: '200px !important', height: '200px !important' });
            assert(block.element.clientWidth === 200);
            assert(block.element.clientHeight === 200);

            rule = cssRule(block.id);
            rule.setStyle({ width: '300px !important' });
            assert(block.element.clientWidth === 300);
          }
        },
        {
          name: 'setProperty',
          test: function(){
            var block = createBlock();
            var rule = cssRule(block.id);

            rule.setStyle({ width: '0px' });

            rule.setStyle({ 'padding-left': '200px' });
            assert(block.element.offsetWidth === 200);
            rule.setStyle({ 'padding-left': '300px !important' });
            assert(block.element.offsetWidth === 300);
            rule.setStyle({ 'padding-left': '200px !important' });
            assert(block.element.offsetWidth === 200);
            rule.setStyle({ 'padding-left': '100px' });
            assert(block.element.offsetWidth === 100);
            rule.setStyle({ 'padding-left': '150px', height: '100px !important' });
            assert(block.element.offsetWidth === 150);
            assert(block.element.clientHeight === 100);
            rule.setStyle({ 'padding-left': '200px !important', height: '200px !important' });
            assert(block.element.offsetWidth === 200);
            assert(block.element.clientHeight === 200);

            rule = cssRule(block.id);
            rule.setStyle({ 'padding-left': '300px !important', height: '300px !important' });
            assert(block.element.offsetWidth === 300);
            assert(block.element.offsetHeight === 300);
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
