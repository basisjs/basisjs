require('basis.date');
require('basis.data');
require('basis.data.dataset');
require('basis.data.index');
require('basis.ui');
require('basis.ui.paginator');
require('basis.utils.benchmark');

var getTime = basis.utils.benchmark.time;
var PROFILE = false;
var POST_PER_PAGE = 15;

var allPosts = new basis.data.Dataset();
var blogThreadPage = new basis.data.dataset.Slice({
  source: allPosts,
  orderDesc: true,
  limit: POST_PER_PAGE,
  rule: 'data.pubDate'
});
var postByTag = new basis.data.dataset.Cloud({
  source: allPosts,
  rule: 'data.tags'
});
var postByCategory = new basis.data.dataset.Split({
  source: allPosts,
  rule: 'data.category'
});

basis.ready(function(){
  if (PROFILE) console.profile();

  var startTime = getTime();
  var postsData = require('./blog_posts.js');
  var time = new basis.Token();

  allPosts.set(postsData.map(function(data){
    return new basis.data.Object({
      data: data
    });
  }));

  var paginator = new basis.ui.paginator.Paginator({
    pageCount: Math.ceil(allPosts.itemCount / POST_PER_PAGE),
    pageSpan: 12,
    handler: {
      activePageChanged: function(){
        blogThreadPage.setRange(this.activePage * POST_PER_PAGE, POST_PER_PAGE);
      }
    }
  });

  blogThreadPage.addHandler({
    sourceChanged: function(ds){
      this.setPageCount(ds.source ? Math.ceil(ds.source.itemCount / POST_PER_PAGE) : 0);
      this.setActivePage(1, true);
    }
  }, paginator);

  var app = new basis.ui.Node({
    container: document.body,

    template: resource('./template/app.tmpl'),
    binding: {
      paginator: paginator,
      postList: require('./views/postList/index.js'),
      categoryList: require('./views/categoryList/index.js'),
      archiveList: require('./views/archiveList/index.js'),
      tagCloud: require('./views/tagCloud/index.js'),
      time: time
    },
    action: {
      reset: function(){
        blogThreadPage.setSource(allPosts);
      }
    }
  });

  time.set(parseInt(getTime() - startTime));

  if (PROFILE) console.profileEnd();
});

module.exports = {
  allPosts: allPosts,
  postThread: blogThreadPage,
  postByCategory: postByCategory,
  postByTag: postByTag
};
