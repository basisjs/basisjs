
var basisDate = require('basis.date');
var dateFormat = basisDate.format;
var dateFromISOString = basisDate.fromISOString;
var domUtils = require('basis.dom');
var basisData = require('basis.data');
var Value = basisData.Value;
var DataObject = basisData.Object;
var Dataset = basisData.Dataset;
var basisDataset = require('basis.data.dataset');
var basisIndex = basis.require('basis.data.index');
var Node = require('basis.ui').Node;
var Paginator = require('basis.ui.paginator').Paginator;
var getTime = require('basis.utils.benchmark').time;

basis.ready(function(){
  var statOutElement = domUtils.createElement('ul');
  var PROFILE = false;

  function outStat(){
    var sdate = times.shift();
    var lasttime = sdate;

    for (var i = 0; i < times.length; i++)
    {
      var t = times[i];
      statOutElement.appendChild(domUtils.createElement('LI', parseInt(t[0] - sdate) + 'ms, self: ' + parseInt(t[0] - (lasttime)) + ' [' + t[1] + ']'));
      lasttime = t[0];
    }

    domUtils.insert(statOutElement, [
      domUtils.createElement('B', parseInt(lasttime - sdate)),
      domUtils.createElement('SPAN', ' (' + parseInt(Date.now() - firstTime) + ')')
    ]);
  }

  if (PROFILE) console.profile();

  var times = [getTime()];

  var postsData = resource('./blog_posts.js').fetch();

  times.push([getTime(), 'generate posts']);

  var allPostDataset = new Dataset({
    items: postsData.map(function(data){
      return new DataObject({
        data: data
      });
    })
  });

  //console.profileEnd();
  times.push([getTime(), 'data load']);

  //console.profile();

  var POST_PER_PAGE = 15;

  var blogThreadPage = new basisDataset.Slice({
    source: allPostDataset,
    orderDesc: true,
    limit: POST_PER_PAGE,
    rule: 'data.pubDate'
  });

  times.push([getTime(), 'thread slice']);

  var paginator = new Paginator({
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
      this.setActivePage(1, true);
    }
  }, paginator);

  var postList = new Node({
    template: resource('./template/blog-thread.tmpl'),

    dataSource: blogThreadPage,

    sorting: 'data.pubDate',
    sortingDesc: true,
    childClass: {
      template: resource('./template/post.tmpl'),

      binding: {
        id: 'data:',
        title: 'data:',
        content: 'data:',
        category: 'data:',
        pubDate: {
          events: 'update',
          getter: function(node){
            return dateFormat(dateFromISOString(node.data.pubDate), '%D/%M/%Y %H:%I:%S');
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
          satelliteClass: Node.subclass({
            template: resource('./template/tagList.tmpl'),

            init: function(){
              Node.prototype.init.call(this);
              Value.from(this, 'update', 'data.tags').link(this, function(tags){
                this.setChildNodes(tags.map(function(tag){
                  return { tag: tag };
                }));
              });
            },

            childClass: {
              template: resource('./template/tag.tmpl'),

              binding: {
                title: 'tag'
              },

              action: {
                pick: function(){
                  blogThreadPage.setSource(cloud.getSubset(this.tag));
                }
              }
            }
          })
        }
      }
    }
  });


  times.push([getTime(), 'post list']);


  var postByCategory = new basisDataset.Split({
    source: allPostDataset,
    rule: 'data.category'
  });

  var categoryList = new Node({
    dataSource: postByCategory,
    template: resource('./template/categoryList.tmpl'),

    childClass: {
      template: resource('./template/category.tmpl'),

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
  var archiveList = new Node({
    dataSource: new basisDataset.Split({
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

        template: resource('./template/archiveYear.tmpl'),
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
      },
      handler: {
        childNodesModified: basis.fn.runOnce(function(){
          this.firstChild.collapsed = false;
          this.firstChild.updateBind('collapsed');
        })
      }
    },
    template: resource('./template/archive.tmpl'),

    childClass: {
      template: resource('./template/archiveMonth.tmpl'),

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

  times.push([getTime(), 'archive list']);

  var cloud = new basisDataset.Cloud({
    source: allPostDataset,
    rule: 'data.tags'
  });

  var cloudCalcs = new basisIndex.IndexMap({
    source: cloud,
    calcs: {
      percentOfRange: basisIndex.percentOfRange('itemsChanged', 'itemCount'),
      title: function(data){
        return data.title;
      },
      source: function(data, indexes, obj){
        return obj;
      }
    }
  });

  var tagCloud = new Node({
    template: resource('./template/tagCloud.tmpl'),

    dataSource: cloudCalcs,
    sorting: function(child){
      return String(child.data.title).toLowerCase();
    },
    childClass: {
      active: true,

      template: resource('./template/tagCloudTag.tmpl'),
      binding: {
        title: 'data:title',
        fontSize: {
          events: 'update',
          getter: function(node){
            return (80 + 120 * node.data.percentOfRange).toFixed(2) + '%';
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

  var app = new Node({
    container: document.body,

    template: resource('./template/app.tmpl'),

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
