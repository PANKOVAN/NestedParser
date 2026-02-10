# Использование NestedParser в других проектах

## Установка

> ⚠️ **Важно**: Пакет должен быть либо опубликован в npm, либо использоваться локально.

### Вариант 1: Локальное использование (для разработки)

#### Способ A: npm link

```bash
# В директории NestedParser
cd D:\MProjects\NestedParser
npm link

# В другом проекте
cd D:\MProjects\YourOtherProject
npm link nested-parser
```

#### Способ B: Относительный путь в package.json

В `package.json` вашего проекта добавьте:

```json
{
  "dependencies": {
    "nested-parser": "file:../NestedParser"
  }
}
```

Затем:
```bash
npm install
```

#### Способ C: Прямой путь (Windows)

```json
{
  "dependencies": {
    "nested-parser": "file:D:/MProjects/NestedParser"
  }
}
```

### Вариант 2: Публикация в npm (для общего доступа)

Если вы хотите опубликовать пакет в npm:

```bash
# 1. Убедитесь, что проект собран
bun run build

# 2. Войдите в npm (если еще не вошли)
npm login

# 3. Проверьте, что имя пакета свободно
npm view nested-parser

# 4. Опубликуйте (если имя свободно, или используйте scoped package)
npm publish

# Или для scoped package (рекомендуется):
# Измените в package.json: "name": "@your-username/nested-parser"
# Затем: npm publish --access public
```

После публикации можно использовать:

```bash
npm install nested-parser
# или для scoped: npm install @your-username/nested-parser
```

## Импорт

### CommonJS (Node.js)

```javascript
const { NestedParser, ArrayScheme, ObjectScheme } = require('nested-parser');
```

### ES6 модули

```javascript
import { NestedParser, ArrayScheme, ObjectScheme } from 'nested-parser';
```

### TypeScript

```typescript
import { NestedParser, ArrayScheme, ObjectScheme, ParserCallbacks } from 'nested-parser';
```

## Базовое использование

### С ArrayScheme (возвращает массив объектов)

```javascript
const { NestedParser, ArrayScheme } = require('nested-parser');

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    
    // Парсинг из строки
    const result1 = await parser.parse(`
        root 1
            child1 value1
            child2 value2
    `);
    
    // Парсинг из файла
    const result2 = await parser.parse('./data.txt');
    
    // Парсинг из URL
    const result3 = await parser.parse('https://example.com/data.txt');
    
    console.log(JSON.stringify(result1, null, 2));
}

main().catch(console.error);
```

**Результат ArrayScheme:**
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
        "values": ["value2"]
      }
    ]
  }
]
```

### С ObjectScheme (возвращает объект)

```javascript
const { NestedParser, ObjectScheme } = require('nested-parser');

