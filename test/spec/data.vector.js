module.exports = {
  name: 'basis.data.vector',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var DataObject = basis.require('basis.data').Object;
    var Dataset = basis.require('basis.data').Dataset;
    var Vector = basis.require('basis.data.vector').Vector;
    var vectorSum = basis.require('basis.data.vector').sum;
    var vectorCount = basis.require('basis.data.vector').count;

    (function(){
      var proto = DataObject.prototype;
      var eventsMap = {};
      var seed = 1;
      var eventTypeFilter = function(event){
        return event.type == this;
      };

      proto.debug_emit = function(event){
        if (!this.testEventId_)
        {
          this.testEventId_ = seed++;
          eventsMap[this.testEventId_] = [];
        }

        eventsMap[this.testEventId_].push(event);
      };

      window.getEvents = function(object, type){
        var events = eventsMap[object.testEventId_];

        if (events && type)
          events = events.filter(eventTypeFilter, type);

        return events;
      };

      window.eventCount = function(object, type){
        var events = getEvents(object, type);

        return events ? events.length : 0;
      };

      window.getLastEvent = function(object, type){
        var events = getEvents(object, type);

        return events && events[events.length - 1];
      };
    })();

    function createDS(count){
      return new Dataset({
        items: basis.array.create(count || 10, function(idx){
          return new DataObject({
            data: {
              value: idx
            }
          });
        })
      });
    }

    function checkVector(vector){
      var sourceItems = [];
      var keys = basis.object.keys(vector.members_);
      var items = vector.getItems();
      var scount = 0;
      var scount2 = 0;

      for (var key in vector.items_)
        if (items.indexOf(vector.items_[key]) == -1)
          return 'getItems and vector.items_ diconnected';

      if (keys.length != vector.itemCount)
        return 'itemCount broken';

      for (var key in vector.sourceMap_)
      {
        var sourceObjectInfo = vector.sourceMap_[key];
        if (sourceObjectInfo.object.basisObjectId != key)
          return 'wrong key of source object (' + key + ')';
        if (sourceObjectInfo.key != vector.rule(sourceObjectInfo.object))
          return 'key property of sourceObjectInfo is wrong (' + key + ')';
        if (sourceObjectInfo.key in vector.members_ == false)
          return 'sourceObjectInfo.key is not in member map (' + key + ')';
        if (key in vector.members_[sourceObjectInfo.key] == false)
          return 'link to sourceObjectInfo in member is missed (' + key + ')';
        if (vector.members_[sourceObjectInfo.key][key] != sourceObjectInfo)
          return 'wrong link to sourceObjectInfo in member (' + key + ')';

        for (var k in sourceObjectInfo.values)
        {
          if (k in vector.calcs == false)
            return 'no calc for key ' + k;
          if (sourceObjectInfo.values[k] !== vector.calcs[k].valueGetter(sourceObjectInfo.object))
            return 'wrong value in sourceObjectInfo (' + k + ')';
        }

        for (var k in vector.calcs)
          if (k in sourceObjectInfo.values == false)
            return 'no value for calc in sourceObjectInfo.values ' + k;

        scount++;
      }

      var mcount = 0;
      for (var key in vector.members_)
      {
        var member = vector.members_[key];
        var ocount = 0;
        for (var k in member)
        {
          switch (k)
          {
            case 'count':
            case 'item':
              break;
            default:
              if (isNaN(k))
                return 'wrong property `' + k + '` in vector member';
              if (k in vector.sourceMap_ == false)
                return 'object with id `' + k + '` is not found in sourceMap';
              if (member[k] !== vector.sourceMap_[k])
                return 'broken link';
              ocount++;
              scount2++;
          }
        }

        if (String(member.item.key) != key)
          return 'member item has wrong value for key';
        if (ocount != member.count)
          return 'member count broken';

        mcount++;
      }

      if (mcount != vector.itemCount)
        return 'itemCount or links broken';

      if (scount != scount2)
        return 'source object count broken';

      return false;
    }
  },

  test: [
    {
      name: 'construct',
      test: [
        {
          name: 'no config',
          test: function(){
            var vector = new Vector();

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 0);
          }
        },
        {
          name: 'source and calcs (no rule)',
          test: function(){
            var vector = new Vector({
              source: createDS(),
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              }
            });

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 1);
            assert(vector.pick().data.count === 10);
            assert(vector.pick().data.sum === 45);
          }
        },
        {
          name: 'source, rule and calcs',
          test: function(){
            var vector = new Vector({
              source: createDS(),
              rule: 'data.value>>1',
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              }
            });

            assert(vector.itemCount === 5);

            var items = vector.getItems();
            var count2count = 0;
            var sumcheck = 0;
            for (var i = 0; i < items.length; i++)
            {
              var item = items[i];
              count2count += item.data.count == 2;
              sumcheck += item.data.sum == 4 * item.key + 1;
            }
            assert(count2count === 5);
            assert(sumcheck === 5);

            // check vector
            assert(checkVector(vector) === false);
          }
        }
      ]
    },
    {
      name: 'dynamics',
      test: [
        {
          name: 'create with no source, and set new source after creation',
          test: function(){
            var dataset = createDS();
            var vector = new Vector({
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              }
            });

            assert(vector.itemCount === 0);

            vector.setSource(dataset);
            assert(vector.itemCount === 1);
            assert(vector.pick().data.count === 10);
            assert(vector.pick().data.sum === 45);

            assert(checkVector(vector) === false);
          }
        },
        {
          name: 'create with source, drop source, and set new source',
          test: function(){
            var dataset = createDS();
            var vector = new Vector({
              source: dataset,
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              }
            });

            var isDestroyed = false;
            vector.pick().addHandler({
              destroy: function(){
                isDestroyed = true;
              }
            });

            vector.setSource();
            assert(checkVector(vector) === false);
            assert(vector.itemCount === 0);
            assert(isDestroyed === true);

            vector.setSource(dataset);
            assert(checkVector(vector) === false);
            assert(vector.itemCount === 1);
            assert(vector.pick().data.count === 10);
            assert(vector.pick().data.sum === 45);
          }
        },
        {
          name: 'create with no rule, set some rule, than set default',
          test: function(){
            var deleted;
            var inserted;
            var vector = new Vector({
              source: createDS(),
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              },
              handler: {
                itemsChanged: function(sender, delta){
                  deleted = delta.deleted;
                  inserted = delta.inserted;
                }
              }
            });
            assert(vector.itemCount === 1);
            assert(vector.pick().data.count === 10);
            assert(vector.pick().data.sum === 45);

            //////////////////////////////

            var items = vector.getItems();

            vector.setRule(basis.getter('data.value >> 1'));
            assert(items, deleted);
            assert(vector.getItems(), inserted);
            assert((inserted && inserted.length) === 5);
            assert(checkVector(vector) === false);

            var items = vector.getItems();
            var count2count = 0;
            var sumcheck = 0;
            for (var i = 0; i < items.length; i++)
            {
              var item = items[i];
              count2count += item.data.count == 2;
              sumcheck += item.data.sum == 4 * item.key + 1;
            }
            assert(vector.itemCount === 5);
            assert(count2count === 5);
            assert(sumcheck === 5);

            //////////////////////////////

            var items = vector.getItems();

            vector.setRule();
            assert(items, deleted);
            assert(deleted && deleted.length === 5);
            assert(vector.getItems(), inserted);
            assert(checkVector(vector) === false);
            assert(vector.itemCount === 1);
            assert(vector.pick().data.count === 10);
            assert(vector.pick().data.sum === 45);
          }
        },
        {
          name: 'source object values - calcs',
          test: function(){
            var dataset = createDS();
            var items = dataset.getItems();
            var vector = new Vector({
              source: dataset,
              calcs: {
                sum: vectorSum('data.value'),
                count: vectorCount()
              }
            });

            items.forEach(function(object){
              object.update({ value: 0 });
            });
            assert(checkVector(vector) === false);
            assert(vector.pick().data.sum === 0);

            items.forEach(function(object, idx){
              object.update({ value: idx });
            });
            assert(checkVector(vector) === false);
            assert(vector.pick().data.sum === 45);
          }
        },
        {
          name: 'source object values - key',
          test: function(){
            var dataset = createDS();
            var items = dataset.getItems();
            var vector = new Vector({
              source: dataset,
              rule: 'data.value'
            });

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 10);

            items.forEach(function(object){
              object.update({ value: 0 });
            });
            assert(checkVector(vector) === false);
            assert(vector.itemCount === 1);

            items.forEach(function(object, idx){
              object.update({ value: idx });
            });
            assert(checkVector(vector) === false);
            assert(vector.itemCount === 10);
          }
        },
        {
          name: 'move some items from one key to another',
          test: function(){
            var dataset = createDS();
            var items = dataset.getItems();
            var vector = new Vector({
              source: dataset,
              rule: 'data.value & 1',
              calcs: {
                sum: vectorSum('data.value')
              }
            });

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 2);

            for (var i = 0; i < items.length / 2; i++)
              items[i].update({ value: 0 });

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 2);
            assert(isNaN(vector.getItems()[0].data.sum) === false);
            assert(isNaN(vector.getItems()[1].data.sum) === false);
          }
        },
        {
          name: 'delete items from source',
          test: function(){
            var dataset = createDS();
            var items = dataset.getItems().slice();
            var vector = new Vector({
              source: dataset,
              rule: 'data.value & 1',
              calcs: {
                sum: vectorSum('data.value')
              }
            });

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 2);

            // delete half
            for (var i = 0; i < items.length / 2; i++)
              items[i].destroy();

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 2);
            assert(isNaN(vector.getItems()[0].data.sum) === false);
            assert(isNaN(vector.getItems()[1].data.sum) === false);

            // delete all
            dataset.clear();

            assert(checkVector(vector) === false);
            assert(vector.itemCount === 0);
          }
        },
        {
          name: 'setCalc',
          test: function(){
            var dataset = createDS();
            var vector = new Vector({
              source: dataset,
              calcs: {
                value: vectorSum('data.value')
              }
            });

            var valueSum = dataset.getItems().reduce(function(res, item){
              return res + item.data.value;
            }, 0);
            assert(vector.pick().data.value === valueSum);

            vector.setCalc('value', vectorCount());
            assert(vector.pick().data.value === dataset.itemCount);

            vector.setCalc('value');
            assert(vector.pick().data.value === undefined);

            vector.setCalc('value', vectorCount());
            assert(vector.pick().data.value === dataset.itemCount);

            vector.setCalc('value', vectorSum('data.value'));
            assert(vector.pick().data.value === valueSum);
          }
        }
      ]
    }
  ]
};
