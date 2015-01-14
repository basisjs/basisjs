module.exports = {
  name: 'basis.utils.info',
  init: function(){
    var fnInfo = basis.require('basis.utils.info').fn;
    var normalizeOffset = basis.require('basis.utils.info').normalizeOffset;
  },
  test: [
    {
      name: 'fn',
      test: [
        {
          name: 'empty function',
          test: function(){
            var functions = [
              function(){},
              function(){
              },
              function () {},
              function/**/(){},
              function /**/ /**/ (){},
              function(/**/){},
              function( /**/ /**/ ){},
              function/**/( /**/ /**/ ){},
              function /**/ /**/( /**/ /**/ ) {},
              function /**/ 
              /**/
              (
                /**/
                /**/
              ) {
              }
            ];

            for (var i = 0; i < functions.length; i++)
            {
              var info = fnInfo(functions[i]);
              assert('', info.args);
              assert(info.name == 'anonymous');
              assert(info.getter == false);
            }
          }
        },
        {
          name: 'no args function',
          test: function(){
            var functions = [
              function(){
                return;
              },
              function(/* args */){
                return;
              },
              function(){
                for(;;){
                  var a = 1;
                  return;
                }
              },
              function(
                /**/){

              },
              function(){
                return "12\"'3";
              },
              function(){
                return /\"\//.test('asd');
              }
            ];

            for (var i = 0; i < functions.length; i++)
            {
              var info = fnInfo(functions[i]);
              assert('', info.args);
              assert(info.name == 'anonymous');
              assert(info.getter == false);
            }
          }
        },
        {
          name: 'no args function',
          test: function(){
            var functions = [
              function foo(){
                return;
              },
              function foo (/* args */){
                return 'sdf\'asda';
              },
              function /**/ foo /**/ ()
              // sdf
              {
                for(;;){
                  var a = 1;
                  // function(){}
                  return "sdf\"asda";
                }
              },
              // endless loop issue
              function(){
                var a = createTemplate('<span title="a"/>');
                var b = createTemplate('<b:include src="#' + a.templateId + '" class="b"></b:include>');

                /*nestedTemplate({
                  include: '<span title="a"/>',
                  attrs: {
                    class: 'b'
                  }
                });*/

                this.is(text('<span title="a" class="b"/>'), text(b));
              },
              function(){
                var a = /regexp/;
                var b = not / a / regexp;
              }
            ];

            for (var i = 0; i < functions.length; i++)
            {
              var info = fnInfo(functions[i]);
              assert('', info.args);
              assert(info.name == 'anonymous');
              assert(info.getter == false);
              assert(info.body == normalizeOffset(functions[i].toString()).replace(/^[^\{]+\{/, '').replace(/\}[^}]*$/, ''));
            }
          }
        },
        {
          name: 'one args function',
          test: function(){
            var functions = new Function('return [' +
              'function(args){\n' +
              '  return;\n' +
              '},\n' +
              'function(/* args */ args){\n' +
              '  return;\n' +
              '},\n' +
              'function(/* args */ args\n' +
              '  /* ! */){\n' +
              '  return;\n' +
              '},\n' +
              'function(args){\n' +
              '  for(;;){\n' +
              '    var a = 1;\n' +
              '    return;\n' +
              '  }\n' +
              '}\n' +
            ']')();

            var originalWarn = basis.dev.warn;
            var warning = false;
            basis.dev.warn = function(){
              warning = true;
            };
            try {
              for (var i = 0; i < functions.length; i++)
              {
                var info = fnInfo(functions[i]);
                assert(!warning);
                assert('args', info.args);
                assert(info.name == 'anonymous');
                assert(info.getter == false);
                warning = false;
              }
            }
            finally
            {
              basis.dev.warn = originalWarn;
            }
          }
        }
      ]
    }
  ]
};
