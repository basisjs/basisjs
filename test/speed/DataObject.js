
  'use strict';

  basis.ready(function(){
    basis.require('basis.dom');
    basis.require('basis.dom.event');
    basis.require('basis.data');

    var createElement = basis.dom.createElement;
    var DOM = basis.dom;
    var DataObject = basis.data.DataObject;

    var TEST_REPEAT_COUNT = 3;
    var TEST_COUNT = 10000;
    var PROFILE = false;

    var output = document.getElementById('output');
    var funcs = {};

    var table = output.appendChild(createElement('TABLE'));
    var tableHead = table.appendChild(createElement('THEAD')).appendChild(createElement('TR', createElement('TH', 'Activity')));
    var tableBody = table.appendChild(createElement('TBODY'));
    var tableFoot = table.appendChild(createElement('TFOOT'));
    var runTime = 0;
    var runNumber = 0;
    var totalsDom;

    function speedTest(name, count, func){
      var t = new Date();

      for (var i = 0; i < count; i++)
        func(i);

      var res = new Date - t;
      var stat = funcs[func] || (funcs[func] = {});

      if (!stat.name)
      {
        stat.total = 0;
        stat.name = name;
        stat.dom = tableBody.appendChild(createElement('TR',
          createElement('TD', name  + ' x ' + count)
        ));
      }

      runTime += res;
      stat.total += res;

      stat.dom.appendChild(
        createElement('TD.time', res)
      );
    }

    var runTest = function runTest(){
      function cleanArray(len, fill){
        var array;

        if (!len)
          array = [];
        else
          array = basis.array.create(len, fill);

        cleanup.push(array);

        return array;
      }

      var cleanup = [];

      runNumber++;
      runTime = 0;

      // Test #1
      // Measure creation of TEST_REPEAT_COUNT basis.data.Object with no config

      var t1 = cleanArray();

      speedTest('create with no config', TEST_COUNT, function(){
        t1.push(new DataObject);
      });
   
      // Test #2
      // Measure creation of TEST_REPEAT_COUNT basis.data.Object with data

      var t2 = cleanArray();
      var t2_data = {
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
      };

      speedTest('create with data', TEST_COUNT, function(){
        t2.push(new DataObject({
          data: t2_data
        }));
      });

      // Test #3
      // Measure create TEST_REPEAT_COUNT basis.data.Object with delegate

      var t3o = cleanArray();
      var t3d = cleanArray(TEST_COUNT, function(){
        return new DataObject;
      });

      speedTest('create with delegate', TEST_COUNT, function(idx){
        t3o.push(new DataObject({
          delegate: t3d[idx]
        }));
      });

      // Test #4

      var t4_config = {
        data: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5
        }
      };

      var t4a = cleanArray(TEST_COUNT, function(){
        return new DataObject(t4_config);
      });
      var t4b = cleanArray(TEST_COUNT, function(){
        return new DataObject(t4_config);
      });

      speedTest('setDelegate with no update', TEST_COUNT, function(idx){
        t4a[idx].setDelegate(t4b[idx]);
      });

      // Test #5

      var t5_o_config = {
        data: {
          f: 6,
          k: 7,
          l: 8,
          m: 9,
          n: 0
        }
      };
      var t5_d_config = {
        data: {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5
        }
      };

      var t5o = cleanArray(TEST_COUNT, function(){
        return new DataObject(t5_o_config);
      });
      var t5d = cleanArray(TEST_COUNT, function(){
        return new DataObject(t5_d_config);
      });

      speedTest('setDelegate with update', TEST_COUNT, function(idx){
        t5o[idx].setDelegate(t5d[idx]);
      });

      // Test #6

      var t6d = cleanArray(TEST_COUNT, function(){
        return new DataObject;
      });
      var t6o = cleanArray(TEST_COUNT, function(idx){
        return new DataObject({ delegate: t6d[idx] });
      });

      speedTest('drop delegate', TEST_COUNT, function(idx){
        t6o[idx].setDelegate();
      });

      // Test #7

      var t7 = basis.array.create(TEST_COUNT, function(idx){
        return new DataObject;
      });

      speedTest('destroy with no delegate', TEST_COUNT, function(idx){
        t7[idx].destroy();
      });

      // Test #8

      var t8d = cleanArray(TEST_COUNT, function(){
        return new DataObject;
      });
      var t8o = basis.array.create(TEST_COUNT, function(idx){
        return new DataObject({ delegate: t8d[idx] });
      });

      speedTest('destroy object with delegate', TEST_COUNT, function(idx){
        t8o[idx].destroy();
      });

      // Test #9

      var t9d = basis.array.create(TEST_COUNT, function(){
        return new DataObject;
      });
      var t9o = cleanArray(TEST_COUNT, function(idx){
        return new DataObject({ delegate: t9d[idx] });
      });

      speedTest('destroy delegate', TEST_COUNT, function(idx){
        t9d[idx].destroy();
      });

      // Test #10

      var t10d = basis.array.create(TEST_COUNT, function(){
        return new DataObject;
      });
      var t10o = basis.array.create(TEST_COUNT, function(idx){
        return new DataObject({ delegate: t10d[idx] });
      });

      speedTest('destroy object & delegate, object -> delegate', TEST_COUNT, function(idx){
        t10o[idx].destroy();  // object
        t10d[idx].destroy();  // delegate
      });

      // Test #11

      var t11d = basis.array.create(TEST_COUNT, function(){
        return new DataObject;
      });
      var t11o = basis.array.create(TEST_COUNT, function(idx){
        return new DataObject({ delegate: t11d[idx] });
      });

      speedTest('destroy object & delegate, delegate -> object', TEST_COUNT, function(idx){
        t11d[idx].destroy();  // delegate
        t11o[idx].destroy();  // object
      });

      // cleanup

      for (var a = 0; a < cleanup.length; a++)
        cleanup[a].map(function(obj){
          obj.destroy();
        });

      //
      // output stat
      //

      if (runNumber == 1)
      {
        totalsDom = tableFoot.appendChild(
          createElement('TR',
            createElement('TD', '')
          )
        );
      }

      tableHead.appendChild(
        createElement('TH', '#' + runNumber)
      );
      totalsDom.appendChild(
        createElement('TD.score', runTime)
      );

      if (runNumber < TEST_REPEAT_COUNT)
      {
        setTimeout(runTest, 20);
      }
      else
      {
        var total = 0;

        tableHead.appendChild(
          createElement('TH', 'Avg')
        );

        basis.object.values(funcs).forEach(function(item){
          total += item.total;
          item.dom.appendChild(
            createElement('TD.time.total', parseInt(item.total / TEST_REPEAT_COUNT))
          );
        });

        totalsDom.appendChild(
          createElement('TD.score.total', parseInt(total / TEST_REPEAT_COUNT))
        );

        if (PROFILE) console.profileEnd();
      }

    };

    function launch(){
      if (PROFILE) console.profile();
      runNumber = 0;
      runTest();
      DOM.remove(launchButton);
    }

    var launchButton;
    DOM.insert(document.body, launchButton = createElement({
      description: 'BUTTON',
      click: launch
    }, 'runTest'));

    //launch();

  });