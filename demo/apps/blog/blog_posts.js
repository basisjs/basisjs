
  basis.require('basis.date');

  var COUNT = 5000;
  var RND_COUNT = 1111;

  var words = (
    'Lorem ipsum dolor sit amet consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
    'Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat ' +
    'Duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur ' +
    'Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'
  ).split(/\s+/);

  var randomsIdx = 0;
  var randoms = basis.array.create(RND_COUNT, Math.random);
  var rwIdx = 0;
  var randomWord = basis.array.create(RND_COUNT, function(){
    return words[parseInt(words.length * Math.random())];
  });

  function genSentence(min, max){
    var count = min + parseInt((max - min) * randoms[randomsIdx++ % RND_COUNT]);

    var res = randomWord.slice(rwIdx %= RND_COUNT, rwIdx += count);
    if (res.length < count)
      res = res.concat(randomWord.slice(0, count - res.length));

    return res;
  }

  var posts = [];
  var catList = ['javascript', 'basis', 'style', 'usability', 'css', 'html', 'framework', 'browser'];
  var date = new Date();
  for (var i = 0; i < COUNT; i++)
  {  
    date.setSeconds(-3600 * 24 / (1 + randoms[randomsIdx++ % RND_COUNT] * (COUNT / 1234)));
    posts.push({
      id: COUNT - i,
      pubDate: date.toISOString(),
      title: genSentence(1, 10).join(' '),
      content: genSentence(15, 150).join(' '),
      category: catList[(i * 33847) % catList.length],
      tags: genSentence(1, 6)
    });
  }

  module.exports = posts;
