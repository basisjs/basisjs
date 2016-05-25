var base64 = require('basis.utils.base64');
var highlight = require('basis.utils.highlight').highlight;
var sourceCache = {};

function findSourceInMap(map, filename){
  if (Array.isArray(map.sources))
    for (var i = 0; i < map.sources.length; i++)
      if (basis.path.normalize(map.sources[i]) == filename)
      {
        if (Array.isArray(map.sourcesContent))
          return map.sourcesContent[i] || '';
      }

  if (Array.isArray(map.sections))
    for (var i = 0; i < map.sections.length; i++)
    {
      var result = findSourceInMap(map.sections[i].map, filename);
      if (result !== false)
        return result;
    }

  return false;
}

function getSource(uri){
  if (sourceCache[uri])
    return sourceCache[uri];

  var resource = basis.resource(uri);
  var source = resource.get(true);
  var sourceMap = source.split('//# sourceMappingURL=');

  if (sourceMap.length > 1)
  {
    sourceMap = sourceMap.pop().trim();

    if (!/[\r\n]/.test(sourceMap))
    {
      sourceMap = sourceMap.split(';').pop();
      if (/^base64,/.test(sourceMap))
        sourceMap = base64.decode(sourceMap.substr(7), true);
      sourceMap = JSON.parse(sourceMap);

      source = findSourceInMap(sourceMap, resource.url) || source;
    }
  }

  sourceCache[uri] = source;

  return source;
}

function sliceString(str, start, end){
  var lines = str
    .split('\n')
    .slice(start.line - 1, end.line);
  return lines
    .concat(lines.pop().substr(0, end.column - 1))
    .join('\n')
    .substr(start.column - 1);
}

function getSourceFragment(loc, start, end){
  function ifNaN(value, fallback){
    return isNaN(value) ? fallback : value;
  }

  var m = loc.match(/^(.*?)(?::(\d+):(\d+)(?::(\d+):(\d+))?)?$/);
  var source = getSource(m[1]);
  var numbers = m.slice(2).map(Number);

  if (!start)
    start = {
      line: numbers[0] || 0,
      column: numbers[1] || 0
    };

  if (!end)
    end = {
      line: ifNaN(numbers[2], 10e6),
      column: ifNaN(numbers[3], 10e6)
    };

  return sliceString(source, start, end);
}

function convertToRange(source, start, end){
  var lines = source.split('\n');
  var rangeStart = (lines.slice(0, start.line - 1).join('\n').length || -1) + start.column;
  var rangeEnd = (lines.slice(0, end.line - 1).join('\n').length || -1) + end.column;

  return [rangeStart, rangeEnd];
}

function getColoredSource(loc, linesBefore, linesAfter, maxLines){
  var m = loc.match(/^(.*?)(?::(\d+):(\d+)(?::(\d+):(\d+))?)?$/);
  var source = getSource(m[1]);
  var numbers = m.slice(2).map(Number);
  var startLine = 0;
  var lastLine = Infinity;
  var range;

  if (!numbers.some(isNaN))
  {
    if (numbers[0])
    {
      startLine = Math.max(0, numbers[0] - (linesBefore || 0));
      if (!numbers[2] && maxLines)
        lastLine = startLine + maxLines;
    }
    if (numbers[2])
      lastLine = Math.min(numbers[2] + (linesAfter || 0), startLine + (maxLines || Infinity) - 1);

    range = convertToRange(
      source,
      { line: numbers[0], column: numbers[1] },
      { line: numbers[2], column: numbers[3] }
    );
  }

  var lines = highlight(source, 'js', {
    keepFormat: true,
    range: range.concat('range'),
    lines: true,
    wrapper: basis.fn.$self
  });
  var linesCount = lines.length;
  var numLength = Math.max(String(Math.min(lastLine, linesCount)).length, 3);

  lines = lines.slice(startLine - 1, lastLine);

  var minOffset = Math.min.apply(null, lines.map(function(line){
    if (!line || line == '<span class="range"></span>')
      return Infinity;
    return line.match(/^(<span class="range">)?(\xA0*)(.*)/)[2].length;
  }));
  var minOffsetRx = new RegExp('^(<span class="range">)?\xA0{' + minOffset + '}');
  lines = lines.map(function(line, num){
    return (
      '<div class="line">' +
        '<span class="num">' + basis.number.lead(startLine + num, numLength, '\xA0') + '</span> ' +
        line.replace(minOffsetRx, '$1') +
      '</div>'
    );
  });

  if (startLine > 0)
    lines.unshift('<div class="skip-before">&middot;&middot;&middot;</div>');
  if (lastLine < linesCount)
    lines.push('<div class="skip-after">&middot;&middot;&middot;</div>');

  return lines.join('');
}

module.exports = {
  getSource: getSource,
  getColoredSource: getColoredSource,
  getSourceFragment: getSourceFragment,
  convertToRange: convertToRange
};
