## 0.9.9 (september 4, 2013)

- NEW: `basis.event.Emitter#handler_list` method was implemented to show list of handlers as an array (available in development only)
- NEW: add `actionTarget` for action events that points to node which trigger an action execute
- API: deprecate `basis.data.index` `getIndex`/`deleteIndex` methods extension of `basis.data.AbstractDataset` (`basis.data.index.addDatasetIndex`/`basis.data.index.removeDatasetIndex` functions must be used instead or related index helpers)
- API: warn when overloaded `setTimeout` with zero timeout used (that overload will be removed in next versions)
- API: `basis.timer.nextTick` returns undefined now (like node.js does)
- API: `setImmediate`/`clearImmediate`/`nixtTick` moved from `basis.timer` into core (basis.js) 
- NEW: `basis.DeferredToken` implemented
- API: `basis.data.Value#as` method extended with new argument to get deferred tokens
- NEW: `basis.data.Value#deferred` method implemented, works as `basis.data.Value#as` but returns deferred tokens
- NEW: basis.data.Value#compute result now has a deferred method to return deferred tokens
- API: show warning when using deprecated `basis.cssom.hide`/`basis.cssom.show`/`basis.cssom.visible`/`basis.cssom.invisible` functions (those functions will be removed in next versions)
- FIX: make `basis.path` context free 
- API: `basis.resource#ready` returns resource now
- FIX: `basis.entity` sync method of datasets not destroy items on remove
- NEW: `ref` attribute for `<b:include>` and `<b:add-ref>`/`<b:remove-ref>` implemented  (issue #10)
- FIX: `basis.template` avoid multiple template definitions for pair path-theme (ignore new definitions)
- FIX: `basis.template.SourceWrapper` destroy method to work correctly
- FIX: `basis.ui.pageslider.PageSlider` bug with adjust rotation when no children
- FIX: kill `click` event for `basis.ui.scroller.Scroller` while scrolling

## 0.9.8 (august 3, 2013)

- API: new basis config option `extClass` to disable buildin class extension (preparations for 0.10)
- API: move extension check into class extend method
- FIX: check for value is a function in `basis.array.from`
- FIX: various bugs in `basis.path`
- FIX: broken error output on resource compilation error
- API: simplify `basis.Token#attach` and `basis.Token#detach` methods
- FIX: fix removal item from lists in `basis.Token#detach` & `basis.data.value.BindValue#removeLink` methods
- FIX: `basis.net.Transport#repeat` method doesn't process request data properly
- API: various fixes of `basis.data.index.Index` and it's subclasses
- FIX: exception for `basis.entity`'s calcs with more than 3 arguments in dev mode
- API: using object for ruleEvents property of `basis.data.dataset`'s classes is deprecated (space separated event names string or array of string should be used instead)
- API: warn about usage instance of `basis.l10n.Token` as value `basis.ui.Node#content`
- API: `basis.ui.scroller.Scroller`'s scroll inertia can be turned off via config
- API: `basis.ui.pageslider.Pageslider`'s rotation adjustment improvements
- API: mark `basis.ui.label` as deprecated
- API: make possible to set footer for `basis.ui.table.Table` instance directly in config, not only via `structure`

## 0.9.7 (july 27, 2013)

- FIX: fix state changing events for `basis.net` synchronous requests
- NEW: simplify usage of `basis.net.request`
- API: make `basis.path` methods compliance to node.js `path` module
- NEW: add origin property to `basis.path`
- FIX: fix `basis.devpanel` l10n regression (dictionary name fetching)
- FIX: temporaty fix in `basis.ui` to solve problem with template switching on `childNodesModified` event
- NEW: `basis.bool.invert` function implemented
- NEW: `basis.data.Value#compute` method implemented
- NEW: `basis.data.Value#as` method implemented
- NEW: `basis.data.Dataset#forEach` method implemented
- NEW: `basis.Token` reworked, and now has value by default and get/set methods are not abstract any more
- FIX: fix `basis.app` wrapper regression
- NEW: `basis.event.createHandler` function implemented
- API: drop `basis.data.Object#isConnected`, it becomes a method of `basis.data`
- API: new boolean argument for `basis.entity.Entity#get` and `basis.entity.Entity#get_*` methods, to get data using modified
- API: deprecate `basis.entity.EntityTypeConstructor`'s `addField`, `addCalcField` and `addAlias` methods
- NEW: default value in `basis.entity` type config could be a function that compute value on init
- NEW: warn when invoke `basis.entity` type wrapper with value as index, but it has no index or index is composite
- NEW: `basis.app` init now can returns object that contains element as property (example, instance of `basis.ui.Node`)
- NEW: `basis.ui.scroller` scroll panning is optional now
- FIX: fix file path resolving for links in docs
- FIX: add `basis` to namespace list in docs
- `basis.data.Value` & `basis.data.value.BindValue` refactoring
- rework TodoMVC demo to use new possibility of framework

## 0.9.6 (july 20, 2013)

- API: change `basis.path.relative` to work correctly with `Array` ES5 iterate methods
- API: drop `basis.l10n.Token#enum` method as not ready to use (will be provided in 0.10)
- API: drop deprecated `l10n:` binding preset in `basis.ui`
- FIX: replace usage of `basis.l10n.getToken` to `basis.l10n.token`
- NEW: add support for `@name` tag in `jsDocs` in docs (to overload local name into export name)
- FIX: fix jsDocs parsing in docs
- FIX: fix name to `jsDocs` association in docs
- FIX: don't remove binding handler on `basis.ui.Node#setTemplate` if it was not be added
- FIX: fix css `transform` support test in `basis.ui.scroller` (it always wrongly returns false)
- FIX: fix type by name resolving in `basis.entity`
- API: use `Array` as field type for `basis.entity` type declaration implemented
- API: no more exception when no arguments on `basis.data.Dataset#set` and `basis.data.Dataset#sync` invoke
- API: `basis.array.from` converts function into array with single item (that function), but not iterate it (because functions has length `property`)
- API: deprecate using `basis.app`, `basis.crypt`, `basis.template` and `basis.format.highlight` as function
- API: `basis.timer` exports `setImmediate`, `clearImmediate`, `nextTick` (alias for `setImmediate`), and `basis.timer.TimeEventManager.add`/`basis.timer.TimeEventManager.remove` methods as functions
- API: `basis.timer.TimeEventManager` is deprecated now
- API: `basis.crypt` exports `HEX`, `SHA1` and `MD5` functions in lower case (`hex`, `sha1` and `md5`), upper case versions become deprecated;
- API: `basis.crypt.base64/utf8/utf16` moved into separate files and new namespaces `basis.utils.base64/utf8/utf16`
- FIX: remove annoying warning in `basis.l10n.createDictionary`
- API: `basis.ui.table` header/footer cell config reworked to accept instances of `basis.Token` & `basis.event.Emitter` as value, but not config
- API: `basis.ui.Node#setSelected` and `basis.ui.Node#setDisabled` methods are implemented
- FIX: improve `basis.ui.Node#focus` to avoid infinite focus jumping across elements in some cases
- NEW: new method `basis.devpanel` API `getVersion` implemented
- NEW: store requires list in `namespace` object for debug purposes (`requires_` property)
- NEW: better `basis.resource` javascript compilation errors output
- API: don't throw exception on `basis.resource` javascript compilation error, just output error message and return `undefined`
- NEW: `basis.dev.error` function implemented
- API: split `basis.format.highlight` into `basis.utils.highlight` and `basis.ui.code`;
- API: `basis.format.highlight` is deprecated now

## 0.9.5 (july 12, 2013)

- API: `basis.data.Value#set` method returns `true` if value was changed
- FIX: `basis.net.Transport` don't add extra headers for request by default (break CORS)
- API: `basis.net.Transport#requestHeaders` is extensible property now
- API: `basis.net.rpc` was transformed into `basis.net.action` (`basis.net.rpc` is still available until 0.10.0)
- API: `basis.data.Dataset#sync` method doesn't accept second argument anymore and works as this argument is `true` (`false` value for second argument was never used and confusing)
- API: new helpers `basis.data.wrap`, `basis.data.wrapObject` and `basis.data.wrapData`
- API: using of `basis.data` as a function is deprecated now (use `basis.data.wrap` instead)
- API: using of `basis.dom.event` as a function is deprecated now (use `basis.dom.event.wrap` instead)
- API: using of `basis.ui.field` as a function is deprecated now (use `basis.ui.field.create` instead)
- API: add warning when using deprecated `basis.dom.event.onLoad` (`basis.ready` must be use instead)
- API: `basis.ui.Table#loadData` method was removed
- FIX: building of search index in docs
- FIX: exception on function to string convertation in docs (for functions with overloaded `toString` method)
- NEW: `basis.ui.PageSlider` is support for page rotation now
- FIX: double add handler in `basis.data.AbstractData#setSyncAction`
- NEW: `basis.net.action.create` creates instance of `basis.net.Transport` by default if `transport`, `service` and `createTransport` properties are not defined in config
- FIX: `basis.template.Theme#define` become context free
- NEW: `basis.template.TemplateSwitcher` class and `basis.template.switcher` helper was implemented to simplify template switching according to rule
- NEW: `basis.dom.wrapper.AbstractNode` sync was tweaked to simplify synchronization by node itself with no additional models or datasets
- API: `basis.data.property` was transform into `basis.data.value`  (`basis.net.property` is still available until 0.10.0)
- API: `basis.data.DataObjectSet` was renamed to `basis.data.ObjectSet` (`basis.data.DataObjectSet` is still available as alias)
- API: new class `basis.data.value.BindValue` (it is `basis.data.value.Property` class but with extend constructor), `basis.data.value.Property` inherits it
- API: `basis.data.value.BindValue#addLink` and `basis.data.value.BindValue#removeLink` requires explicit value for second argument now ([backward path](https://gist.github.com/lahmatiy/5962364))
- API: content property in header/footer cell config for `basis.ui.Table` is deprecated now
- API: if value for footer cell in config is a function, use function call result as a value
- FIX: exception in `basis.data.value.Expression` on global destroy (attempt to destroy object twice)
- NEW: send `X-Basis-Resource` header when fetch resource content (it helps `basisjs-tools` server to build resource cache correctly)
- FIX: recursion on resolving basis resources (browser is not freezing now, and show warning message in console when recursion occurs)
- API: `basis.path.relative` may accepts two aguments now, in this case it works similar to `path.relative` in `node.js`
- FIX: resolving dictionary pathes in `basis.devpanel` was fixed
- NEW: `basis.entity.Entity` accepts array as value for field type, in this case field become an enum
- NEW: `basis.entity.Entity` accepts string as value for field type (type with that name may not be defined at that moment, when type defines it's wrapper sets as value for that field)
- NEW: `basis.entity.EntitySet` accepts string as wrapper (type with that name may not be defined at that moment, when type defines it's wrapper sets as wrapper for `EntitySet`)
- NEW: `basis.entity.EntitySet` can be named now (second argument for `basis.entity.EntitySet` constructor or first argument for `basis.entity.createSetType` function)
- NEW: new function `basis.entity.validate` adds warnings to console if some types was used in `Entity`/`EntitySet` definitions but not defined yet
- FIX: `basis.ui.ScrollTable` crash when table has no footer
- NEW: new property `basis.ui.ScrollTable#fitToContainer`

## 0.9.4 (july 2, 2013)

- NEW: `basis.event.events.*` functions have verbose name in dev mode now (was `anonymous function` before)
- API: `basis.data.property.DataObjectSet` reset `value`/`state` changed flags before set/compute new `value`/`state`, it makes possible trigger recalc `value`/`state` inside event callbacks
- API: `basis.net.rpc` actions handle `abort` event and turn `origin` into `UNDEFINED` state
- API: `basis.net.rpc.callback` was removed ([backward patch](https://gist.github.com/lahmatiy/5891561))
- API: `basis.net.AbstractRequest` don't emit `failure` event and turn request object into `UNDEFINED` state (it's settable via `AbstractRequest#stateOnAbort`) on `abort` ([backward patch](https://gist.github.com/lahmatiy/5891591))
- FIX: add new syntax for `sourceURL` (avoid warnings in Chrome Canary)
- API: `basis.data.property.AbstractData` moved to `basis.data.Value`
- API: `basis.data.Value#updateCount` was removed ([backward patch](https://gist.github.com/lahmatiy/5895614))
- API: `forceEvent` argument for `basis.data.Value#set` was removed ([backward patch](https://gist.github.com/lahmatiy/5895982))
- API: `basis.data.property.AbstractData` and `basis.data.DataObject` aliases are removed
- FIX: `basis.template.makeDeclaration` left html tokens as is when token not resolved
- FIX: double `groupingChanged` event emit was fixed ([issue #8](https://github.com/basisjs/basisjs/issues/8))
- FIX: dataset indexes become more stable for incorrect values (avoid `NaN` as value)
- NEW: new class `basis.data.property.Expression` implemented (how to use it see [Data indexes](https://github.com/basisjs/basisjs/blob/master/demo/defile/data_index.html) or [TodoMVC](https://github.com/basisjs/basisjs/tree/master/demo/apps/todomvc/basis/js) demos)
- NEW: `basis.router` debug info output is optional now (set `basis.router.debug` = `true`/`false` to turn on/off debug output)
- NEW: `basis.resource('..').ready` method implemented, useful for async callback on init attach
- TodoMVC refactored
- Basis.js templates become more independent from host object implementation
- Various small fixes and code clean up
