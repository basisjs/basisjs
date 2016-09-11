module.exports = {
  name: 'basis.type',
  test: [
    require('./type/string.js'),
    require('./type/number.js'),
    require('./type/int.js'),
    require('./type/enum.js'),
    require('./type/array.js'),
    require('./type/object.js'),
    require('./type/date.js'),
    {
      name: 'definition of new types',
      init: function(){
        var basis = window.basis.createSandbox();
        var type = basis.require('basis.type');
        var catchWarnings = basis.require('./helpers/common.js').catchWarnings;
      },
      test: [
        {
          name: 'simple case',
          test: function(){
            var any = function(value){
              return value;
            };

            type.defineType('Any', any);

            assert(type.getTypeByName('Any') === any);
          }
        },
        {
          name: 'corner case',
          test: function(){
            var toStringType = type.getTypeByName('toString');

            var warned = catchWarnings(function(){
              toStringType({});
            });

            assert(warned);
            assert(type.getTypeByNameIfDefined('toString') === undefined);

            type.defineType('toString', basis.fn.$self);

            var warnedAgain = catchWarnings(function(){
              toStringType({});
            });

            assert(!warnedAgain);
            assert(type.getTypeByNameIfDefined('toString') === basis.fn.$self);
          }
        },
        {
          name: 'deferred type definition',
          test: function(){
            var DeferredType = type.getTypeByName('DeferredType');

            var warnedBefore = catchWarnings(function(){
              assert(DeferredType('234.55') === undefined);
            });

            assert(warnedBefore);

            type.defineType('DeferredType', type.int);

            var warnedAfter = catchWarnings(function(){
              assert(DeferredType('234.55') === 234);
            });

            assert(warnedAfter === false);
          }
        },
        {
          name: 'deffered type definition with specifying type host',
          test: function(){
            var typeHost = {};

            var HostedType = type.getTypeByName('HostedType', typeHost, 'someType');

            var warnedBefore = catchWarnings(function(){
              assert(HostedType('234.55') === undefined);
            });

            assert(warnedBefore);

            type.defineType('HostedType', type.number);

            var warnedAfter = catchWarnings(function(){
              assert(HostedType('234.55') === 234.55);
            });

            assert(warnedAfter === false);
            assert(typeHost.someType === type.number);
          }
        },
        {
          name: 'double define',
          test: function(){
            var DoubleTypeA = type.defineType('DoubleType', type.string);

            var DoubleTypeB;

            var warned = catchWarnings(function(){
              var DoubleTypeB = type.defineType('DoubleType', type.date);
            });

            assert(warned);
            assert(type.getTypeByName('DoubleType') === type.date);
          }
        },
        {
          name: 'type definition with non string value',
          test: function(){
            var warned = catchWarnings(function(){
              var Three = type.defineType(3, type.object);
            });

            assert(warned);
          }
        },
        {
          name: 'validation',
          test: function(){
            var StringType = type.getTypeByName('StringType');
            var NumberType = type.getTypeByName('NumberType');

            type.defineType('StringType', type.string);

            var warned = catchWarnings(function(){
              type.validate();
            });

            assert(warned);

            type.defineType('NumberType', type.number);

            var warnedAgain = catchWarnings(function(){
              type.validate();
            });

            assert(!warnedAgain);
          }
        }
      ]
    }
  ]
};
