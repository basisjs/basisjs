
  window.DemoLocale = {
    TABS: {
      DEMO: 'Demo',
      DESCRIPTION: 'Description',
      SOURCE: 'Source code'
    }
  };

  document.write('<style type="text/css">@import "../demo.css";</style>');
  document.write('<script type="text/javascript" src="../../plugins/highlight.js"></script>');
  
  Basis.Event.onLoad(function(){
    
    var DOM = Basis.DOM;
    var Event = Basis.Event;
    var Data = Basis.Data;
    var classList = Basis.CSS.classList;

    var highlight = Function.runOnce(function(){
      DOM.get('javascript').innerHTML = Basis.Plugin.SyntaxHighlight.highlight(DOM.get('javascript').innerHTML);
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
          DOM.createElement('H2', 'Included resources'),
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
          ),
          DOM.createElement('H2', 'CSS'),
          cssSource = DOM.createElement('PRE#css', DOM.get('demo-css').innerHTML),
          DOM.createElement('H2', 'Javascript'),
          jsSource = DOM.createElement('PRE#javascript', DOM.get('demo-javascript').innerHTML)
        )
      }
    ];
    var tabs = DOM.createElement('#DemoTabs', DOM.wrap(pages, { '.DemoWrapper-Tab': Function.$true }, 'title'));
    classList(tabs.firstChild).add('selected');
    
    cssSource.className = 'brush: css';
    jsSource.className = 'Basis-SyntaxHighlight';

    Event.addHandler(tabs, 'click', function(event){
      var sender = Event.sender(event);
      var classListSender = classList(sender);
      if (classListSender.contains('DemoWrapper-Tab'))
      {
        DOM.axis(tabs, DOM.AXIS_CHILD).forEach(function(tab, idx){
          classList(tab).bool('selected', tab == sender);
          DOM.display(pages[idx].element, tab == sender);
        });
        if (sender == sender.parentNode.lastChild)
          highlight();
      }
    });
    
    pages.forEach(function(page, idx){ DOM.display(page.element, !idx) });

    DOM.insert(document.body, [
      DOM.createElement('A#backLink[href="../index.html"]', 'Back to demos'),
      DOM.createElement('#DemoWrapper',
        tabs,
        DOM.wrap(pages, { '.DemoWrapper-Page': Function.$true }, 'element')
      ),
      DOM.createElement('#DemoCopy', DOM.createElement('P', 'Basis ' + String.Entity.copy + ' 2006-2010, home page'))
    ]);

    classList(document.body).add('show');
  });