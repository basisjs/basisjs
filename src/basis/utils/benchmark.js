var host = typeof performance !== 'undefined' ? performance : Date;
var nowMethod = 'webkitNow' in host ? 'webkitNow' : 'now';

module.exports = {
  time: function(time){
    return !arguments.length ? host[nowMethod]() : parseInt(host[nowMethod]() - time);
  },
  test: function(times, fn){
    var t = this.time();

    for (var i = 0; i < times; i++)
      fn(i);

    return this.time(t);
  }
};
