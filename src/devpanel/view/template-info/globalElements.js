var history = [];

function initGlobalElements(data){
  data.output.addHandler({
    change: function(){
      if (!this.value.object) {
        return;
      }

      history.unshift(this.value.object);
      history.length = 4;

      history.forEach(function(element, position){
        window['_' + position] = element;
      });
    }
  });
}

module.exports = {
  init: initGlobalElements
};
