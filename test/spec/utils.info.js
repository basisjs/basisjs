module.exports = {
  name: 'basis.utils.info',
  init: function(){
    var fnInfo = basis.require('basis.utils.info').fn;
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
