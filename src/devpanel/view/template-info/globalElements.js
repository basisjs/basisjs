var MAX_HISTORY_SIZE = 4;
var PRECEDING_SYMBOL = '_';
var history = [];

function initGlobalElements(data){
  data.output.addHandler({
    change: function(){
      if (!this.value.object) {
        return;
      }

      history.unshift(this.value.object);
      history.length = MAX_HISTORY_SIZE;

      history.forEach(function(element, position){
        window[PRECEDING_SYMBOL + position] = element;
      });
    }
  });
}

module.exports = {
  init: initGlobalElements
};
