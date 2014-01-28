## 1.1.0 (January 28, 2014)

New namespaces:

  - `basis.utils.benchmark` – utils for benchmarking, use new browser APIs when possible (speed tests was changed to use it)
  - `basis.dom.computedStyle` – functions to get computed values for css properties
  - `basis.dom.resize` – event-based element resize detection (other modules was refactored to use it)

basis.event

  - API: rename `basis.event.Emitter` methods `emit_debug` -> `debug_emit` and `handler_list` -> `debug_handlers`
  - FIX: `basis.event.Emitter#removeHandler` method always warns when no handlers and handler didn't removed now
  - FIX: warnings in `basis.event` show incorrect class in messages
  - FIX: multiple call of `basis.event.Emitter#destroy` method is not fanal anymore and override destroy method not only in dev mode for behaviour consistence
  
basis.layout

  - deprecate `basis.layout.Box`, `basis.layout.Viewport` and `basis.layout.addBlockResizeHandler`
  - remove `basis.layout.Intersection`
  - rework `basis.layout.VerticalPanelStack` and `basis.layout.VerticalPanel`
  - new functions: `getOffsetParent`, `getTopLeftPoint`, `getBoundingRect` and `getViewportRect`
  - add tests for new functions

basis.l10n

  - API: `basis.l10n.culture.set` is equivalent to `basis.l10n.setCulture` now
  - FIX: `basis.l10n.setCulture` don't set culture as current if culture is not in the culture list
  - FIX: prevent `basis.l10n.culture` to create new instances of `basis.l10n.Culture`
  - API: allow to use `basis.resource` for `basis.l10n.dictionary` function
  - NEW: experimental support for object as content for dictionary

basis.data

  - API: remove `basis.data.Object#isTarget`
  - NEW: `basis.data.Value.from` function casts object properties to `basis.data.Value` (experimental)
  - FIX: `basis.data.dataset.Slice` index order (finally)
  - FIX: `basis.data.Value` destroy method doesn't remove listen handlers from linked emitter instances
  - FIX: `basis.data.Value` set value to `null` when value is `basis.event.Emitter` and destroing 
  - FIX: change destroy order for `basis.data.Object`
  - NEW: `basis.data.resolveDataset` and `basis.data.DatasetAdapter` implemented
  - NEW: `basis.data.DatasetWrapper#setDataset`, `basis.data.dataset.SourceDataset#setSource` and `basis.dom.wrapper.Node#setDataSource` methods are using `basis.data.resolveDataset` now
  - `basis.data.Dataset#sync` and `basis.entity`'s datasets aggregate events on objects destroy

basis.dom.wrapper satellites:

  - API: `basis.dom.wrapper.Node#satelliteConfig` is now deprecated (`basis.dom.wrapper.Node#satellite` should be used instead)
  - API: `events` property should be used instead of `hook` property in satellite config
  - NEW: `basis.dom.wrapper.Node#setSatellite` accepts satellite config now
  - NEW: `instance` property in satellite config
  - fix various issues
  - cover by tests

