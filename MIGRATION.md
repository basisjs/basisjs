## 1.6.0 → 1.7.0

Might break

  - `SVG` is new resource type, which automatically inject to document when call `startUse()`
  - Relative path in markup tokens are resolving to source file now
  - Ignore wrong types in `_meta` as more predictable behaviour (`default` type was set before)
  - Common container for root element of popups (`basis.ui.popup`) instead of document's body

## 1.5.0 → 1.6.0

Remove

  - `this.path` is no longer available in modules
  - `basis.data.index.IndexConstructor`

Might break

  - `IndexMap` was reworked to be more async and simpler (see details in HISTORY.md)
  - never set binding and binding with `undefined` value behaviours are differ now

## 1.4.0 → 1.5.0

Remove

  - `STATE.from()` (use `basis.data.Value.state()` instead)
  - `STATE.factory()` (use `basis.data.Value.stateFactory()` instead)
  - `basis.data.generator` module

Might break

  - `basis.require()` appends `.js` to filename, if there is no extension

## 1.3.0 → 1.4.0

Rename

  - `basis.data.Dataset#sync()` → `basis.data.Dataset#setAndDestroyRemoved()`
  - `basis.ui.field.Field#binding.titleText` → `basis.ui.field.Field#binding.title`
  - `title` → `titleEl` reference in `basis.ui.field` templates
  - `basis.ui.paginator.Paginator#spanStartPage_` → `basis.ui.paginator.Paginator#spanStartPage`
  - `basis.net.Service#isSecure` → `basis.net.Service#secure`
  - `basis.net.Service#transportClass#needSignature` → `basis.net.Service#transportClass#secure`
  - `basis.net.ajax.Transport#postBody` → `basis.net.ajax.Transport#body`
  - `basis.require('basis.ua').cookies` → `basis.require('basis.ua.cookie')` (`basis.ua.cookies` moved to separate namespace `basis.ua.cookie`)
  
