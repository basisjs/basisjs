
  Basis.Event.onLoad(function(){

    var TEST_COUNT = 5;
    var INNER_TEST_COUNT = 4500;
    var output = document.getElementById('output');

    var funcs = {};
    var GUID = 1;

    function speedTest(name, count, func){
      var t = new Date();

      for (var i = 0; i < count; i++)
        func();

      var res = (new Date - t);
      var stat = funcs[func] || (funcs[func] = {});

      if (!stat.name)
      {
        stat.total = 0;
        stat.guid = GUID++;
        stat.name = name;
        stat.count = 0;
      }

      stat.total += res;
      stat.count += 1;

      output.appendChild(Basis.DOM.createElement(
        'DIV',
        name + ' x ' + count + ': ', 
        Basis.DOM.createElement('B', res),
        ' ms'
      ));
    }

    var runTest = function(){

      // Test #1

      var x = [];

      speedTest('Create with no config', INNER_TEST_COUNT, function(){
        x.push(new Basis.Data.DataObject);
      });
   
      // Test #2

      speedTest('Create with info', INNER_TEST_COUNT, function(){
        x.push(new Basis.Data.DataObject({
          info: {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5,
            f: 6,
            k: 7,
            l: 8,
            m: 9,
            n: 0
          }
        }));
      });

      // Test #3

      speedTest('Create with delegate', INNER_TEST_COUNT, function(){
        var delegate = new Basis.Data.DataObject;
        x.push(new Basis.Data.DataObject({
          info: {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5
          },
          delegate: delegate
        }), delegate);
      });

      speedTest('destroy ' + INNER_TEST_COUNT * 4 + ' objects', 1, function(){
        for (var i = x.length; i --> 0;)
          x[i].destroy();
        x.length = 0;
      });

      // Test #4

      var a = new Basis.Data.DataObject();
      var b = new Basis.Data.DataObject({
        info: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5
        }
      });
      speedTest('setDelegate with no update', INNER_TEST_COUNT, function(){
        a.setDelegate(b);
        a.setDelegate();
      });

      // Test #4

      var c = new Basis.Data.DataObject({
        info: {
          f: 6,
          k: 7,
          l: 8,
          m: 9,
          n: 0
        }
      });
      var d = new Basis.Data.DataObject({
        info: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5
        }
      });
      speedTest('setDelegate with update', INNER_TEST_COUNT, function(){
        c.setDelegate(d);
        c.setDelegate();
      });

      output.appendChild(Basis.DOM.createElement('hr'));

      if (TEST_COUNT-- > 1)
        setTimeout(arguments.callee, 20);
      else
      {
        var cnt = 0;
        var total = 0;
        Object.values(funcs).sortAsObject('guid').forEach(function(item){
          total += item.total;
          cnt++;
          output.appendChild(Basis.DOM.createElement(
            'DIV',
            item.name + ' x ' + item.count + ': ',
            Basis.DOM.createElement('B.total', parseInt(item.total/item.count)),
            ' ms'
          ))
        });

        output.appendChild(Basis.DOM.createElement('hr'));
        output.appendChild(Basis.DOM.createElement(
          'DIV',
          'Total score: ',
          Basis.DOM.createElement('B.total', parseInt(total/cnt)),
          ' ms'
        ));
      }

    };

    Basis.DOM.insert(document.body, Basis.DOM.createElement({
      description: 'BUTTON',
      click: function(){
        runTest();
      }
    }, 'runTest'));

  });