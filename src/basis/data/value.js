
 /**
  * Namespace overview:
  * - {basis.data.value.Property}
  * - {basis.data.value.ObjectSet}
  * - {basis.data.value.Expression}
  *
  * @see ./demo/data/basic.html
  *
  * @namespace basis.data.value
  */

  var namespace = 'basis.data.value';


  // import names

  var basisData = require('basis.data');
  var Value = basisData.Value;
  var ObjectSet = require('./ObjectSet.js');
  var Expression = require('./Expression.js');


 /**
  * @class
  */
  var Property = Value.subclass({
    className: namespace + '.Property',

    // use custom constructor
    extendConstructor_: false,

   /**
    * @param {object} initValue Initial value for object.
    * @param {object=} handler
    * @param {function()=} proxy
    * @constructor
    */
    init: function(initValue, handler, proxy){
      this.value = initValue;
      this.handler = handler;
      this.proxy = proxy;

      Value.prototype.init.call(this);
    }
  });



  //
  // export names
  //

  module.exports = {
    Property: Property,
    ObjectSet: ObjectSet,
    Expression: Expression,
    expression: Expression.create
  };
