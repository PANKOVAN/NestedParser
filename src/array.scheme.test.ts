import { describe, test, expect } from 'bun:test';
import { ArrayScheme } from './array.scheme';

describe('ArrayScheme', () => {
    test('должен инициализироваться с пустым массивом', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        
        expect(scheme.levelNodes).toBeDefined();
        expect(scheme.levelNodes?.length).toBe(1);
    });

    test('должен обрабатывать nameDetected', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        
        expect(scheme.levelNodes).toBeDefined();
        const children = scheme.levelNodes?.[0]?.children;
        expect(children).toBeDefined();
        expect(children?.length).toBe(1);
        expect(children?.[0].name).toBe('test');
    });

    test('должен обрабатывать valuesDetected', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        scheme.valuesDetected(1, ['value1', 'value2']);
        
        const children = scheme.levelNodes?.[0]?.children;
        expect(children?.[0].values).toEqual(['value1', 'value2']);
    });

    test('должен обрабатывать levelUp', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'parent');
        scheme.levelUp(2);
        
        expect(scheme.levelNodes?.length).toBe(2);
    });

    test('должен обрабатывать levelDown', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'parent');
        scheme.levelUp(2);
        scheme.levelDown(3);
        
        expect(scheme.levelNodes?.length).toBe(1);
    });

    test('должен возвращать массив при parserEnded', () => {
        const scheme = new ArrayScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        const result = scheme.parserEnded();
        
        expect(Array.isArray(result)).toBe(true);
        expect(result?.length).toBe(1);
        expect(result?.[0].name).toBe('test');
    });

    test('должен выбрасывать ошибку при errorDetected', () => {
        const scheme = new ArrayScheme();
        
        expect(() => {
            scheme.errorDetected(1, 'Test error');
        }).toThrow('Parse error. Line 1. Test error');
    });
});
