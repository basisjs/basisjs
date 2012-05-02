
  basis.ready(function(){

    var createElement = basis.dom.createElement;
    var DOM = basis.dom;
    var DataObject = basis.data.DataObject;

    var TEST_COUNT = 5;
    var INNER_TEST_COUNT = 10000;
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

      output.appendChild(createElement(
        'DIV',
        name + ' x ' + count + ': ', 
        createElement('B', res),
        ' ms'
      ));
    }

    var runTest = function(){

      // Test #1

      var x = [];

      speedTest('Create with no config', INNER_TEST_COUNT, function(){
        x.push(new DataObject);
      });
   
      // Test #2

      speedTest('Create with data', 1, function(){
        for (var i = 0; i < INNER_TEST_COUNT; i++)
          x.push(new DataObject({
            data: {
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
        var delegate = new DataObject;
        x.push(new DataObject({
          data: {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5
          },
          delegate: delegate
        }), delegate);
      });

      speedTest('destroy ' + x.length + ' objects', 1, function(){
        for (var i = x.length; i --> 0;)
          x[i].destroy();
        x.length = 0;
      });

      // Test #4

      var a = new DataObject();
      var b = new DataObject({
        data: {
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

      var c = new DataObject({
        data: {
          f: 6,
          k: 7,
          l: 8,
          m: 9,
          n: 0
        }
      });
      var d = new DataObject({
        data: {
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

      output.appendChild(createElement('hr'));

      if (TEST_COUNT-- > 1)
        setTimeout(arguments.callee, 20);
      else
      {
        var cnt = 0;
        var total = 0;
        Object.values(funcs).sortAsObject('guid').forEach(function(item){
          total += item.total;
          cnt++;
          output.appendChild(createElement(
            'DIV',
            item.name + ' x ' + item.count + ': ',
            createElement('B.total', parseInt(item.total/item.count)),
            ' ms'
          ))
        });

        output.appendChild(createElement('hr'));
        output.appendChild(createElement(
          'DIV',
          'Total score: ',
          createElement('B.total', parseInt(total/cnt)),
          ' ms'
        ));
      }

    };

    DOM.insert(document.body, createElement({
      description: 'BUTTON',
      click: function(){
        runTest();
      }
    }, 'runTest'));

  });