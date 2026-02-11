import { describe, test, expect } from 'bun:test';
import { ObjectScheme } from './object.scheme';

describe('ObjectScheme', () => {
    test('должен инициализироваться с пустым объектом', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        
        expect(scheme.levelNodes).toBeDefined();
        expect(scheme.levelNodes?.length).toBe(1);
        expect(scheme.levelNodes?.[0].node).toEqual({});
    });

    test('должен обрабатывать nameDetected', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        
        expect(scheme.levelNodes?.[0].name).toBe('test');
    });

    test('должен обрабатывать valuesDetected с одним значением', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        scheme.valuesDetected(1, ['value1']);
        
        expect(scheme.levelNodes?.[0].node.test).toBe('value1');
    });

    test('должен обрабатывать valuesDetected с несколькими значениями', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        scheme.valuesDetected(1, ['value1', 'value2']);
        
        expect(scheme.levelNodes?.[0].node.test).toEqual(['value1', 'value2']);
    });

    test('должен обрабатывать levelUp', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'parent');
        scheme.valuesDetected(1, []);
        scheme.levelUp(2);
        
        expect(scheme.levelNodes?.length).toBe(2);
        expect(scheme.levelNodes?.[0].node.parent).toBeDefined();
        expect(typeof scheme.levelNodes?.[0].node.parent).toBe('object');
    });

    test('должен обрабатывать levelDown', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'parent');
        scheme.levelUp(2);
        scheme.levelDown(3);
        
        expect(scheme.levelNodes?.length).toBe(1);
    });

    test('должен возвращать объект при parserEnded', () => {
        const scheme = new ObjectScheme();
        scheme.parserStarted();
        scheme.nameDetected(1, 'test');
        scheme.valuesDetected(1, ['value1']);
        const result = scheme.parserEnded();
        
        expect(typeof result).toBe('object');
        expect(result.test).toBe('value1');
    });

    test('должен выбрасывать ошибку при errorDetected', () => {
        const scheme = new ObjectScheme();
        
        expect(() => {
            scheme.errorDetected(1, 'Test error');
        }).toThrow('Parse error. Line 1. Test error');
    });
});
