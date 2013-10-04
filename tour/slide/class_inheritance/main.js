var Human = basis.Class(null, {
  name: 'no name',
  init: function(name){
    this.name = name;
  },
  say: function(){
    return 'My name is ' + this.name;
  }
});

var Gamer = basis.Class(Human, {
  level: 0,
  init: function(name, level){
    Human.prototype.init.call(this, name);
    this.level = level;
  },
  say: function(){
    return Human.prototype.say.call(this) +
      ' I\'m ' + this.level + ' level.';
  }
});

var john = new Human('John');
var mario = new Gamer('Super Mario', 99);

console.log('John says:', john.say()); // My name is John.
console.log('Mario says:', mario.say()); // My name is Super Mario. I'm 99 level.
console.log(mario instanceof Human); // true
console.log(mario instanceof Gamer); // true