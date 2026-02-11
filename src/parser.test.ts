import { describe, test, expect } from 'bun:test';
import { NestedParser } from './parser';
import { ArrayScheme } from './array.scheme';
import { ObjectScheme } from './object.scheme';

describe('NestedParser', () => {
    describe('Базовая функциональность', () => {
        test('должен парсить простую строку', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse('root 1');
            
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('root');
            expect(result[0].values).toEqual(['1']);
        });

        test('должен парсить иерархическую структуру', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(`
root 1
    child1 value1
    child2 value2
`);
            
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('root');
            expect(result[0].children).toBeDefined();
            expect(result[0].children?.length).toBe(2);
            expect(result[0].children?.[0].name).toBe('child1');
            expect(result[0].children?.[1].name).toBe('child2');
        });

        test('должен обрабатывать комментарии', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(`
# это комментарий
root 1
    child1 value1
`);
            
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('root');
        });

        test('должен обрабатывать литеральные значения с обратными кавычками', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(`
root \`value with spaces\`
    child \`multi
line
value\`
`);
            
            expect(result).toBeDefined();
            expect(result[0].name).toBe('root');
        });

        test('должен обрабатывать массивы значений', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse('root 1, 2, 3');
            
            expect(result).toBeDefined();
            expect(result[0].values).toBeDefined();
        });
    });

    describe('ArrayScheme', () => {
        test('должен возвращать массив объектов', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(`
root1 1
root2 2
`);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].name).toBe('root1');
            expect(result[1].name).toBe('root2');
        });

        test('должен обрабатывать вложенные уровни', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(`
root 1
    child1 value1
        grandchild value2
    child2 value3
`);
            
            expect(result[0].children).toBeDefined();
            expect(result[0].children?.length).toBe(2);
            expect(result[0].children?.[0].children).toBeDefined();
            expect(result[0].children?.[0].children?.length).toBe(1);
        });
    });

    describe('ObjectScheme', () => {
        test('должен возвращать объект', async () => {
            const parser = new NestedParser({ logParser: false }, new ObjectScheme());
            const result = await parser.parse(`
server
    host localhost
    port 3000
`);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result.server).toBeDefined();
            expect(result.server.host).toBe('localhost');
            expect(result.server.port).toBe('3000');
        });

        test('должен обрабатывать множественные значения как массив', async () => {
            const parser = new NestedParser({ logParser: false }, new ObjectScheme());
            const result = await parser.parse(`
config
    values 1, 2, 3
`);
            
            expect(result.config.values).toBeDefined();
            expect(Array.isArray(result.config.values)).toBe(true);
        });
    });

    describe('Обработка ошибок', () => {
        test('должен выбрасывать ошибку при смешанных отступах', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            
            await expect(async () => {
                await parser.parse(`
root 1
    child1
\tchild2
`);
            }).toThrow();
        });

        test('должен выбрасывать ошибку при невалидной иерархии', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            
            await expect(async () => {
                await parser.parse(`
root 1
    child1
  child2
`);
            }).toThrow();
        });
    });

    describe('Работа со streams', () => {
        test('должен парсить из ReadableStream', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const text = 'root 1\n    child1 value1';
            const stream = new ReadableStream({
                start(controller) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(text));
                    controller.close();
                }
            });
            
            const result = await parser.parse(stream);
            
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('root');
        });

        test('должен парсить из функции, возвращающей строку', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(() => 'root 1');
            
            expect(result).toBeDefined();
            expect(result[0].name).toBe('root');
        });

        test('должен парсить из асинхронной функции', async () => {
            const parser = new NestedParser({ logParser: false }, new ArrayScheme());
            const result = await parser.parse(async () => {
                return 'root 1';
            });
            
            expect(result).toBeDefined();
            expect(result[0].name).toBe('root');
        });
    });

    describe('Логирование', () => {
        test('должен логировать события при logParser: true', async () => {
            const parser = new NestedParser({ logParser: true }, new ArrayScheme());
            
            // Просто проверяем, что парсинг проходит без ошибок
            const result = await parser.parse('root 1');
            expect(result).toBeDefined();
        });
    });
});
