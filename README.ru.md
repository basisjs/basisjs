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

Все классы данных имеют состояние и некоторые другие общие механизмы.

Объекты (модели), бывают как простые, с произвольным набором полей и значений, так и более сложные, со строгим набором полей, вычисляемых полей, нормализацией значений и поддержкой основного индекса (primary key), в том числе составного.

```js
// простая модель
var simple = new basis.data.Object({
  data: {
    foo: 123,
    bar: 'example'
  }
});

// типизированная модель
var SomeType = basis.entity.createType('SomeType', {
  id: basis.entity.IntId,
  name: String
});

var complex = SomeType({  // new не нужно, так как если объекта этого типа
  id: 1,                  // с id = 1 нет, то он будет создана, иначе – обновлен
  name: 'example'
});
```

Объекты могут объединяться в наборы (множества). Наборы могут быть как [обычные](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.datasets.md), так и [автоматические](https://github.com/basisjs/articles/blob/master/ru-RU/basis.data.dataset.md), состав которых определяют наборы-источники и некоторое правило. Последние можно воспринимать как некоторые операции над множествами. Так можно объединять, вычитать, получать подмножество, разбивать на группы, получать срез и т.д.

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

Скаляры хранят значения, которые воспринимаются как нечто неделимое. Их можно преобразовывать, объединять для получения нового значения и связывать с другими объектами. Так же это базовый класс для индексов,  агрегированных значений от множества, которые автоматически обновляются при изменении элементов или состава набора.

```js
// значение
var atom = new basis.data.Value({
  value: 2
});

// преобразование
var cube = atom.as(function(value){
  return value * value * value;
});
console.log(cube.value);  // 8

// индекс
var sum = basis.data.index.sum(dataset, function(item){
  return item.data.value;
});
console.log(sum.value);   // сумма value элементов множества, будет меняться
                          // при изменении значений value у элементов набора
                          // или при изменении его состава
```

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

Для наиболее частых задач есть готовые решения. Это позволяет просто создавать достаточно сложные представления. Так же стоит отметить, что можно изменить практически все настройки представления после создания.

```js
// вывести список компаний сгруппированные по городу
// и отсортированные по имени, с возможностью выбора
var complex = new basis.ui.Node({
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
    template: '<li>{name} (city)</li>',
    binding: {
      name: 'data:',
      city: 'data:'
    }
  }
});
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
<script src="путь/до/basisjs/src/basis.js" basis-config=""></script>
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
