[![Build Status](https://travis-ci.org/basisjs/basisjs.svg?branch=master)](https://travis-ci.org/basisjs/basisjs)

# basis.js

[Версия на русском](README.ru.md) (более полная и подробная)

## What is it?

`basis.js` – is open-source JavaScript framework to build big single-page applications (SPA). It developing with focus on dynamics (everything could change), flexibility, performance and ability to manage a lot data (models, collections etc).

You could compare performance of `basis.js` with others by some synthetic tests: [animation through bindings](http://jsfiddle.net/rdvornov/L46HM/) ([alternative version](http://jsfiddle.net/rdvornov/yE9Z9/)), [model generation](http://lahmatiy.github.io/lib-compare/) and [simple list with a lot items generation](http://plnkr.co/edit/RzZP7146NgWHlVchXZF7?p=preview).

## Not just a framework

`basis.js` has some tools for development, that helps build awesome applications:

* [basisjs-tools](http://github.com/basisjs/basisjs-tools) - CLI to manage basis.js project: create instances, build for production and special web server that notify client when resources are updated. Please, visit project page for more information.
* [Google Chrome plugin](https://chrome.google.com/webstore/detail/basisjs-tools/paeokpmlopbdaancddhdhmfepfhcbmek) ([repo](http://github.com/basisjs/app-control-panel)) - helps to manage templates and localization with live updates and change saving to files, it also provide project file structure graph and other information.

## Run tests
```
/path/to/project $ npm install
/path/to/project $ basis server
Server run at http://localhost:8123
```
Go to http://localhost:8123/test/. Click `pick up` link on the right to select a specific test suite.

## Where can I get more information

Unfortunatelly, most information is in Russian now, but we are working on it.

You could find some information here:

* [basisjs.com](http://basisjs.com) – project site
* [Tutorial](https://github.com/basisjs/articles/blob/master/ru-RU/tutorial/index.md) – step by step instruction for how to use `basis.js` (in progress)
* [Articles](https://github.com/basisjs/articles) – documentation about various parts of the framework (in progress);
* [Tour](http://basisjs.com/tour) – interactive slides with description and code, that you could tweak;
* [Docs](http://basisjs.com/docs) – auto-documentation, that generates on fly by module structure and their source code;
* [Demo](http://basisjs.com/demo) – demo set that shows some of abilities of the framework;
* [Slide](http://www.slideshare.net/basisjs) – slides for basis.js related talks.

Media channels:

* [Blog](http://blog.basisjs.com/)
* [Twitter](http://twitter.com/basisjs)
* [Community on Google+](https://plus.google.com/communities/102581433209953312275)

## If you have a question

Use [Google groups](https://groups.google.com/forum/#!forum/basisjs) or [Google+](https://plus.google.com/communities/102581433209953312275) for ask your questions. You also could use GitHub [Issues](https://github.com/basisjs/basisjs/issues) as an option.

If those channels are not suitable for you, please feel free to contact us at `contact@basisjs.com`.
