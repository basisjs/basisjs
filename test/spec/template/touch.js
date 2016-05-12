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
            var tmpl = createTemplate('<div{targetDiv} event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl
            });

            assert(node.tmpl.targetDiv.style.cursor === '');
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
              '  <div{divClick}     event-click="eventAction"></div>' +
              '  <div{divMouseover} event-mouseover="eventAction"></div>' +
              '  <div{divMousemove} event-mousemove="eventAction"></div>' +
              '  <div{divMousedown} event-mousedown="eventAction"></div>' +
              '  <div{divMouseup}   event-mouseup="eventAction"></div>' +
              '</div>';
            var tmpl = createTemplate(templateText, true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.divClick.style.cursor     === 'pointer');
            assert(node.tmpl.divMouseover.style.cursor === 'pointer');
            assert(node.tmpl.divMousemove.style.cursor === 'pointer');
            assert(node.tmpl.divMousedown.style.cursor === 'pointer');
            assert(node.tmpl.divMouseup.style.cursor   === 'pointer');
          }
        },
        {
          name: 'does not add cursor pointer for event-change',
          test: function(){
            var tmpl = createTemplate('<div{targetDiv} event-change="eventAction"></div>', true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.targetDiv.style.cursor === '');
          }
        },
        {
          name: 'does not overwrite existing value',
          test: function(){
            var tmpl = createTemplate('<div{targetDiv} event-click="eventAction" style="cursor: text"></div>', true);
            var node = new Node({ template: tmpl });

            assert(node.tmpl.targetDiv.style.cursor === 'text');
          }
        },
        {
          name: 'reactive style - keeps cursor',
          test: function(){
            var tmpl = createTemplate('<div{targetDiv} style="color: {textColor}" event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl,
              binding: {
                textColor: 'data:'
              }
            });

            assert(node.tmpl.targetDiv.style.cursor === 'pointer');

            node.update({ textColor: 'red' });

            assert(node.tmpl.targetDiv.style.cursor === 'pointer');
          }
        },
        {
          name: 'reactive cursor - keeps specified',
          test: function(){
            var tmpl = createTemplate('<div{targetDiv} style="cursor: {cursor}" event-click="eventAction"></div>', true);
            var node = new Node({
              template: tmpl,
              binding: {
                cursor: 'data:'
              }
            });

            assert(node.tmpl.targetDiv.style.cursor === 'pointer');

            node.update({ cursor: 'text' });

            assert(node.tmpl.targetDiv.style.cursor === 'text');

            node.update({ cursor: 'pointer' });

            assert(node.tmpl.targetDiv.style.cursor === 'pointer');
          }
        }
      ]
    }
  ]
};
