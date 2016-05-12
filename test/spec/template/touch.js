module.exports = {
  name: 'platform-specific behavior',
  test: [
    {
      name: 'non-touch devices',
      sandbox: true,
      init: function(){
        var basis = window.basis.createSandbox(window.basis.config);
        var Node = basis.require('basis.ui').Node;
        var api = basis.require('../helpers/template.js').createSandboxAPI(basis);
        var createTemplate = api.createTemplate;
      },
      test: [
        {
          name: 'does not add "cursor: pointer" for event-click for non-touch devices',
          test: function(){
            var tmpl = createTemplate('<div{testElement} event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl
            });

            assert(node.tmpl.testElement.style.cursor === '');
          }
        }
      ]
    },
    {
      name: 'touch devices behavior',
      html: __dirname + '/touch.html',
      sandbox: true,
      init: function(){
        var basis = window.basis.createSandbox(window.basis.config);
        var Node = basis.require('basis.ui').Node;
        var api = basis.require('../../helpers/template.js').createSandboxAPI(basis);
        var createTemplate = api.createTemplate;
      },
      test: [
        {
          name: 'adds cursor pointer for event-<mouseevent>',
          test: function(){
            var templateText =
              '<div>' +
              '  <div{testClick}     event-click="eventAction"></div>' +
              '  <div{testDblclick}  event-dblclick="eventAction"></div>' +
              '  <div{testMouseover} event-mouseover="eventAction"></div>' +
              '  <div{testMousemove} event-mousemove="eventAction"></div>' +
              '  <div{testMousedown} event-mousedown="eventAction"></div>' +
              '  <div{testMouseup}   event-mouseup="eventAction"></div>' +
              '</div>';
            var tmpl = createTemplate(templateText, true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.testClick.style.cursor     === 'pointer');
            assert(node.tmpl.testDblclick.style.cursor  === 'pointer');
            assert(node.tmpl.testMouseover.style.cursor === 'pointer');
            assert(node.tmpl.testMousemove.style.cursor === 'pointer');
            assert(node.tmpl.testMousedown.style.cursor === 'pointer');
            assert(node.tmpl.testMouseup.style.cursor   === 'pointer');
          }
        },
        {
          name: 'does not add cursor pointer for event-change',
          test: function(){
            var tmpl = createTemplate('<div{testElement} event-change="eventAction"></div>', true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.testElement.style.cursor === '');
          }
        },
        {
          name: 'does not overwrite existing value',
          test: function(){
            var tmpl = createTemplate('<div{testElement} event-click="eventAction" style="cursor: text"></div>', true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.testElement.style.cursor === 'text');
          }
        },
        {
          name: 'does not overwrite existing value',
          test: function(){
            var tmpl = createTemplate('<div{testElement} style="cursor: text" event-click="eventAction"></div>', true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.testElement.style.cursor === 'text');
          }
        },
        {
          name: 'reactive style - keeps cursor',
          test: function(){
            var tmpl = createTemplate('<div{testElement} style="color: {textColor}" event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl,
              binding: {
                textColor: 'data:'
              }
            });

            assert(node.tmpl.testElement.style.cursor === 'pointer');

            node.update({ textColor: 'red' });

            assert(node.tmpl.testElement.style.cursor === 'pointer');
          }
        },
        {
          name: 'reactive cursor - keeps specified',
          test: function(){
            var tmpl = createTemplate('<div{testElement} style="cursor: {cursor}" event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl,
              binding: {
                cursor: 'data:'
              }
            });

            assert(node.tmpl.testElement.style.cursor === 'pointer');

            node.update({ cursor: 'text' });

            assert(node.tmpl.testElement.style.cursor === 'text');

            node.update({ cursor: 'pointer' });

            assert(node.tmpl.testElement.style.cursor === 'pointer');
          }
        },
        {
          name: 'reactive cursor - keeps specified',
          test: function(){
            var tmpl = createTemplate('<div{testElement} event-click="eventAction" style="cursor: {cursor}"></div>', true);
            var node = new Node({
              template: tmpl,
              binding: {
                cursor: 'data:'
              }
            });

            assert(node.tmpl.testElement.style.cursor === 'pointer');

            node.update({ cursor: 'text' });

            assert(node.tmpl.testElement.style.cursor === 'text');

            node.update({ cursor: 'pointer' });

            assert(node.tmpl.testElement.style.cursor === 'pointer');
          }
        }
      ]
    }
  ]
};
