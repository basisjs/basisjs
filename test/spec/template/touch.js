module.exports = {
  name: 'platform-specific behavior',
  test: [
    {
      name: 'non-touch devices',
      sandbox: true,
      init: function(){
        var basis = window.basis.createSandbox(window.basis.config);
        var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
        var createTemplate = api.createTemplate;
      },
      test: [
        {
          name: 'does not add "cursor: pointer" for event-click for non-touch devices',
          test: function(){
            var template = createTemplate('<div event-click="eventAction"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === '');
          }
        }
      ]
    },
    {
      name: 'touch devices',
      html: __dirname + '/touch.html',
      sandbox: true,
      init: function(){
        var basis = window.basis.createSandbox(window.basis.config);
        var api = basis.require('../../helpers/template.js').createSandboxAPI(basis);
        var createTemplate = api.createTemplate;
      },
      test: [
        {
          name: 'adds cursor pointer for event-<mouseevent>',
          test: function(){
            var templateText =
              '<div>' +
              '  <div{testClick}     event-click="eventAction"/>' +
              '  <div{testDblclick}  event-dblclick="eventAction"/>' +
              '  <div{testMouseover} event-mouseover="eventAction"/>' +
              '  <div{testMousemove} event-mousemove="eventAction"/>' +
              '  <div{testMousedown} event-mousedown="eventAction"/>' +
              '  <div{testMouseup}   event-mouseup="eventAction"/>' +
              '</div>';
            var template = createTemplate(templateText);
            var instance = template.createInstance();

            assert(instance.testClick.style.cursor     === 'pointer');
            assert(instance.testDblclick.style.cursor  === 'pointer');
            assert(instance.testMouseover.style.cursor === 'pointer');
            assert(instance.testMousemove.style.cursor === 'pointer');
            assert(instance.testMousedown.style.cursor === 'pointer');
            assert(instance.testMouseup.style.cursor   === 'pointer');
          }
        },
        {
          name: 'does not add cursor pointer for event-change',
          test: function(){
            var template = createTemplate('<div event-change="eventAction"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === '');
          }
        },
        {
          name: 'shouldn\'t override explicit cursor value',
          test: function(){
            var template = createTemplate('<div event-click="eventAction" style="cursor: text"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === 'text');
          }
        },
        {
          name: 'shouldn\'t override explicit cursor value (changed attribute order)',
          test: function(){
            var template = createTemplate('<div style="cursor: text" event-click="eventAction"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === 'text');
          }
        },
        {
          name: 'non-cursor style bindings shouldn\'t affect cursor value',
          test: function(){
            var template = createTemplate('<div style="color: {textColor}" event-click="eventAction"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === 'pointer');

            instance.set('textColor', 'red');

            assert(instance.element.style.cursor === 'pointer');
          }
        },
        {
          name: 'style binding for cursor property should work as expected',
          test: function(){
            var template = createTemplate('<div style="cursor: {cursor}" event-click="eventAction"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === 'pointer');

            instance.set('cursor', 'text');

            assert(instance.element.style.cursor === 'text');

            instance.set('cursor', 'pointer');

            assert(instance.element.style.cursor === 'pointer');
          }
        },
        {
          name: 'style binding for cursor property should work as expected (changed attribute order)',
          test: function(){
            var template = createTemplate('<div event-click="eventAction" style="cursor: {cursor}"/>');
            var instance = template.createInstance();

            assert(instance.element.style.cursor === 'pointer');

            instance.set('cursor', 'text');

            assert(instance.element.style.cursor === 'text');

            instance.set('cursor', 'pointer');

            assert(instance.element.style.cursor === 'pointer');
          }
        }
      ]
    }
  ]
};
