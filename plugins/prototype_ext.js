
(function(){

  Object.extend(Array.prototype, {
    clone: function(){
      return Array.from(this);
    },
    unique: function(sorted){
      if (!this.length)
        return [];

      var source, result;

      if (sorted)
        // no source array copy, no array sorting
        // O = N
        result = [(source = this)[0]];
      else
        // copy source array, sort copy of array
        // O = N*log(N)
        source = result = Array.from(this).sort(function(a, b){
          if (a === b) return 0;
          else return typeof a == typeof b ? a > b || -1 : typeof a > typeof b || -1;
        });

      for (var i = 1, k = 0; i < source.length; i++)
        if (result[k] !== source[i])
          result[++k] = source[i];
      result.length = k + 1;

      return result;
    },
    collapse: function(callback, thisObject){
      var len = this.length;
      for (var i = 0, k = 0; i < len; i++)
        if (!callback.call(thisObject, this[i], i, this))
          this[k++] = this[i];
      this.length = k;
      return this;
    },
    exclude: function(array){
      return this.filter(this.absent, array);
    },
    binarySearchIntervalPos: function(value, leftGetter, rightGetter, strong, left, right){
      if (!this.length)  // empty array check
        return -1;

      leftGetter  = getter(leftGetter || $self);
      rightGetter = getter(rightGetter || $self);

      var pos, compareValue;
      var l = isNaN(left) ? 0 : left;
      var r = isNaN(right) ? this.length - 1 : right;
      var lv, rv;

      // binary search
      do 
      {
        compareValue = this[pos = (l + r) >> 1];
        if (value < (lv = leftGetter(compareValue)))
          r = pos - 1;
        else 
          if (value > (rv = rightGetter(compareValue)))
            l = pos + 1;
          else
            return value >= lv && value <= rv ? pos : -1; // founded element
                                                          // -1 returns when it seems as founded element,
                                                          // but not equal (array item or value looked for have wrong data type for compare)
      }
      while (l <= r);

      return strong ? -1 : pos + (rightGetter(compareValue) < value);
    },
    binarySearchInterval: function(value, leftGetter, rightGetter){
      return this.binarySearchIntervalPos(value, leftGetter, rightGetter, true);
    },
    // array comparators
    equal: function(array){
      return this.length == array.length && this.every(function(item, index){ return item === array[index] });
    }
  });

  Object.extend(String.prototype, {
    ellipsis: function(length){
      var str = this.substr(0, length || 0);
      return this.length > str.length ? str + '\u2026' : str;
    }
  });

});