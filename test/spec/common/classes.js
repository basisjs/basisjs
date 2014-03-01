module.exports = {
  name: 'basis.classes',
  init: function(){
    basis.require('basis.all');
  },

  // TODO: generate tests one per class
  test: function(){
    for (var i = 0; i < basis.Class.all_.length; i++)
    {
      var Cls = basis.Class.all_[i];
      try {
        var instance = new Cls();

        for (var name in instance)
          if (name in instance.constructor.prototype == false)
            this.is(true, 'Property ' + name + ' not in ' + Cls.className + '.prototype');
      } catch(e) {
        this.is(null, Cls.className + ': ' + e.message);
      }
    }
  }
};