async function main() {
    const parser = new NestedParser({ logParser: false }, new ObjectScheme());
    const result = await parser.parse('./data.txt');
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

**Результат ObjectScheme:**
```json
{
  "root": {
    "values": ["1"],
    "child1": {
      "values": ["value1"]
    },
    "child2": {
      "values": ["value2"]
    }
  }
}
```

### С логированием событий (для отладки)

```javascript
const { NestedParser, ArrayScheme } = require('nested-parser');

async function main() {
    // Включите logParser для вывода всех событий в консоль
    const parser = new NestedParser({ logParser: true }, new ArrayScheme());
    const result = await parser.parse('./data.txt');
    // Все события парсинга будут выведены в консоль
}

main().catch(console.error);
```

### Динамическое изменение схемы

```javascript
const { NestedParser, ArrayScheme, ObjectScheme } = require('nested-parser');

async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    
    // Можно изменить схему после создания
    parser.setSchema(new ObjectScheme());
    
    const result = await parser.parse('./data.txt');
}

main().catch(console.error);
```

## Типы входных данных

NestedParser поддерживает различные типы входных данных:

```javascript
const parser = new NestedParser({ logParser: false }, new ArrayScheme());

// 1. Текстовая строка
await parser.parse('root\n  child');

// 2. Путь к файлу (относительный)
await parser.parse('./data.txt');
await parser.parse('../data.txt');

// 3. Путь к файлу (с префиксом file://)
await parser.parse('file:///path/to/file.txt');

// 4. URL (строка)
await parser.parse('https://example.com/data.txt');
await parser.parse('http://example.com/data.txt');

// 5. URL (объект)
await parser.parse(new URL('https://example.com/data.txt'));

// 6. ReadableStream
const fs = require('fs');
await parser.parse(fs.createReadStream('data.txt'));

// 7. Функция, возвращающая строку
await parser.parse(() => 'root\n  child');

// 8. Функция, возвращающая Promise<string>
await parser.parse(async () => {
    return 'root\n  child';
});

// 9. Функция, возвращающая поток
await parser.parse(() => fs.createReadStream('data.txt'));
```

## Создание собственной схемы

Вы можете создать собственную схему, реализовав интерфейс `ParserCallbacks`:

### JavaScript

```javascript
const { NestedParser } = require('nested-parser');

class CustomScheme {
    constructor() {
        this.data = {};
    }

    parserStarted() {
        this.data = {};
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
        // Ваша логика при переходе на следующий уровень
    }

    levelDown(lineNumber) {
        // Ваша логика при переходе на предыдущий уровень
    }
}

const parser = new NestedParser({ logParser: false }, new CustomScheme());
const result = await parser.parse('./data.txt');
```

### TypeScript

```typescript
import { NestedParser, ParserCallbacks } from 'nested-parser';

class CustomScheme implements ParserCallbacks {
    private data: any = {};

    parserStarted(): void {
        this.data = {};
    }

    parserEnded(): any {
        return this.data;
    }

    nameDetected(lineNumber: number, name: string): void {
        // Ваша логика обработки имени
    }

    valuesDetected(lineNumber: number, values: string[]): void {
        // Ваша логика обработки значений
    }

    levelUp(lineNumber: number): void {
        // Ваша логика при переходе на следующий уровень
    }

    levelDown(lineNumber: number): void {
        // Ваша логика при переходе на предыдущий уровень
    }
}

const parser = new NestedParser({ logParser: false }, new CustomScheme());
const result = await parser.parse('./data.txt');
```

## Примеры использования

### Пример 1: Парсинг конфигурационного файла

```javascript
const { NestedParser, ObjectScheme } = require('nested-parser');

async function loadConfig() {
    const parser = new NestedParser({ logParser: false }, new ObjectScheme());
    const config = await parser.parse('./config.txt');
    return config;
}

// config.txt:
// server
//     host localhost
//     port 3000
// database
//     name mydb
//     user admin
```

### Пример 2: Парсинг данных из API

```javascript
const { NestedParser, ArrayScheme } = require('nested-parser');

async function fetchAndParse() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());
    const data = await parser.parse('https://api.example.com/data.txt');
    return data;
}
```

### Пример 3: Создание кастомной схемы для обработки

```javascript
const { NestedParser, ParserCallbacks } = require('nested-parser');

class CustomProcessingScheme {
    constructor() {
        this.items = [];
    }

    parserStarted() {
        this.items = [];
    }

    nameDetected(line, name) {
        this.items.push({ line, name });
    }

    parserEnded() {
        return this.items;
    }
}

async function processFile() {
    const parser = new NestedParser({ logParser: false }, new CustomProcessingScheme());
    const result = await parser.parse('./data.txt');
    return result;
}
```

## Поддержка TypeScript

Библиотека полностью типизирована и поддерживает TypeScript из коробки:

```typescript
import { NestedParser, ArrayScheme, ParserCallbacks } from 'nested-parser';

interface MyData {
    name: string;
    values?: string[];
    children?: MyData[];
}

const parser = new NestedParser<MyData>({ logParser: false }, new ArrayScheme());
const result: MyData[] = await parser.parse('./data.txt');
```

## Совместимость

- **Node.js**: >= 14.0.0
- **TypeScript**: >= 4.0.0
- Поддерживает CommonJS и ES6 модули
- Автоматический выбор формата через `package.json` exports
