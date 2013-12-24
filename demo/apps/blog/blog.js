
basis.require('basis.date');
basis.require('basis.dom');
basis.require('basis.data');
basis.require('basis.data.dataset');
basis.require('basis.data.index');
basis.require('basis.ui');
basis.require('basis.ui.paginator');
basis.require('basis.utils.benchmark');

basis.ready(function(){
  var statOutElement = basis.dom.createElement('ul');
  var getTime = basis.utils.benchmark.time;
  var PROFILE = false;

  function outStat(){
    var sdate = times.shift();
    var lasttime = sdate;

    for (var i = 0; i < times.length; i++)
    {
      var t = times[i];
      statOutElement.appendChild(basis.dom.createElement('LI', parseInt(t[0] - sdate) + 'ms, self: ' + parseInt(t[0] - (lasttime)) + ' [' + t[1] + ']'));
      lasttime = t[0];
    }

    basis.dom.insert(statOutElement, [
      basis.dom.createElement('B', parseInt(lasttime - sdate)),
      basis.dom.createElement('SPAN', ' (' + parseInt(Date.now() - firstTime) + ')')
    ]);
  }

  if (PROFILE) console.profile();

  var times = [getTime()];

  var postsData = resource('blog_posts.js').fetch();

  times.push([getTime(), 'generate posts']);

  var allPostDataset = new basis.data.Dataset({
    items: postsData.map(function(data){
      return new basis.data.Object({
        data: data
      });
    })
  });

  //console.profileEnd();
  times.push([getTime(), 'data load']);

  //console.profile();

  var POST_PER_PAGE = 15;

  var blogThreadPage = new basis.data.dataset.Slice({
    source: allPostDataset,
    orderDesc: true,
    limit: POST_PER_PAGE,
    rule: 'data.pubDate'
  });

  times.push([getTime(), 'thread slice']);

  var paginator = new basis.ui.paginator.Paginator({
    pageCount: Math.ceil(allPostDataset.itemCount / POST_PER_PAGE),
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
      this.setActivePage(1, true)
    }
  }, paginator);

  var postList = new basis.ui.Node({
    template: resource('template/blog-thread.tmpl'),

    dataSource: blogThreadPage,
    
    sorting: 'data.pubDate',
    sortingDesc: true,
    childClass: {
      template: resource('template/post.tmpl'),

      binding: {
        id: 'data:',
        title: 'data:',
        content: 'data:',
        category: 'data:',
        pubDate: {
          events: 'update',
          getter: function(node){
            return basis.date.format(basis.date.fromISOString(node.data.pubDate), '%D/%M/%Y %H:%I:%S');
          }
        },
        tagList: 'satellite:'
      },

      action: {
        filterByCategory: function(){
          blogThreadPage.setSource(postByCategory.getSubset(this.data.category));
        }
      },

      satellite: {
        tagList: {
          existsIf: function(owner){
            return owner.data.tags && owner.data.tags.length;
          },
          delegate: basis.fn.$self,
          instanceOf: basis.ui.Node.subclass({
            template: resource('template/tagList.tmpl'),

            templateUpdate: function(){
              this.setChildNodes(this.data.tags.map(function(tag){
                return {
                  data: { title: tag }
                };
              }));
            },

            childClass: {
              template: resource('template/tag.tmpl'),

              binding: {
                title: 'data:'
              },

              action: {
                pick: function(){
                  blogThreadPage.setSource(cloud.getSubset(this.data.title));
                }
              }
            }
          })
        }
      }
    }
  });


  times.push([getTime(), 'post list']);


  var postByCategory = new basis.data.dataset.Split({
    source: allPostDataset,
    rule: 'data.category'
  });

  var categoryList = new basis.ui.Node({
    dataSource: postByCategory,
    template: resource('template/categoryList.tmpl'),

    childClass: {
      template: resource('template/category.tmpl'),

      binding: {
        title: 'data:'
      },

      action: {
        choose: function(){
          blogThreadPage.setSource(this.delegate);
        }
      }
    }
  });


  times.push([getTime(), 'category list']);


  var MONTH = 'January February March April May June July August September October November December'.split(' ');
  var archiveList = new basis.ui.Node({
    dataSource: new basis.data.dataset.Split({
      source: allPostDataset,
      rule: 'data.pubDate.substr(0, 7)'
    }),
    sorting: 'data.id',
    sortingDesc: true,
    grouping: {
      rule: 'data.id.substr(0, 4)',
      sorting: 'data.id',
      sortingDesc: true,
      childClass: {
        collapsed: true,

        template: resource('template/archiveYear.tmpl'),

        binding: {
          collapsed: function(node){
            return node.collapsed ? 'collapsed' : '';
          }
        },

        action: {
          toggle: function(){
            this.collapsed = !this.collapsed;
            this.updateBind('collapsed');
          }
        }
      }
    },
    template: resource('template/archive.tmpl'),

    childClass: {
      template: resource('template/archiveMonth.tmpl'),

      binding: {
        count: 'delegate.itemCount',
        title: function(node){
          return MONTH[node.data.id.substr(5) - 1];
        }
      },

      action: {
        choose: function(){
          blogThreadPage.setSource(this.delegate);
        }
      },

      listen: {
        delegate: {
          itemsChanged: function(){
            this.updateBind('count');
          }
        }
      }
    }
  });
  archiveList.grouping.firstChild.collapsed = false;
  archiveList.grouping.firstChild.updateBind('collapsed');

  times.push([getTime(), 'archive list']);

  var cloud = new basis.data.dataset.Cloud({
    source: allPostDataset,
    rule: 'data.tags'
  });

  var cloudCalcs = new basis.data.index.IndexMap({
    source: cloud,
    calcs: {
      percentOfRange: basis.data.index.percentOfRange('itemsChanged', 'itemCount'),
      source: function(data, indexes, obj){
        return obj;
      }
    }
  });

  var tagCloud = new basis.ui.Node({
    dataSource: cloudCalcs,
    sorting: 'data.title',
    template: resource('template/tagCloud.tmpl'),

    childClass: {
      active: true,

      template: resource('template/tagCloudTag.tmpl'),

      binding: {
        title: 'data.source.data.title',
        fontSize: {
          events: 'update',
          getter: function(node){
            return basis.string.format('{0:.2}%', 80 + 120 * node.data.percentOfRange);
          }
        }
      },

      action: {
        pick: function(){
          blogThreadPage.setSource(this.data.source);
        }
      }
    }
  });

  times.push([getTime(), 'tag cloud']);

  var app = new basis.ui.Node({
    container: document.body,

    template: resource('template/app.tmpl'),

    binding: {
      paginator: 'satellite:',
      postList: 'satellite:',

      categoryList: 'satellite:',
      tagCloud: 'satellite:',
      archiveList: 'satellite:',
      stat: basis.fn.$const(statOutElement)
    },

    action: {
      reset: function(){
        blogThreadPage.setSource(allPostDataset);
      }
    },

    satellite: {
      paginator: paginator,
      postList: postList,

      categoryList: categoryList,
      archiveList: archiveList,
      tagCloud: tagCloud
    }
  });

  times.push([getTime(), 'app']);

  if (PROFILE) console.profileEnd();

  outStat();
});