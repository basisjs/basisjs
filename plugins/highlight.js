
  (function(){ 
    
   /**
    * @namespace Basis.Plugin.SyntaxHighlight
    */
    var namespace = 'Basis.Plugin.SyntaxHighlight';

    //
    // import names
    //

    var DOM = Basis.DOM;
    var nsWrappers = Basis.DOM.Wrapper;
    var Template = Basis.Html.Template;

    //
    // Main part
    //

    var keywords = 
      'break case catch continue ' +
      'default delete do else false ' +
      'for function if in instanceof ' +
      'new null return super switch ' +
      'this throw true try typeof var while with';

    var keywordRegExp = new RegExp('\\b(' + keywords.qw().join('|') + ')\\b', 'g');

   /**
    * @func
    */
    function highlight(code, keepFormat){

      function normalize(code, offset){
        code = code
                 .trimRight()
                 .replace(/\r\n|\n\r|\r/g, '\n')

        if (!keepFormat)
          code = code.replace(/^(?:\s*[\n]+)+?([ \t]*)/, '$1');

        // fix empty strings
        code = code
                 .replace(/\n[ \t]+/g, function(m){ return m.replace(/\t/g, '  '); })
                 .replace(/\n[ \t]+\n/g, '\n\n');

        if (!keepFormat)
        {
          // normalize code offset
          var minOffset = 1000;
          var lines = code.split(/\n+/);
          var startLine = Number(code.match(/^function/) != null); // hotfix for function.toString()
          for (var i = startLine; i < lines.length; i++)
          {
            var m = lines[i].match(/^\s*/);
            if (m[0].length < minOffset)
              minOffset = m[0].length;
            if (minOffset == 0)
              break;
          }

          if (minOffset > 0)
            code = code.replace(new RegExp('(^|\\n) {' + minOffset + '}', 'g'), '$1');
        }

        code = code.replace(new RegExp('(^|\\n)( +)', 'g'), function(m, a, b){ return a + '\xA0'.repeat(b.length)});

        return code; 
      }

      function getMatches(code){
        function addMatch(kind, start, end, rn){
          if (lastMatchPos != start)
            result.push(code.substring(lastMatchPos, start).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

          lastMatchPos = end + 1;

          result.push('<span class="token-' + kind + '">' + code.substring(start, end + 1) + '</span>' + (rn || ''));
        }

        var result = [];
        var sym = code.toArray();
        var start;
        var lastMatchPos = 0;

        for (var i = 0; i < sym.length; i++)
        {
          if (sym[i] == '\'')
          {
            start = i;
            while (++i < sym.length)
            {
              if (sym[i] == '\'')
              {
                addMatch('string', start, i);
                break;
              }

              if (sym[i] == '\n')
                break;

              if (sym[i] == '\\')
              {
                i++;
                if (sym[i] == '\n')
                {
                  addMatch('string', start, i - 1);
                  start = i + 1;
                }
              }
            }
          }
          else if (sym[i] == '\"')
          {
            start = i;
            while (++i < sym.length)
            {
              if (sym[i] == '\"')
              {
                addMatch('string', start, i);
                break;
              }

              if (sym[i] == '\n')
                break;

              if (sym[i] == '\\')
              {
                i++;
                if (sym[i] == '\n')
                {
                  addMatch('string', start, i - 1);
                  start = i;
                }
              }
            }
          }
          else if (sym[i] == '/')
          {
            start = i;
            i++;

            if (sym[i] == '/')
            {
              while (++i < sym.length)
              {
                if (sym[i] == '\n')
                  break;
              }

              addMatch('comment', start, i - 1);
            }

            if (sym[i] == '*')
            {
              while (++i < sym.length)
              {
                if (sym[i] == '*' && sym[i + 1] == '/')
                {
                  addMatch('comment', start, ++i);
                  break;
                }
                else if (sym[i] == '\n')
                {
                  addMatch('comment', start, i - 1, '\n');
                  lastMatchPos = start = i + 1;
                }
              }
            }
          }
        }

        result.push(code.substr(lastMatchPos).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

        return result;
      }

      //  MAIN PART

      var html = getMatches(normalize(code).replace(/</g, '&lt;'));

      //console.log('getmatches ' + (new Date - t));

      var lines = html.join('').split('\n');
      var numberWidth = String(lines.length >> 1).length;
      var res = [];
      for (var i = 0; i < lines.length; i++)
      {
        res.push(
          '<div class="line ' + (i % 2 ? 'odd' : 'even') + '">' +
            '<span class="lineContent">' + 
              '<input class="lineNumber" value="' + (i + 1).lead(numberWidth) + '" type="none" unselectable="on" readonly="readonly" tabindex="-1" />' +
              '<span class="over"></span>' +
              (lines[i] + '\r\n') + 
            '</span>' +
          '</div>'
        )
      }
      //console.log('build html ' + (new Date - t));
      return res.join('');
    }

   /**
    * @class
    */
    var SourceCodeNode = Basis.Class(nsWrappers.HtmlNode, {
      className: namespace + '.SourceCodeNode',

      template: new Template(
        '<pre{element|codeElement} class="Basis-SyntaxHighlight"/>'
      ),

      codeGetter: Function.getter('info.code'),
      normalize: true,

      event_update: function(object, delta){
        nsWrappers.HtmlNode.prototype.event_update.call(this, object, delta);

        var code = this.codeGetter(this);
        if (code != this.code_)
        {
          this.code_ = code;
          this.tmpl.codeElement.innerHTML = highlight(code, !this.normalize);
        }
      }
    });

    //
    // export names
    //

    Basis.namespace(namespace).extend({
      // functions
      highlight: highlight,

      // classes
      SourceCodeNode: SourceCodeNode
    });

  })();
