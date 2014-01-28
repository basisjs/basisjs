## Basis.js

`basis.js` – javascript фреймворк ориентированный на разработку одностраничных приложений (`SPA`). Основной упор делается на динамику (все может меняться), гибкость, скорость и возможность работать с большим количеством данных.

Ключевыми направлениями являются:

* [данные](#Данные);
* [шаблоны](#Шаблоны);
* [пользовательский интерфейс](#ui).

### Данные

Выделяются три основные группы классов данных:

* [объекты](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.Object.md) (модели);
* [наборы](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.datasets.md) (коллекции);
* [скаляры](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.Value.md) (атомарные значения).

Модели делятся на простые и типизированные. Простые модели имеют базовую функциональность, и могут иметь произвольный набор полей и значений.

```js
// простая модель
var simple = new basis.data.Object({
  data: {
    foo: 123,
    bar: 'example'
  }
});

simple.update({ bar: [1, 2, 3], baz: 'value' });
console.log(simple.data);
// console> { foo: 123, bar: [1, 2, 3], baz: 'value' }
```

Наиболее важная способность таких моделей – делегирование. Это механизм, при котором связанные объекты имеют общее состояние и ссылаются на одни и те же данные. Делегирование широко используется при построении интерфейса, так как узлы интерфейса являются потомками таких моделей и так же его поддерживают.

```js
// делегирование
var foo = new basis.data.Object({
  data: {
    a: 123
  }
});
var bar = new basis.data.Object({
  delegate: foo
});

console.log(bar.data.a);
// console> 123

foo.update({ a: 456 });
bar.update({ b: 'baz' });
console.log(bar.data);
// console> { a: 456, b: 'baz' }

console.log(bar.data === foo.data);
// console> true
```

Типизированные модели имеют более сложную реализацию. Они предоставляют дополнительные возможности: строгий набор полей, вычисляемые поля, нормализацией значений, основной индекс (`primary key`, в том числе составной), обновления с возможностью отката и др. Такие модели не умеют делегировать данные, но часто выступают в качестве источника данных.

```js
// типизированная модель
var SomeType = basis.entity.createType('SomeType', {
  id: basis.entity.IntId,
  name: String
});

var something = SomeType({ // оператор new не указывается, так как все зависит от того,
  id: 1,                   // есть ли экземпляр данного типа с id = 1 или нет; 
  name: 'example'          // если такого объекта нет, то он будет создает, а иначе обновлен
});                        // новыми данными
```

Объекты могут объединяться в наборы (множества). Наборы делятся на [обычные](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.datasets.md) и [автоматические](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.dataset.md). Состав обычных наборов задается через типовое, для таких классов, `API`. А состав автоматических наборов определяют наборы-источники и некоторое правило. Автоматические наборы можно воспринимать как операции над множествами. Так можно объединять, вычитать, получать подмножество, разбивать на группы, получать срез и т.д. ([демонстрация работы разных наборов](http://basisjs.com/basisjs/demo/defile/dataset.html))

```js
// обычный набор
var dataset = new basis.data.Dataset({
  items: [
    new basis.data.Object(..),
    new basis.data.Object(..)
  ]
});

// автоматический набор – подмножество "только нечетные"
var odd = new basis.data.dataset.Subset({
  source: dataset,
  rule: function(item){
    return item.data.value % 2;
  }
});
```

[Скаляры](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.Value.md) хранят значения, которые воспринимаются как нечто неделимое. Они умеют связываться с другими объектами, преобразовывать значения, объединяться для получения нового значения и т.д.

```js
// значение
var atom = new basis.data.Value({
  value: 2
});

// преобразование
var cube = atom.as(function(value){
  return value * value * value;
});
console.log(cube.value);
// console> 8

atom.set(3);
console.log(cube.value);
// console> 27
```

К этой группе так же относятся индексы, агрегированные значения от множества. Они автоматически обновляют свое значение при изменении элементов набора или его состава.

```js
// набор
var dataset = new basis.data.Dataset({
  items: basis.data.wrap([1, 2, 3], true)
});

// индекс
var sum = basis.data.index.sum(dataset, function(item){
  return item.data.value;
});

console.log(sum.value);
// console> 6

dataset.remove(dataset.pick());

console.log(sum.value);
// console> 5
```

Все классы данных имеют состояние и некоторые другие [общие механизмы](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.md).

### Шаблоны

Большинство шаблонизаторов генерируют функцию, которая производит `HTML`, используя переданные ей данные. Далее `HTML` трансформируется в `DOM`-фрагмент через свойство `innerHTML`. При изменении данных процедура повторяется.

Шаблонизатор `basis.js` работает иначе. Он генерирует функцию, которая производит `DOM`-фрагмент и занимается дальнейшим его обслуживанием. Когда меняются данные, то в `DOM`-фрагменте производятся точечные изменения. Шаблонизатор работает только в терминах `DOM` и не имеет дело с `HTML`.

Шаблоны описываются в `HTML`-подобном формате. Описание размечается маркерами. В зависимости от положения в описании, маркеры являются либо местами для применения биндингов, либо ссылками на определенные `DOM`-узлы. Пример шаблона:

```html
<li{element} class="item item_{selected}">
  {title}
</li>
```

Для обработки событий на пользовательские действия используются атрибуты с префиксом `event-` ([подробнее](https://github.com/basisjs/articles/blob/master/ru-RU/basis.ui_actions.md)).

```html
<li{element} class="item item_{selected}" event-click="select">
  {title}
</li>
```

Шаблоны могут содержать специальные теги. Например, тег `<b:style>` позволяет подключать файлы стилей. Стили подключаются только когда начинает использоваться шаблон. Обычно каждый шаблон имеет собственный файл стилей.

```html
<b:style src="item.css"/>
<li{element} class="item item_{selected}" event-click="select">
  {title}
</li>
```

Так же можно подключать другие шаблоны и модифицировать их.

```html
<b:style src="item.css"/>
<li{element} class="item item_{selected}" event-click="select">
  {title}
  <b:include src="button.tmpl">
    <b:set-attr name="event-click" value="remove"/>
    <b:replace ref="caption">
      Delete
    </b:replace>
  </b:include>
</li>
```

Описание шаблона может хранится в коде или во внешнем файле. В основном, шаблоны хранятся в отдельных файлах. Это позволяет их переиспользовать и производить различные оптимизации на этапе сборки. Непосредственно в коде текст шаблона указывается только на этапе прототипирования или для демонстраций.

Подробнее в документации – [Формат описания](https://github.com/basisjs/articles/blob/master/ru-RU/basis.template_format.md).

Подход используемый в `basis.js` позвляет работать с большим количеством представлений и гибко перестраивать интерфейс. Он так же позволяет обновлять описание шаблонов без перезагрузки страницы. Это используется при построении адаптивных интерфейсов, которые подстраиваются под объем данных, их структуру, размер экрана, форм-фактор и т.д.

Поддерживается [механизм тем](https://github.com/basisjs/articles/blob/master/ru-RU/basis.template_theme.md). Тема – это набор шаблонов. В один момент времени может использоваться только одна тема. Темы наследуются и их можно переключать без перезагрузки страницы.

```js
// базовая тема
basis.template.define({
  'button': resource('button.tmpl'),
  'buttonPanel': resource('buttonPanel.tmpl')
});

// дополнительная тема, все темы по умолчанию наследуются от базовой
basis.template.theme('mytheme').define({
  'button': resource('mytheme/button.tmpl')
});

// вместо конкретного описания или указания файла, в качестве значения шаблона
// задается именовый шаблон; используемое описание будет зависеть от выбранной
// темы и какое описание закрепленное за этим именем в этой теме
var button = new basis.ui.Node({
  template: basis.template.get('button')
});

basis.template.setTheme('mytheme');
// button -> resource('mytheme/button.tmpl')
// buttonPanel -> resource('buttonPanel.tmpl')
```

Шаблоны поддерживают локализацию. Они могут как использовать языковые токены, переданные в качестве значения для биндингов, так и самостоятельно подключать словари. Для подключения словаря используется специальный тег `<b:l10n>`, а для вставки значений в описании биндинга используется префикс `l10n:`.

```html
<b:l10n src="dict.l10n"/>
<div>
  <h1>{l10n:header}</h1>
  <div class="date">{day} {l10n:month.{month}} {year}</div>
  <div class="content">
    {l10n:content}
  </div>
</div>
```

Словари описываются в формате `.json`, но файлы должны иметь расширение `.l10n`. Пример словаря (`dict.l10n`):

```json
{
  "en-US": {
    "header": "Hello world!",
    "month": {
      "jan": "January",
      "feb": "February",
      ...
    }
  },
  "ru-RU": {
    "header": "Привет мир!",
    "month": {
      "jan": "Январь",
      "feb": "Февраль",
      ...
    }
  }
}
```

Шаблоны реагируют на изменение значений языковых токенов, и заменяют старые значения на новые в `DOM`. Благодаря этому поддерживается real-time редактирование локализации и переключение языка без перезагрузки страницы. Подробнее в документации модуля [basis.l10n](https://github.com/basisjs/articles/blob/master/ru-RU/basis.l10n.md).

Модули шаблонов и локализации могут быть использованы не только с `basis.js`, но и с другими библиотеками и фреймворками. Для этого можно использовать библиотеку [basis-templates](http://basisjs.com/templates/). Есть так же специальный [плагин](http://basisjs.com/templates/#bbt) для `backbone.js`.

Помимо [документации](https://github.com/basisjs/articles/blob/master/ru-RU/basis.template.md) про основы шаблонов можно посмотреть в презентациях «[Basis.js - почему я не бросил разрабатывать свой фреймворк](http://www.slideshare.net/basisjs/basisjs-fronttalks)» ([видео](http://www.youtube.com/watch?v=cVbbkwkhNQg)) и «[Как построить DOM](http://www.slideshare.net/basisjs/dom-27356908)».

### UI

В основе построения интерфейса лежит модель DOM, а сам интерфейс представляет собой одно большое дерево. Такой подход позволяет унифицировать API и использовать одни и те же паттерны для всех компонент.

```js
// hello world
var view = new basis.ui.Node({
  template: 'Hello world!'
});

// простой список
var list = new basis.ui.Node({
  template: '<ul>',
  childClass: {
    template: '<li>{name}</li>',
    binding: {
      name: 'name'
    }
  },
  childNodes: [
    { name: 'foo' },
    { name: 'bar' },
    { name: 'baz' }
  ]
});
```

Для наиболее частых задач есть готовые решения. Это позволяет просто создавать достаточно сложные представления. Большинство свойств представления можно изменить после его создания, используя соотвествующие методы.

```js
// выводим список компаний сгруппированных по городу и отсортированных
// по имени, с возможностью выбора элемента по клику
var companyView = new basis.ui.Node({
  dataSource: companies,          // набор, источник данных для дочерних узлов
  selection: true,                // использовать выделение
  sorting: 'data.name',           // сортировка по имени
  grouping: {                     // группировка
    rule: 'data.city',            // правило группировки
    childClass: {                 // класс для группы
      template:                   
        '<div class="group">' +   // обычно шаблоны выносятся в отдельные файлы,
          '{title}:' +            // здесь указаны в коде для наглядности
          '<ul{childNodesElement}/>'
        '</div>',
      binding: {
        title: 'data:id'
      }
    }
  },
  childClass: {                   // класс для дочерних узлов – дополненый basis.ui.Node
    template: '<li event-click="select">{name} (city)</li>',
    binding: {
      name: 'data:',
      city: 'data:'
    }
  }
});

// задать сортировку по стоимости по убыванию
companyView.setSorting('data.cost', true);

// убрать группировку
companyView.setGrouping(null);

// изменить источник данных
companyView.setDataSource(top100Companies);
```

## С чего начать

* [Статьи](https://github.com/basisjs/articles) с подробным описанием фреймворка (в процессе написания);
* [Блог](http://blog.basisjs.com/)
* [Интерактивный тур](http://basisjs.com/tour) – набор слайдов, снабженных кодом, который можно менять;
* [Docs](http://basisjs.com/docs) – авто-документация, сгенерированная на основе структуры модулей и исходного кода;
* [Demo](http://basisjs.com/demo) – набор демонстраций, которые могут быть примером.

Рекомендуется начинать со статьи [Приступая к разработке](https://github.com/basisjs/articles/blob/master/ru-RU/get-started.md), в которой описаны основные шаги по настройке окружения и инструментов.

Используя консольный инструмент [`basisjs-tools`](https://github.com/basisjs/basisjs-tools), создание заготовки приложения на `basis.js` ограничивается выполнением команды:

    > basis create app

## Как использовать

Для подключения фреймворка в проект, необходимо либо клонировать репозитарий, либо использовать `bower`.

    > bower install basisjs --save

`basis.js` является модульным, в модулях указываются зависимости и от этого зависит, что попадает в сборку. По этой причине нет готовых пакетов.

В приложении подключается основной файл фреймворка (ядро). При этом у подключающего тега обязательно должен присутствовать атрибут `basis-config`, который так же может использоваться для задания настроек. Далее используются `basis.require()`, `basis.resource()` и `basis.asset()` для подключения модулей и других файлов.

```html
<script src="path/to/basisjs/src/basis.js" basis-config=""></script>
<script>
  basis.require('basis.ui');
  var view = new basis.ui.Node({
    template: basis.resource('path/to/template.tmpl'),
    ...
  });
</script>
```

Более подробно в статье [Приступая к разработке](https://github.com/basisjs/articles/blob/master/ru-RU/get-started.md).

## Инструменты

Для автоматизации и более эффективной разработки рекомендуется использовать консольный инструмент [`basisjs-tools`](https://github.com/basisjs/basisjs-tools). Он предоставляет dev-сервер, обеспечивает сборку и помогает с генерацией кода.

[Плагин](https://chrome.google.com/webstore/detail/basisjs-tools/paeokpmlopbdaancddhdhmfepfhcbmek) для `Google Chrome` упрощает работу с локализацией, позволяет редактировать шаблоны, показывает проблемы приложения и граф его файлов.

Объединяющим оба инструмента является модуль `basis.devpanel`. Этот модуль предоставляет панель разработчика для быстрого переключения темы/языка, а так же выбора шаблона или текста для перевода.

## Поддержка браузеров

Начиная с версии `1.0.0`, Internet Explorer поддерживается начиная c 8й версии. Для остальных браузеров поддерживаются текущая и предыдущая версия.
