# NestedParser

**NestedParser** - библиотека для разбора иерархических удобочитаемых текстов с упрощенной разметкой (human-readable hierarchical texts). Предусмотрено два режима работы
- парсинг - обход текста и вызов пользовательских callback функций
- использование схемы данных - парсинг с возвратом результата в виде JSON, который формируется в соответствии с выбранной схемой.

**NestedParser** не предлагает однозначного способа конвертации(десериализации) в JSON или объект.  

## Понятия
- исходный текст - текст, который используется для парсинга. Текст состоит из строк разделенных символами '\n' или '\r\n'. Допускаются следующие варианты:
    - просто текстовая строка
    - имя файла - строка, которая начинается с 'file://' или './' или '../'
    - url - строка, которая начинается с 'http://' или 'https://' 
    - URL - объект URL
    - stream - поток (ReadableStream)
    - function - функция, которая возвращает строку или поток
- специальные символы - '\n', '`', ';' - используются при разметке текста
- уровень иерархии - количество пробелов (символов табуляции) в начале строки до первого не пробельного символа. Нельзя использовать смесь из табуляций и пробелов. При переходе на следующий(более высокий) уровень иерархии должен быть просто больше чем у предыдущей. При сохранении или переходе на предыдущий(более низкий) уровень иерархии должен совпадать с текущим или одним из предыдущих. Условие, что все уровни иерархии должны быть кратны определенному значению (например 2 или 4) - необязательно.
- комментарий - строка, которая начинается с символа '#', перед которым может быть любое количество пробелов, комментарии не изменяют текущий уровень иерархии, конечные комментарии запрещены
- значение - часть строки, не содержащая специальных символов. Может содержать пробелы. Начальные конечные пробелы обрубаются. 
- литеральное значение - часть строки заключенная в обратные кавычки ('`'), может содержать специальные символы. Если необходимо для значения использовать несколько строк оно должно быть литеральным. В дальнейшем используется просто значение.
- признак массива - если несколько значений разделены символом ';' это считается признаком массива значений. Точка с запятой в конце строки означает, что следующая строка(строки) содержат продолжение массива.
- имя узла - первое значение в строке, отделенное от остальной части пробелом.

## События

- **parserStarted** - начало разбора
- **parserEnded** - завершение разбора
- **levelUp** - переход на следующий уровень иерархии
- **levelDown** - переход на предыдущий уровень иерархии
- **rowDetected** - строка выделена
- **nameDetected** - имя выделено
- **valuesDetected** - значения выделены
- **commentDetected** - встречены комментарии
- **errorDetected** - встречена ошибка


Все обработчики имеют одинаковый интерфейс. В обработчик передается два параметра номер текущей строки и значение. Если не задан обработчика ошибок, то выбрасывается исключение.

## Пример

```
# this is comment 1
root 1 
    child1 1
    child2 value of child 2
    child3 `very long value of child 3
            very long value of child 3
            very long value of child 3
            `
    child4 4
        grand_child_1 41
        `grand child 2` 420, 421, 422
# this is comment 2
root 2
```

При разборе этого текста будут вызваны следующие обработчики
```
- parseStarted(undefined, undefined)
- commentDetected(0, 'this is comment 1')
- rowDetected(1, 'root 1')
- nameDetected(1, 'root')
- valuesDetected(1, ['1'])
- levelUp(2, undefined)
- rowDetected(2, 'child1 1')
- nameDetected(2, 'child1')
- valuesDetected(2, ['1'])
- rowDetected(2, 'child2  value of child 2')
- nameDetected(3, 'child2')
- valuesDetected(3, ['2'])
- rowDetected(4, 'child3  value of child 2')
- nameDetected(4, 'child3 'very long value of child 3 very long value of child 3 very long value of child 3`')
- valuesDetected(4, 'very long value of child 3 very long value of child 3 very long value of child 3')
- rowDetected(2, 'child4  4')
- nameDetected(8, 'child4')
- valuesDetected(8, ['4'])
- levelUp(8, undefined)
- rowDetected(9, 'grand_child_1 41')
- nameDetected(9, 'grand_child_1')
- valuesDetected(9, ['41'])
- rowDetected(10, '`grand child 2` 420, 421, 422')
- nameDetected(10, 'grand child 2')
- valuesDetected(10, ['420', '421', '422'])
- commentDetected(11, 'this is comment 2')
- levelDown(12, undefined)
- levelDown(12, undefined)
- rowDetected(9, 'root 2')
- nameDetected(12, 'root')
- valuesDetected(12, '2')
- parseEnded(undefined, undefined)
```
## Установка

```bash
npm install
```

## Сборка

Библиотека поддерживает сборку в два формата: CommonJS и ES6 модули.

```bash
# Сборка обоих форматов
npm run build

# Сборка только CommonJS
npm run build:cjs

# Сборка только ES6 модулей
npm run build:esm

# Очистка сборочных директорий
npm run clean
```

## Использование

### CommonJS (Node.js)

```javascript
const { NestedParser } = require('nested-parser');

const text = `
Root
  Child 1
  Child 2
    Grandchild
`;

async function main() {
    const parser = new NestedParser();
    const nodes = await parser.parse(text);
    console.log(nodes);
}

main().catch(console.error);
```

### ES6 модули

```javascript
import { NestedParser } from 'nested-parser';

const text = `
Root
  Child 1
  Child 2
    Grandchild
`;

async function main() {
    const parser = new NestedParser();
    const nodes = await parser.parse(text);
    console.log(nodes);
}

main().catch(console.error);
```

### Различные типы входных данных

```javascript
import { NestedParser } from 'nested-parser';

const parser = new NestedParser();

// Текстовая строка
const nodes1 = await parser.parse('Root\n  Child');

// Путь к файлу
const nodes2 = await parser.parse('./data.txt');
const nodes3 = await parser.parse('file:///path/to/file.txt');

// URL
const nodes4 = await parser.parse('https://example.com/data.txt');
const nodes5 = await parser.parse(new URL('https://example.com/data.txt'));

// ReadableStream
import fs from 'fs';
const nodes6 = await parser.parse(fs.createReadStream('data.txt'));

// Функция
const nodes7 = await parser.parse(() => 'Root\n  Child');
const nodes8 = await parser.parse(() => fs.createReadStream('data.txt'));
```

## Структура проекта

```
NestedParser/
├── src/              # Исходный код TypeScript
├── lib/              # Скомпилированный код (все форматы в одном каталоге)
│   ├── index.cjs     # CommonJS модуль
│   ├── index.mjs     # ES6 модуль
│   ├── index.d.ts    # TypeScript определения типов
│   └── ...           # Остальные файлы библиотеки
├── scripts/          # Вспомогательные скрипты сборки
├── tsconfig.json     # Базовая конфигурация TypeScript
├── tsconfig.cjs.json # Конфигурация для CommonJS
├── tsconfig.esm.json # Конфигурация для ES6 модулей
└── tsconfig.types.json # Конфигурация для типов
```

Node.js автоматически выберет правильный формат на основе условий в `package.json` exports.

## Разработка

1. Установите зависимости: `npm install`
2. Внесите изменения в `src/`
3. Соберите проект: `npm run build`
4. Проверьте результат в `lib/` и `lib-esm/`

## Лицензия

MIT
