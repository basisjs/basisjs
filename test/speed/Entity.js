
    basis.require('basis.date');
    basis.require('basis.cssom');
    basis.require('basis.dom');
    basis.require('basis.dom.event');
    basis.require('basis.data');
    basis.require('basis.entity');
    basis.require('basis.utils.benchmark');

    var MAX_COUNT = 3000;
    var MAX_COUNT_QUATER = MAX_COUNT >> 2;
    var PROFILE = false;

    var DOM = basis.dom;
    var Data = basis.data;
    var nsEntity = basis.entity;

    var getter = basis.getter;
    var arrayFrom = basis.array.from;
    var getTime = basis.utils.benchmark.time;

    var eventStat = {};

    basis.event.Emitter.prototype.debug_emit = function(event){
      eventStat[event.type] = (eventStat[event.type] || 0) + 1;
    };

    function saveEventStat(){
      savedEventStat_ = basis.object.extend({}, eventStat);
    }
    function getEventStat(){
      var res = {};
      for (var event in eventStat)
      {
        if (eventStat[event] != savedEventStat_[event])
          res[event] = eventStat[event] - (savedEventStat_[event] || 0);
      }
      return res;
    }

    basis.fn.$nullOrValue = function(value){
      return value == null ? null : value;
    };

    basis.fn.$nullOrString = function(value){
      return value == null ? null : String(value);
    };

    basis.fn.$nullOrBoolean = function(value){
      return value == null ? null : Boolean(value);
    };

    basis.fn.$date = function(value){
      return value instanceof Date || value == null ? value : basis.date.fromISOString(value);
    };

    basis.fn.$nullOrArray = function(value){
      return value == null || value.length == 0 ? null : arrayFrom(value);
    };

    var User = new nsEntity.EntityType({
      name: 'User',
      fields: {
        UserId: nsEntity.IntId,
        Title: String,
        Value: Number
      }
    });

    var Currency = new nsEntity.EntityType({
      name: 'Currency',
      fields: {
        CurrencyId: nsEntity.IntId,
        Code: String,
        Title: String
      }
    });

    var Transfer = new nsEntity.EntityType({
      name: 'Transfer',
      fields: {
        TransferId: nsEntity.IntId,
        User: User,
        Amount: Number,
        Currency: Currency,
        Value: Number,
        CreateDate: basis.fn.$date
      }
    });
    Currency.entityType.entityClass.extend({
      behaviour: {
        update: function(){},
        destroy: function(){}
      }
    });
    User.entityType.entityClass.extend({
      behaviour: {
        update: function(){},
        destroy: function(){}
      }
    });
    Transfer.entityType.entityClass.extend({
      behaviour: {
        update: function(){},
        destroy: function(){}
      }
    });

    var date = new Date;
    function test(){
      var st = getTime();
      for (var i = 1; i <= MAX_COUNT; i++)
      {
        Transfer({
          TransferId: i,
          User: {
            UserId: 1 + (i % MAX_COUNT_QUATER),
            Title: 'User #' + (i % MAX_COUNT_QUATER)
          },
          Amount: i,
          Currency: 1 + (i % 5),
          CreateDate: date
        });
      }
      return getTime(st);
    }

    function testFastInsert(){
      var st = getTime();
      var data = [];
      for (var i = 1; i <= MAX_COUNT; i++)
      {
        data.push({
          TransferId: i,
          User: {
            UserId: 1 + (i % MAX_COUNT_QUATER),
            Title: 'User #' + (i % MAX_COUNT_QUATER)
          },
          Amount: i,
          Currency: 1 + (i % 5),
          CreateDate: date
        });
      }
      Transfer.all.sync(data);
      return getTime(st);
    }


    var uniqValue = 1;
    function testUpdate(){
      var st = getTime();
      for (var i = 1; i <= MAX_COUNT; i++)
      {
        Transfer({
          TransferId: i,
          User: {
            Value: Math.random()
          },
          Value: uniqValue++,
          Currency: {
            Title: 'Currency ' + 1 + (i % 5)
          }
        });
      }
      return getTime(st);
    }


    function getCount(es){
      if (es.value)
        return es.value.length;
      if (es.items)
        return es.items.length;
      return es.itemCount;
    }
    function clear(){
      var st = getTime();
      for (var i = 1, cnt = getCount(Transfer.all); i <= cnt; i++)
        Transfer(i).destroy();
      for (var i = 1, cnt = getCount(Currency.all); i <= cnt; i++)
        Currency(i).destroy();
      for (var i = 1, cnt = getCount(User.all); i <= cnt; i++)
        User(i).destroy();
      return getTime(st);
    }

    function fastClear(){
      if (Transfer.all.sync)
      {
        var st = getTime();
        Transfer.all.sync([]);
        User.all.sync([]);
        Currency.all.sync([]);
        return getTime(st);
      }
      else
        return clear();
    }

    var coldInsertTime = 0;
    var hotUpdateTime = 0;
    var hotUpdateChangesTime = 0;
    var clearTime = 0;
    var fastClearTime = 0;

    function sec(value){
      return value.toFixed(3) + ' sec';
    }

    function run1(func){
      saveEventStat();
      var t1 = test();
      var s1 = summary();
      var es1 = getEventStatElement();
      saveEventStat();
      var t2 = test();
      var s2 = summary();
      var es2 = getEventStatElement();
      saveEventStat();
      var t22 = testUpdate();
      var s3 = summary();
      var es3 = getEventStatElement();
      saveEventStat();
      var t3 = clear();
      var s4 = summary();
      var es4 = getEventStatElement();

      coldInsertTime += t1;
      hotUpdateTime += t2;
      hotUpdateChangesTime += t22;
      clearTime += t3;

      DOM.insert(document.body, [
        DOM.createElement('hr'),
        DOM.createElement(null, '1st run: ', sec(t1 / 1000), s1, es1),
        DOM.createElement(null, '2nd run (no changes): ', sec(t2 / 1000), s2, es2),
        DOM.createElement(null, '3rd run (changes): ', sec(t22 / 1000), s3, es3),
        DOM.createElement(null, 'Clear all: ', sec(t3 / 1000), s4, es4)
      ]);
      setTimeout(func, 50);
    }

    function run2(func){
      saveEventStat();
      var t1 = testFastInsert();
      var s1 = summary();
      var es1 = getEventStatElement();
      saveEventStat();
      var t2 = testFastInsert();
      var s2 = summary();
      var es2 = getEventStatElement();
      saveEventStat();
      var t22 = testUpdate();
      var s3 = summary();
      var es3 = getEventStatElement();
      saveEventStat();
      var t3 = fastClear();
      var s4 = summary();
      var es4 = getEventStatElement();

      coldInsertTime += t1;
      hotUpdateTime += t2;
      hotUpdateChangesTime += t22;
      fastClearTime += t3;

      DOM.insert(document.body, [
        DOM.createElement('hr'),
        DOM.createElement(null, '1st run: ', sec(t1 / 1000), s1, es1),
        DOM.createElement(null, '2nd run (no changes): ', sec(t2 / 1000), s2, es2),
        DOM.createElement(null, '3rd run (changes): ', sec(t22 / 1000), s3, es3),
        DOM.createElement(null, 'Fast clear all: ', sec(t3 / 1000), s4, es4)
      ]);
      setTimeout(func, 50);
    }

    function summary(){
      return DOM.createElement({
          description: 'DIV',
          css: {
            display: 'block',
            color: '#888',
            fontSize: '10px',
            padding: '0 2ex'
          }
        },
        [Transfer.all, Currency.all, User.all].map(function(ds, idx){
          return ['Transfer', 'Currency', 'User'][idx] + ' ' + getCount(ds);
        }).join(', ')
      );
    }

    function getEventStatElement(){
      var res = getEventStat();
      return DOM.createElement({
          description: 'SPAN',
          css: {
            display: 'block',
            color: '#D00',
            fontSize: '10px',
            padding: '0 2ex'
          }
        },
        basis.object.iterate(res, function(k, v){
          return k + ': +' + v;
        }).sort().join(', ')
      );
    }

    function total(){
      DOM.insert(document.body, [
        DOM.createElement('hr'),
        DOM.createElement('H2', 'SCORE: ', parseInt((coldInsertTime + hotUpdateTime + hotUpdateChangesTime + 2 * clearTime + 2 * fastClearTime) / 4)),
        DOM.createElement(null, 'First run: ', sec(coldInsertTime / 4000)),
        DOM.createElement(null, 'Second run (no changes): ', sec(hotUpdateTime / 4000)),
        DOM.createElement(null, 'Second run (changes): ', sec(hotUpdateChangesTime / 4000)),
        DOM.createElement(null, 'Clear total: ', sec(clearTime / 2000)),
        DOM.createElement(null, 'Fast clear total: ', sec(fastClearTime / 2000))
      ]);
    }

    window.c1count = 0;
    window.c2count = 0;

    function startTest(){
      if (PROFILE) console.profile();
      run1(function(){
        run1(function(){
          var c1 = new basis.entity.Collection({
            source: Transfer.all,
            rule: 'getId()%2'
          });
          var c2 = new basis.entity.Collection({
            source: User.all,
            rule: 'getId()%2'
          });
          c1.addHandler({ itemsChanged: function(dataset, delta){ c1count += (delta.inserted ? delta.inserted.length : 0) - (delta.deleted ? delta.deleted.length : 0); } });
          c2.addHandler({ itemsChanged: function(dataset, delta){ c2count += (delta.inserted ? delta.inserted.length : 0) - (delta.deleted ? delta.deleted.length : 0); } });
          DOM.insert(document.body, [
            DOM.createElement('hr'),
            DOM.createElement(null, '2 collection added')
          ]);
          run2(function(){
            run2(function(){
              if (PROFILE) console.profileEnd();
              total();
            });
          });
        });
      });
    }

    DOM.insert(document.body,
      runBtn = DOM.createElement({
        description: 'BUTTON',
        click: function(){
          DOM.remove(this);
          startTest();
        }
      }, 'run test')
    );

    if (location.hash == '#autorun')
    {
      basis.ready(function(){ runBtn.click(); });
    }
