module.exports = {
  name: 'basis.layout',

  html: __dirname + 'layout.html',
  init: function(){
    var getBoundingRect = basis.require('basis.layout').getBoundingRect;
    var getViewportRect = basis.require('basis.layout').getViewportRect;
    var computedStyle = basis.require('basis.dom.computedStyle').get;

    function $(id){
      return document.getElementById(id);
    }
  },

  test: [
    {
      name: 'Zero scroll',
      test: [
        {
          name: 'Reset scroll offset',
          test: function(){
            var container = $('test2_container');

            document.documentElement.scrollTop = 0;
            document.documentElement.scrollLeft = 0;
            document.body.scrollTop = 0;
            document.body.scrollLeft = 0;
            container.scrollTop = 0;
            container.scrollLeft = 0;

            assert(document.documentElement.scrollTop === 0);
            assert(document.documentElement.scrollLeft === 0);
            assert(document.body.scrollTop === 0);
            assert(document.body.scrollLeft === 0);
            assert(container.scrollLeft === 0);
            assert(container.scrollLeft === 0);
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15);
            assert(box.left === 15);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5);
            assert(box.left === 215 + 15 + 3 + 5);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15);
            assert(box.left === 15);
          }
        },
        {
          name: 'Rel box',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el, $('test1'));

            assert(box.top === (50 + 15 + 3 + 5) - 15);
            assert(box.left === (215 + 15 + 3 + 5) - 15);
          }
        }
      ]
    },
    {
      name: 'Zero scroll + relative documentElement',
      test: [
        {
          name: 'Set documentElement position relative',
          test: function(){
            document.documentElement.style.position = 'relative';
            assert(computedStyle(document.documentElement, 'position') === 'relative');
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 7 + 3);
            assert(box.left === 15 + 7 + 5);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5 + 7 + 3);
            assert(box.left === 215 + 15 + 3 + 5 + 7 + 5);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15);
            assert(box.left === 15);
          }
        },
        {
          name: 'Set documentElement position static',
          test: function(){
            document.documentElement.style.position = 'static';
            assert(computedStyle(document.documentElement, 'position') === 'static');
          }
        }
      ]
    },
    {
      name: 'Zero scroll + relative body',
      test: [
        {
          name: 'Set body position relative',
          test: function(){
            document.body.style.position = 'relative';
            assert(computedStyle(document.body, 'position') === 'relative');
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 11 + 9 + 7);
            assert(box.left === 15 + /*html*/15 + /*body*/11 + 9);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5 + (11 + 9 + 7));
            assert(box.left === 215 + 15 + 3 + 5 + (15 + 11 + 9));
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15);
            assert(box.left === 15);
          }
        },
        {
          name: 'Set body position static',
          test: function(){
            document.body.style.position = 'static';
            assert(computedStyle(document.body, 'position') === 'static');
          }
        }
      ]
    },
    {
      name: 'Root scroll',
      test: [
        {
          name: 'Set scroll offset 23x23',
          test: function(){
            document.documentElement.scrollTop = 23;
            document.documentElement.scrollLeft = 23;
            document.body.scrollTop = 23;
            document.body.scrollLeft = 23;

            assert((document.documentElement.scrollTop || document.body.scrollTop) === 23);
            assert((document.documentElement.scrollLeft || document.body.scrollLeft) === 23);
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15);
            assert(box.left === 15);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5);
            assert(box.left === 215 + 15 + 3 + 5);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 23);
            assert(box.left === 15 + 23);
          }
        },
        {
          name: 'Test #4',
          test: function(){
            var el = $('test3');
            var viewport = getViewportRect(el);

            assert(viewport.top === 23 + 15);
            assert(viewport.bottom === 23 + 15 + 10);
            assert(viewport.left === 23 + 15);
            assert(viewport.right === 23 + 15 + 10);
            assert(viewport.width === 10);
            assert(viewport.height === 10);
          }
        }
      ]
    },
    {
      name: 'Root scroll + relative documentElement',
      test: [
        {
          name: 'Set documentElement position relative',
          test: function(){
            document.documentElement.style.position = 'relative';
            assert(computedStyle(document.documentElement, 'position') === 'relative');
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 7 + 3);
            assert(box.left === 15 + 7 + 5);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5 + 7 + 3);
            assert(box.left === 215 + 15 + 3 + 5 + 7 + 5);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 23);
            assert(box.left === 15 + 23);
          }
        },
        {
          name: 'Set documentElement position static',
          test: function(){
            document.documentElement.style.position = 'static';
            assert(computedStyle(document.documentElement, 'position') === 'static');
          }
        }
      ]
    },
    {
      name: 'Root scroll + relative body',
      test: [
        {
          name: 'Set body position relative',
          test: function(){
            document.body.style.position = 'relative';
            assert(computedStyle(document.body, 'position') === 'relative');
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 11 + 9 + 7);
            assert(box.left === 15 + /*html*/15 + /*body*/11 + 9);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5 + (11 + 9 + 7));
            assert(box.left === 215 + 15 + 3 + 5 + (15 + 11 + 9));
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = getBoundingRect(el);

            assert(box.top === 15 + 23);
            assert(box.left === 15 + 23);
          }
        },
        {
          name: 'Set body position static',
          test: function(){
            document.body.style.position = 'static';
            assert(computedStyle(document.body, 'position') === 'static');
          }
        }
      ]
    },
    {
      name: 'Root scroll + container scroll',
      test: [
        {
          name: 'Set container scroll offset 11x11',
          test: function(){
            var container = $('test2_container');
            container.scrollTop = 11;
            container.scrollLeft = 11;

            assert(container.scrollTop === 11);
            assert(container.scrollLeft === 11);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = getBoundingRect(el);

            assert(box.top === 50 + 15 + 3 + 5 - 11);
            assert(box.left === 215 + 15 + 3 + 5 - 11);
          }
        }
      ]
    }
  ]
};
