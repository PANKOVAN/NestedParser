// Пример использования с CommonJS
const { NestedParser, ArrayScheme } = require('./lib/index.cjs');


async function main() {
    const parser = new NestedParser({ logParser: false }, new ArrayScheme());

    let json = await parser.parse('./example.txt') || {};

    console.log(JSON.stringify(json, undefined, 4));

    // Пример с файлом
    // const fileNodes = await parser.parse('./data.txt');

    // Пример с URL
    // const urlNodes = await parser.parse('https://example.com/data.txt');
}

main().catch(console.error);

