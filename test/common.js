function loadTest(TestCase){

  var DOM = basis.dom;
  var Event = basis.dom.event;
  var Tester = basis.test.Tester;

  if (top.regTestCase)
  {
    top.regTestCase(Tester.parse(document.title, TestCase));
    top.nextTest();
  }
  else
  {
    var buttonRun, buttonStop, progressbar, panel;

    DOM.insert(document.body, [
      DOM.createElement('H1', document.title),
      panel = DOM.createElement('#TestPanel',
        progressbar = DOM.createElement('#TestProgressbar',
          DOM.createElement()
        ),
        buttonRun = DOM.createElement({ description: 'BUTTON', click: new Event.Handler(Tester.run, Tester) }, 'Run'),
        buttonStop = DOM.createElement({ description: 'BUTTON', click: new Event.Handler(Tester.stop, Tester) }, 'Stop'),
        DOM.createElement({ description: 'A[href=#autorun]', click: function(event){ Tester.run() } }, 'Autorun')
      )
    ]);

    var testcase = Tester.parse(document.title, TestCase);
    var result = DOM.createElement('#result');

    testcase.addHandler({
      progress: function(diff, p){
        DOM.setStyle(progressbar.firstChild, { width: (100 * p) + '%' });
      },
      over: function(){
        DOM.remove(progressbar);
        DOM.insert(DOM.clear(result), testcase.toDOM());
        DOM.insert(document.body, result);
        //console.log('end');
      },
      reset: function(){
        DOM.remove(result);
        DOM.insert(panel, progressbar, 0);
      }
    });

    Tester.state.addLink(buttonRun, function(value){ this.disabled = value == 'run' });
    Tester.state.addLink(buttonStop, function(value){ this.disabled = value != 'run' });

    if (location.hash == '#autorun')
      Tester.run();
  }

};