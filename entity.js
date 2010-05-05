/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2010 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

    // namespace

    var namespace = 'Basis.Entity';

    // import names

    var Class = Basis.Class;
    var Data = Basis.Data;
    var Cleaner = Basis.Cleaner;

    var extend = Object.extend;
    var complete = Object.complete;

    var nsWrapers = Basis.DOM.Wrapers;

    var AbstractProperty = nsWrapers.AbstractProperty;
    var Property = nsWrapers.Property;
    var STATE = nsWrapers.STATE;

    /*
     *  Misc
     */

    var UntitledName = Class(null, {
      init: function(name){
        this.counter = 0;
        this.name = name;
      },
      getName: function(){
        return '[untitled{0}{1}]'.format(this.name, this.counter++);
      }
    });

    /*
     *  Storages
     */

    var eUniqueId = 1;
    var eGlobalStorage = {};
    var eReadOnly = {};
    var eReadOnlyWriteAllow = false;

    /**
     *  EntitySetType
     */

    var EntitySetType = function(entityType){
      if (this instanceof EntitySetType)
      {
        var entitySetType = new InternalEntitySetType({ entityType: entityType });

        var result = function(data, entitySet){
          if (arguments.length)
          {
            //console.log('create/update entitySet', data, entitySet instanceof EntitySet);
            if (data == null)
              return null;

            if (!(entitySet instanceof EntitySet))
              entitySet = entitySetType.createEntitySet();

            entitySet.set(data instanceof AbstractProperty ? data._value : data);

            return entitySet;
          }
          else
            return null;
        };

        result.callText = function(){ return 'EntitySet' + (entityType ? (entityType.entityType || entityType).name.quote('(') : '()') };

        return result;
      }
      else
        console.warn('Unknown what to do', config);
    };

    var InternalEntitySetType = Class(null, {
      className: namespace + '.EntitySetType',

      init: function(config){
        this.entityType = config.entityType;
      },
      createEntitySet: function(){
        return new EntitySet(this.entityType, 'Set of ' + (this.entityType.entityType || this.entityType).name.quote('{'));
      }
    });
    EntitySetType.className = namespace + '.EntitySetType';

    /**
     *  EntitySet
     */

    var EntitySetToEntitySetHandler = {};

    function entitySetAddLinks(entitySet, inserted){
      var result = [];
      for (var i = inserted.length - 1; i >= 0; i--)
      {
        var entity = inserted[i];
        var index = entity.uniqueId;
        var ea = entitySet.attaches[index];
        if (ea)
          ea.count++;
        else
        {
          result.push(entity);
          ea = entitySet.attaches[index] = {
            count: 1,
            entity: entity,
            isEntitySet: entity instanceof EntitySet,
            handler: {
              datasetChanged: entity instanceof EntitySet
                ? // handler for entitySet
                  (function(entity){
                    return function(dataset, delta){
                      if (!entitySet.__nested_trigger)
                      {
                        //var old = Array.from(entitySet.value);
                        //var injection = [0, oldValue.length].concat(newValue);
                        var d = -(delta.inserted ? delta.inserted.length : 0) + (delta.deleted ? delta.deleted.length : 0);
                        var injection = [0, entity.value.length + d].concat(entity.value);
                        var count = ea.count;
                        var count2 = 0;
                        var complexDelta = {
                          inserted: [],
                          deleted: [],
                          updated: []
                        };

                        for (var i = 0, offset = 0; count && i < entitySet._value.length; i++)
                        {
                          var e = entitySet._value[i];
                          if (e === entity)
                          {
                            count--;

                            injection[0] = offset;
                            entitySet.value.splice.apply(entitySet.value, injection);

                            if (delta.deleted)
                              for (var item, j = 0; item = delta.deleted[j]; j++)
                                complexDelta.deleted.push({
                                  pos: item.pos + offset + count2 * d,
                                  info: item.info
                                });

                            if (delta.inserted)
                              for (var item, j = 0; item = delta.inserted[j]; j++)
                                complexDelta.inserted.push({
                                  pos: item.pos + offset,
                                  info: item.info
                                });

                            if (delta.updated)
                              for (var item, j = 0; item = delta.updated[j]; j++)
                                complexDelta.updated.push({
                                  pos: item.pos + offset,
                                  oldPos: item.oldPos + offset,
                                  info: item.info
                                });

                            count2++;
                          }

                          offset += e instanceof EntitySet ? e.value.length : 1;
                        }

                        complexDelta.deleted = complexDelta.deleted.sortAsObject('pos').reverse();
                        //console.log(complexDelta.deleted);

                        for (var key in complexDelta)
                          if (!complexDelta[key].length)
                            delete complexDelta[key];

                        //entitySet.__nested_trigger++;
                        entitySet.dispatch('datasetChanged', entitySet.value, complexDelta);
                        //entitySet.__nested_trigger--;
                      //console.log('changes', delta);
                      }
                    };
                  })(entity)
                : Function.$null,
              change: entity instanceof EntitySet == false
                ? // handler for entity
                  (function(entity){
                    return function(){
                      if (!entitySet.__nested_trigger)
                      {
                        var delta = {
                          updated: [],
                          changedMembers: [entity]
                        };
                        var count = ea.count;
                        var pos = -1;
                        while (count-- && (pos = entitySet._value.indexOf(entity, pos + 1)) != -1)
                        {
                          delta.updated.push({
                            pos: pos,
                            oldPos: pos,
                            info: entity
                          });
                        }
                        entitySet.dispatch('datasetChanged', entitySet.value, delta);
                      }
                      else
                        entitySet.updateCount++;
                    };
                  })(entity)
                : Function.$null,
              destroy: function(entity){
                entitySet.remove([entity].repeat(ea.count));
                //entitySet.set(entitySet.value.filter(Function.$isNotSame, entity));
              }
            }
          };
          entity.addHandler(ea.handler, entitySet);
        };
      }
      return result;
    };

    function entitySetRemoveLinks(entitySet, deleted){
      var result = [];
      for (var i = deleted.length - 1; i >= 0; i--)
      {
        var entity = deleted[i];
        var index = entity.uniqueId;
        if (index != -1)
        {
          var ea = entitySet.attaches[index];

          if (!(--ea.count))
          {
            result.push(ea.entity);

            ea.entity.removeHandler(ea.handler, entitySet);
            delete ea.entity;
            delete entitySet.attaches[index];
          }
        }
      }
      return result;
    };

    var EntitySetMemberFilter = function(item){
      // this - EntitySet
      if (item)
      {
        // already in entitySet or instance of Entity
        if (this.attaches[item.uniqueId] || item instanceof Entity)
          return true;
        else
          if (item instanceof EntitySet)
          {
            if (this.isDependenced(item))
            {
              ;;; if (typeof console != 'undefined') console.warn('Destination EntitySet depend on source EntitySet');
              return false;
            }
            if (item.isDependenced(this))
            {
              ;;; if (typeof console != 'undefined') console.warn('Source EntitySet depend on destination EntitySet');
              return false;
            }
            return true;
          }
      }
      return false;
      /*
      return item &&
             (
               this.attaches[item.uniqueId] ||  // already in entitySet
               item instanceof Entity ||
              (item instanceof EntitySet && !this.isDependenced(item) && !item.isDependenced(this))
             );
      */
    };

    var untitledEntitySet = new UntitledName('EntitySet');
    var EntitySet = Class(Property, {
      className: namespace + '.EntitySet',

      state: STATE.UNDEFINED,

      init: function(entityType, name){
        eGlobalStorage[this.uniqueId = eUniqueId++] = this;

        this.inherit([]);
        this._value = [];
        this.info = this;

        this.name = name || untitledEntitySet.getName();
        this.entityType = entityType ? entityType.wraper || entityType : Function.$self;

        this.attaches = {};

        this.updateCount = 0;
        this.__nested_trigger = 0;
      },
      isDependenced: function(entitySet){
        if (entitySet === this)
          return true;

        for (var id in this.attaches)
        {
          var ea = this.attaches[id];
          if (ea.isEntitySet)
          {
            if (ea.entity === entitySet || ea.entity.isDependenced(entitySet))
              return true;
          }
        }

        return false;
      },
      toString: function(){
        return '[object EntitySet]';
      },
      set: function(data, forceEvent){

        if (eReadOnly[this.uniqueId] && !eReadOnlyWriteAllow)
          return;

        if (data)
        {
          // optimization: just append possible
          if (this._value.length == 0)
            return this.append(data, forceEvent);

          this.__nested_trigger++;
          data = Array.from(data).map(this.entityType).filter(EntitySetMemberFilter, this);
          this.__nested_trigger--;

          // optimization: just delete possible (clear)
          if (data.length == 0)
            return this.clear();

          // hard way
          var updateCount = this.updateCount;
          var _inserted = [];
          var _deleted = [];
          var _insertedPos = [];

          if (!data.equal(this._value))
          {
            var changes = {
              deleted:  [],
              inserted: [],
              updated:  []
            };

            // current_value (this._value) -> _old
            var _old = Array.from(this._value);
            // new_value (data) -> current value
            this._value.set(data);

            //var old = Array.from(this.value);
            this.value.clear();

            var exists = {};

            var oldOffsets = new Array(_old.length);
            for (var i = 0, offset = 0; i < _old.length; i++)
            {
              var entity = _old[i];
              oldOffsets[i] = offset;
              offset += entity instanceof EntitySet ? entity.value.length : 1;
            }
            //console.log(oldOffsets);

            for (var i = 0, offset = 0; i < this._value.length; i++, offset += len)
            {
              var entity = this._value[i];
              var isEntitySet = entity instanceof EntitySet;
              var len = isEntitySet ? entity.value.length : 1;
              var index = entity.uniqueId;
              var exist = null;

              if (this.attaches[index])
                if (exists[index])
                  exist = exists[index];
                else
                  exist = exists[index] = {
                    count: this.attaches[index].count,
                    lastPos: -1
                  };

              var items = isEntitySet ? entity.value : [entity];
              if (!exist || exist.count == 0)
              {
                for (var j = 0; j < len; j++)
                {
                  changes.inserted.push({
                    pos: offset + j,
                    info: items[j]
                  });
                }

                this.value.push.apply(this.value, items);
                _inserted.push(entity);
                _insertedPos.push(i);
              }
              else
              {
                exist.count--;
                exist.lastPos = _old.indexOf(entity, exist.lastPos + 1);
                oldOffsets[exist.lastPos] = -1;

                this.value.push.apply(this.value, items);
              }
            }

            //console.log(oldOffsets);
            for (var i = oldOffsets.length - 1; i >= 0; i--)
            {
              var offset = oldOffsets[i];
              if (offset != -1)
              {
                var entity = _old[i];
                var items = entity instanceof EntitySet ? entity.value : [entity];

                offset += items.length - 1;
                for (var j = 0; j < items.length; j++)
                  changes.deleted.push({
                    pos:  offset - j,
                    info: items[j]
                  });

                _deleted.push(entity);
                _old.splice(i, 1);
              }
            }

            // processing position changes
            for (var i = 0; i < _inserted.length; i++)
              _old.splice(_insertedPos[i], 0, _inserted[i]);

            var oldOffsets = [];
            for (var i = 0, offset = 0; i < _old.length; i++)
            {
              oldOffsets[i] = offset;
              offset += _old[i] instanceof EntitySet ? _old[i].value.length : 1;
            }

            var delta = 0;
            for (var i = 0, offset = 0; i < this._value.length; i++)
            {
              var a = this._value[i];
              var aLength = a instanceof EntitySet ? a.value.length : 1;
              var b = _old[i];
              var bLength = b instanceof EntitySet ? b.value.length : 1;

              if (a !== b)
              {
                // swap
                var oldPos = _old.indexOf(a, i);
                _old[i] = _old[oldPos];
                _old[oldPos] = b;
                b = a;

                bLength = b instanceof EntitySet ? b.value.length : 1;

                // calc delta position
                delta += bLength - aLength;

                // form updated
                var items = b instanceof EntitySet ? b.value : [b];
                for (var j = 0; j < bLength; j++)
                {
                  changes.updated.push({
                    pos: offset + j,
                    oldPos: oldOffsets[oldPos] + delta + j,
                    info: items[j]
                  });
                }

                this.updateCount += bLength;
              }

              offset += aLength;
            }

            for (var key in changes)
              if (!changes[key].length)
                delete changes[key];

            if (_inserted.length)
            {
              this.updateCount++;
              var items = entitySetAddLinks(this, _inserted);
              if (items.length)
                changes.addedMembers = items;
            }
            if (_deleted.length)
            {
              this.updateCount++;
              var items = entitySetRemoveLinks(this, _deleted);
              if (items.length)
                changes.removedMembers = items;
            }
          }
        }

        if (forceEvent || this.updateCount != updateCount)
          this.dispatch('datasetChanged', this.value, /*old || this.value, */changes || {});

        return changes || {};
      },
      update: function(data, forceEvent){
        this.set(data, forceEvent);
      },
      sync: function(data, set){
        data = data || [];
        var save = data.map(this.entityType).sortAsObject(Data.getter('uniqueId')).unique(true);
        var self = this.value.sortAsObject(Data.getter('uniqueId')).unique(true);

        self.exclude(save).forEach(Data.getter('destroy()'));

        if (set)
          return this.set(data);
      },
      append: function(data, forceEvent){
        if (eReadOnly[this.uniqueId] && !eReadOnlyWriteAllow)
          return;

        if (data)
        {
          //var old = Array.from(this.value);
          var updateCount = this.updateCount;
          var changes = {
            inserted: []
          };
          var _inserted = [];

          this.__nested_trigger++;
          data = Array.from(data).map(this.entityType).filter(EntitySetMemberFilter, this);
          this.__nested_trigger--;

          var items;
          var pos = this.value.length;
          for (var i = 0; i < data.length; i++)
          {
            var entity = data[i];

            items = entity instanceof EntitySet ? entity.value : [entity];
            this.value.push.apply(this.value, items);
            for (var j = 0; j < items.length; j++)
              changes.inserted.push({
                pos: pos++,
                info: items[j]
              });

            this._value.push(entity);
            _inserted.push(entity);
          }

          if (_inserted.length)
          {
            this.updateCount++;
            var items = entitySetAddLinks(this, _inserted);
            if (items.length)
              changes.addedMembers = items;
          }
        }

        if (forceEvent || this.updateCount != updateCount)
          this.dispatch('datasetChanged', this.value,/* old, */changes);

        return changes || {};
      },
      remove: function(data){
        if (eReadOnly[this.uniqueId] && !eReadOnlyWriteAllow)
          return;

        if (this.destroy == Function.$undef)
          return;

        if (data)
        {
          //var old = Array.from(this.value);
          var updateCount = this.updateCount;
          var changes = {
            deleted: []
          };
          var _deleted = [];

          this.__nested_trigger++;
          data = Array.from(data).map(this.entityType);
          this.__nested_trigger--;

          // optimization: filter list of removing items only for existing
          for (var i = 0, k = 0; i < data.length; i++)
          {
            if (data[i] && this.attaches[data[i].uniqueId])
              data[k++] = data[i];
          }
          data.length = k;

          // remove
          for (var i = this._value.length - 1, offset = this.value.length; data.length && i >= 0; i--)
          {
            var entity = this._value[i];
            var index = data.indexOf(entity);
            var isEntitySet = entity instanceof EntitySet;
            var len = isEntitySet ? entity.value.length : 1;
            offset -= len;
            if (index != -1)
            {
              var items = isEntitySet ? entity.value : [entity];
              for (var j = len - 1; j >= 0; j--)
              {
                changes.deleted.push({
                  pos: offset + j,
                  info: items[j]
                });
              }

              this.value.splice(offset, len);
              this._value.splice(i, 1);
              _deleted.unshift(entity);
              data.splice(index, 1);
            }
          }

          if (_deleted.length)
          {
            this.updateCount++;
            var items = entitySetRemoveLinks(this, _deleted);
            if (items.length)
              changes.removedMembers = items;
          }
        }

        if (this.updateCount != updateCount)
          this.dispatch('datasetChanged', this.value,/* old, */changes);

        return changes || {};
      },
      clear: function(){
        if (eReadOnly[this.uniqueId] && !eReadOnlyWriteAllow)
          return;

        //this.remove(this._value);
        if (this._value.length)
        {
          var changes = { deleted: [] };

          for (var i = this.value.length - 1; i >= 0; i--)
            changes.deleted.push({
              pos: i,
              info: this.value[i]
            });

          var items = entitySetRemoveLinks(this, this._value);
          if (items.length)
            changes.removedMembers = items;

          var old = Array.from(this.value);
          this.value.clear();
          this._value.clear();

          this.dispatch('datasetChanged', this.value, /*old, */changes);
        }

        return changes;
      },
      getCount: function(entity){
        var ea = this.attaches[this.entityType(entity).uniqueId];
        return ea ? ea.count : 0;
      },
      has: function(entity){
        return this.attaches[this.entityType(entity).uniqueId];
      },
      destroy: function(){
        delete eReadOnly[this.uniqueId];

        this.clear();
        this.inherit();

        delete eGlobalStorage[this.uniqueId];

        // delete this.value;  // deleted in this.inherit()
        delete this._value;
        delete this.info;

        delete this.attaches;

        delete this.entityType;
      }
    });

    /*
     *  GroupingEntitySet
     */

    var untitledGrouping = new UntitledName('Grouping');

    var GroupingMasterEntitySetHandler = {
      datasetChanged: function(newValue, delta){
        if (Cleaner.globalDestroy)
          return;

        if (delta.inserted)
        {
          for (var i = 0, item; item = delta.inserted[i]; i++)
          {
            var entity = item.info;
            var group = this.entityGroup[entity.uniqueId];

            if (!group)
              group = this.getGroup(this.groupSelector(entity), true);
              
            group.append(entity);

            this.entityGroup[entity.uniqueId] = group;
          }
        }
        if (delta.deleted)
        {
          for (var i = 0, item; item = delta.deleted[i]; i++)
          {
            var entity = item.info;
            var group = this.entityGroup[entity.uniqueId];

            if (group)
            {
              group.remove(entity);
              if (group.getCount(entity) == 0)
                delete this.entityGroup[entity.uniqueId];
            }
          }
        }
        if (delta.updated)
        {
          for (var i = 0, item; item = delta.updated[i]; i++)
          {
            var entity = item.info;
            var curGroup = this.entityGroup[entity.uniqueId];
            if (curGroup)
            {
              var group = this.getGroup(this.groupSelector(entity), true);
              if (curGroup != group)
              {
                var s = [entity].repeat(curGroup.getCount(entity));
                curGroup.remove(s);
                group.append(s);
                this.entityGroup[entity.uniqueId] = group;
              }
            }
          }
        }
      },
      stateChanged: function(object, newState, oldState, errorText){
        this.setState(newState, errorText);
      }
    };

    var GroupEntitySet = Class(EntitySet, {
      className: namespace + '.GroupEntitySet',
      init: function(entityType, name, groupingEntitySet){
        this.groupingEntitySet = groupingEntitySet;
        this.inherit(entityType, name);
      },
      destroy: function(){
        this.inherit();
        delete this.groupingEntitySet;
      }
    });

    var GroupingEntitySet = Class(EntitySet, {
      className: namespace + '.GroupingEntitySet',

      autoDestroyEmptyGroups: false,
      groupSelector: null,

      init: function(entityType, name, groupSelector, entitySet){
        name = 'Grouping ' + name.quote() + ' of ' + (entityType ? entityType.name.quote('{') : 'mixed');

        this.inherit(entityType, name);

        this.entityTypeWraper = this.entityType;
        this.entityType = Function.$self;
        this.groups = {};
        this.entityGroup = {};

        this.setMasterEntitySet(entitySet || entityType.all);
        /*
        this.masterEntitySet = entitySet || entityType.all;
        if (this.masterEntitySet)
        {
          this.masterEntitySet.addHandler(GroupingMasterEntitySetHandler, this);
          this.entityTypeWraper = this.masterEntitySet.entityType;
          //this.setDelegate(this.masterEntitySet);
        }*/

        this.setGroupSelector(groupSelector);
      },
      setMasterEntitySet: function(entitySet){
        if (this.masterEntitySet != entitySet)
        {
          if (this.masterEntitySet)
          {
            this.clear();
            this.masterEntitySet.removeHandler(GroupingMasterEntitySetHandler, this);
            delete this.masterEntitySet;
          }

          if (entitySet)
          {
            this.masterEntitySet = entitySet;
            this.masterEntitySet.addHandler(GroupingMasterEntitySetHandler, this);
            //this.entityType = this.masterEntitySet.entityType;
            this.entityTypeWraper = this.masterEntitySet.entityType;

            if (this.groupSelector)
            {
              GroupingMasterEntitySetHandler.datasetChanged.call(this, null, {
                inserted: this.masterEntitySet.value.map(Data.wrapper('info'))
              });
            }
          }
        }
      },
      setGroupSelector: function(groupSelector){
        groupSelector = Data.getter(groupSelector);
        if (this.groupSelector != groupSelector)
        {
          this.groupSelector = groupSelector;

          if (this.groupSelector && this.masterEntitySet)
            GroupingMasterEntitySetHandler.datasetChanged.call(this, null, {
              updated: this.masterEntitySet.value.map(Data.wrapper('info'))
            });
        }
      },
      getGroup: function(groupId, autocreate){
        var group = this.groups[groupId];
        if (!group && autocreate)
        {
          group = this.groups[groupId] = new GroupEntitySet(this.entityTypeWraper, 'Group set ' + groupId, this);
          this.append(group);
        }
        return group;
      },
      destroy: function(){
        this.setMasterEntitySet();
        /*if (this.masterEntitySet)
        {
          this.masterEntitySet.removeHandler(GroupingMasterEntitySetHandler, this);
          delete this.masterEntitySet;
        }*/

        delete this.entityGroup;
        this.clear();

        for (var groupId in this.groups)
        {
          this.groups[groupId].destroy();
          delete this.groups[groupId];
        }
        delete this.groups;

        this.inherit();
      }
    });

    /*
     * CollectionEntitySet
     */

    var untitledCollection = new UntitledName('Collection');

    var CollectionMasterEntitySetHandler = {
      datasetChanged: function(newValue, delta){
        if (Cleaner.globalDestroy)
          return;

        if (delta.inserted)
          this.append(delta.inserted.map(Data.getter('info')).filter(this.memberSelector));

        if (delta.deleted)
          this.remove(delta.deleted.map(Data.getter('info')).filter(this.memberSelector));

        if (delta.updated)
        {
          var eSet = {};
          for (var i = 0, item; item = delta.updated[i]; i++)
          {
            var entity = item.info;
            if (!eSet[entity.uniqueId])
              eSet[entity.uniqueId] = { items: [] };
            eSet[entity.uniqueId].items.push(entity);
          }

          for (var key in eSet)
          {
            var item = eSet[key].items;
            var entity = item[0];
            var isMember = this.memberSelector(entity);
            if (isMember)
            {
              if (!this.attaches[entity.uniqueId])
                this.append(item);
            }
            else
            {
              if (this.attaches[entity.uniqueId])
                this.remove(item);
            }
          }
        }
      },
      stateChanged: function(object, newState, oldState, errorText){
        this.setState(newState, errorText);
      }
    };

    var CollectionEntitySet = Class(EntitySet, {
      className: namespace + '.CollectionEntitySet',

      memberSelector: null,

      init: function(entityType, name, memberSelector, entitySet){
        this.inherit(entityType, name);

        this.name = 'Collection ' + name.quote() + ' of ' + (entityType ? entityType.name.quote('{') : 'mixed');

        this.entityTypeWraper = this.entityType;
        this.entityType = Function.$self;

        this.setMasterEntitySet(entitySet || (entityType ? entityType.all : null));
        /*
        this.masterEntitySet = entitySet || (entityType ? entityType.all : null);
        if (this.masterEntitySet)
        {
          this.masterEntitySet.addHandler(CollectionMasterEntitySetHandler, this);
          this.entityType = this.masterEntitySet.entityType;
          //this.setDelegate(this.masterEntitySet);
        }*/

        this.setMemberSelector(memberSelector);
      },
      setMasterEntitySet: function(entitySet){
        if (this.masterEntitySet != entitySet)
        {
          if (this.masterEntitySet)
          {
            this.clear();
            this.masterEntitySet.removeHandler(CollectionMasterEntitySetHandler, this);
            delete this.masterEntitySet;
          }

          if (entitySet)
          {
            this.masterEntitySet = entitySet;
            this.masterEntitySet.addHandler(CollectionMasterEntitySetHandler, this);
            this.entityType = this.masterEntitySet.entityType;

            if (this.memberSelector)
            {
              CollectionMasterEntitySetHandler.datasetChanged.call(this, null, {
                inserted: this.masterEntitySet.value.map(Data.wrapper('info'))
              });
            }
          }
        }
      },
      setMemberSelector: function(memberSelector){
        memberSelector = Data.getter(memberSelector);
        if (this.memberSelector != memberSelector)
        {
          this.memberSelector = memberSelector;

          if (this.memberSelector && this.masterEntitySet)
          {
            CollectionMasterEntitySetHandler.datasetChanged.call(this, null, {
              updated: this.masterEntitySet.value.map(Data.wrapper('info'))
            });
          }
        }
      },
      destroy: function(){
        this.setMasterEntitySet();/*
        if (this.masterEntitySet)
        {
          this.masterEntitySet.removeHandler(CollectionMasterEntitySetHandler, this);
          delete this.masterEntitySet;
        }*/

        this.inherit();
      }
    });

    /*
     *  EntityType
     */

    var EntityType = function(config){
      if (this instanceof EntityType)
      {
        var result = function(newData, entity){
          //return entityType.parse(data, true);

          if (arguments.length && newData != null)
          {
            if (newData.entityType == entityType)
              return newData;
            //console.log('create/update entity', data, entity instanceof Entity);
            var data = newData instanceof AbstractProperty ? newData._value : newData;
            var parse = false;
            if (!(entity instanceof Entity))
              parse = true;
            else
              if (data != entity)
              {
                if ((typeof data == 'number' || typeof data == 'string') && entityType.idField)
                  parse = true;
                else
                {
                  if (entity)
                  {
                    var id = entityType.getId(data);
                    parse = id != null && id != entity.getId();
                  }
                }
                //entity = entityType.parse(data instanceof AbstractProperty ? data.value : data, false);
              }

            if (parse || !entity)
              entity = entityType.parse(data, true);
            else
              entity.update(data);

            return entity;
          }
          else
            return null;
        };

        var entityType = new InternalEntityType(config, result);

        extend(result, {
          getConfig: function(){
            var result = {
              id: entityType.idField,
              name: entityType.name,
              fields: {},
              aliases: {},
              reflection: {}
            };
            for (var key in entityType.fields)
              result.fields[key] = {
                wraper: entityType.fields[key],
                defaultValue: entityType.defaults[key]
              };
            for (var key in entityType._reflection)
              result.reflection[key] = {
                description: 'todo...'
              };
            for (var key in entityType.aliases)
              result.aliases[key] = entityType.aliases[key];

            return result;
          },
          get: function(data){
            return entityType.getEntity(data);
          },
          getAll: function(){
            return Array.from(entityType.all.value);
          },
          addField: function(key, wraper){
            entityType.addField(key, wraper);
          },
          all: entityType.all,
          createCollection: function(name, memberSelector, entitySet){
            var collection = entityType._collection[name];

            if (!collection && memberSelector)
              collection = entityType._collection[name] = new CollectionEntitySet(entityType, name, memberSelector, entitySet);

            return entityType._collection[name];
          },
          getCollection: function(name){
            return entityType._collection[name];
          },
          createGrouping: function(name, groupSelector, entitySet){
            ;;;if (name == '*') return entityType._grouping;

            var grouping = entityType._grouping[name];

            if (!grouping && groupSelector)
              grouping = entityType._grouping[name] = new GroupingEntitySet(entityType, name, groupSelector, entitySet);

            return grouping;
          },
          getGrouping: function(name){
            return entityType._grouping[name];
          }
        });

        // debug only
        ;;;
         result.entityType = entityType;
        result.callText = function(){ return entityType.name };

        return result;
      }
      //else
      //  return namedEntityTypes.get(config);
    };
    EntityType.className = namespace + '.EntityType';

    var untitledEntityType = new UntitledName('EntityType');
    var entityTypes = [];

    var Reflection = Class(null, {
      className: namespace + '.Reflection',
      init: function(name, config){
        this.name = name;
        this.keepReflectionAlive = config.keepReflectionAlive === true;
        this.dataGetter = config.dataGetter || Function.$self;
        this.destroyDataGetter = config.destroyDataGetter || null;
        this.entityType = config.entityType || Function.$self;
        this.isExists = config.isExists || function(value){ return Boollean.normalize(keys(value).length) };
      },
      update: function(entity){
        if (this.isExists(entity.value, entity))
          this.attach(entity, this.name);
        else
          this.detach(entity, this.name);
      },
      attach: function(entity){
        var ref = entity._reflection[this.name];
        var data = this.dataGetter(entity.value, entity);
        if (ref)
        {
          if (typeof ref.update == 'function')
            ref.update(data);
          else
            extend(ref, data);
        }
        else
          entity._reflection[this.name] = this.entityType(data);
      },
      detach: function(entity){
        var ref = entity._reflection[this.name];
        if (ref)
        {
          if (!this.keepReflectionAlive)
          {
            if (typeof ref.destroy == 'function')
              ref.destroy();
          }
          else
          {
            if (this.destroyDataGetter)
            {
              var data = this.destroyDataGetter(entity.value, entity);
              if (typeof ref.update == 'function')
                ref.update(data);
              else
                extend(ref, data);
            }
          }
          delete entity._reflection[this.name];
        }
      },
      destroy: function(){
      }
    });

    var InternalEntityType = Class(null, {
      className: namespace + '.EntityType',
      name: 'UntitledEntityType',

      defaults: {},
      fields: {},
      extensible: false,

      init: function(config, wraper){
        this.name = config.name || untitledEntityType.getName();
        this.config  = extend({}, config);

        ;;;if (typeof console != 'undefined' && entityTypes.search(this.name, Data('name'))) console.warn('Dublicate entity name: ', this.name);
        entityTypes.push(this);

        this.idField = config.id;
        this.wraper   = wraper;
        this.handlers = config.handlers;

        this.all = new EntitySet(this, 'All entities of ' + this.name.quote('{'));
        eReadOnly[this.all.uniqueId] = true;
        this.identifiedEntity = {};

        if (config.extensible)
          this.extensible = true;

        this.defaults  = {};
        this.fields = {};
        if (config.fields)
          for (var key in config.fields)
            this.addField(key, config.fields[key]);

        this.aliases = {};
        if (config.aliases)
          extend(this.aliases, config.aliases);

        this._collection = {};
        if (config.collections)
          for (var name in config.collections)
            this._collection[name] = new CollectionEntitySet(this, name, config.collections[name] || Function.$true);

        this._grouping = {};
        if (config.groupings)
          for (var name in config.groupings)
            this._grouping[name] = new GroupingEntitySet(this, name, config.groupings[name] || Function.$true);

        this._reflection = {};
        if (config.reflections)
          for (var name in config.reflections)
            this.addReflection(name, config.reflections[name]);

        this.entityClass = Class(Entity, {
          className: Entity.prototype.className + '.' + this.name,
          entityType: this,
          all: this.all
        });

        if (config.dirty)
          this.entityClass.prototype.dirty = true;
      },
      addField: function(key, wraper){
        if (typeof wraper == 'function')
        {
          this.fields[key] = wraper;
          this.defaults[key] = this.fields[key]();
        }
        else
        {
          ;;;if (typeof console != 'undefined') console.warn('(debug) EntityType ' + this.name + ': Field wraper for `' + key + '` field is not a function. Field description has been ignored. Wraper: ', wraper);
          this.fields[key] = Function.$self;
          this.defaults[key] = this.defaults[key]; // init key
        }
      },
      addReflection: function(name, cfg){
        var ref = this._reflection[name] = new Reflection(name, cfg);
        for (var i = this.all.value.length; --i >= 0;)
          ref.update(this.all.value[i]);
      },
      getEntity: function(data){
        return this.identifiedEntity[typeof data == 'number' || typeof data == 'string' ? data : this.getId(data)];
      },
      createEntity: function(data){
        return new this.entityClass(data);
      },
      parse: function(data, autocreate){
        if (data && data.entityType === this)
          return data;

        var entity = this.getEntity(data);
        var isKeyValue = typeof data == 'number' || typeof data == 'string';

        if (!entity)
        {
          if (isKeyValue)
            if (this.idField)
            {
              //data = Data.wrapper(this.idField)(data);
              var tmp = {};
              tmp[this.idField] = data;
              data = tmp;
            }
            else
              return;

          if (autocreate != false)
            entity = this.createEntity(data);
        }
        else
          if (!isKeyValue && (entity !== data))
            entity.update(data);

        return entity;
      },
      getId: function(entityOrData){
        if (entityOrData)
        {
          if (entityOrData.entityType)
            return entityOrData.value[this.idField];
          else
            return entityOrData[this.idField];
        }
      }
    });

    /*
     *  Entity
     */

    function entityWarn(entity, message){
      ;;;if (typeof console != 'undefined') console.warn('(debug) Entity ' + entity.entityType.name + '#' + entity.uniqueId + ': ' + message, entity); 
    };

    var Entity = Class(Property, {
      className: namespace + '.Entity',

      rollbackData: null,
      cascadeDestroy: true,

      dirty: false,

      /*setDelegate: function(){
        console.log('used');
        this.inherit.apply(this, arguments);
      },*/

      behaviour: nsWrapers.createBehaviour(Property, {
        change: function(newValue, oldValue, delta){
          for (var name in this.entityType._reflection)
            this.entityType._reflection[name].update(this);
        },
        destroy: function(){
          for (var name in this._reflection)
            this.entityType._reflection[name].detach(this);
        },
        delegateChanged: function(object, oldDelegate){
          this.inherit(object, oldDelegate);
          this.info = this;
        },
        stateChanged: function(object, newState, oldState, errorText){
          this.inherit(object, newState, oldState, errorText);
          if (newState == STATE.READY)
            this.rollbackData = null;
        }
      }),

      init: function(data){
        eGlobalStorage[this.uniqueId = eUniqueId++] = this;

        this.inherit(extend({}, this.entityType.defaults), this.entityType.handlers);
        this.updateCount = 0;
        this.attachedHandlers = {};

        this.info = this;
        this._value = this.value;

        this.__silentSet = true;
        if (data)
          for (var key in data)
            this.set(key, data[key]);
        this.__silentSet = false;

        eReadOnlyWriteAllow = true;
        this.entityType.all.append([this]);
        eReadOnlyWriteAllow = false;

        this._reflection = {};
        for (var name in this.entityType._reflection)
          this.entityType._reflection[name].update(this);
      },
      toString: function(){
        return '[object Entity]';
      },
      getId: function(data){
        return this.entityType.getId(data || this);
      },
      get: function(key){
        if (this.value)
          return this.value[this.entityType.aliases[key] || key];
      },
      set: function(key, value, rollback){
        // omit method, to prevent data rewrite

        key = this.entityType.aliases[key] || key;

        var wraper = this.entityType.fields[key];
        if (!wraper)
        {
          if (!this.entityType.extensible)
          {
            ;;;if (!this.dirty) entityWarn(this, 'Set value for "' + key + '" property ignored');
            return;
          }
          wraper = Function.$self;
        }

        this.__nested_trigger = true;

        var result;
        var nestedUpdateCount;
        var curValue = this.value[key];
        if (curValue)
          nestedUpdateCount = curValue.updateCount;

        var newValue = wraper(value, curValue);

        this.__nested_trigger = false;

        var valueChanged = newValue !== curValue;

        if (valueChanged && newValue instanceof Date && curValue instanceof Date)
          valueChanged = newValue - curValue;

        if (valueChanged)
        {
          if (this.entityType.idField == key)
          {
            var keyEntity = this.entityType.identifiedEntity[newValue];
            if (keyEntity && keyEntity !== this)
            {
              ;;;entityWarn(this, 'Duplicate entity ID (entity.set() aborted) ' + this.value[key] + ' => ' + newValue);
              return;
            }

            if (typeof newValue != 'undefined' && newValue != null)
              this.entityType.identifiedEntity[newValue] = this;
            delete this.entityType.identifiedEntity[curValue];
          }

          if (this.attachedHandlers[key])
          {
            this.attachedHandlers[key].object.removeHandler(this.attachedHandlers[key].handler, this);
            delete this.attachedHandlers[key];
          }

          // newValue !== this prevent recursion for self update
          if (newValue !== this && newValue instanceof AbstractProperty)
          {
            this.attachedHandlers[key] = {
              object: newValue,
              handler: {
                change: function(){
                  if (!this.__nested_trigger)
                    this.dispatch('change', this.value, this.value, {});
                },
                datasetChanged: function(){
                  if (!this.__nested_trigger)
                  {
                    //;;;if (typeof console != 'undefined') console.warn('We needs to do something here?');
                    this.dispatch('change', this.value, this.value, {});
                  }
                },
                destroy: function(){
                  var u = {};
                  u[key] = null;
                  this.update(u);
                }
              }
            };
            newValue.addHandler(this.attachedHandlers[key].handler, this);
          }

          this.value[key] = newValue;
          this.updateCount++;

          result = { key: key, value: curValue };

          var delta = {};
          delta[key] = curValue;

          if (rollback)
            this.rollbackData = complete(this.rollbackData || {}, delta);

          if (!this.__silentSet)
            this.dispatch('change', this.value, [this.value, delta].merge(), delta);
        }
        else
          // nested updated
          if (newValue && newValue.updateCount != nestedUpdateCount)
            this.updateCount++;

        return result;
      },
      rollback: function(){
        if (this.state == STATE.PROCESSING)
        {
          ;;;entityWarn(this, 'Entity in processing state (entity.rollback() aborted)');
          return;
        }

        if (this.rollbackData)
        {
          this.update(this.rollbackData);
          this.rollbackData = null;
        }
        this.setState(STATE.READY);
      },
      update: function(data, forceEvent, rollback){
        var updateCount = this.updateCount;
        var delta = {};
        var keySet = data || this.value;
        var res;

        if (!data)
          data = this.entityType.defaults;

        this.__silentSet = true;
        for (var key in keySet)
          if (res = this.set(key, data[key], rollback))
            delta[res.key] = res.value;
        this.__silentSet = false;

        if (forceEvent || (this.updateCount != updateCount))
          this.dispatch('change', this.value, [this.value, delta].merge(), delta);

        return this.updateCount != updateCount ? delta : false;
      },
      clear: function(){
        var data = {};
        for (var key in this.value)
          data[key] = undefined;
        return this.update(data);
      },
      destroy: function(){
        // prevent call this method again
        this.destroy = Function.$undef;

        // delete from identify hash
        var id = this.getId();
        if (this.entityType.identifiedEntity[id] === this)
          delete this.entityType.identifiedEntity[id];
        eReadOnlyWriteAllow = true;
        this.entityType.all.remove(this);
        eReadOnlyWriteAllow = false;

        // unlink attached handlers
        for (var key in this.attachedHandlers)
        {
          this.attachedHandlers[key].object.removeHandler(this.attachedHandlers[key].handler, this);
          delete this.attachedHandlers[key];
        }
        delete this.attachedHandlers;

        // fire object destroy event handlers, primary for linked objects
        this.dispatch('destroy', this);

        //
        var tmp = this.value;
        this.dispatch('change', this.value = {}, tmp, {});

        // inherit
        this.dispatch = Function.$undef;
        this.inherit();

        delete eGlobalStorage[this.uniqueId];

        delete this._group;
        delete this.entityType;

        delete this.info;
        delete this._value;
      }
    });

    function stat(){
      return entityTypes.reduce(function(item, res){
        res[item.name] = item.all.value.length;
        return res;
      }, {});
    };

    function isEntity(value, entityType){
      //entityType = entityType ? (entityType.entityType ? entityType.entityType.wraper : entityType) : null;
      //return value instanceof Entity && (entityType ? value.entityType == entityType || value.entityType == entityType.entityType : true);
      entityType = (entityType ? (entityType.entityType ? entityType.entityType.entityClass : entityType.entityClass) : Entity);
      return value instanceof entityType;
    }

    //
    // export names
    //

    var exportNames = {
      Entity: Entity,
      EntityType: EntityType,
      EntitySetType: EntitySetType,
      EntitySet: EntitySet,
      CollectionEntitySet: CollectionEntitySet,
      GroupingEntitySet: GroupingEntitySet,
      GroupEntitySet: GroupEntitySet,
      stat: stat,
      isEntity: isEntity
    };

    ;;;Object.extend(exportNames, { entityTypes_: entityTypes, InternalEntityType_: InternalEntityType });

    Basis.namespace(namespace).extend(exportNames);

  })();