Remove

  - `deferred` argument in `basis.data.Value#as()` (`value.as(fn, true)` → `value.as(fn).deferred()`)
  - `fn` argument in `basis.data.Value#deferred()` (`value.deferred(fn)` → `value.as(fn).deferred()`)
  - `basis.data.index.IndexMap#addCalc()`
  - `basis.data.index.IndexMap#removeCalc`
  - ability to define default `state` for `basis.entity` types via type config
  - `defines` from template declaration
  - `dictURI` from template declaration
  - `select` and `unselect` events emit on init and destroy (`basis.dom.wrapper.Node`)
  - `basis.dom.wrapper.Node#selectable`
  - arguments in `Window#open()`
  - `basis.ui.window.Window#emit_beforeShow()`
  - `basis.ui.window.Window#emit_active()` (doesn't work anyway)
  - `basis.net.action` isn't add `request` property to context object (on action invocation)
  - `basis.net` remove `influence` functionality

Deprecated

  - `modificator` argument in `basis.getter()` (`basis.getter(fn1, fn2)` → `basis.getter(f1).as(fn2)`)
  - `basis.data.Dataset#sync()`
  - `basis.entity.Collection`
  - `basis.entity.Grouping`
  - `instanceOf` in satellite config of `basis.dom.wrapper.Node` (use `instance` instead)
  - `basis.ui.field.Field#binding.titleText` (use `Field#binding.title` instead)
  - `basis.ui.window.Window#closed` (use `Window#visible` instead)
  - `basis.net.Service#isSecure` (use `Service#secure` instead)
  - `basis.net.Service#transportClass#needSignature` (use `Service#transportClass#secure` instead)
  - `basis.net.ajax.Transport#postBody` (use `Transport#body`)

Might break

  - `basis.asset()` is now resolves paths as `basis.resource()` (left value as is before)
  - `require()` doesn't accept `baseURI` as second argument anymore
  - `__dirname` has no trailing slash now
  - all private property naming for reactive adapters are now ends with `RA_` (i.e. `activeRA_`, `datasetRA_`)
  - `basis.PROXY` is default value for `active` property for all source-based dataset classes; this means that any instance of those classes become active when has any active subscriber
  - `basis.data.DatasetWrapper#setDataset()` method is now set new value to `dataset` property before `itemsChanged` event emit
  - `basis.data.Value`'s methods and `basis.data.Value.from()` are now returns some sort of `basis.data.Value` instance instead `basis.Token`:
    - `Value#compute()` returns instance of `basis.data.ReadOnlyValue` (instead of `basis.Token`)
    - `Value#as()` returns instance of `basis.data.ReadOnlyValue` (instead of `basis.Token`)
    - `Value#deferred()` returns instance of `basis.data.DeferredValue` (instead of `basis.DeferredToken`)
    - `Value.from()` returns instance of `basis.data.ReadOnlyValue` (instead of `Value`)
  - `basis.data.index.IndexMap` was reworked
    - items are not require subscribers to be computed anymore
    - make item's calculations immediately on item create (no more `update` event emit on create)
    - copy data from source object to map member by default (set `IndexMap#copyDataFromSource` to `false` to disable it), but ignore fields with names that defined in `IndexMap#calcs`
    - stop use `keyMap` as internal item storage
    - `IndexMap#itemClass` property is using instead of old `IndexMap#keyMap.itemClass`
  - operation order for `basis.data.dataset.SourceDataset` was changed
    - on init (more safe init)
      - store current `source` value to local variable and set `source` to `null`
      - invoke super constructor `init` method 
      - set `source` value
    - on source change, new order:
      - add and remove `listen` handler
      - emit `sourceChanged` event
      - emit `itemsChanged` event
  - `basis.data.value.Expression` inherited from `basis.data.ReadOnlyValue` (instead of `basis.data.value.ObjectSet`) and instances become "readonly"
  - `basis.entity.Entity` instances invoke `syncAction()` only if have `id` value or type has no index
  - `basis.entity.Entity` instances is now wrap `defValue` by field wrapper
  - binding format in template AST was changed (declaration version changed to `3`)
  - `<b:define>` doesn't apply for nested templates bindings anymore (scoped by template source it's declared in)
  - `isolate` is not inherit from nested templates 
  - don't isolate classes adding via `<b:include>`'s instructions with include isolate context (i.e. for case `<b:isolate prefix="foo-"/><b:include isolate="bar-" class="baz"/>` class `baz` will be isolated by `foo-` prefix only, but no by `foo-bar-` as before)
  - template style namespaces are scoped by template source it's declared in
  - markup `l10n` token's content is not wrapped by `<span>`
  - `basis.dom.wrapper`: `unselect` nodes goes before `select` on selection delta processing
  - `basis.ui.field` isn't reset field validity on `keyup`
  - `basis.ui.field.Combobox#setValue()` logic doesn't depend on `disabled` state now
  - no more `__basisEvents` in `global` (`basis.dom.event` don't store global event handlers in `global`)
  - `basis.ui.popup.Popup` instances are not children of `popupManager` anymore and could have `parentNode` or `owner`
  - `basis.net.action` actions return ES6 `Promise` (native or polyfill provided by `basis.promise`)

## 1.2.5 → 1.3.0

Rename

  - `basis.array.sortAsObject` → `basis.array.sort`
  - `basis.data.AbstractDataset` → `basis.data.ReadOnlyDataset`
  - `basis.data.DatasetAdapter` → `basis.data.ResolveAdapter`
  - `basis.data.dataset.Subset` → `basis.data.dataset.Filter`

Remove

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

Deprecated

  - `path` section in `basis-config` (use `modules` instead)
  - `basis.entity.EntityType().entityType` (use `type` instead)
  - `basis.entity.EntitySetType().entitySetType` (use `type` instead)
  - `basis.entity.EntityType().extend` (use `extendClass` instead)
  - `basis.entity.EntitySetType().extend` (use `extendClass` instead)
  - `basis.ui.calendar.Calendar#sections` (use `childNodes` instead)

Might break

  - `basis.date` show warnings instead of exception throw
  - `clear` methods in `basis.data.dataset` don't reset sources anymore
  - `basis.data.Value.from()` instances are readonly now
  - `basis.data.Value#locked` is counter now but not a boolean value (use `basis.data.Value#isLocked()` to check value is locked)
  - `basis.template` style of included templates are always going before own template resources
  - `basis.template` apply defines per include but not per template
  - `basis.ui` emit `templateChanged` event only on template change, but not on instance create
  - `basis.ui.field.validator.Required()` is trim value before check now
  - `basis.dragdrop.DragDropElement#startRule` receive real `deltaX`/`deltaY` but not a result of `axisXproxy`/`axisYproxy` methods
  - `basis.dragdrop.DragDropElement` always emit `start` event with zero `deltaX`/`deltaY`
  - `basis.dragdrop` implement `DragDropElement#ignoreTarget` to ignore element that can't be a drag trigger (by default those elements are `<input>`, `<textarea>`, `<select>` and `<button>`)

## 1.2.1 → 1.2.3

Might break

  - `basis.ui.calendar.CalendarNode` has no `periodStart` and `periodEnd` on init, but get those properties after append to parent (section) and receive `periodChanged` event

## 1.2.0 → 1.2.1

Remove
 
  - `basis.xml.createAttributeNS` (as candidate to remove in `DOM level 4`)
  - `basis.xml.setAttributeNodeNS` (as candidate to remove in `DOM level 4`)

## 1.1.0 → 1.2.0

Rename

  - `basis.net.Transport` → `basis.net.ajax.Transport`
  - `basis.net.Request` → `basis.net.ajax.Request`
  - `basis.net.request` → `basis.net.ajax.request`
  - `basis.layout.VerticalPanel` → `basis.ui.panel.VerticalPanel`
  - `basis.layout.VerticalPanelStack` → `basis.ui.panel.VerticalPanelStack`
  - `processErrorResponse` → `getResponseError` in all `basis.net` related modules

Remove
  
  - `basis.date.toFormat`
  - `basis.layout.Box`
  - `basis.layout.Viewport`
  - `basis.layout.addBlockResizeHandler`
  - `basis.data.Object#isTarget`
  - `basis.entity.Type#addField` (doesn't work since 1.0 anyway)
  - `basis.entity.Type#addCalcField` (doesn't work since 1.0 anyway)

Might break

  - `extProto: false` by default (don't extend buildin classes prototypes)
  - all resource extensions are updatable by default (use `permanent: true` in resource type definition to supress it)
  - all relative paths should start with `./` or `..`
  - `basis.dragdrop.DragDropElement#isDragging` method returns `false` inside `over` event handlers (returns `true` before)
  - `.l10n` resources return dictionary instead of `json` object
  - `resposeText`, `responseXML` and `error` don't store in `basis.net.*.Request#data`
  - `typeof` check in `basis.data.Value.from` was removed (returns `null` before, if first argument isn't an `object`)
