
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.cssom');
  basis.require('basis.format.highlight');

  document.write('<style type="text/css">@import "../demo.css";</style>');
  
  basis.ready(function(){

    var dom = basis.dom;
    var event = basis.dom.event;
    var cssom = basis.cssom;
    var classList = basis.cssom.classList;

    var highlight = Function.runOnce(function(){
      dom.get('javascript').innerHTML = basis.format.highlight.highlight(dom.get('javascript').innerHTML, 'js');
      dom.get('css').innerHTML = basis.format.highlight.highlight(dom.get('css').innerHTML, 'css');
    });

    var pages = [
      {
        title: 'Demo',
        element: dom.createElement('#Demo-MainPage', dom.get('demo-summary'), dom.get('demo-container'))
      },
      {
        title: 'Description',
        element: dom.createElement('#Demo-DescriptionPage', dom.get('demo-description'))
      },
      {
        title: 'Source',
        element: dom.createElement('#Demo-SourcePage',
          dom.createElement('H2', 'CSS'),
          dom.createElement('PRE#css.Basis-SyntaxHighlight', dom.get('demo-css').innerHTML),
          dom.createElement('H2', 'Javascript'),
          dom.createElement('PRE#javascript.Basis-SyntaxHighlight', dom.get('demo-javascript').innerHTML)
        )
      }
    ];
    var tabs = dom.createElement('#DemoTabs', dom.wrap(pages, { '.DemoWrapper-Tab': Function.$true }, 'title'));
    classList(tabs.firstChild).add('selected');

    event.addHandler(tabs, 'click', function(e){
      var sender = event.sender(e);
      var classListSender = classList(sender);
      if (classListSender.contains('DemoWrapper-Tab'))
      {
        dom.axis(tabs, dom.AXIS_CHILD).forEach(function(tab, idx){
          classList(tab).bool('selected', tab == sender);
          cssom.display(pages[idx].element, tab == sender);
        });
        if (!sender.nextSibling)
          highlight();
      }
    });
    
    pages.forEach(function(page, idx){ cssom.display(page.element, !idx); });

    dom.insert(
      document.body,
      dom.createElement('A#backLink[href="../index.html"]', 'Back to demos'),
      dom.INSERT_BEGIN
    );

    dom.insert(document.body, [
      dom.createElement('#DemoWrapper',
        tabs,
        dom.wrap(pages, { '.DemoWrapper-Page': Function.$true }, 'element')
      ),
      dom.createElement('#DemoCopy', dom.createElement('P', 'basis.js \xA9 2006-2012, ', dom.createElement('A[href="http://code.google.com/p/basis-js"][target="_blank"]', 'Project page')))
    ]);

    classList(document.body).add('show');

    /*if (/google/.test(location.host))
      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
       (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ga);
      })();*/
  });

  /*var _gaq = _gaq || [];
  _gaq.push(
    ['siteTracker._setAccount', 'UA-18071-1'],
    ['siteTracker._trackPageview']
  );
 
  _gaq.push(
    ['projectTracker._setAccount', 'UA-16275563-1'],
    ['projectTracker._trackPageview']
  );*/