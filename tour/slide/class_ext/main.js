var Creature = basis.Class(null, {
  extendConstructor_: true,
  headClass: basis.Class(null, {
    parts: basis.Class.extensibleProperty({
      eye: 2,
      ear: 2,
      nose: 1,
      mouth: 1
    })
  }),
  init: function(){
    this.head = new this.headClass();
  },
  destroy: function(){
    this.head.destroy();
    this.head = null;
  }
});

var Cyclops = Creature.subclass({
  headClass: {  // we can omit Creature.prototype.headClass.subclass() here
                // because classes has __extend__ property
    parts: {
      eye: 1,
      ugly: true
    }
  }
});


var creature = new Creature();
var cyclops = new Cyclops();
var pirat = new Creature({
  headClass: { // the same rules for config, as for class creation
    parts: {
      eye: 1,
      ear: 1,
      hat: true
    }
  }
});

console.log('creature head:', tour.plainStr(creature.head.parts));
console.log('cyclops head:', tour.plainStr(cyclops.head.parts));
console.log('pirat head:', tour.plainStr(pirat.head.parts));