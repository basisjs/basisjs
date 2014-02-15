module.exports = {
  name: 'basis.layout',

  html: __dirname + 'layout.html',
  init: function(){
    basis.require('basis.layout');

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

            this.is(0, document.documentElement.scrollTop);
            this.is(0, document.documentElement.scrollLeft);
            this.is(0, document.body.scrollTop);
            this.is(0, document.body.scrollLeft);
            this.is(0, container.scrollLeft);
            this.is(0, container.scrollLeft);
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15, box.top);
            this.is(15, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5, box.top);
            this.is(215 + 15 + 3 + 5, box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15, box.top);
            this.is(15, box.left);
          }
        },
        {
          name: 'Rel box',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el, $('test1'));

            this.is((50 + 15 + 3 + 5) - 15, box.top);
            this.is((215 + 15 + 3 + 5) - 15, box.left);
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
            this.is('relative', computedStyle(document.documentElement, 'position'));
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 7 + 3, box.top);
            this.is(15 + 7 + 5, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5 + 7 + 3, box.top);
            this.is(215 + 15 + 3 + 5 + 7 + 5, box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15, box.top);
            this.is(15, box.left);
          }
        },
        {
          name: 'Set documentElement position static',
          test: function(){
            document.documentElement.style.position = 'static';
            this.is('static', computedStyle(document.documentElement, 'position'));
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
            this.is('relative', computedStyle(document.body, 'position'));
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 11 + 9 + 7, box.top);
            this.is(15 + /*html*/15 + /*body*/11 + 9, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5 + (11 + 9 + 7), box.top);
            this.is(215 + 15 + 3 + 5 + (15 + 11 + 9), box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15, box.top);
            this.is(15, box.left);
          }
        },
        {
          name: 'Set body position static',
          test: function(){
            document.body.style.position = 'static';
            this.is('static', computedStyle(document.body, 'position'));
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

            this.is(23, document.documentElement.scrollTop || document.body.scrollTop);
            this.is(23, document.documentElement.scrollLeft || document.body.scrollLeft);
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15, box.top);
            this.is(15, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5, box.top);
            this.is(215 + 15 + 3 + 5, box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 23, box.top);
            this.is(15 + 23, box.left);
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
            this.is('relative', computedStyle(document.documentElement, 'position'));
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 7 + 3, box.top);
            this.is(15 + 7 + 5, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5 + 7 + 3, box.top);
            this.is(215 + 15 + 3 + 5 + 7 + 5, box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 23, box.top);
            this.is(15 + 23, box.left);
          }
        },
        {
          name: 'Set documentElement position static',
          test: function(){
            document.documentElement.style.position = 'static';
            this.is('static', computedStyle(document.documentElement, 'position'));
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
            this.is('relative', computedStyle(document.body, 'position'));
          }
        },
        {
          name: 'Test #1',
          test: function(){
            var el = $('test1');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 11 + 9 + 7, box.top);
            this.is(15 + /*html*/15 + /*body*/11 + 9, box.left);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5 + (11 + 9 + 7), box.top);
            this.is(215 + 15 + 3 + 5 + (15 + 11 + 9), box.left);
          }
        },
        {
          name: 'Test #3',
          test: function(){
            var el = $('test3');
            var box = basis.layout.getBoundingRect(el);

            this.is(15 + 23, box.top);
            this.is(15 + 23, box.left);
          }
        },
        {
          name: 'Set body position static',
          test: function(){
            document.body.style.position = 'static';
            this.is('static', computedStyle(document.body, 'position'));
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

            this.is(11, container.scrollTop);
            this.is(11, container.scrollLeft);
          }
        },
        {
          name: 'Test #2',
          test: function(){
            var el = $('test2');
            var box = basis.layout.getBoundingRect(el);

            this.is(50 + 15 + 3 + 5 - 11, box.top);
            this.is(215 + 15 + 3 + 5 - 11, box.left);
          }
        }
      ]
    }
  ]
};
