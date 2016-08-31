var MAX_HISTORY_SIZE = 4;
var PREFIX = '$b';
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
        global[PREFIX + position] = element;
      });
    }
  });
}

module.exports = {
  init: initGlobalElements
};
