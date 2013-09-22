
  function resolveGetter(getter){
    if (getter.basisGetterId_ > 0)
    {
      var result = 'getter(';

      if (typeof getter.base == 'string')
        result += '"' + getter.base.replace(/"/g, '\\"') + '"';
      else
      {
        if (!getter.mod)
          return resolveGetter(getter.base);
        else
          result += resolveGetter(getter.base);
      }

      if (getter.mod)
      {
        if (typeof getter.mod == 'string')
          result += ', "' + getter.mod.replace(/"/g, '\\"') + '"';
        else
          result += ', ' + resolveGetter(getter.mod);
      }

      return result + ')';
    }
    else
      return Function.prototype.toString.call(getter);
  }


 /**
  * @param {function} fn Function to analyze
  * @return {object} Info about function
  */
  function functionInfo(fn){
    var source = Function.prototype.toString.call(fn);
    var m = source.match(/^\s*function(\s+\S+)?\s*\((\s*(?:\S+|\/\*[^*]+\*\/)(\s*(?:,\s*\S+|\/\*[^*]+\*\/))*\s*)?\)/);
    var body = source.replace(/^\s*\(?\s*function[^(]*\([^\)]*\)[^{]*\{|\}\s*\)?\s*$/g, '');
    var getter = resolveGetter(fn);
    var args = (m && m[2] || '').replace(/\s*,\s*/g, ', ')

    if (!m)
      basis.dev.log('Function parse error: ' + source);

    return {
      source: source,
      name: (m && m[1] || 'anonymous').trim(),
      fullname: name + '(' + args + ')',
      args: args,
      body: body,
      getter: getter != source ? getter : false
    };
  }


  //
  // export names
  //

  module.exports = {
    fn: functionInfo
  };
