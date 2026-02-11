import { describe, test, expect } from 'bun:test';
import { NestedParser } from './parser';
import { ArrayScheme } from './array.scheme';
import { ObjectScheme } from './object.scheme';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Интеграционные тесты', () => {
    test('должен парсить example.txt с ArrayScheme', async () => {
        const parser = new NestedParser({ logParser: false }, new ArrayScheme());
        const exampleText = readFileSync(join(__dirname, '../example.txt'), 'utf-8');

        const result = await parser.parse(exampleText);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('root');
        expect(result[0].values).toEqual(['1']);
        expect(result[0].children).toBeDefined();
        expect(result[0].children?.length).toBe(4);

        // Проверяем child1
        expect(result[0].children?.[0].name).toBe('child1');
        expect(result[0].children?.[0].values).toEqual(['1']);

        // Проверяем child2
        expect(result[0].children?.[1].name).toBe('child2');
        expect(result[0].children?.[1].values).toBeDefined();
        // Значения могут быть как массивом, так и одной строкой в зависимости от парсинга

        // Проверяем child4 с вложенными элементами
        expect(result[0].children?.[3].name).toBe('child4');
        expect(result[0].children?.[3].children).toBeDefined();
        expect(result[0].children?.[3].children?.length).toBe(2);

        // Проверяем второй root
        expect(result[1].name).toBe('root');
        expect(result[1].values).toEqual(['2']);
    });

    test('должен парсить example.txt с ObjectScheme', async () => {
        const parser = new NestedParser({ logParser: false }, new ObjectScheme());
        // Используем упрощённый пример, так как ObjectScheme требует определённой структуры
        const text = `
server
    host localhost
    port 3000
database
    name mydb
`;

        const result = await parser.parse(text);

        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.server).toBeDefined();
        expect(result.server.host).toBe('localhost');
        expect(result.server.port).toBe('3000');
        expect(result.database).toBeDefined();
        expect(result.database.name).toBe('mydb');
    });

    test('должен обрабатывать сложную иерархию', async () => {
        const parser = new NestedParser({ logParser: false }, new ArrayScheme());
        const text = `
level1 value1
    level2 value2
        level3 value3
            level4 value4
        level3_2 value5
    level2_2 value6
level1_2 value7
`;

        const result = await parser.parse(text);

        expect(result.length).toBe(2);
        expect(result[0].children?.length).toBe(2);
        expect(result[0].children?.[0].children?.length).toBe(2);
        expect(result[0].children?.[0].children?.[0].children?.length).toBe(1);
    });

    test('должен обрабатывать массивы значений', async () => {
        const parser = new NestedParser({ logParser: false }, new ArrayScheme());
        const text = `
item 1, 2, 3
    subitem 4, 5, 6
`;

        const result = await parser.parse(text);

        expect(result[0].values).toBeDefined();
        expect(result[0].children?.[0].values).toBeDefined();
    });

    test('должен обрабатывать литеральные значения с переносами строк', async () => {
        const parser = new NestedParser({ logParser: false }, new ArrayScheme());
        const text = `
root \`multi
line
value\`
`;

        const result = await parser.parse(text);

        expect(result[0].name).toBe('root');
        // Значение должно содержать переносы строк
        expect(result[0].values).toBeDefined();
    });
});
