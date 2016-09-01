# basis.js

[![npm](https://img.shields.io/npm/v/basisjs.svg)](https://www.npmjs.com/package/basisjs)
[![Build Status](https://travis-ci.org/basisjs/basisjs.svg?branch=master)](https://travis-ci.org/basisjs/basisjs)
[![Join the chat at https://gitter.im/basisjs/basisjs](https://badges.gitter.im/basisjs/basisjs.svg)](https://gitter.im/basisjs/basisjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[Версия на русском](README.ru.md) (более полная и подробная)

`basis.js` – is open-source JavaScript framework to build complex single page applications (SPA). It's developing with focus on dynamics (everything could change), flexibility, performance and ability to manage a lot of data (models, collections etc).

You can compare performance of `basis.js` with other frameworks by some synthetic tests: [animation through bindings](http://jsfiddle.net/rdvornov/L46HM/) ([alternative version](http://jsfiddle.net/rdvornov/yE9Z9/)), [model generation](http://lahmatiy.github.io/lib-compare/) and [simple list with a lot items generation](http://plnkr.co/edit/RzZP7146NgWHlVchXZF7?p=preview).

## Not just a framework

`basis.js` has tools that helps build awesome applications:

* [basisjs-tools](http://github.com/basisjs/basisjs-tools) - CLI to manage basis.js project: create instances, build for production and special web server that notify client when resources are updated. See more information in [project repo](http://github.com/basisjs/basisjs-tools).
* [Google Chrome plugin](https://chrome.google.com/webstore/detail/basisjs-tools/paeokpmlopbdaancddhdhmfepfhcbmek) ([repo](http://github.com/basisjs/app-control-panel)) - helps to manage templates and localization with live updates and change saving to files, it also provide project file structure graph and other information.

## Using

```
> npm install basisjs
```

or use build as [library](https://github.com/basisjs/basis-library)

```
> npm install basis-library
```

Library version can be fetched from CDN: [https://cdnjs.com/libraries/basis.js](https://cdnjs.com/libraries/basis.js)

## Run tests

Install all dependencies (by `npm install`). Than use command:

```
> npm test
```

Another option is start http server and open `/test/index.html` in your browser to run test suite.

## Where can I get more information

> Unfortunatelly, most information is in Russian now, but we are working on it.

* [basisjs.com](http://basisjs.com) – project site
* [Articles](https://github.com/basisjs/articles) – documentation about various parts of the framework (in progress);
* [Tour](http://basisjs.com/tour) – interactive slides with description and code, that you could tweak;
* [Tutorial](https://github.com/basisjs/articles/blob/master/ru-RU/tutorial/index.md) – step by step instruction for how to use `basis.js` (in progress)
* [Docs](http://basisjs.com/docs) – auto-documentation, that generates on fly by module structure and their source code;
* [Demo](http://basisjs.com/demo) – demo set that shows some of abilities of the framework;
* [Slides](http://www.slideshare.net/basisjs) – slides for basis.js related talks.

Media channels:

* [Twitter](http://twitter.com/basisjs)
* [Google+](https://plus.google.com/communities/102581433209953312275)
* [Blog](http://blog.basisjs.com/)
