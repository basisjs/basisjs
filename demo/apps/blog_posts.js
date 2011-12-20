window.rawData = (function(){
  var words = (
               'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
               'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' +
               'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
               'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
              )
              .replace(/[^a-z]/gi, ' ')
              .trim()
              .split(/\s+/);
  function genSentence(min, max){
    var result = [];
    var count = min + parseInt((max - min) * Math.random());

    while (count--)
      result.push(words[Math.round(Math.random() * words.length)]);

    return result.join(' ');
  };


  var result = [];
  var catList = ['javascript', 'basis', 'style', 'usability', 'css', 'html', 'framework', 'browser'];
  var COUNT = 27500;
  var offset = 0;
  for (var i = COUNT; i >= 0; i--)
  {  
    result.push({
      id: i,
      pubDate: new Date((new Date()) - offset).toISOString(),
      title: genSentence(1, 10),
      content: genSentence(10, 50),
      category: catList[(i * 33847) % catList.length],
      tags: Array.create(i % 6, function(idx){
        return words[parseInt(Math.random() * words.length)];
      }).join(',')
    });
    offset += 3600 * 24 * 1000/(1 + Math.random()*(COUNT/200));
  }

  return result;
})();