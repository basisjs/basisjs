## 1.11.1 (October 25, 2017)

- Fixed wrongly placed warning in router, when no callback is removed from route (@sm0g, #179)
- Fixed warning about using a `require` when using with webpack

## 1.11.0 (September 6, 2017)

- Changed `basis.asset()` and `asset()` to take second argument `inline` (optional). When parameter is `true` (other values are treats as `false`) those functions return a resource content instead of resource reference. Good for file content inlining into JavaScript source. `basisjs-tools-build` 1.9.0+ is required to work propertly on build. (@lahmatiy)
- Reworked `basis.router` to make possible to create a parametrized route via passing second argument to `basis.router.route()`. Many thanks to @istrel for his awesome work on the feature (#150, #153). Some highlight on new routes:
    - Added `route.params` which contains typed reactive values two-way bound with location
    - Added automatic parsing and stringifying of query params
    - Added ability to normalize parameters via `normalize` param in route config
    - Added method `getPath(params)` for getting url to route
    - Added method `navigate(params, replace)` to navigate to the route
    - Added method `update(params, replace)` for bulk update `route.params`
- Tracker
    - Allow transform event data via custom handler `transformWithUIEvent` (@tyanas, #154)
    - Fixed `loadMap()` crash when tracked data is a string (@istrel, #155)
- Devpanel
    - Fixed global events releasing by devpanel when attempt to inspect a new template being in inspect mode (@smelukov, #157)
    - Fixed long attribute value output in template viewer (@smelukov, #159)
- Changed `basis.entity.is(value, type)` to work for `EntitySetType` instances (@rdvornov)
- Changed `basis.ui.field.Combobox` to close its popup by Esc (@prostoandrei, #176)
- Fixed styles `sourceUrl` resolving in template declaration info (@smelukov, #163)
- Use headless Chrome for unit testing that makes results stable (@istrel)

## 1.10.3 (May 17, 2017)

- Fixed `basis.entity.EntitySet#setAndDestroyRemoved()` to destroy items when an empty array or null passed
- Fixed using basis.js on node.js (#53)

## 1.10.2 (March 16, 2017)

- Fixed wrong warning on successful route handler removal (#151)

## 1.10.1 (March 3, 2017)

- Changed injection of `SVG` by `basis.resource()`, now it's storing `SVG` in invisible container to avoid browser specific bugs (@tyanas, #141)
- Added `keypress` to input event list in `basis.tracker` (@MammaSonnim, #134)
- Added role to `basis.ui.ScrollPanel` (@MammaSonnim, #136)
- Implemented missed `ruleEvents` for `basis.data.vector.Vector` (@lahmatiy)
- Fixed arguments order for `basis.data.index.percentOfSum()` (@lahmatiy)
- Fixed object comparation in `MapFilter` by using safe `isEqual()` function (@smelukov, #148)
- Fixed object comparation in `Extract` by using safe `isEqual()` function (@smelukov, #149)

## 1.10.0 (November 14, 2016)

### Core

- Implemented new module [`basis.type`](https://github.com/basisjs/articles/blob/master/ru-RU/basis.type.md) (#100, @istrel)
- Added warning when no `basis-config` marker is found (#120, @tyanas)
- Fixed edge case for `basis.path.resolve()` when base path is `/` (@lahmatiy)

### Data

- Fixed behaviour on dataset reseting by flushing accumulated dataset changes on `basis.data.Dataset#clear()` (#116, @istrel)
- Fixed issues on dataset destroy in accumulate state by flushing accumulated changes and prevent further `itemsChanged` events on `AbstractDataset#destroy()` (#116, @istrel)
- Fixed `basis.data.dataset.Merge` create behavior in accumulate state (#118, @istrel)
- Fixed `basis.data.dataset.Subtract` behavior in accumulate state (#121, @istrel)

### UI

- Implemented `AbstractNode#getSatellitesDataset()` method (#95, @smelukov)
- Make charts work correctly with fractional numbers (#107, @wuzyk)
- Fixed setting `defaultOrder` for auto-sorting header cell of `basis.ui.table` (#105, @lahmatiy)

### Devtools

- Added `window.$b0..$b3` references to selected object (and previously selected) in template viewer (#103, @naorunaoru)
- Added ability to cancel inspect mode by `ESC` (#129, @smelukov)
- Fixed layout by adding missing flexbox prefixes (#104, @smelukov)
- Fixed `show source` fails (#108, @smelukov)
- Fixed total file count in file graph statistics (@lahmatiy)
- Fixed issue when inspect mode doesn't cancel after a role is selected (#131, @smelukov)
- Fixed open file calls (#129, @smelukov)
- Fixed issue when inspect mode doesn't cancel after a l10n token is selected (#129, @smelukov)
- Fixed source panel visibility reset on the inspector closing (#129, @smelukov)
- Fixed issues for IE (#129, @smelukov)
- Fixed data flow connector drawing issue (#114, @smelukov)

### Other

- Implemented `roleId` tracking (#110, @tyanas)
- Implemented network activity tracking (#115, @tyanas)
- Implemented user input with roles tracking (#122, #124, @tyanas)
- Added `requestUrl` to `requestData` of `basis.net.soap.Request` (#109, @fateevv)
- Added roles to `basis.ui.slider.Slider` component (#125, @MammaSonnim)
- Fixed `node.js` 7 issue (bump karma version to use new version of `socket.io`) (#133, @smelukov)

## 1.9.2 (August 31, 2016)

- Fixed `.npmignore` not to ignore `src/devpanel/standalone/index.html`

## 1.9.1 (August 31, 2016)

### Devtools

- Fixed warning grouping by source file
- Fixed spinner overlay after first profile loading on warnings view
- Fixed opening file in editor by click in template DOM tree view
- Fixed file graph alignment to center in `Firefox`
- Fixed edge arrows in file graph in `Firefox`
- Fixed stanalone toolbar layout for old Webkit browsers (flexbox prefix issue)
- Fixed issue with old location in `Edge` when stanalone loads in iframe with new `src` (using `window.name` as workaround)
- Fixed various source warnings

## 1.9.0 (August 29, 2016)

Work in this release was focused on reworking devpanel and inspectors to support remote inspection. Starting this version UI may to be transferred into any WebView as all-sufficient bundle that communicate with app to get data and pass commands to it. It's dramatically simplify developing and debugging of devtools and provides common UX for any remote tool developer uses (on page tools, another tab, browser plugin, embedded WebView etc).
Currently most important work on devtools platform has been done. In future versions devtools will be extended to support more features and better application state representation.

### Core

- Disabled `implicitExt` in `basis-config` (i.e. `basis-config="explicitExt:false"` by default now)
- Core is now sync files update with dev-server by itself (it makes work file sync with `noConflict:true`)

### Data

- Improved `basis.data.Value#as()` method to convert string parameter to function via `basis.getter()`
- Fixed value deep wrapping by `basis.data.devWrap()`
- Added reference to source object for `basis.data.index.IndexMap` members

### Template

- Implemented `basis.template.resolveInfoByNode()` and `basis.template.resolveInfoById()` functions to simplify access to template instance description
- Made `basis.template.theme` a `basis.Token`-like to compliment `basis.l10n.culture`
- Fixed edge case when source of isolated style is reset

### Devtools

- Reworked to work on page and as remote tool
    - UI can to be build to bundle now
    - Improved transport protocols with dev-server and plugins
    - Drop legacy functionality
    - Various improvements and fixes
- Implemented basic UI tree viewer
- Implemented app warnings viewer
- Implemented app file graph viewer

### Other

- Changed `basis.app` to accept non-factory functions as valid value for `create` method
- Changed `basis.dom.resize` to use `srcdoc` and `src` to prevent net activity blinking on `IFRAME`'s document load (#92)
- Relaxing some checks for `basis.ui.scroller` (@naorunaoru, #98)
- Fixed typo in `basis.ui.pageslider` (@wuzyk, #88)
- Fixed issue with scrolling on `basis.ui.slider` on touch devices (@fateevv, #97)
- Extended `basis.dom.event` to support touch and pointer events (@fateevv, #99)
- Fixed warning in `basis.dom.event` about deprecated `keyIdentifier`
- Fixed wrong warnings (#93)
    - `Emitter` instances don't warn on handler removing when already destroyed since it all its handlers already dropped
    - `ReadOnlyValue` instances don't add destroy handler on its value since they can't drop value anyway (and shouldn't)
    - Prevented double handler removing for `Value.from()` instances
- Added link to remote devtool on index page if supported

## 1.8.3 (July 19, 2016)

- Fixed issues with `undefined` or `null` as template source (now it converts to empty string)
- Fixed using `basis.template.SourceWrapper` as cell template value in `basis.ui.table`
- Fixed navigation up from `basis.dom.wrapper.PartitionNode` instance to parent in template inspector
- Added the button to navigate up to group node in template inspector

## 1.8.2 (July 19, 2016)

- Fixed issue with build when using `invert` binding in template

## 1.8.1 (July 18, 2016)

- Fixed exception when using `b:ref` attribute in templates
- Fixed template issue when value in reference list not used as binding (changes make sense for multi-references nodes only)
- Fixed `<b:define>` apply to descendant nodes of `<b:content>`
- Fixed edge case with comments when implicit `element` reference added to comment node with no refs and bindings but in production those nodes are remove
- Fixed exception in devpanel template inspector when template source is empty string

## 1.8.0 (July 17, 2016)

### Core

- Implemented `basis.resource.buildCloak()` to hide resources that should be used in development mode only
- Changed `basis.fn.publicCallback()` to return result of wrapped function
- Implemented `basis.dev.patchFactory()` to patch factory's returning value location to location of factory definition

### Template

- Refactored `basis.template.makeDeclaration()` and work will continue
- Implemented [`<b:content>`](https://github.com/basisjs/articles/blob/master/ru-RU/template/b-content.md) to specify default insertion point in template
- Fixed incorrect `<b:text>` content trimming
- Implemented declaration AST walker `basis.template.declatation.walk()`
- Reworked `<b:include>`'s attributes processing
    - Apply attributes in order they declared in template source
    - Added warning for unknown attributes
    - Converting all attributes into equivalent instructions except `role`
    - Changed `ref` attribute logic to work as `<b:add-ref>` instruction
    - Fixed extra slash in path adding by `role` attribute
    - Fixed issue when `<b:show>`, `<b:hide>`, `<b:visible>` or `<b:hidden>` instruction with static value doesn't override opposite setting with binding
- Changed `ref` attribute to be optional for `<b:remove-ref>`
- Renamed `<b:set-role>`'s `value` attribute to `name`
- Fixed crash on using inline style with `options` attribute (@istrel, #75)
- Fixed tokenizer to return range for whole tag not for open tag only
- Added warning on duplicate namespaces for `<b:style>`
- Added warning for `<b:style>`, `<b:define>`, `<b:l10n>` and `<b:isolate>` when used not in the beginning of template

### Data

- Improved `basis.data.AbstractData` to support a `Promise` as `syncAction()` result and synchronizing its state with data object state
- Implemented `basis.entity.Type.all.set(data)` method that works as `setAndDestroyRemoved()` method but apply `reader()` for passed data and binded to `Type.all`
- Removed `basis.data.value.Property` class
- Fixed various factory location problem
- Added wraping indexes by proxy (development mode only)

### Devpanel

- Data flow
    - Fixed connections drawing on target value changing
    - Correctly show view for dataset at any node (previously shows only for source nodes)
    - Fixed issue when popup shows old graph after re-open popup for the same value
    - Better `IndexWrapper` and `Value.query()` graphs
- Template inspector
    - Added clickable warnings in template sources (click by warning opens location in editor)
    - Added support for `<b:content>`
    - Fixed coloring of template source ranges

## Other

- Fixed event extension in `basis.dom.event` it depends on event type now (@smelukov, #69)
- Improved `basis.date.format()` function to return formatting function when first argument is a string, i.e. now possible to do `format('%Y/%D/%M')(new Date())`
- Removed warning and fallback for `basis.net.ajax.Request#getResponseError()`
- Fixed `abort` processing in `basis.net.ajax` by using `onabort` event
- Fixed regression of `basis.ui.scroller.ScrollPanel` introduced in previous version (@naorunaoru, #79)
- Fixed `Value.query('childNodes.length')` for `basis.ui.Node` instances to work as expected
- Reworked `tour` and now its viewer is using on [site](http://basisjs.com) as examples viewer
- Dropped `basis/patch`

## 1.7.0 (June 24, 2016)

### Core

- Added `SVG` as new resource type, which automatically inject to document when call `startUse()` method like `CSS` resources (@tyanas)
- Implemented `basis.dev.patchInfo()` to patch dev info instead of rewriting
- Always add `sourceURL` to wrapped modules source

### Data

- Implemented `Value#query()` and `Value.factory#query()`
- Fixed `basis.data.dataset.Slice` index to be stable for `NaN` values
- Fixed `basis.data.SourceDataset#setSource()` issue when new source mutates on linking (e.g. via `syncAction`)
- Added `VectorFn` and `fnConstructor` to export of `basis.data.vector` (#68, @istrel)

### Template

- `<b:svg>` support to simplify injection of `<svg><use xlink:href=".."></svg>` to layout (@tyanas)
- Added automatic injection of `cursor: pointer` to style for elements with mouse events on touch devices to make mouse events work on iOS (#63, @istrel)
- Added resource resolve warnings to template warnings list with reference to AST token
- Reworked resource processing in declaration
- Corrected relative path resolving in markup tokens (relative to source file)
- Fixed comment processing inside blocks in `isolateCss()`
- Fixed exception when apply isolation in build version of basis.js

### l10n

- Implemented dictionary patching via `l10n: { patch: .. }` in `basis-config` (@BobbyZee)
- Ignore wrong types in `_meta` as more predictable behaviour (`default` type was set before)
- Added token source information and some debug info in dictionaries (make sense on dictionary merge when patching)
- Reworked token types and dictionary content update mechanics

### Other

- Changed container for root element of popups (`basis.ui.popup`) to mitigate layout problems in `Firefox`. Now it's a common container again not a document's body (@naorunaoru)
- Corrected calculations of min/max delta for `basis.dragdrop.MoveableElement` (@wuzyk)
- Fixed duplicate callback invocation in `basis.net.service` (#57, @BobbyZee)
- Added `requestData` as argument into `Service#signature` to simplify re-signing of requests after the session will be unfrozen (@BobbyZee)
- Changed severity for messages about rejecting the request in `basis.net.action` (@BobbyZee)
- Fixed edge cases in `basis.ui.scroller` (#59, @naorunaoru)
- Fixed edge case for range calculate in `basis.utils.source.convertToRange()`
- Fixed `basis.crypt.md5()` for messages longest than 32 chars
- Implemented `Field#required` and related changes (@istrel)
  - Conditional required via `Field#required` property
  - Automatically attach/detach `Validator.Required` depending on `required` property value
  - Added `Field#validatorsChanged` event that triggers on validators changing
  - Added `prepend` argument for `Field#attachValidator()` method to place validator in beginning

### devpanel

- Implemented representation of FRP trasformations graph named as `Data flow`. Currently for reactive bindings only. For some examples see demo: `demo/data/data-flow.html` (@tyanas)
- Added touch support in template inspector (@tyanas)
- Added `basis.l10n` token info popup on token hover
- Added opening token value location in editor
- Fixed exception in grid inspector when measuring text is zero width (@naorunaoru)
- Fixed namespace and source output in template info popup

## 1.6.0 (January 21, 2016)

- fix duplicate var declarations (thanks to new linter's check in `basisjs-tools`)
- specify explicit names for namespaces instead of `this.path`, which is no longer available in modules (thanks to @BobbyZee)
- basis.data.dataset: split into modules
- basis.data.index: refactoring
    - split into modules
    - don't export `IndexConstructor` (doesn't exist anymore)
    - simplify calc presets and `CalcIndexPreset` class
    - rework `IndexMap`, make it more async
        - inherit `IndexMap` from `SourceDataset` (instead of `MapFilter`)
        - make `IndexMap#setSource` async
        - `IndexMap#ruleEvents` → `IndexMap#recalcEvents`
        - add new members on `recalc` only
        - proxy member update to source object
        - fix issue when source index doesn't destroy on `source` change
- basis.dom.wrapper: fix value for `childClass` of `AbstractNode` (`undefined` → `Class.SELF`)
- basis.template: explicit set `UNSET` value as default binding value to separate two cases when value is never set and equal to `undefined`
- basis.template: new define type `invert` (i.e. `<b:define type="invert"/>`), that works like `bool` but inverts binding value
- basis.template: warn when `default` attribute on `<b:define>` with type `bool` or `invert` has no value
- basis.template: namespaced attributes (thanks to @tyanas)
    - support for namespaced attributes in templates
    - support `xlink` namespace by default
    - new module `basis.template.namespace` to resolve namespace by tag/attribute name
- basis.ui.paginator: add roles

## 1.5.1 (November 18, 2015)

- fix `basis.data.Dataset.setAccumulateState()` issue with `itemsChanged` event concurrency on cache flush (new event emited before cached event)
- make `parentNode` consistent for first and consequent template instances
- fix `basis.data.Value.query()` for nested properties to produce the same value for the same parameters
- show correct special key in devpanel hint to open template source in editor on Mac
- add licence field to `package.json`

## 1.5.0 (November 17, 2015)

### Core

- **NEW**: add support for dev info from instrumented source code (see [basisjs-tools-instrumenter](https://github.com/basisjs/basisjs-tools-instrumenter) as usage example)
- NEW: `Class.factory()` implemented
- NEW: `basis.require()` appends `.js` to filename, if there is no extension
- allow override console methods in `basis.dev`
- don't add `sourceURL` for sources with source map
- make framework more bundle tools aware (like `webpack`)
    - fix check for `NODE_ENV` and use context as `global`
    - don't use `require` anymore

### Data

- init work on splitting `basis.data`:
    - move state to `basis.data.state` module
    - move subscription to `basis.data.subscription` module
    - move common `resolve` function to `basis.data.resolve` module
    - move `AbstractData` to `basis/data/AbstractData.js`
- REMOVE: deprecated `STATE.from()` and `STATE.factory()`
- **NEW**: `Value.query()` implemented. This simplifies building values and factories for paths since no events set are required. For example, `Value.from(node, 'ownerChanged', 'owner').pipe('update', 'data.foo')` can be replaced for `Value.query(node, 'owner.data.foo')`. If first argument (target) is omited it produces a factory.
- NEW: `basis.data.value.expression()` implemented. `expression(foo, bar, fn)` is equivalent to `new Expression(foo, bar, fn)`. This function is useful when needs to build expression from an arbitrary number of arguments, i.e. `expression.apply(null, args.concat(fn))`
- CHANGE: `basis.data.index` functions are produce value's factory when source is factory
- basis.entity:
    - export `arrayField` and `dateField` wrappers
    - various bugs of `EntitySet#setAndDestroyRemoved()` was fixed (thanks to @BobbyZee)

### Template

- NEW: provide `setIsolatePrefixGenerator` function to set isolate prefix generator
- NEW: add raw values in debug info
- CHANGE: does not set any value to attribute if one of expression value is equal to `undefined`
- FIX: notify template source changed when subresource changes
- FIX: css isolate issue when prefix insert into `@import "url"`
- FIX: class change on `SVG` nodes in `IE11` and lower
- FIX: template theme fallback issue
- l10n
    - IMPROVE: less memory consumption for markup token templates with no bindings
    - FIX: issue with broken template source when l10n token isn't resolved
    - FIX: issue when l10n token used with computed l10n token
    - FIX: edge cases with l10n bindings in attributes
    - FIX: wrong l10n binding matches

### UI

- basis.dom.wrapper:
    - NEW: `ownerSatelliteNameChanged` event implemented
    - IMPROVE: reduce `childNodes` modification on `dataSource` changes (optimization)
- FIX: `basis.ui.field.ComplexField` destroy issue
- basis.ui.popup:
    - NEW: `Popup#trackRelElement` implemented (`false` by default)
    - NEW: `maxWidth` and `maxHeight` bindings
    - IMPROVE: better `realign` method with less DOM read operations
    - IMPROVE: don't realign on `show` method call if `dir` is not specified and popup already visible

### Router

- NEW: `basis.router.route(route)` returns `Route` instance
- NEW: `Route#add()` and `Route#remove()` helpers (equals to `basis.router.add(route, ...)` and `basis.router.remove(route)`)
- CHANGE: `basis.router.add(route, ...)` works as expected now
- CHANGE: `add()` apply matches async (asap)
- CHANGE: call `enter` and `match` callbacks asap or by `checkUrl()`
- CHANGE: calc router match independent of callback init
- IMPROVE: preventing router recursion freeze
- FIX: `remove()` invoke `leave` callback on handler remove if route matched

### Roles

Initial work on new module `basis.tracker` for unobtrusive event tracking. 

- support in `basis.ui`
    - implement `role` and `roleId` properties
- support in templates
    - `b:role` on elements attribute
    - `<b:include role>` attribute
    - `<b:set-role>` and `<b:remove-role>` instructions
- support in devpanel
    - new inspecting modes
    - initial implementation of tracker info viewer
    - last tracked event log

### Devpanel

- enable devpanel by default in dev mode (opt-out `devpanel: false` in basis config)
- ignore invisible elements when outline blocks
- improve grid overlay and add support for settings
- new template info popup
- show template owner object details in template viewer
- use dev info from instrumented sources
- fix showing l10n bindings in attributes in template viewer (#31)
- show js source fragment popup when hover source location link
- show special marker in binding list when binding value was resolved from another one

### Other

- basis.data.generator: drop module
- basis.utils.source: new module to work with sources
- basis.utils.highlight: various improvements, add source range selection
- basis.dom.event: implement `event.path` (use native or polyfill)
- basis.l10n: prevent recursion warning when use dictionary via `resource()` or `require()`
- basis.dom.resize: reset `iframe` border to fit container size (actual for containers with overflow other than `hidden` or `visible`)


## 1.4.1 (September 4, 2015)

- FIX: `basis.template` don't pass `onAction` handler to nested templates (primary for l10n markup tokens)
- FIX: double event emit on `basis.entity.Grouping#setAndDestroyRemoved()`
- FIX: `basis.net.action` don't use `stateOnAbort` value when set new state on abort

## 1.4.0 (June 17, 2015)

### Core

#### Modules and path resolving

- **NEW**: support for root namespace prefix in resource paths (a.e. `basis:ui/button.js`)
- **CHANGE**: `basis.asset()` is now resolves paths as `basis.resource()`
- **NEW**: local `asset()` function in modules scope (works like `basis.asset()` but resolves paths relative to module path)
- IMPROVE: use `basis.resource.resolveURI()` for every function that accepts path to resource
- CHANGE: improve `require()` interoperability with `resource()`
  - `[basis.]require()` behave as `[basis.]resource().fetch()` in all cases, except one: namespaces processing (i.e. `foo.bar.baz`)
  - `require()` doesn't accept `baseURI` as second argument anymore
  - `basis.resource()` accepts `baseURI` as second argument (as `basis.require()` does)
- FIX: `__dirname` has no trailing slash anymore
- FIX: edge cases with namespace and filename resolving
- FIX: `basis.resource.getFiles()` returns absolute paths and ignore virtual resources now
- FIX: `basis.patch()` is notify when apply to resolved resource now

#### Timers

- IMPROVE: `setImmediate()` polyfill 
  - try use `postMessage()` first instead of `MessageChannel` as more predictable task order in multi-sandbox mode
  - make `postMessage()` usage more safe across sandboxes by random generated message id
- **NEW**: `basis.asap(fn)` function that invoke function as soon as possible (line `nextTick()`, but tries do it in current code frame)
- **NEW**: `basis.asap.schedule()` function to create task queue (with `add()` and `remove()` methods) that processed asap
- NEW: experimental `basis.codeFrame`

#### basis.Token

- **NEW**: `basis.Token#as(fn)` method to get new token that stores transformed by `fn` value of originated token
- NEW: `basis.Token#attach()` support destroy callback as third argument (i.e. `token.attach(fn, context, onDestroy)`)
- CHANGE: `basis.Token#deferred()` uses `get()` method instead of value read from `value` property

#### Misc

- **NEW**: new config option `implicitExt` to prevent implicit namespace extension, set to `warn` by default; convert all modules to use `exports`, but not implicit namespace extensions
- NEW: `basis.fn.publicCallback(fn, permanent)` function that adds global reference to `fn`, that could be used once or permanent
- NEW: `basis.fn.factory(value)` function that makes a factory from given `value` (function with `FACTORY` marker)
- NEW: `basis.fn.isFactory(value)` function to check `value` is a factory
- NEW: `FACTORY` and `PROXY` constants
- NEW: `basis.teardown(callback, context)` function to registrate handlers that should be invoked on page or sandbox unload
- CHANGE: invoke `basis.ready()` handlers async and in order of addiction
- **CHANGE**: new implementation of `basis.getter()` with `getter.as()` method support (i.e. `basis.getter('foo').as(Number).as(Boolean)`)
- **CHANGE**: `basis.getter()` with two arguments is deprecated now (old code should be changed this way `basis.getter(fn1, fn2)` → `basis.getter(f1).as(fn2)`)
- CHANGE: `Class.nestedExtendProperty()` iterates only own keys and don't set property value to `null` if new value is not truthly
- CHANGE: `Class.oneFunctionProperty()` iterates only own object keys
- IMPROVE: add possibility to set config for `basis` core before load, `node.js` env fixes
- FIX: make `Object.defineProperty()` usage aware of `IE8`


### Data

#### basis.data

- IMPROVE: all private property naming for reactive adapters are now ends with `RA_` (i.e. `activeRA_`, `datasetRA_`)
- IMPROVE: `resolveDataset()` and `resolveObject()` re-use resolve adapter when possible (performance)
- IMPROVE: new `factoryContext` argument for `resolve*` functions (fix factory issue with some complex classes)
- NEW: `createResolveFunction(class)` function factory
- **NEW**: `resolveValue()` function, similar to `resolveObject()` and `resolveDataset()` but resolves scalar value
- NEW: support `resolveValue()` for `AbstractData#active` property
- NEW: support `resolveValue()` for `AbstractData#state` property
- **NEW**: support proxy mode for `AbstractData#active` (via setting `basis.PROXY` value to property) – object become active when has any active subscriber
- **CHANGE**: set `basis.PROXY` as default value `active` property for all source-based dataset classes. Complete list of classes:
  - `basis.data.DatasetWrapper`
  - `basis.data.dataset.Merge`
  - `basis.data.dataset.Subtract`
  - `basis.data.dataset.SourceDataset`
  - `basis.data.dataset.MapFilter`
  - `basis.data.dataset.Filter`
  - `basis.data.dataset.Split`
  - `basis.data.dataset.Slice`
  - `basis.data.dataset.Cloud`
  - `basis.data.dataset.Extract`
  - `basis.data.index.IndexMap`
  - `basis.data.vector.Vector`
  - `basis.entity.Collection` (deprecated but still)
  - `basis.entity.Grouping` (deprecated but still)
- NEW: `DatasetWrapper#getValues()` proxy method to `dataset.getValues()`
- CHANGE: `DatasetWrapper#setDataset()` method is now set new value to `dataset` property before `itemsChanged` event emit
- CHANGE: rename `Dataset#sync()` (deprecated) → `Dataset#setAndDestroyRemoved()`
- IMPROVE: wrap any value for `KeyObjectMap#keyGetter` by `basis.getter()`

##### State

- NEW: `Value.state()` helper function that returns `Value` instance storing correct state value from source object (return `STATE.UNDEFINED` if no source or source is not `AbstractData` instance)
- NEW: `Value.stateFactory()` helper function
- FIX: don't set wrong value on init (output error in console and set `STATE.UNDEFINED`)
- FIX: `AbstractData#setState()` doesn't throw an exception on wrong value now (output error in console and ignore value)

##### Value

- NEW: `ReadOnlyValue` class
- NEW: `DeferredValue` class
- NEW: `PipeValue` class
- NEW: `Value#link()` and `attach` method of `bb-interface` are now support for `onDestroy` callback
- **NEW**: `Value#pipe()` method
- IMPROVE: `Value#compute()` method is now returns function marked as factory 
- **NEW**: functions (factories) returned by `Value#compute()` or `Value.factory()` are have chaining methods now. All methods returns new function that also has those methods:
  - `pipe()` (uses `Value#pipe()`)
  - `as()` (uses `Value#as()`)
  - `deferred()` (uses `Value#deferred()`)
  - `compute()` (uses `Value#compute()`)
- **CHANGE**: `Value`'s methods and `Value.from()` are now returns some sort of `Value` instance instead `basis.Token` (more suitable, less confusion):
  - `Value#compute()` returns instance of `ReadOnlyValue` (instead of `basis.Token`)
  - `Value#as()` returns instance of `ReadOnlyValue` (instead of `basis.Token`)
  - `Value#deferred()` returns instance of `DeferredValue` (instead of `basis.DeferredToken`)
  - `Value.from()` returns instance of `ReadOnlyValue` (instead of `Value`)
- CHANGE: `Value#as()` and `Value#deferred()` methods are now work as `basis.Token` methods.
  - `Value#as()` doesn't accept `deferred` flag anymore (old code should be changed this way `value.as(fn, true)` → `value.as(fn).deferred()`)
  - `Value#deferred()` doesn't accept any arguments now (old code should be changed this `value.deferred(fn)` → `value.as(fn).deferred()`)
  - old signatures don't work anymore (output warnings in console)
- FIX: `Value.from()` instances from `bb-values` (a.e. `basis.Token` instance) destroying on `bb-value` destroy

#### basis.data.object

- NEW: support `resolveObject()` for `Merge#sources`
- NEW: support subscription for `Merge#sources`
- IMPROVE: more effecient and correct processing of `data` on `Merge` instance create
- FIX: reset properties on `source` change when new `source` has no some properties

#### basis.data.index

- **NEW**: support for `bb-value` as index source (a.e. `basis.data.index.sum(new basis.Token(..), ..)`)
- IMPROVE: rework `IndexMap`
  - items are not require subscribers to be computed anymore (probably `calcSubscribedOnly` option will be added in future)
  - make item's calculations immediately on item create (no more `update` event emit on create)
  - reduce calculations on changes
  - use `basis.asap.schedule()` for suspended calculations
  - copy data from source object to map member by default, but ignore fields with names that defined in `IndexMap#calcs`
  - new `IndexMap#copyDataFromSource` boolean property to disable copy data from source object to map member (`true` by default)
  - stop use `keyMap` as internal item storage
  - new `IndexMap#itemClass` property to specify class for map members (`basis.data.Object` by default, using instead of old `IndexMap#keyMap.itemClass`)
  - remove `IndexMap#addCalc()` and `IndexMap#removeCalc` methods

#### basis.data.dataset

- NEW: `Slice#left(offset)` and `Slice#right(offset)` methods
- CHANGE: change operation order for `SourceDataset`
  - on init (more safe init)
    - store current `source` value to local variable and set `source` to `null`
    - invoke super constructor `init` method 
    - set `source` value
  - on source change, new order:
    - add and remove `listen` handler
    - emit `sourceChanged` event
    - emit `itemsChanged` event

#### basis.data.value

- INPROVE: `ObjectSet#add()` warn about wrong value but doesn't throw an exception
- IMPROVE: use `basis.asap.schedule()` to re-calculate all changed `ObjectSet` and `Expression` instances
- IMPROVE: rework `Expression`
  - inherit from `basis.data.ReadOnlyValue` instead of `basis.data.value.ObjectSet` (as result instances are readonly now)
  - new `Expression#update()` method for immediately value recalc
  - support for any `bb-values` as arguments
  - automatically destroy instance when any argument is destroying
  - less memory consumption

#### basis.entity

- NEW: `EntityType.readList(value, [mapFn])`
- NEW: `EntityType#read(value)`
- NEW: `is(value, type)` helper function to check is `value` instance of some entity `type`
- NEW: new signatures to create entity set type (i.e. `createSetType(name, wrapper, options)`, `createSetType(wrapper, options)` and `createSetType(config)`)
- **NEW**: `EntitySet#localId` optional method to compare new items with set members; useful when members has no natural index; might be set on entity set type create (a.e. `createSetType(Type, { localId: 'id' })`)
- **CHANGE**: wrap `defValue` by field wrapper
- CHANGE: `Entity` instance invoke `syncAction()` only if has `id` value or type has no index
- FIX: field wrappers shouldn't be invoked for calc fields on init
- FIX: `reader` functions should ignore calc fields
- FIX: prevent alias definition for calc fields
- FIX: broken `EntitySet#sync()` method
- REMOVE: remove ability to define default `state` for type instance via type config
- DEPRECATE: `Collection` class
- DEPRECATE: `Grouping` class


### Template

- CHANGE: theme stuff was moved to new module `basis.template.theme`
- CHANGE: `buildDom()` function (a.k.a `buildHtml()`) was refactored and moved to new module `basis.template.buildDom`
- CHANGE: `isolateCss()` function was rewrited (parsing fixes, at-rules support) and moved to separate module `basis.template.isolateCss`
- IMPROVE: `isolateCss()` could return original offsets of prefexed css classes in original source (if third arguments is `true`)
- **IMPROVE**: rework of `l10n` (markup tokens) in templates, now it's fully suported and well tested

#### Tokenizer

- CHANGE: move `tokenize()` to new module `basis.template.tokenize`
- IMPROVE: move all parsing stuff to tokenizer
- IMPROVE: tokenizer storing token positions now
- IMPROVE: tokenizer implements warning on duplicate attributes
- FIX: wrong parsing of html token with digits at the ending (i.e `&sup2;`)

#### Declaration

- CHANGE: move `makeDeclaration()` and `getDeclFromSource()` to new module `basis.template.declaration`
- **NEW**: `from` attribute in `<b:define>` (i.e. `<b:define name="newName" from="binding"/>`)
- NEW: `b:hidden` and `b:visible` attributes on elements (as `b:show` and `b:hide` but changes `visibility` instead of `display`)
- NEW: `show`, `hide`, `visible` and `hidden` as `<b:include>` attributes and instructions (i.e. `<b:include show="..."/>` and `<b:include><b:show ref="..." expr="..."/></b:include>`)
- NEW: `options` attribute on `<b:include>` and `<b:style>` (experimental feature)
- NEW: provide `includes` in declaration – all `<b:include>` tokens as tree
- NEW: provide `l10n` in declaration - all used `l10n` tokens identifiers
- NEW: provide `styles` in declaration – all `<b:styles>` tokens
- NEW: provide `removals` in declration – all tokens that was removed from subtrees
- **IMPROVE**: a lot of new useful warnings and old warnings improvements on declaration building
- IMPROVE: add source location info to all warnings
- IMPROVE: re-use virtual resources for namespaced stylesheets (performance and memory consumption)
- CHANGE: rework binding format in declaration, change declaration version to `3`
- CHANGE: `<b:define>` doesn't apply for nested templates bindings anymore
- **CHANGE**: stop inherit `isolate` from nested templates
- CHANGE: don't isolate classes adding via `<b:include>`'s instructions with include isolate context (i.e. for case `<b:isolate prefix="foo-"/><b:include isolate="bar-" class="baz"/>` class `baz` will be isolated by `foo-` prefix only, but no by `foo-bar-` as before)
- **CHANGE**: style namespacing
  - namespaces are scoped now by template source it's declared in
  - correct cross-template isolation
  - non-resolved namespace class warning refers to original name
  - remove non-resolved namespace classes from markup (as invalid class names)
  - warning when style namespace is not used
  - fix `<b:remove>` to able remove namespaced classes
- CHANGE: ignore `l10n` binding when dictionary couldn't be resolved
- IMPROVE: declaration always include `loc` and `range` information in dev-mode
- FIX: broken bindings with `anim:` prefix when defines applyed
- FIX: `<b:remove-attr>` instruction (never works before)
- FIX: override duplicate values in `event-*` and `class` attributes on value append (remove old occurrence and add new one)
- REMOVE: `defines` from declaration
- REMOVE: `dictURI` from declaration

#### Runtime

- NEW: `log-event` special action to log event in console (a.e. `<span event-click="log-event"/>` would log event when any click on span)
- IMPROVE: special case for `tabindex` attribute
- IMPROVE: don't extend `Node` prototype with `contains` polyfill
- IMPROVE: prohibit node binding on `{element}`
- IMPROVE: start use proto cloning on second template instance creation only (reduce number of `DOM` nodes when template uses only once)
- IMPROVE: don't wrap `l10n` token content by `<span>`
- FIX: issue with `l10n` tokens attribute expression (template function compilation bug)
- FIX: safe markup token value check (no more exception on token value change in dictionary)
- FIX: broken check for instance of `Node` in `Safari` and fallback for `IE`
- FIX: exception when attribute value has `\r` or `\n`
- FIX: exceptions when binding has name like one of `Object`'s build-in property
- FIX: destroy compute tokens on template instance destroy


### l10n

- **NEW**: support for `{#}` placeholder in plural variants, it's replacing for value which was used to choose plural form
- NEW: `plural-markup` token type - plural token, but each variant has `markup` type
- NEW: `enum-markup` token type - enum token, but each variant has `markup` type
- NEW: `isToken(value)` helper function to check `value` is `basis.l10n.Token` instance
- NEW: `isMarkupToken(value)` helper function to check `value` is `basis.l10n.Token` instance with `markup` type
- IMPROVE: better `Token` destroy clean up
- IMPROVE: ignore token names in dictionary that contain dot (prevents possible resolve issues)
- REMOVE: `enableMarkup` flag (`markup` enabled by default) 


### UI

#### basis.dom.wrapper

- **NEW**: `parentChanged` event
- NEW: `SUBSCRIPTION.SATELLITE` subscription type (added to `AbstractNode#subscribeTo`)
- NEW: `SUBSCRIPTION.CHILD` subscription type
- NEW: support `resolveValue()` for `Node#disabled`
- CHANGE: `Node#disable()` and `Node#enable()` methods aren't change `disabled` if it is under `bb-value`
- FIX: `Node#setDisabled()` is always returns `boolean` now
- FIX: mixed value type sorting issue
- FIX: take in account `alive` flag in `Node#setGrouping()` method
- FIX: group sorting issue
- FIX: issue when `dataSource` is `null` inside `childNodesModified` event handler on all dataset items removal
- FIX: child nodes with `destroyDataSourceMember: true` should not be destroyed on `dataSource` change

##### Selection

- NEW: support `resolveValue()` for `Node#selected`
- CHANGE: `Node#select()` and `Node#unselect()` methods aren't change `selected` property if it is under `bb-value`
- CHANGE: `unselect` nodes goes before `select` on selection delta processing
- IMPROVE: no more `select` and `unselect` events on init and destroy
- IMPROVE: `Selection#add()` and `Selection#set()` are now can accept single node but not only array (like `Dataset`'s methods do, i.e. `selection.add(node)`)
- IMPROVE: `Node#setSelection()` now treat any non-`Selection` instance value as config for new `Selection` instance
- IMPROVE: auto unlink `Selection` instance from nodes on instance destroy
- REMOVE: drop `Node#selectable`
- FIX: only instance of `Selection` could be set as `Node#selection`
- FIX: filter non-`Node` instances when add to selection 

##### Satellites

- NEW: support `resolveValue()` for `existsIf`
- NEW: support `resolveValue()` for `instance`
- **IMPROVE**: `instance` property in satellite config is now universal property that could accept classes, bb-values, functions (which could return instance or class), factories etc.
- **IMPROVE**: support any values for `config`, `existsIf`, `delegate`, `dataSource` in satellite config:
  - if value is `function`, use as is
  - if value is `string`, wrap it by `basis.getter()`
  - otherwise convert value to function that returns specified value
- DEPRECATE: `instanceOf` (use `instance` instead)
- IMPROVE: warnings on unknown properties in satellite config

#### basis.ui

- NEW: `active` binding – refers to `Node#active` state
- NEW: `tabindex` binding – returns correct value for `tabindex` attribute depends on `Node#disabled` state
- CHANGE: `Node#action.select` doesn't call `select` method if `selected` property is under `bb-value`
- FIX: `templateChanged` event emit on init come back
- FIX: `DocumentFragment` re-use issue (`basis.ui.window.Window` override element by comment node)


### Components

#### basis.ui.field

- NEW: `Field#revalidateRule` and `Field#revalidateEvents` properties
- NEW: `ComplexFieldItem#action.selectByKey` action
- IMPROVE: rework `ComplexField`, make it more passive to value changes
- IMPROVE: export `VALIDITY` constants
- CHANGE: remove field validity reset on `keyup`
- CHANGE: change `titleText` binding for `title`
  - replace `titleText` binding by `title` (`titleText` is deprecated now)
  - `title` reference in templates replaced for `titleEl`
  - `MatchProperty` looks for `title` reference first, than for `titleText`
- FIX: `Combobox#setValue()` logic doesn't depend on `disabled` state anymore (check for `disabled` should be in actions)
- FIX: `Combobox` popup template synchronization issue

#### basis.ui.window

- NEW: support `resolveValue()` support for `Window#title`
- NEW: `Window#visible` property (inversion of `Window#closed`) with `resolveValue()` support
- NEW: `Window#setVisible()` method to set value for `Window#visible` property
- DEPRECATE: `Window#closed` property (use `Window#visible` instead)
- REMOVE: parameters support for `Window#open()` method
- REMOVE: `emit_beforeShow` event
- REMOVE: `emit_active` event (doesn't work for long time anyway)
- CHANGE: `Window#open()` and `Window#close()` methods aren't change `visible` property if it is under `bb-value`
- CHANGE: `Window#action.close` doesn't call `close` method if `visible` property is under `bb-value`
- CHANGE: `Window#action.keydown` and title buttons call window's `close` *action* instead of direct `close` method call
- IMPROVE: `Window` instances take in account `ddelement` reference to decide what element to drag

#### basis.ui.popup

- **IMPROVE**: rework popup manager, popups could has `owner` or `parentNode` now
- NEW: `'owner:ref'` value for `relElement` property (experimental)
- FIX: wrong viewport resolving for scrolling pages

#### basis.ui.paginator

- NEW: support `resolveValue()` for `Paginator#pageCount`
- NEW: support `resolveValue()` for `Paginator#pageSpan`
- NEW: support `resolveValue()` for `Paginator#activePage`
- NEW: `spanStartPageChanged` event
- IMPROVE: child nodes calls `selectPage()` method of parent node on `click` by default (not required define subclass for child to override click behaviour anymore)
- CHANGE: rename `Paginator#spanStartPage_` → `Paginator#spanStartPage`
- CHANGE: auto-spotlight page when active page is changing and page is not in viewport, on page count or span changes
- IMPROVE: make consistent event emit place

#### basis.ui.pageslider

- IMPROVE: make `PageSlider` more robust
- FIX: wrong `PaseSlider` init offset
- FIX: exception when no children on create
- FIX: exception on `PageSlider#selectNext()` and `PageSlider#selectPrev()` when no children or single child

#### Other

- NEW: support `resolveValue()` for `basis.ui.button.Button#caption`
- IMPROVE: make `header` and `footer` cells in `basis.ui.table` configurable as common `basis.ui.Node` instance
- FIX: fix warning in `basis.ui.calendar` about non-exists action by using `Calendar#selectNodeAction()` method instead of `Node#templateAction()` hack
- FIX: `invertAxis: true` chart drawing in `basis.ui.chart`
- FIX: broken selection issue in `basis.ui.chart`
- FIX: `basis.ui.chart.ChartViewer` exception on recall (because of `ownerChanged` event on init)


### Net

- REMOVE: remove `influence` functionality from `basis.net`
- FIX: double event dispatch by `basis.net.transportDispatcher`
- IMPROVE: `basis.net.update.FileUploader#uploadFiles` can accept form as url now

#### basis.net.ajax

- **CHANGE**: rename `postBody` → `body` (`postBody` is deprecated)
- IMPROVE: auto-stringify `body` if `contentType` is `application/json`
- IMPROVE: `body` in request data could be a function, that invokes with `bodyContext` and result uses as request payload
- IMPROVE: method could be set in `url`, overrides `method` setting (i.e. `transport.request({ url: 'POST /some/url' })`)
- IMPROVE: store `response` in error state data

#### basis.net.action

- **NEW**: actions are now return `Promise`
- IMPROVE: take in account that `body` could be a function and invoke it with proper context and arguments (as `prepare()` and `request()`)
- FIX: `prepare` handler works as in transport config now (when returns `true` request is not perform)

#### basis.net.service

- CHANGE: use `sessionKey` as session data if no data specified 
- CHANGE: rename `Service#isSecure` (deprecated) → `Service#secure`
- CHANGE: rename `Service#transportClass#needSignature` (deprecated) → `Service#transportClass#secure`
- FIX: resume requests when transport destroy during freeze phase cause to exception

### Other

- NEW: `basis.promise` module – ES6 Promise polyfill
- CHANGE: move cookie API to new module `basis.ua.cookie`
- IMPROVE: `basis.utils.info.fn()` function for better getter to string transformation
- FIX: escape `&` in source code before highlight in `basis.utils.highlight`
- FIX: `IE11` detection in `basis.ua`
- FIX: setting dasherized style properties in `basis.cssom`
- FIX: timezone designator converting to minutes in `basis.date`
- FIX: try to use `cancelAnimationFrame` first, instead of deprecated `cancelRequestAnimationFrame` in `basis.animation`

#### basis.router

- **NEW**: `Route` class (inherits `basis.Token`) that describes route and it's state
- NEW: `route(path)` function that returns `Route` instance by given path
- CHANGE: `add(path, ...)` function is now returns `Route` instance (like `route(path)`)
- CHANGE: router starts watch for location changes by default (on module init)
- FIX: debug info output

#### basis.app

- NEW: if argument of `create()` isn't a plain object convert it to `{ element: value }`
- NEW: use `resolveValue()` to resolve value for `element` or `init()` result (nested values support)
- IMPROVE: safe element insert to document (if exception nothing changes)

#### basis.dom.event

- FIX: don't store global event handlers in `global`, generate unique property name (per sandbox) to hold event handlers on dom elements
- FIX: fix `mousewheel` for Firefox 17+ and other modern browsers
- FIX: fix warnings for deprecated properties of `progress` event
- FIX: don't kill captured (by `captureEvent()`) events by default

#### basis.dom.resize

- IMPROVE: stop using `overflow` and `underflow` events as proposed to be removed from browsers
- FIX: make sensor non-focusable via tab key
- FIX: check element `position` property value not on sensor create but init, as host element may be not in document

#### basis.layout

- NEW: export `getOffset()` function
- IMPROVE: make functions more robust and universal (works for `window` viewport now)
- FIX: `getViewportRect()` wrong calculations

#### basis.dragdrop

- IMPROVE: add support for touch events
- FIX: work correctly for `position: fixed` elements

### Devpanel

- **NEW**: awesome template viewer
  - opened by click in template inspect mode
  - show live template dom fragment (excluding nesting template fragments)
  - show used bindings and actual their values
  - show final template markup and source template tree
- IMPROVE: using dev-server's `openFile()` everywhere for quick navigation to file
- IMPROVE: fix `l10n` token overlay regions order
- FIX: prevent focus lose issue on inspection start

### Common

- clean up and refactoring demo, docs and tour
- clean up tons of warnings in source code, styles and templates (thanks to new `basisjs-tools`)
- clean up all code style warnings (reported by `jscs`)
- add script to generate `basis.all` module
- add simple index page
- add `.editorconfig`

### Testing

- new 389 tests
- clean up and restruct most of old tests
- use sandbox mode for most test suites (performance)
- use `Yatra` test runner via `npm` (as dev dependency)
- integrate with `karma` and `TravisCI`
- add `jscs` as dev dependancy and use it before unit-test run
- add build status badge (`TravisCI`) in readme


## 1.3.4 (November 18, 2014)

- FIX: `Date` field type in `basis.entity` 
- FIX: `basis.template.isolateCss` to work with complex selectors (i.e. `:not()`, `:matches()` etc) and nested stylesheets (i.e. `@media`, `@supports` etc)

## 1.3.3 (October 12, 2014)

- FIX: exception on config processing when `Array#reduce` is not supported by browser
- FIX: exception in `basis.entity` on using `Object.defineProperty()` in IE8 (dev-mode only)
- FIX: `basis.ui.calendar` infinite loop in some cases by mistake in local binary search function
- FIX: RegExp for url validator in `basis.ui.field`

## 1.3.2 (August 5, 2014)

- FIX: remove index handler from items on dataset destroy in `basis.data.index`
- FIX: resolving by entity type wrapper in `basis.entity` when both arguments are equal (e.g. `Type(1, 1)` wrongly returns `1` instead of `Type` instance)
- FIX: make `basis.dragdrop` more stable when side choosing

## 1.3.1 (July 19, 2014)

- FIX: remove wrong warning in `basis.data.dataset.Merge#setSources()`
- FIX: exception in `basis.dom.resize.remove()` when iframe sensor used
- FIX: `basis.template` include stack issue
- FIX: `basis.net.Transport#poolLimit` request duplicate issue
- FIX: memory leaks when `MessageChannel` polyfill for `basis.setImmediate()`
- FIX: module `path` and `filename` resolving in `basis.processConfig`
- FIX: `basis.genUID()` don't rely on `performance.now()`
- API: `basis.genUID()` is return UID that always srart with alpha
- automate library publication

## 1.3.0 (July 13, 2014)

### Core

- NEW: virtual resources implemented (i.e. `basis.resource.virtual(type, content, baseURI)`)
- NEW: implement `basis.createSandbox(config)`
- NEW: use `process.basisjsReadFile(fn)` and `process.basisjsBaseURI` on `node.js` environment if possible (better build process)
- NEW: `basis.genUID(len)`
- FIX: `basis.getter()` use unique `basisGetterId_` marker for using several instances of `basis.js` core on one page
- API: `basis.resource#update` doesn't convert new content to string anymore
- API: pass current prototype state to function's class extensions for easier method overload (i.e. `SomeClass.subclass(function(superProto, currentProto){ /* ... */ })`)
- API: rework config processing
  - `basis.processConfig(object)` to process config (available in dev mode only)
  - new section `modules` to define modules (better setup for module base path and index file, multiple autoload)
  - deprecate `path` section (use `modules` instead)

### Data

#### Object

- NEW: `basis.data.resolveObject()` (similar to `basis.data.resolveDataset()`)
- NEW: `basis.data.object.Merge` listen for custom source by name (i.e. `listen: { 'source:name': { /* handler */ } }`)
- NEW: `basis.data.object.Merge` support for different field names for source and instance (i.e. `fieldName: 'source:sourceFieldName'`)
- FIX: `basis.data.object.Merge` adds own fields marker (i.e. `-`) to sources by mistake

#### Entity

- NEW: `Date` field type (convert `ISO` date string or number to date, use date instance as is, accept `null`, ignore new value otherwise)
- NEW: multiple indexes for one instance
- NEW: `basis.entity.getIndexByName(indexName)`
- NEW: `basis.entity.getByIndex(indexName, value)`
- NEW: `basis.entity.resolve(type, value)` (works like `Type(value)`)
- NEW: export `basis.entity.ConcatStringField()`
- API: unify `basis.entity.EntityTypeWrapper` and `basis.entity.EntitySetWrapper`
  - `extendClass` and `extendReader` methods return type wrapper
  - deprecate `entityType` and `entitySetType` properties (use `type` instead)
  - deprecate `extend` methods
- FIX: better `Entity` and `EntitySet` type names in dev mode

#### Dataset

- NEW: `basis.data.resolveDataset()` support for values with binding bridge interface (i.e. `basis.Token`)
- IMPROVE: mix `inserted` and `deleted` in accumulate delta if possible (reduce event count)
- API: `basis.data` cache `ReadOblyDataset#emit_itemsChanged` before `setAccumulateState` starts to use current (probably overrided) method
- FIX: issue with `itemsChanged` when delta may be corrupted in some complex cases 
- NEW: implement `basis.data.ReadOnlyDataset#getValues()` method
- API: `clear` methods in `basis.data.dataset` don't reset sources anymore
- NEW: implement `emit_ruleChanged` event for all datasets in `basis.data.dataset`
- API: uniform `setRule` methods in `basis.data.dataset` (wrap new value by `basis.getter`, emits `ruleChanged` event and returns `delta`)
- API: `basis.data.dataset` set `ruleValue` property not only for dataset, but for dataset wrapper too
- NEW: `basis.data.dataset.Merge#hasSource(value)`
- NEW: `basis.data.dataset.Merge` is now support for any values as source if it could be resolved in dataset by `basis.data.resolveDataset()`
- NEW: use `resolveDataset` for `basis.data.Subtract#minuend` and `basis.data.Subtract#subtrahend`
- FIX: `basis.data.dataset.Subtract` bug, when items that not in `minuend` removes from `subtrahend` wrongly adds to set- 
- NEW: `basis.data.dataset.Extract` dataset, that recursive extracts items by source items (rule could returns `basis.data.Object` or `basis.data.ReadOblyDataset`)

#### Value

- API: `basis.data.Value.from()` instances are readonly now
- NEW: subscription for `basis.data.Value#value` property (i.e. `basis.data.SUBSCRIPTION.VALUE`)
- API: use counter for `basis.data.Value#locked` instead of `true`/`false`
- NEW: `basis.data.Value#isLocked()` method implemented
- FIX: `basis.data.Value` correctly works with getters now
- NEW: new index `basis.data.index.distinct()` that counts unique values in dataset

#### Map

- NEW: `basis.data.KeyObjectMap#autoDestroyMembers` (`true` by default)

### Template

- CHANGE: styles of included templates are always going before own template styles
- CHANGE: apply defines per include but not per template
- NEW: support for `id:` references in `<b:include>` (i.e. `<b:include src="id:foo"/>`)
- NEW: support for inline `<b:style>`
- NEW: style isolation, new `<b:isolate>` tag and `isolate` attribute for `<b:include>`
- NEW: style namespaces, `ns` or `namespace` attributes on `<b:style>`
- NEW: `b:show` and `b:hide` attributes
- NEW: auto close `html` singleton tags (like `<input>`, `<img>`, `<br>` etc)
- NEW: build-in actions to manage events `prevent-default` and `stop-propagation`
- FIX: use unique `basisTemplateId` marker for using several `basis.js` instances on one page
- FIX: better recursion prevention (detect root template include)
- FIX: treat `indeterminate` as special attribute for `<input>`
- FIX: treat `value` as special attribute for `<select>`
- FIX: attribute expressions doesn't update `DOM` in some cases
- IMPROVE: work with resources like styles more universal to support formats other than `.css`

### UI

- NEW: named `listen` for satellites (i.e. `listen: { 'satellite:name': { /* handler */ } }`)
- NEW: `basis.ui.debug_notifier()` and `basis.ui.debug_getInstances()` functions to inspect `basis.ui` instances (available in dev mode only)
- API: use `basis.ui.Node#isDisabled()` method in `disabled` and `enabled` bindings instead of custom code
- API: `basis.ui` emit `templateChanged` event only on template change, but not on instance create
- FIX: `basis.ui.Node`'s template instance changing bug (old template handler didn't remove)
- NEW: now possible set point as `relElement` on init or by `basis.ui.popup.Popup#show()` method (i.e. `popup.show([50, 100])`)
- NEW: `basis.ui.popup.Popup#autoRealign` boolean property to prevent automatic realign on window resize
- API: deprecate `basis.ui.calendar.Calendar#sections` (use `childNodes` instead)
- FIX: broken `basis.ui.calendar.Calendar#selectDate()` method
- API: `basis.ui.form.FormContent` is now checks field is disabled on field commit
- NEW: `basis.ui.field.Checkbox#indeterminate` implemented
- API: `basis.ui.field.validator.Required()` is trim value before check
- NEW: `basis.ui.field.ComboboxItem` is now selectable when using as satellite
- NEW: `basis.ui.pageslider.PageSlider` supports for vertical scroll now

### Transport

- NEW: `basis.net.ajax.Transport` completes request's `routerParams` by transport's `routerParams`
- NEW: `basis.net.ajax.Request#sendDelay` property to delay `send` call (`null` by default)
- FIX: `basis.net.ajax` should show actual request `url` on json parse failure, but not url template
- FIX: add missed `basis.net.jsonp` to `basis.all`

### Devpanel

- restructing, refactoring, isolate styles
- tweak styles to be stable for style reset
- use `basis.js` sandbox for devpanel
- init work on `basis.ui` inspecting
- do nothing in build mode

### Other

- API: `basis.date` show warnings instead of exception throw
- NEW: `basis.dom.event` adds `target` property (alias for `sender`) to wrapped event object
- FIX: `basis.l10n.Token#computeToken` is not fallback propertly
- NEW: `basis.dragdrop` implement `DragDropElement#ignoreTarget` to ignore element that can't be a drag trigger (by default those elements are `<input>`, `<textarea>`, `<select>` and `<button>`)
- NEW: various improvements on `basis.dragdrop.MoveableElement` class, make it move universal and adaptive

### Renaming

- `basis.array.sortAsObject` → `basis.array.sort`
- `basis.data.AbstractDataset` → `basis.data.ReadOnlyDataset`
- `basis.data.DatasetAdapter` → `basis.data.ResolveAdapter`
- `basis.data.dataset.Subset` → `basis.data.dataset.Filter`

### Removals

- remove support for `extProto` in `basis-config`
- `basis.setImmediate` and `basis.nextTick` doesn't accept non-function values anymore
- `basis.platformFeature` (use `basis.cssom.features` instead)
- `basis.data.ReadOnlyDataset#clear`
- `basis.data.dataset` drop fallback for `ruleEvents` as object
- `basis.dragdrop.DragDropElement#containerGetter`
- `basis.dom.wrapper.AbstractNode#satelliteConfig`
- `basis.dom.wrapper.GroupingNode#groupGetter`
- `basis.dom.wrapper` drop support for `hook` in satellite config
- `basis.ui.Node#templateUpdate`
- `basis.ui.Node#content`
- `basis.ui.table` drop support for `content` in header config
- `basis.ui.table` drop support for `content` in footer config
- `basis.template` remove support for `<b:resource>` (use `<b:style>` instead)


## 1.2.5 (June 3, 2014)

- FIX: fix issues with request concurrency and request abort in `basis.net.jsonp`
- FIX: process `value` attribute for `<select>` as special
- FIX: crash issue with `basis.entity.EntitySet#sync`

## 1.2.4 (May 26, 2014)

- FIX: `basis.ui.slider` exception on value changes via `mousewheel`
- FIX: `basis.entity` warnings on entity destroy and `all.sync([])`
- FIX: `basis.ui.chart` wrong key label vertical text offset when no `y` axis labels shown
- add `sourceURL` to css resource content (`Chrome DevTools` shows source files now)
- tweak `basis.devpanel` styles

## 1.2.3 (April 24, 2014)

- FIX: one more fix for `basis.utils.info.fn` function parsing 
- FIX: bug with processing of zero values in `basis.ui.chart.SeriesChart` series
- FIX: `basis.data.index.IndexMap#destroy` method (issue #15)
- FIX: `basis.devpanel` crash on inspecting SVG elements
- FIX: one more fix for `basis.ui.field` fix URL validator (regexp)
- FIX: hide `basis.devpanel` in print styles
- FIX: rework `basis.ui.calendar.CalendarNode` creation to work `before` and `after` bindings propertly (issue #16)
- FIX: `basis.layout.getViewportRect` adds page scroll offset twice

## 1.2.2 (April 9, 2014)

- FIX: `basis.ui.field.validator.Url` domains could starts with digit now
- FIX: `basis.ui.slider.Slider` doesn't fire `change` event when value isn't changed now
- FIX: `basis.utils.info.fn` freeze (endless loop) on function source parsing when source has a RegExp
- IMPROVEMENT: `basis.template.html` doesn't use `DocumentFragment` wrapper for base DOM structure (performance)
- use `.jscsrc` instead of `.jscs.json` config file for `jscs`
- `basis.template.html` reserve `get` as prohibited binding name
- other small fixes and improvements

## 1.2.1 (March 27, 2014)

- remove usage of `createAttributeNS` and `setAttributeNodeNS` DOM methods in `basis.xml` and `basis.net.soap` as candidates for remove from DOM level 4 (methods are removed in Chrome 35 canary already, [more details](https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/jS7iCEmoWfQ))
- FIX: `basis.data.Object` instance didn't remove back reference to object that stop delegates it in some cases (issue #12)

## 1.2.0 (March 24, 2014)

Core

  - API: don't extend buildin classes prototypes by default (i.e. `extProto: false`)
  - API: warn when filenames using with no `./`, `/` or `..` prefix
  - API: all resource extensions are updatable by default now, to supress that use `permanent` property equals `true` (`.js` extension does)
  - NEW: `basis.resource.get`, `basis.resurce.isResolved` functions and `basis.Resource#isResolved` method implemented
  - NEW: `basis.resolveNSFilename` function to get filename by namespace name
  - NEW: `basis.patch` function for resource patching implemenented
  - FIX: a ton of bugs in `basis.path` (fully covered by tests now)
  - FIX: local `resource` function wrongly resolves absolute path as relative
  - FIX: make `basis.json.parse` throw an exception when `JSON.parse` fallback using (to be consistent with `JSON.parse`)
  - IMPROVEMENT: set checkers for `<head>` and `<body>`, only if one of them is not available (speedup app load)

Dev panel

  - NEW: open template file in external editor by `ctrl`+`click` (windows) or `cmd`+`click` (mac) in template select mode (works only if `basisjs-tools` supports it and using external editor is setting up)
  - NEW: panel now become gray when `dev-server` offline and blue when online
  - NEW: notify about permanent resource updates that require page reload
  - FIX: show correct state of `dev-server` online status on startup
  - FIX: bug with exit from template select mode
  - IMPROVEMENT: make `devpanel` works with new `basisjs-tools` when `basis.data` module is not loaded (robust)
  - various code and style improvements

Data

  - NEW: very promising `basis.data.object.Merge` class implemented (new namespace `basis.data.object`)
  - API: remove deprecated `basis.data.Object#isTarget` property fallback
  - API: remove `typeof` check in `basis.data.Value.from` to be usable with functions that have binding bridge (like `basis.Resource` or `basis.l10n.culture`)
  - FIX: reset `basis.data.Value#lockedValue` on `basis.data.Value#unlock` method call (avoid memory leaks)
  - FIX: `basis.data.Object` trigger unecessary events for dynamically added or removed delegates on `update` and `stateChanged` events
  - FIX: issue with dependent values that destroing on source destroy and subscription
  - FIX: repair broken `basis.data.Dataset#sync` method
  - NEW: implement `basis.data.dataset.Slice#setRule` method
  - IMPROVEMENT: use `delta.inserted` as cache if possible (performance, memory consumption)

basis.entity

  - NEW: `basis.entity.get` helper implemented to get instance by type name and id pair
  - NEW: `extendClass` and `extendReader` helpers implemented for `basis.entity.EntityType` and `basis.entity.EntitySetType`
  - NEW: make creation of `all` instance dataset optional (set `all: false` in type config to prevent `all` creation)
  - FIX: fix issues with defaults on `basis.entity.Entity` creation
  - FIX: issue when `Object.prototype` property names are using as index value
  - FIX: remove missed `Type#addField` and `Type#addCalcField` methods (not working since `1.0` through)
  - FIX: bug by using named types with later declaration in field definitions
  - IMPROVEMENT: improve entity instance creation (performance, 3x-5x faster now)
  - IMPROVEMENT: rework getting type instance via wrapper by `number` or `string` id i.e. `EntityType(id)` (performance)
  - IMPROVEMENT: entity instances init `fieldHandlers_` property on demand (memory consumption)
  - IMPROVEMENT: treats enum fields with one variant as constant value (performance)
  - IMPROVEMENT: reduce defaults builder function creation, speed up creation a lot of similar types (performance)
  - various code improvements

Template

  - FIX: dictionary path resolving (build issue)
  - FIX: `<b:l10n>` relative path resolving (build issue) 
  - FIX: `<b:remove-attr>` and `<b:append-attr>` didn't work on some attributes
  - FIX: `style` processing attribute issues
  - FIX: crash when template source contains `*/` (couldn't be compiled in dev mode)
  - FIX: clean up almost all warnings in default templates
  - warn on using deprecated `<b:resource>` (will be removed in next release)

UI

  - FIX: `basis.dom.wrapper.childNodesState` state data is not set propertly in some cases
  - IMPROVEMENT: `basis.dom.wrapper` init `satellite` property on demand (memory consumption)
  - IMPROVEMENT: `basis.dom.wrapper` call `match` method of `newChild` on insert only if required (performance)
  - FIX: add missed `updatePosition` event emit in `basis.ui.scroller.Scroller#setPositionX` and `basis.ui.scroller.Scroller#setPositionY` methods
  - FIX: sync `basis.ui.field.Select` value on template init

Net

  - API: `AjaxTransport`, `AjaxRequest` classed and `request` helper moved from `basis.net` to new `basis.net.ajax` namespace (patched)
  - NEW: `basis.net.ajax` support for `responseType` added
  - API: `basis.net.ajax.Request` instances don't store `resposeText`, `responseXML` and `error` in `data` anymore (memory consumption)
  - API: method `processErrorResponse` renamed to `getResponseError`
  - NEW: `JSONP` support added via new `basis.net.jsonp` namespace that provides `Transport` and `Request` classes and `request` helper (similar to `basis.net.ajax`)

Project maintenance

  - brand new test runner (it became [separate project](https://github.com/basisjs/test-runner))
  - test suite has been updated, many new tests added

Other changes

  - FIX: remove usage of `body.scrollTop` and `body.scrollLeft` in standarts mode, to avoid warnings on `webkit`
  - FIX: remove old `//@ sourceURL` syntax
  - FIX: `basis.date.fromISOString` timezone issue
  - FIX: missed `basis.date.toISOString` added
  - API: `basis.date.toFormat` fallback was removed
  - API: `.l10n` resources return dictionary instead of `json` object now
  - FIX: `basis.app` always replaces container, but not append
  - FIX: `basis.router` issue when callbacks on empty path don't invoke if added after router start
  - NEW: `domain` parameter added for `basis.ua.cookies.set` and `basis.ua.cookies.remove`
  - NEW: `basis.dom.resize` adds `basis-dev-role` attribute for sensor elements
  - NEW: make `basis.layout.getBoundingRect` works with `Range` instances
  - API: move `VerticalPanel` and `VerticalPanelStack` classes from `basis.layout` to new namespace `basis.ui.panel` (patched)
  - API: remove deprecated `Box`, `Viewport` and `addBlockResizeHandler` from `basis.layout` (patched)
  - API: `basis.dragdrop.DragDropElement#isDragging` method returns `false` inside `over` event handlers now (returns `true` before)
  - IMPROVEMENT: rewrite some hot functions to be optimized by V8 (performance)
  - IMPROVEMENT: `basis.dragdrop` ignore `mousedown` event occur on scrollbars now (robust)
  - IMPROVEMENT: rework `basis.utils.info.fn` function source parsing from regexp to tokenize to be stable in any cases (robust)
  - IMPROVEMENT: test `getComputedStyle` for bugs on demand, when first `basis.dom.computedStyle.get` invoke and only on first buggy property request (speedup page load, avoid layout and style calculations)

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
- FIX: `basis.doc.ready` and use it in `basis.ui.popup`/`basis.ui.window`
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
