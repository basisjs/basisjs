var Value = require('basis.data').Value;

module.exports = {
  pageLoadTime: new Value({ value: 0 }),
  walkTime: new Value({ value: 0 }),
  walkCount: new Value({ value: 0 }),
  tokenCount: new Value({ value: 0 }),
  initTime: new Value({ value: 0 })
};
