var Human = basis.Class(null, { // you can use basis.Class instead of null
  name: 'no name',
  init: function(name){ // special method - constructor
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

console.log(john.say()); // My name is John.
console.log(mario.say()); // My name is Super Mario. I'm 99 level.
console.log(mario instanceof basis.Class); // false (for some reasons it false now)
console.log(mario instanceof Human); // true
console.log(mario instanceof Gamer); // true