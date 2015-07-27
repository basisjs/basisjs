var base64 = require('basis.utils.base64');
var highlight = require('basis.utils.highlight').highlight;

function findSourceInMap(map, filename){
  if (Array.isArray(map.sources))
    for (var i = 0; i < map.sources.length; i++)
      if (map.sources[i] == filename)
      {
        if (Array.isArray(map.sourcesContent))
          return map.sourcesContent[i] || '';
      }

  if (Array.isArray(map.sections))
    for (var i = 0; i < map.sections.length; i++)
      return findSourceInMap(map.sections[i].map, filename);

  return false;
}

function getSource(uri){
  var resource = basis.resource(uri);
  var source = resource.get(true);
  var sourceMap = source.match(/\/\/# sourceMappingURL=([^\r\n]+)[\s\r\n]*$/);

  if (sourceMap)
  {
    sourceMap = sourceMap[1].split(';').pop();
    if (/^base64,/.test(sourceMap))
      sourceMap = base64.decode(sourceMap.substr(7), true);
    sourceMap = JSON.parse(sourceMap);

    return findSourceInMap(sourceMap, resource.url);
  }

  return source;
}

function getSourceFragment(str, start, end){
  var lines = str
    .split('\n')
    .slice(start.line - 1, end.line);
  return lines
    .concat(lines.pop().substr(0, end.column))
    .join('\n')
    .substr(start.column - 1);
}

function convertToRange(source, start, end){
  var lines = source.split('\n');
  var rangeStart = lines.slice(0, start.line - 1).join('\n').length + start.column;
  var rangeEnd = lines.slice(0, end.line - 1).join('\n').length + end.column;

  return [rangeStart, rangeEnd];
}

function getColoredSource(loc, lineBefore, maxLines){
  var m = loc.match(/^(.*?)(?::(\d+):(\d+)(?::(\d+):(\d+))?)?$/);
  var source = getSource(m[1]);
  var numbers = m.slice(2).map(Number);
  var startLine = Math.max(0, numbers[0] - (lineBefore || 0));
  var lastLine = startLine + Math.min(numbers[2] - numbers[0] + Math.min(numbers[0] - startLine) || Infinity, maxLines || Infinity);
  var range;

  console.log(startLine, lastLine, Math.min((numbers[2] - numbers[0]) + 1 || Infinity, maxLines || Infinity))

  if (!numbers.some(isNaN))
    range = convertToRange(
        source,
        { line: numbers[0], column: numbers[1] },
        { line: numbers[2], column: numbers[3] }
      );

  return highlight(source, 'js', {
    keepFormat: true,
    range: range.concat('range'),
    wrapper: function(line, num){
      num = num + 1;
      if (num == startLine - 1)
        return '<div data-skip-before>...</div>';
      if (num >= startLine && num <= lastLine)
        return '<div>' + line + '</div>';
      if (num == lastLine + 1)
        return '<div data-skip-after>...</div>';
    }
  });
}

module.exports = {
  getSource: getSource,
  getColoredSource: getColoredSource,
  getSourceFragment: getSourceFragment,
  convertToRange: convertToRange
};
