## Basis.js

basis.js – javascript фреймворк ориентированный на разработку одностраничных приложений (SPA). Основной упор делается на динамику (все может меняться), гибкость, скорость и возможность работать с большим количеством данных.

Ключевыми направлениями являются:

* [данные](#Данные);
* [шаблоны](#Шаблоны);
* [пользовательский интерфейс](#UI).

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

Типизированные модели имеют более сложную реализацию. Они предоставляют дополнительные возможности: строгий набор полей, вычисляемые поля, нормализацией значений, основной индекс (primary key, в том числе составной), обновления с возможностью отката и др. Такие модели не умеют делегировать данные, но часто выступают в качестве источника данных.

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

Объекты могут объединяться в наборы (множества). Наборы делятся на [обычные](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.datasets.md) и [автоматические](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.dataset.md). Состав обычных наборов задается через типичное API. А состав автоматических наборов определяют заданные наборы-источники и некоторое правило. Автоматические наборы можно воспринимать как операции над множествами. Так можно объединять, вычитать, получать подмножество, разбивать на группы, получать срез и т.д. ([демонстрация работы разных наборов](http://basisjs.com/basisjs/demo/defile/dataset.html))

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

[Скаляры](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.Value.md) хранят значения, которые воспринимаются как нечто неделимое. Самый простой класс умеет только хранить значение и вызывать обработчики при его изменении.

```js
// простой класс для хранения значений
var token = new basis.Token('foo');
console.log(token.value);
// console> 'foo'

token.attach(function(value){
  console.log('New value is ' + value);
});

token.set('bar');
// console> New value is bar
```

Более сложные представители этой группы умеют преобразовывать значения, объединяться для получения нового значения, связываться с другими объектами и др.

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

var expr = new basis.data.value.Expression(atom, cube, function(atom, cube){
  return cube - atom;
});
console.log(expr);
// console> 6
```

К этой группе так же относятся индексы, агрегированные значения от множества. Они автоматически обновляют свое значение при изменении элементов набора или его состава.

```js
// индекс
var sum = basis.data.index.sum(dataset, function(item){
  return item.data.value;
});

console.log(sum.value);   // сумма value элементов множества, будет меняться
                          // при изменении значений value у элементов набора
                          // или при изменении его состава
```

Все классы данных имеют состояние и некоторые другие [общие механизмы](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.md).

### Шаблоны

Гибкие шаблоны, с возможностью изменения без перезагрузки и поддержкой локализации.

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
  dataSource: companies,
  selection: true,
  sorting: 'data.name',
  grouping: {
    rule: 'data.city',
    childClass: {
      template:
        '<div class="group">' +
          '{title}:' +
          '<ul{childNodesElement}/>'
        '</div>',
      binding: {
        title: 'data:id'
      }
    }
  },
  childClass: {
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

* [Статьи](https://github.com/basisjs/articles) с подробным описанием различных частей фреймворка (в процесее написания);
* [Blog](http://blog.basisjs.com/)
* [Интерактивный тур](http://basisjs.com/tour) – набор слайдов, снабженных кодом, который можно менять;
* [Docs](http://basisjs.com/docs) – авто-документация, сгенерированная на основе структуры модулей и исходного кода;
* [Demo](http://basisjs.com/demo) – набор демонстраций, которые могут быть примером.

## Как использовать

Для использования необходимо клонировать репозитарий, либо использовать `bower`.

    > bower install basisjs --save

basis.js является модульным, в модулях указываются зависимости и от этого зависит, что попадает в сборку. По этой причине нет готовых пакетов.

В приложении подключается основной файл фреймворка (ядро). При этом у подключающего тега обязательно должен присутсвовать атрибут `basis-config`, который так же может использоваться для задания настроек. А далее используются `basis.require()`, `basis.resource()` и `basis.asset()` для подключения модулей и других файлов.

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
