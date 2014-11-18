## 1.3.0 → 1.4.0

Rename

  - `basis.require('basis.ua').cookies` → `basis.require('basis.ua.cookie')` (`basis.ua.cookies` moved to separate namespace `basis.ua.cookie`)
  - `Service#isSecure` → `Service#secure`
  - `Service#transportClass#needSignature` → `Service#transportClass#secure`
  - `basis.ui.field.Field#binding.titleText` → `basis.ui.field.Field#binding.title`
  - `title` → `titleEl` reference in `basis.ui.field` templates
  - `instanceOf` → `satelliteClass` in satellite config of `basis.dom.wrapper.Node`
  
Remove

  - `basis.net.action` isn't add `request` property to context object (on action invocation)
  - `basis.net` remove `influence` functionality

Deprecated

  - `Service#isSecure` (use `Service#secure` instead)
  - `Service#transportClass#needSignature` (use `Service#transportClass#secure` instead)
  - `basis.ui.field.Field#binding.titleText` (use `basis.ui.field.Field#binding.title` instead)
  - `instanceOf` in satellite config of `basis.dom.wrapper.Node` (use `satelliteClass` instead)

Might break

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
