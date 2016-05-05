module.exports = {
  name: 'UI Field',
  test: [
    {
      sandbox: true,
      name: 'changing validators',
      test: [
        {
          name: 'prependValidator',
          init: function(){
            var ValidatorError = basis.require('basis.ui.field').ValidatorError;
            var TextField = basis.require('basis.ui.field').Text;
          },
          test: [
            {
              name: 'simple attaching/detaching',
              test: function(){
                function emptyValidator() {}

                function failingValidator() {
                  return error;
                }

                var field = new TextField({
                  validators: [
                    emptyValidator
                  ]
                });

                var error = new ValidatorError(field, failingValidator);

                assert(undefined, field.validate());

                field.attachValidator(failingValidator);

                assert(error, field.validate());

                field.detachValidator(failingValidator);

                assert(undefined, field.validate());
              }
            },
            {
              name: 'calls sequence',
              test: function(){
                var callsLog = '';

                function firstValidator() {
                  callsLog += 'first ';
                }

                function secondValidator() {
                  callsLog += 'second ';
                }

                var field = new TextField({
                  validators: [
                    firstValidator
                  ]
                });

                field.attachValidator(secondValidator);

                field.validate();

                assert('first second ', callsLog);
              }
            },
            {
              name: 'multiple attaching',
              test: function(){
                function emptyValidator() {}

                var callCount = 0;
                function loggingValidator() {
                  callCount++;
                }

                var field = new TextField({
                  validators: [
                    emptyValidator
                  ]
                });

                for (var idx = 0; idx < 3; idx++) {
                  field.attachValidator(loggingValidator);
                }

                field.validate();

                assert(1, callCount);

                callCount = 0;

                field.detachValidator(loggingValidator);

                field.validate();

                assert(0, callCount);
              }
            },
            {
              name: 'validatorsModified event',
              test: function(){
                function firstValidator() {}
                function secondValidator() {}

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

                assert(0, eventsCount);

                field.attachValidator(secondValidator);

                assert(1, eventsCount);

                field.attachValidator(secondValidator);

                assert(1, eventsCount);
                assert({ inserted: secondValidator }, lastDelta);

                field.detachValidator(secondValidator);

                assert(2, eventsCount);
                assert({ deleted: secondValidator }, lastDelta);

                field.detachValidator(secondValidator);

                assert(2, eventsCount);
              }
            },
            {
              name: 'attach/detach and validate',
              test: function(){
                function unoValidator() {}

                var validatesCount = 0;

                var field = new TextField({
                  validate: function(){
                    validatesCount++;
                  }
                });

                field.attachValidator(unoValidator, true);

                assert(1, validatesCount);

                field.attachValidator(unoValidator, true);

                assert(1, validatesCount);

                field.detachValidator(unoValidator, true);

                assert(2, validatesCount);

                field.detachValidator(unoValidator, true);

                assert(2, validatesCount);
              }
            }
          ]
        },
        {
          name: 'prependValidator',
          init: function(){
            var ValidatorError = basis.require('basis.ui.field').ValidatorError;
            var TextField = basis.require('basis.ui.field').Text;
          },
          test: [
            {
              name: 'simple prepending/detaching',
              test: function(){
                function emptyValidator() {}

                function failingValidator() {
                  return error;
                }

                var field = new TextField({
                  validators: [
                    emptyValidator
                  ]
                });

                var error = new ValidatorError(field, failingValidator);

                assert(undefined, field.validate());

                field.prependValidator(failingValidator);

                assert(error, field.validate());

                field.detachValidator(failingValidator);

                assert(undefined, field.validate());
              }
            },
            {
              name: 'calls sequence',
              test: function(){
                var callsLog = '';

                function firstValidator() {
                  callsLog += 'first ';
                }

                function secondValidator() {
                  callsLog += 'second ';
                }

                var field = new TextField({
                  validators: [
                    secondValidator
                  ]
                });

                field.prependValidator(firstValidator);

                field.validate();

                assert('first second ', callsLog);
              }
            },
            {
              name: 'multiple prepending',
              test: function(){
                function emptyValidator() {}

                var callCount = 0;
                function loggingValidator() {
                  callCount++;
                }

                var field = new TextField({
                  validators: [
                    emptyValidator
                  ]
                });

                for (var idx = 0; idx < 3; idx++) {
                  field.prependValidator(loggingValidator);
                }

                field.validate();

                assert(1, callCount);

                callCount = 0;

                field.detachValidator(loggingValidator);

                field.validate();

                assert(0, callCount);
              }
            },
            {
              name: 'validatorsModified event',
              test: function(){
                function firstValidator() {}
                function secondValidator() {}

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

                assert(0, eventsCount);

                field.prependValidator(secondValidator);

                assert(1, eventsCount);

                field.prependValidator(secondValidator);

                assert(1, eventsCount);
                assert({ inserted: secondValidator }, lastDelta);

                field.detachValidator(secondValidator);

                assert(2, eventsCount);
                assert({ deleted: secondValidator }, lastDelta);

                field.detachValidator(secondValidator);

                assert(2, eventsCount);
              }
            },
            {
              name: 'prepend and validate',
              test: function(){
                function unoValidator() {}

                var validatesCount = 0;

                var field = new TextField({
                  validate: function(){
                    validatesCount++;
                  }
                });

                field.prependValidator(unoValidator, true);

                assert(1, validatesCount);

                field.prependValidator(unoValidator, true);

                assert(1, validatesCount);
              }
            }
          ]
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

        function validationPasses() {
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

            assert(false, validationPasses());

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


            assert(false, validationPasses());

            field.setValue('val');

            assert(false, validationPasses());

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

            basis.asap.process();

            assert(false, validationPasses());

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

            basis.asap.process();

            assert(false, validationPasses());

            field.setValue('val');

            assert(false, validationPasses());

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

            basis.asap.process();

            assert(false, validationPasses());

            field.setValue('val');

            assert(validationPasses());

            field.update({ needed: false });

          }
        }
      ]
    }
  ]
};
