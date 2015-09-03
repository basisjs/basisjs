module.exports = {
  name: 'nsEntity',

  sandbox: true,
  init: function(){
    var basis = window.basis.createSandbox();

    var dateUtils = basis.require('basis.date');
    var nsData = basis.require('basis.data');
    var nsEntity = basis.require('basis.entity');
    var createType = nsEntity.createType;
    var createSetType = nsEntity.createSetType;
    var basisEvents = basis.require('basis.event').events;
    var Filter = basis.require('basis.data.dataset').Filter;

    var catchWarnings = basis.require('./helpers/common.js').catchWarnings;

    (function(){
      var init_ = nsEntity.BaseEntity.prototype.init;
      nsEntity.BaseEntity.prototype.init = function(){
        this.history_ = [];
        this.historyAll_ = [];
        init_.apply(this, arguments);
      };

      nsEntity.BaseEntity.prototype.emit_update = function(delta){
        this.history_.push(delta);
        this.historyAll_.push(['update'].concat([this].concat(basis.array.from(arguments))));
        basisEvents.update.call(this, delta);
      };

      nsEntity.BaseEntity.prototype.emit_rollbackUpdate = function(delta){
        this.historyAll_.push(['rollbackUpdate'].concat([this].concat(basis.array.from(arguments))));
        basisEvents.rollbackUpdate.call(this, delta);
      };
    })();

    function resetHistory(obj){
      obj.history_ = [];
      obj.historyAll_ = [];
    }

    function rollbackEvents(entity){
      return entity.historyAll_.filter(function(arg){
        return arg[0] == 'rollbackUpdate';
      });
    }

    function getIds(dataset){
      return dataset instanceof nsData.ReadOnlyDataset ? dataset.getValues('data.id').sort() : null;
    }
  },

  test: [
    require('./entity/create.js'),
    require('./entity/rollback.js'),
    require('./entity/index.js'),
    require('./entity/field-types.js'),
    require('./entity/entity-set.js'),
    require('./entity/helpers.js')
  ]
};
