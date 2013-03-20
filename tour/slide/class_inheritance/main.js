var Human = basis.Class(null, { // use null if no ancestor class
  name: 'no name',
  init: function(name){ // calls once, when instance creates
    this.name = name;
  },
  say: function(){
    return 'My name is {0}.'.format(this.name);
  }
});

var Gamer = basis.Class(Human, {
  level: 0,
  init: function(name, level){
    Human.prototype.init.call(this, name);
    this.level = level;
  },
  say: function(){
    return Human.prototype.say.call(this) + ' I\'m {0} level.'.format(this.level);
  }
});

var john = new Human('John');
var mario = new Gamer('Super Mario', 99);

console.log('John says:', john.say()); // My name is John.
console.log('Mario says:', mario.say()); // My name is Super Mario. I'm 99 level.
console.log(mario instanceof Human); // true
console.log(mario instanceof Gamer); // true