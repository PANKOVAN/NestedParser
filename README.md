
# NestedParser

**NestedParser** - универсальная библиотека для разбора иерархических удобочитаемых текстов с упрощенной разметкой (human-readable hierarchical texts). Работает как в Node.js, так и в браузере. Предусмотрено два режима работы
- парсинг - обход текста и вызов пользовательских callback функций
- использование схемы данных - парсинг с возвратом результата в виде JSON, который формируется в соответствии с выбранной схемой.

**NestedParser** не предлагает однозначного способа конвертации(десериализации) в JSON или объект.  

## Понятия
- исходный текст - текст, который используется для парсинга. Текст состоит из строк разделенных символами '\n' или '\r\n'. Допускаются следующие варианты:
    - текстовая строка - прямая строка с данными
    - ReadableStream - поток данных (Web ReadableStream или Node.js ReadableStream)
    - function - функция, которая возвращает строку или ReadableStream
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

### npm

```bash
npm install @pankovan/nested-parser
```

### bun

```bash
bun add @pankovan/nested-parser
```

### yarn

```bash
yarn add @pankovan/nested-parser
```

### pnpm

```bash
pnpm add @pankovan/nested-parser
```

> ⚠️ **Примечание**: Если пакет ещё не опубликован, используйте локальное подключение через `npm link` или относительный путь в `package.json`:
> ```json
> {
>   "dependencies": {
>     "@pankovan/nested-parser": "file:../NestedParser"
>   }
> }
> ```

## Использование

### Базовый пример (Node.js)

```javascript
const { NestedParser, ArrayScheme } = require('@pankovan/nested-parser');

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    
    // Парсинг из строки
    const result = await parser.parse(`
        root 1
            child1 value1
            child2 value2
                grandchild value3
    `);
    
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

**Результат:**
```json
[
  {
    "name": "root",
    "values": ["1"],
    "children": [
      {
        "name": "child1",
        "values": ["value1"]
      },
      {
        "name": "child2",
        "values": ["value2"],
        "children": [
          {
            "name": "grandchild",
            "values": ["value3"]
          }
        ]
      }
    ]
  }
]
```

### ES6 модули

```javascript
import { NestedParser, ArrayScheme, ObjectScheme } from '@pankovan/nested-parser';

async function main() {
    // Использование с ArrayScheme (возвращает массив объектов)
    const parser1 = new NestedParser({ logParser: false }, new ArrayScheme());
    const result1 = await parser1.parse('root 1\n    child1 value1');
    console.log(result1);
    
    // Использование с ObjectScheme (возвращает объект)
    const parser2 = new NestedParser({ logParser: false }, new ObjectScheme());
    const result2 = await parser2.parse('root 1\n    child1 value1');
    console.log(result2);
}

main().catch(console.error);
```

### TypeScript

```typescript
import { NestedParser, ArrayScheme, ObjectScheme, ParserCallbacks } from '@pankovan/nested-parser';

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    const result = await parser.parse('root 1\n    child1 value1');
    console.log(result);
}

main().catch(console.error);
```

### Парсинг из файла (Node.js)

```javascript
import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';
import fs from 'fs';

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    
    // Чтение из файла через stream
    const stream = fs.createReadStream('./example.txt');
    const result = await parser.parse(stream);
    
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

### Парсинг из URL (браузер или Node.js 18+)

```javascript
import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    
    // Сначала получаем текст через fetch
    const response = await fetch('https://example.com/data.txt');
    const text = await response.text();
    
    // Парсим текст
    const result = await parser.parse(text);
    console.log(result);
    
    // Или используем stream напрямую
    const response2 = await fetch('https://example.com/data.txt');
    const result2 = await parser.parse(response2.body); // ReadableStream
    console.log(result2);
}

main().catch(console.error);
```

### Парсинг из File (браузер)

```html
<input type="file" id="fileInput" accept=".txt">

<script type="module">
  import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';
  
  document.getElementById('fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
          const parser = new NestedParser({ logParser: false }, new ArrayScheme());
          
          // Читаем файл как текст
          const text = await file.text();
          const result = await parser.parse(text);
          
          console.log(result);
      }
  });
</script>
```

### Использование с ObjectScheme

```javascript
import { NestedParser, ObjectScheme } from '@pankovan/nested-parser';

async function main() {
    const parser = new NestedParser({ logParser: false }, new ObjectScheme());
    const result = await parser.parse(`
        server
            host localhost
            port 3000
        database
            name mydb
            user admin
    `);
    
    console.log(JSON.stringify(result, null, 2));
}
```

**Результат:**
```json
{
  "server": {
    "values": [],
    "host": {
      "values": ["localhost"]
    },
    "port": {
      "values": ["3000"]
    }
  },
  "database": {
    "values": [],
    "name": {
      "values": ["mydb"]
    },
    "user": {
      "values": ["admin"]
    }
  }
}
```

### Использование с логированием (для отладки)

```javascript
import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';

async function main() {
    // Включите logParser для вывода всех событий в консоль
    const parser = new NestedParser({ logParser: true }, new ArrayScheme());
    const result = await parser.parse('root 1\n    child1 value1');
    // Все события парсинга будут выведены в консоль
}
```

### Создание собственной схемы

```javascript
import { NestedParser, ParserCallbacks } from '@pankovan/nested-parser';

class CustomScheme {
    constructor() {
        this.data = {};
        this.currentPath = [];
    }

    parserStarted() {
        this.data = {};
        this.currentPath = [];
    }

    parserEnded() {
        return this.data;
    }

    nameDetected(lineNumber, name) {
        // Ваша логика обработки имени
        console.log(`Found name: ${name} at line ${lineNumber}`);
    }

    valuesDetected(lineNumber, values) {
        // Ваша логика обработки значений
        console.log(`Found values:`, values);
    }

    levelUp(lineNumber) {
        // Переход на следующий уровень
    }

    levelDown(lineNumber) {
        // Переход на предыдущий уровень
    }
}

const parser = new NestedParser({ logParser: false }, new CustomScheme());
const result = await parser.parse('root 1\n    child1 value1');
```

### Различные типы входных данных

NestedParser принимает только **строку** или **ReadableStream**:

#### Строка

```javascript
import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';

const parser = new NestedParser({ logParser: false }, new ArrayScheme());

// Прямая строка
const result1 = await parser.parse('Root\n  Child');

// Функция, возвращающая строку
const result2 = await parser.parse(() => 'Root\n  Child');

// Асинхронная функция
const result3 = await parser.parse(async () => {
    const response = await fetch('https://example.com/data.txt');
    return await response.text();
});
```

#### ReadableStream

```javascript
import { NestedParser, ArrayScheme } from '@pankovan/nested-parser';

const parser = new NestedParser({ logParser: false }, new ArrayScheme());

// Node.js ReadableStream
import fs from 'fs';
const nodeStream = fs.createReadStream('data.txt');
const result1 = await parser.parse(nodeStream);

// Web ReadableStream (браузер или Node.js 18+)
const response = await fetch('https://example.com/data.txt');
const webStream = response.body; // ReadableStream
const result2 = await parser.parse(webStream);

// Функция, возвращающая stream
const result3 = await parser.parse(() => fs.createReadStream('data.txt'));
```

> 💡 **Важно**: Парсер читает из потока построчно, не загружая весь файл в память. Это эффективно для больших файлов!

> ✅ **Упрощённый API**: Только строка и stream - работает везде одинаково!
