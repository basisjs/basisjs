module.exports = {
  name: 'UI Field',
  test: [
    {
      sandbox: true,
      name: 'changing validators',
      init: function(){
        var ValidatorError = basis.require('basis.ui.field').ValidatorError;
        var TextField = basis.require('basis.ui.field').Text;
      },
      test: [
        {
          name: 'simple attaching/detaching',
          test: function(){
            function emptyValidator(){}

            function failingValidator(){
              return error;
            }

            var field = new TextField({
              validators: [
                emptyValidator
              ]
            });

            var error = new ValidatorError(field, failingValidator);

            assert(field.validate() === undefined);

            field.attachValidator(failingValidator);

            assert(field.validate() === error);

            field.detachValidator(failingValidator);

            assert(field.validate() === undefined);
          }
        },
        {
          name: 'calls sequence - adding to the end',
          test: function(){
            var callsLog = [];

            function firstValidator(){
              callsLog.push('first');
            }

            function secondValidator(){
              callsLog.push('second');
            }

            var field = new TextField({
              validators: [
                firstValidator
              ]
            });

            field.attachValidator(secondValidator);
            field.validate();

            assert.deep(['first', 'second'], callsLog);
          }
        },
        {
          name: 'calls sequence - adding to the beginning',
          test: function(){
            var callsLog = [];

            function firstValidator(){
              callsLog.push('first');
            }

            function secondValidator(){
              callsLog.push('second');
            }

            var field = new TextField({
              validators: [
                secondValidator
              ]
            });

            field.attachValidator(firstValidator, false, true);
            field.validate();

            assert.deep(['first', 'second'], callsLog);
          }
        },
        {
          name: 'multiple attaching',
          test: function(){
            function emptyValidator(){}

            var callCount = 0;
            function loggingValidator(){
              callCount++;
            }

            var field = new TextField({
              validators: [
                emptyValidator
              ]
            });

            for (var idx = 0; idx < 3; idx++)
              field.attachValidator(loggingValidator);

            field.validate();

            assert(callCount === 1);

            callCount = 0;
            field.detachValidator(loggingValidator);
            field.validate();

            assert(callCount === 0);
          }
        },
        {
          name: 'validatorsModified event',
          test: function(){
            function firstValidator(){}
            function secondValidator(){}

            var eventsCount = 0;
            var lastDelta;

            var field = new TextField({
              validators: [
                firstValidator
              ],
              handler: {
                validatorsChanged: function(sender, delta){
                  eventsCount++;
                  lastDelta = delta;
                }
              }
            });

            assert(eventsCount === 0);

            field.attachValidator(secondValidator);

            assert(eventsCount === 1);

            field.attachValidator(secondValidator);

            assert(eventsCount === 1);
            assert({ inserted: secondValidator }, lastDelta);

            field.detachValidator(secondValidator);

            assert(eventsCount === 2);
            assert({ deleted: secondValidator }, lastDelta);

            field.detachValidator(secondValidator);

            assert(eventsCount === 2);
          }
        },
        {
          name: 'attach/detach and validate',
          test: function(){
            function unoValidator(){}

            var validatesCount = 0;

            var field = new TextField({
              validate: function(){
                validatesCount++;
              }
            });

            field.attachValidator(unoValidator, true);

            assert(validatesCount === 1);

            field.attachValidator(unoValidator, true);

            assert(validatesCount === 1);

            field.detachValidator(unoValidator, true);

            assert(validatesCount === 2);

            field.detachValidator(unoValidator, true);

            assert(validatesCount === 2);
          }
        }
      ]
    },
    {
      sandbox: true,
      name: 'required property',
      init: function(){
        var Value = basis.require('basis.data').Value;
        var validator = basis.require('basis.ui.field').validator;
        var ValidatorError = basis.require('basis.ui.field').ValidatorError;
        var TextField = basis.require('basis.ui.field').Text;

        var field;

        function validationPasses(){
          return !field.validate();
        }
      },
      test: [
        {
          name: 'by default',
          test: function(){
            field = new TextField({});

            assert(validationPasses());
          }
        },
        {
          name: 'required: true',
          test: function(){
            field = new TextField({
              required: true
            });

            assert(validationPasses() === false);

            field.setValue('val');

            assert(validationPasses());
          }
        },
        {
          name: 'required: true and other validator',
          test: function(){
            field = new TextField({
              minLength: 4,
              required: true,
              validators: [
                validator.MinLength
              ]
            });


            assert(validationPasses() === false);

            field.setValue('val');

            assert(validationPasses() === false);

            field.setValue('value');

            assert(validationPasses());
          }
        },
        {
          name: 'required: reactive value',
          test: function(){
            var value = new Value({ value: false });

            field = new TextField({
              required: value
            });

            assert(validationPasses());

            value.set(true);

            assert(validationPasses() === false);

            field.setValue('val');

            assert(validationPasses());

            value.set(false);
          }
        },
        {
          name: 'required: value and failing validator',
          test: function(){
            var value = new Value({ value: true });

            var customError = new ValidatorError(field, 'Custom error message');

            field = new TextField({
              required: true,
              validators: [
                function(){
                  return customError;
                }
              ]
            });

            assert(field.validate() !== customError);

            field.setValue('val');

            assert(field.validate() === customError);
          }
        },
        {
          name: 'required: value and other validator',
          test: function(){
            var value = new Value({ value: false });

            field = new TextField({
              minLength: 4,
              required: value,
              validators: [
                validator.MinLength
              ]
            });

            assert(validationPasses());

            value.set(true);

            assert(validationPasses() === false);

            field.setValue('val');

            assert(validationPasses() === false);

            field.setValue('value');

            assert(validationPasses());

            value.set(false);
          }
        },
        {
          name: 'required: valueQuery',
          test: function(){
            field = new TextField({
              required: Value.query('data.needed')
            });

            assert(validationPasses());

            field.update({ needed: true });

            assert(validationPasses() === false);

            field.setValue('val');

            assert(validationPasses());

            field.update({ needed: false });
          }
        }
      ]
    }
  ]
};