Project maintenance:

  - add `.gitignore`
  - add `.jscs.json` to use with [JavaScript Code Style checker](https://github.com/mdevils/node-jscs), init clean up source code style, add own rule to check identifiers
  - new readme (ru)

Other changes:

  - FIX: fix `basis.resource` and `basis.require` implicit namespace conversion from path
  - NEW: `basis.app#ready` method implemented
  - NEW: `basis.router` supports `\` and `|` (inside braces) in path as special symbols now
  - FIX: `basis.net` don't replace semicolon prefixed names for `undefined` in url if no value in `routerParams`
  - API: remove `basis.dom.event.Handler`
  - NEW: `<b:remove>` instruction implemented in `basis.template`
  - FIX: fix warnings and double event emit on `basis.dom.wrapper.AbstractNode#setOnwer`
  - FIX: change `basis.ui.Node` destroy order
  - API: set null to `basis.ui.Node#template` is not allowed now (only on node destroy)
  - FIX: `basis.dom.wrapper` issue with non-empty groups on grouping reset
  - delete deprecated `basis.html` namespace file
  - rework `basis.ui.GroupingNode` and `basis.ui.PartitionNode` moving on template update 
  - rework `basis.ui.table.HeaderGroupingNode`
  - improve `basis.ui.scrolltable` by using `basis.dom.resize`
  - various small fixes and improvements in `basis.ui.chart`
  - temporary remove file inspector from `basis.devpanel`
  - `TodoMVC` demo refactoring

## 1.0.0 (december 18, 2013)

- FIX: template events for IE8 and below
- FIX: `basis.ui.field.Combobox` to be more stable with popup template sync
- FIX: `basis.doc.ready` and use it in `basis.ui.popup`/basis.ui.window`
- FIX: `basis.ui.popup.Popup` layout for case when body.position = static
- FIX: style and template bindgins in IE8 and lower
- FIX: issue on `basis.ui.chart` childNodes update
- FIX: `basis.data.dataset.Slice` internal member index corruption when some items has the same value

## 1.0.0-rc3 (december 4, 2013)

- NEW: `ruleValue` property implemented for `basis.data.dataset.Split` and `basis.data.dataset.Cloud` subsets
- NEW: email & url validators support cyryllic symbols
- NEW: add `file` param name implemented in `net.upload`
- NEW: cross-browser implementation for `mouseenter` and `mouseleave` events in templates
- NEW: flexible style customization for `basis.ui.chart`
- NEW: `basis.dragdrop.DragDropElement#startRule` implemented
- NEW: `basis.router` support for optional parts in path
- NEW: `basis.ui.field.Select` support multiple selection
- NEW: rework `basis.date`: make optional `Date` prototype extension and related changes
- NEW: resources with `basis.ui.Node` instance as `module.exports` now can be used as binding value with no `fetch` method
- NEW: support for local vesion of `basis.require` in js resources
- NEW: plural forms for most languages and cultures in `basis.l10n`
- NEW: rework `basis.data.Object#setDelegate` to solve various problems on delegate change
- NEW: `basis.data.Object` is support for `root` listener now
- NEW: `basis.entity.Entity#rollback` support for list of fields that should be rolled back
- API: change order for `basis.data.index` helpers, optional events argument should be before getter argument
- API: `basis.entity.Entity#rollback` might be call for any state of entity (it was possible if entity hasn't processing state before)
- API: `basis.entity.Entity#rollback` doesn't change entity's state
- API: rename `basis.dom.wrapper.GroupingNode#groupGetter` -> `basis.dom.wrapper.GroupingNode#rule`
- FIX: issue with `Function#name` property usage that doesn't support by old IE
- FIX: l10n token resolving for included by name templates
- FIX: proper usage of `FormData` for IE in `net.upload`
- FIX: `basis.dom.event.mouseX` and `basis.dom.event.mouseY` to prevent page reflow when event has no mouse related properties
- FIX: NaN for `basis.dom.event.wheelDelta` when delta is equal to zero
- FIX: improve `basis.event.sender` to be more stable across browsers
- FIX: prevent warnings about deprecated properties usage on `basis.event.Event` creation 
- FIX: override `basis.Token.attach` and `basis.Token.detach` methods on destroy to avoid warnings and possible problems
- FIX: `basis.ui.field.Combobox` creation & destruction to avoid warnings about incorrect handlers removals
- FIX: 'use strict' usage in modules
- FIX: warn when empty array set as definition for `basis.entity.Entity` field
- FIX: `basis.ui.field` field's new and current values comparison
- FIX: `basis.ui.field` explicit cast of field value to string type before applying regexp validator
- FIX: `minLength` validator in `basis.ui.field`
- FIX: `basis.animation.Modificator` computations on thread value changes 
- FIX: calc doesn't compute on `basis.entity.Entity` creation in some cases
- improve `basis.router` path parsing
- speed up `basis.date.format` function
- some code changes for better browser js optimizations
- small refactoring of `basis.ui.field.Field` & `basis.ui.field.ComplexField`
- various bug fixes

## 1.0.0-rc2 (october 25, 2013)

Removals:

- namespaces: `basis.session`, `basis.timer` (`basis.timer.*` -> `basis.*`)
- classes: `basis.data.BindValue`
- methods and properties: `basis.string.quote`, `Array#item`, `Array#merge`, `Array#set`, `Array#clear`, `Array#binarySearchPos`, `Array#binarySearch`, `String#quote`, `String#toArray`, `Number#between`, `Number#toHex`, `Number#sign`, `Number#base`, `Number#quote`, `basis.data.Object#getRootDelegate`, `basis.data.Object#cascadeDestroy`, `basis.data.Object#canSetDelegate`, `basis.dom.wrapper.Node#nodeType`, `basis.dom.wrapper.Node#getChildren`, `basis.dom.wrapper.Node#hasOwnSelection`, `basis.ui.Node#cssClassName`
- functions: `basis.object.coalesce`, `basis.fn.body`, `basis.fn.def`, `basis.dom.head`, `basis.dom.body`, `basis.dom.appendHead`
- fixes for `Date#getYear` and `Date#setYear`

Relocations:

- `basis.cssom.CssResource` -> core (basis.js)
- `basis.data.BindValue#addLink` -> `basis.data.Value#link`
- `basis.data.BindValue#removeLink` -> `basis.data.Value#unlink`
- `basis.ui.Node#focusable` -> `basis.ui.field.Field#focusable`
- `basis.html` -> `basis.utils.html`

Other changes:

- NEW: `noConflict` in `basis-config` implemented
- NEW: `extProto` in `basis-config` implemented (`false` – don't extend buildin class prototypes, `true` – extend, `"warn"` – extend, but warn about non-standard method usage)
- NEW: `basis.doc` – async interface for head/body implemented
- NEW: `basis.Class.all_` implemented that contains list of all classes (for debug purposes, dev only)
- NEW: `basis.json.parse` implemented, that replaced `String#toObject` in some cases
- API: don't store `lastSearchIndex` in `Array`, but into array itself
- API: binding bridge `attach`/`detach` methods return nothing now (`undefined`) 
- FIX: dictionary path resolving in `basis.devpanel`
- NEW: `basis.utils.info` namespace implemented
- NEW: extend `basis.data.DatasetWrapper` with `has`, `pick`, `top` and `forEach` proxy methods 
- FIX: `root` & `syncAction` problem on init for `basis.data.Object`
- FIX: issue with `subscription` for `basis.data.DatasetWrapper#dataset` on init
- FIX: `basis.data.dataset.Cloud` subset auto-creation on source items changed 
- FIX: `basis.entity.Grouping` set wrapper for subset
- FIX: edge cases in templates (`actions` doesn't process if `basisTemplateId` equals to 0 or no context object)
- FIX: prevent `basis.dom.wrapper.Node` destroy if it delegates dataSource item
- API: remove support of `cssClassName` in `basis.ui.table` column config, but add support for `templates`
- NEW: warn about action name isn't found in `basis.ui.Node#action` list
- `basis.ui.Node` don't change `display` style of element on `match` and `unmatch` events by default 
- FIX: `basis.net.AbstractRequest#abort` method in new Chrome
- FIX: IE8 issue with `basis.ready`
- FIX: IE8 issue with `basis.animation`
- FIX: IE8 issue with `basis.layout.VerticalPanelStack`
- improve template fallback for browsers with no capture phase 
- rework creation of root namespaces

## 1.0.0-rc1 (september 21, 2013)

basis.require:
  
  * now accepts filename (allow any file type) and returns resource content (exports for `.js`) like node.js
  * basis.require(smth) works like basis.resource(smth).fetch(), if smth is not a namespace
  * any `.js` file requested by `basis.require` or `basis.resource` has it own namespace

**Brand new `basis.l10n` module**:

  * new simplified API
  * no namespaces and no base dictionaries any more
  * new dictionary format (file extension is `.l10n` now)
  * support for enums
  * support plural
  * support for markup, but disabled by default due to build problems for now; it could be enabled by setting `true` to `basis.l10n.enableMarkup`, but no guarantee build be successful
  * Chrome Developer tools [plugin](https://chrome.google.com/webstore/detail/basisjs-tools/paeokpmlopbdaancddhdhmfepfhcbmek) and [basisjs-tools](https://github.com/basisjs/basisjs-tools) ready

Templates:

  * support for new `basis.l10n`
  * `<b:l10n>` implemented, to define dictionary using by template
  * `<b:text>` implemented, to preserve text inside as is and ignore any markup
  * count of `basis.template.Template` instances limited to 4096
  * no more exception on double colon in tag/attribute name, tokenizer silently converts those tags into text
  * remove support for references on attributes in template source
  * DOM node values bind as node only for first binding occurrence and as string for others
  * template instances **reduce memory consumption by more than 30%**

UI:

  * move template instance creation to `basis.ui.Node#postInit` and related changes, one step closer to `basis.ui.Node` template independence
  * rework `basis.ui.Node#setTemplate` and `basis.ui.Node#templateSync` methods
  * remove `noRecreate` argument for `basis.ui.Node#templateSync` as not using any more
  * emit `templateChanged` event on template changing, but not on `basis.ui.Node#init`
  * any value for `basis.ui.Node#binding` keys that has `bindingBridge` accept as is now
  * fix problem when satellite changes it's template
  * rework all `basis.ui.*` components to support new workflow

Dev panel:

  * support for new `l10n` and `templates`
  * improve l10n tokens hightlighing
  * improve template selection and highlighting
  * new feature: basic heat map implementation

Tour:

  * reworked to support for new features
  * use `codemirror` for code editor
  * everything is updatable
  * support `l10n` for slides
  * slide generator

Removals:

- don't extend build in classes by default and drop extClass option in `basis-config`
- don't extend global with `setImmediate`/`clearImmediate` and don't patch `setTimeout`/`clearTimeout`
- remove all deprecated things
  * namespaces: `basis.format.highlight`, `basis.net.rpc`, `basis.ui.label` and `basis.data.property`
  * classes: `basis.ui.Container`, `basis.ui.field.Validator`, `basis.data.value.DataObjectSet`
  * functions: `basis.crypt.UTF16/UTF8/HEX/Base64/SHA1/MD5`, `basis.cssom.hide`, `basis.cssom.show`, `basis.cssom.visible`, `basis.cssom.invisible`, `basis.dom.event.onLoad`
  * objects: `basis.timer.TimeEventManager`
  * methods: remove `basis.namespace#setWrapper` (and all wrappers), `basis.data.AbstractDataset#getIndex`, `basis.data.AbstractDataset#deleteIndex`, `basis.entity.EntityTypeConstructor#addField`, `basis.entity.EntityTypeConstructor#addAlias`, `basis.entity.EntityTypeConstructor#addCalcField`, `basis.ui.button.ButtonPanel#getButtonByName`, `basis.ui.form.FormContent#getFieldByName` and `basis.ui.form.FormContent#getFieldById`
- drop support for `basis.ui.Node#id`, `basis.l10n.Token` instance as value for `basis.ui.Node#content`

Other changes:

- basis.Class refactored
- NEW: `basis.all` implemented
- API: basis namespaces are objects now (instances of `basis.Namespace`, was functions before)
- NEW: `basis.event.Emitter#handler_list` method implemented to show list of handlers as an array (available in development only)
- API: `basis.data.Value` instances don't pass `value` as first argument for `change` event handlers any more
- API: inherits `basis.data.AbstractDataset` from `basis.data.AbstractData`
- API: `basis.data.SourceDataset#setSource` and `basis.dom.wrapper.Node#setDataSource` methods accept `basis.data.DatasetWrapper` as correct value, and `basis.data.index`'es also work with `basis.data.DatasetWrapper` as with dataset
- NEW: `basis.ui.ShadowNodeList` and `basis.ui.ShadowNode` classes implemented, `basis.ui.tabs` and `basis.ui.calendar` reworked to use it
- API: rework `basis.ui.paginator` (API changed)

And other various bug fixes, improvements, refactoring and code clean up.

## 0.9.10 (september 21, 2013)

- FIX: `basis.net.AjaxRequest#setTimeout` for synchronous requests
- FIX: `basis.setImmediate` for IE8 and below and other old browsers
- FIX: fix multiple subscribe/unsubscribe for subscriptions with more than one event
- FIX: no more warnings on `enum` entity field definition in `basis.entity`
- FIX: add `basisObjectId` to base class prototype
- FIX: `satellite` doesn't remove itself from `owner.satellite` map on `owner` change via `setSatellite` and `setOwner` methods
- FIX: make `instanceOf` for satellite as `basis.dom.wrapper.AbstractNode` by default (if not defined)
- FIX: make `itemsChanged` event accumulation more stable ([test](test/spec/data/dataset.html))

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
