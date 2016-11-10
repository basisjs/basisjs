var MAX_HISTORY_SIZE = 4;
var PREFIX = '$b';
var history = [];

var ELEMENT_DESTROY_HANDLER = {
  destroy: function(){
    for (var position = 0; position < history.length; position++){
      if (history[position] == this){
        global[PREFIX + position] = history[position] = null;
      }
    }
  }
};

function initGlobalElements(data){
  data.output.addHandler({
    change: function(){
      var addCandidate = this.value.object;

      if (!addCandidate || history[0] == addCandidate){
        return;
      }

      history.unshift(addCandidate);
      addCandidate.addHandler(ELEMENT_DESTROY_HANDLER);

      if (history.length > MAX_HISTORY_SIZE){
        var deleteCandidate = history.pop();

        if (deleteCandidate){
          deleteCandidate.removeHandler(ELEMENT_DESTROY_HANDLER);
        }
      }

      history.forEach(function(element, position){
        global[PREFIX + position] = element;
      });
    }
  });
}

module.exports = {
  init: initGlobalElements
};
