// Пример использования с ES6 модулями
import { NestedParser } from './lib/index.mjs';

const text = `
Root
  Child 1
  Child 2
    Grandchild 1
    Grandchild 2
  Child 3
Another Root
  Another Child
`;

async function main() {
    // Создаем парсер
    const parser = new NestedParser();
    
    console.log('=== Парсинг ===');
    const nodes = await parser.parse(text);
    console.log(JSON.stringify(nodes, null, 2));
    
    // Пример с файлом
    // const fileNodes = await parser.parse('./data.txt');
    
    // Пример с URL
    // const urlNodes = await parser.parse('https://example.com/data.txt');
}

main().catch(console.error);

