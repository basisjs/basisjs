
  basis.require('basis.cssom');


 /**
  * @namespace basis.utils.highlight
  */

  var lead = basis.number.lead;
  var repeat = basis.string.repeat;

  var LANG_PARSER = {};
  var PARSER = {
    add: function(lang, fn){
      LANG_PARSER[lang] = fn;
    }
  };

  //
  // default parser
  //

  PARSER.add('text', basis.array);


  //
  // javascript parser
  //

  PARSER.add('js', (function(){
    var keywords =
      'break case catch continue ' +
      'default delete do else false ' +
      'for function if in instanceof ' +
      'new null return super switch ' +
      'this throw true try typeof var while with';

    var keywordRegExp = new RegExp('\\b(' + keywords.split(' ').join('|') + ')\\b', 'g');

    return function(text){
      function addMatch(kind, start, end, rn){
        if (lastMatchPos != start)
          result.push(text.substring(lastMatchPos, start).replace(keywordRegExp, '<span class="token-keyword">$1</span>'));

        lastMatchPos = end + 1;

        if (kind)
          result.push('<span class="token-' + kind + '">' + text.substring(start, end + 1) + '</span>' + (rn || ''));
      }

      var result = [];
      var sym = text.split('');
      var start;
      var lastMatchPos = 0;
      var strSym;

      for (var i = 0; i < sym.length; i++)
      {
        if (sym[i] == '\'' || sym[i] == '\"')
        {
          strSym = sym[i];
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == '\\')
            {
              if (sym[i + 1] == '\n')
              {
                addMatch('string', start, i);
                start = ++i + 1;
              }
              else
                i += 2;
            }

            if (sym[i] == strSym)
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;
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
          else if (sym[i] == '*')
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

      addMatch(null, text.length);

      return result;
    };
  })());


  //
  // css parser
  //

  PARSER.add('css', (function(){
    var prefixes =
      '-webkit- -o- -ms- -moz- -khtml-';
    var properties =
      'azimuth background-attachment background-color background-image background-position ' +
      'background-repeat background border-collapse border-color border-spacing border-style ' +
      'border-top border-right border-bottom border-left border-top-color border-right-color ' +
      'border-bottom-color border-left-color border-top-style border-right-style border-bottom-style ' +
      'border-left-style border-top-width border-right-width border-bottom-width border-left-width ' +
      'border-width border bottom caption-side clear clip color content counter-increment ' +
      'counter-reset cue-after cue-before cue cursor direction display elevation empty-cells ' +
      'float font-family font-size font-style font-variant font-weight font height left ' +
      'letter-spacing line-height list-style-image list-style-position list-style-type ' +
      'list-style margin-right margin-left margin-top margin-bottom margin max-height ' +
      'max-width min-height min-width orphans outline-color outline-style outline-width ' +
      'outline overflow padding-top padding-right padding-bottom padding-left padding ' +
      'page-break-after page-break-before page-break-inside pause-after pause-before ' +
      'pause pitch-range pitch play-during position quotes richness right speak-header ' +
      'speak-numeral speak-punctuation speak speech-rate stress table-layout text-align ' +
      'text-decoration text-indent text-transform top unicode-bidi vertical-align visibility ' +
      'voice-family volume white-space widows width word-spacing z-index';
    var css3properties =
      // CSS Transitions Module Level 3 (http://www.w3.org/TR/css3-transitions/)
      'transition transition-delay transition-duration transition-property transition-timing-function ' +
      // CSS 2D Transforms (http://www.w3.org/TR/css3-2d-transforms/)
      'transform transform-origin ' +
      // CSS Backgrounds and Borders Module Level 3 (http://www.w3.org/TR/css3-background/)
      'background-origin background-clip background-size ' +
      'border-image border-image-outset border-image-repeat border-image-slice border-image-source border-image-width ' +
      'border-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius border-top-left-radius ' +
      'box-decoration-break box-shadow ' +
      // CSS Multi-column Layout Module (http://www.w3.org/TR/css3-multicol/)
      'column-count column-fill column-gap column-rule column-rule-color column-rule-style column-rule-width columns column-span column-width';

    var values =
      'left-side far-left left center-left center-right center far-right right-side ' +
      'right behind leftwards rightwards inherit scroll fixed transparent none repeat-x ' +
      'repeat-y repeat no-repeat collapse separate auto top bottom both open-quote ' +
      'close-quote no-open-quote no-close-quote crosshair default pointer move e-resize ' +
      'ne-resize nw-resize n-resize se-resize sw-resize s-resize text wait help ltr rtl ' +
      'inline block list-item run-in compact marker table inline-table table-row-group ' +
      'table-header-group table-footer-group table-row table-column-group table-column ' +
      'table-cell table-caption below level above higher lower show hide caption icon ' +
      'menu message-box small-caption status-bar normal wider narrower ultra-condensed ' +
      'extra-condensed condensed semi-condensed semi-expanded expanded extra-expanded ' +
      'ultra-expanded italic oblique small-caps bold bolder lighter inside outside ' +
      'disc circle square decimal decimal-leading-zero lower-roman upper-roman lower-greek ' +
      'lower-alpha lower-latin upper-alpha upper-latin hebrew armenian georgian ' +
      'cjk-ideographic hiragana katakana hiragana-iroha katakana-iroha crop cross invert ' +
      'visible hidden always avoid x-low low medium high x-high static relative absolute ' +
      'portrait landscape spell-out once digits continuous code x-slow slow fast x-fast ' +
      'faster slower justify underline overline line-through blink capitalize uppercase ' +
      'lowercase embed bidi-override baseline sub super text-top middle text-bottom silent ' +
      'x-soft soft loud x-loud pre nowrap serif sans-serif cursive fantasy monospace empty ' +
      'string strict loose char true false dotted dashed solid double groove ridge inset ' +
      'outset larger smaller xx-small x-small small large x-large xx-large all newspaper ' +
      'distribute distribute-all-lines distribute-center-last inter-word inter-ideograph ' +
      'inter-cluster kashida ideograph-alpha ideograph-numeric ideograph-parenthesis ' +
      'ideograph-space keep-all break-all break-word lr-tb tb-rl thin thick inline-block ' +
      'w-resize hand distribute-letter distribute-space whitespace ignore';

    var propertiesRegExp = new RegExp('(^|[^a-z0-9\-])((?:' + prefixes.split(' ').join('|') + ')?(?:' + css3properties.split(' ').join('|') + ')|(?:' + properties.split(' ').join('|') + '))(\s|:|$)', 'gi');
    var valuesRegExp = new RegExp('\\b(' + values.split(' ').join('|') + ')\\b', 'g');

    return function(text){
      function addMatch(kind, start, end, rn){
        if (lastMatchPos != start)
        {
          var fragment = text.substring(lastMatchPos, start);

          if (blockScope)
          {
            if (valueScope)
              fragment = fragment.replace(valuesRegExp, '<span class="token-value">$1</span>');
            else
              fragment = fragment.replace(propertiesRegExp, '$1<span class="token-key">$2</span>$3');
          }

          result.push(fragment);
        }

        lastMatchPos = end + 1;

        if (kind)
          result.push('<span class="token-' + kind + '">' + text.substring(start, end + 1) + '</span>' + (rn || ''));
      }

      var result = [];
      var sym = text.split('');
      var start = 0;
      var lastMatchPos = 0;
      var strSym;
      var blockScope = false;
      var valueScope = false;
      var braceScope = false;

      for (var i = 0; i < sym.length; i++)
      {
        if (sym[i] == '\'' || sym[i] == '\"')
        {
          strSym = sym[i];
          start = i;
          while (++i < sym.length)
          {
            if (sym[i] == strSym)
            {
              addMatch('string', start, i);
              break;
            }

            if (sym[i] == '\n')
              break;

            if (sym[i] == '\\' && sym[i + 1] == '\n')
            {
              addMatch('string', start, i);
              start = ++i + 1;
            }
          }
        }
        else if (sym[i] == '/')
        {
          start = i;
          i++;

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
        else if (sym[i] == '{')
        {
          blockScope = true;
          valueScope = false;
          braceScope = false;
          start = i + 1;
          addMatch('', start, i);
        }
        else if (sym[i] == '(')
        {
          if (valueScope)
            braceScope = true;
        }
        else if (sym[i] == ')')
        {
          if (valueScope)
            braceScope = false;
        }
        else if (sym[i] == ':')
        {
          if (blockScope && !braceScope)
          {
            start = i + 1;
            addMatch('', start, i);
            valueScope = true;
          }
        }
        else if (sym[i] == ';')
        {
          if (blockScope && !braceScope)
          {
            start = i + 1;
            addMatch('', start, i);
            valueScope = false;
          }
        }
        else if (sym[i] == '}')
        {
          blockScope = false;
          valueScope = false;
        }
      }

      addMatch(null, text.length);

      return result;
    };
  })());


 /**
  * Function that produce html code from text.
  * @param {string} text
  * @param {string=} lang
  * @param {object=} options
  * @return {string}
  */
  function highlight(text, lang, options){

    function normalize(text){
      text = text
        .trimRight()
        .replace(/\r\n|\n\r|\r/g, '\n');

      if (!options.keepFormat)
        text = text.replace(/^(?:\s*[\n]+)+?([ \t]*)/, '$1');

      // fix empty strings
      text = text
               .replace(/\n[ \t]+/g, function(m){
                  return m.replace(/\t/g, '  ');
                })
               .replace(/\n[ \t]+\n/g, '\n\n');

      if (!options.keepFormat)
      {
        // normalize text offset
        var minOffset = 1000;
        var lines = text.split(/\n+/);
        var startLine = Number(text.match(/^function/) != null); // fix for function.toString()
        for (var i = startLine; i < lines.length; i++)
        {
          var m = lines[i].match(/^\s*/);
          if (m[0].length < minOffset)
            minOffset = m[0].length;
          if (minOffset == 0)
            break;
        }

        if (minOffset > 0)
          text = text.replace(new RegExp('(^|\\n) {' + minOffset + '}', 'g'), '$1');
      }

      text = text.replace(new RegExp('(^|\\n)( +)', 'g'), function(m, a, b){
        return a + repeat('\xA0', b.length);
      });

      return text;
    }

    //  MAIN PART

    if (!options)
      options = {};

    var parser = LANG_PARSER[lang] || LANG_PARSER['text'];
    var html = parser(normalize(text || '').replace(/</g, '&lt;'));

    var lines = html.join('').split('\n');
    var numberWidth = String(lines.length).length;
    var res = [];
    var lineClass = (options.noLineNumber ? '' : ' hasLineNumber');
    for (var i = 0; i < lines.length; i++)
    {
      res.push(
        '<div class="line ' + (i % 2 ? 'odd' : 'even') + lineClass + '">' +
          '<span class="lineContent">' +
            (!options.noLineNumber
              ? '<input class="lineNumber" value="' + lead(i + 1, numberWidth) + '" type="none" unselectable="on" readonly="readonly" tabindex="-1" />' +
                '<span class="over"></span>'
              : ''
            ) +
            (lines[i] + '\r\n') +
          '</span>' +
        '</div>'
      );
    }

    return res.join('');
  }


  //
  // export names
  //

  module.exports = {
    highlight: highlight,
    useStyle: basis.fn.runOnce(function(){
      resource('../ui/templates/highlight/SourceCode.css')().startUse();
    })
  };
