function catchWarnings(fn){
  var warn = basis.dev.warn;
  var warnings = [];

  try {
    basis.dev.warn = function(message){
      warnings.push(message);
    };

    fn();
  } finally {
    basis.dev.warn = warn;
  }

  return warnings.length ? warnings : false;
}

module.exports = {
  catchWarnings: catchWarnings
};
