
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.cssom');
  basis.require('basis.format.highlight');

  window.DemoLocale = {
    TABS: {
      DEMO: 'Demo',
      DESCRIPTION: 'Description',
      SOURCE: 'Source code'
    }
  };

  document.write('<style type="text/css">@import "../demo.css";</style>');
  //document.write('<script type="text/javascript" src="../../plugins/highlight.js"></sc'+'ript>');
  
  basis.dom.event.onLoad(function(){

    var DOM = basis.dom;
    var Event = basis.dom.event;
    var Data = basis.data;
    var classList = basis.cssom.classList;

    var highlight = Function.runOnce(function(){
      DOM.get('javascript').innerHTML = basis.format.highlight.highlight(DOM.get('javascript').innerHTML, 'js');
      DOM.get('css').innerHTML = basis.format.highlight.highlight(DOM.get('css').innerHTML, 'css');
      //SyntaxHighlighter.highlight({}, DOM.get('css'));
    });

    var cssSource, jsSource;
    var pages = [
      {
        title: DemoLocale.TABS.DEMO,
        element: DOM.createElement('#Demo-MainPage', DOM.get('demo-summary'), DOM.get('demo-container'))
      },
      {
        title: DemoLocale.TABS.DESCRIPTION,
        element: DOM.createElement('#Demo-DescriptionPage', DOM.get('demo-description'))
      },
      {
        title: DemoLocale.TABS.SOURCE,
        element: DOM.createElement('#Demo-SourcePage',
          /*DOM.createElement('H2', 'Included resources'),
          DOM.createElement('UL',
            DOM.wrap(
              DOM
                .tag('SCRIPT')
                .map(Function.getter('getAttribute("src")'))
                .filter(String.isNotEmpty)
                .filter(function(value){ return !/third_party/.test(value) && !/demo\.js/.test(value) })
                .map(function(value){ return DOM.createElement('A[href={0}]'.format(value.quote()), value.replace(/^([\.]+\/)+/, '')) }),
              { 'LI': Function.$true }
            )
          ),*/
          DOM.createElement('H2', 'CSS'),
          cssSource = DOM.createElement('PRE#css.Basis-SyntaxHighlight', DOM.get('demo-css').innerHTML),
          DOM.createElement('H2', 'Javascript'),
          jsSource = DOM.createElement('PRE#javascript.Basis-SyntaxHighlight', DOM.get('demo-javascript').innerHTML)
        )
      }
    ];
    var tabs = DOM.createElement('#DemoTabs', DOM.wrap(pages, { '.DemoWrapper-Tab': Function.$true }, 'title'));
    classList(tabs.firstChild).add('selected');

    Event.addHandler(tabs, 'click', function(event){
      var sender = Event.sender(event);
      var classListSender = classList(sender);
      if (classListSender.contains('DemoWrapper-Tab'))
      {
        DOM.axis(tabs, DOM.AXIS_CHILD).forEach(function(tab, idx){
          classList(tab).bool('selected', tab == sender);
          DOM.display(pages[idx].element, tab == sender);
        });
        if (!sender.nextSibling)
          highlight();
      }
    });
    
    pages.forEach(function(page, idx){ DOM.display(page.element, !idx) });

    DOM.insert(
      document.body,
      DOM.createElement('A#backLink[href="../index.html"]', 'Back to demos'),
      DOM.INSERT_BEGIN
    );

    DOM.insert(document.body, [
      DOM.createElement('#DemoWrapper',
        tabs,
        DOM.wrap(pages, { '.DemoWrapper-Page': Function.$true }, 'element')
      ),
      DOM.createElement('#DemoCopy', DOM.createElement('P', 'basis.js ' + String.Entity.copy + ' 2006-2011, ', DOM.createElement('A[href="http://code.google.com/p/basis-js"][target="_blank"]', 'Project page')))
    ]);

    classList(document.body).add('show');

    if (/google/.test(location.host))
      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
       (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ga);
      })();
  });

  var _gaq = _gaq || [];
 _gaq.push(
 ['siteTracker._setAccount', 'UA-18071-1'],
 ['siteTracker._trackPageview']);
 
 _gaq.push(
 ['projectTracker._setAccount', 'UA-16275563-1'],
 ['projectTracker._trackPageview']);
