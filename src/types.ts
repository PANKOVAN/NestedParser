/**
 * Type definitions for NestedParser
 */

export interface ParserOptions {
    logParser: boolean
}


/**
 * Input source types for NestedParser
 * Works in both Node.js and browser environments
 */
export type ParserInput =
    | string
    | ReadableStream<Uint8Array>  // Web Streams API (universal)
    | NodeJS.ReadableStream       // Node.js streams
    | (() => string | Promise<string>)
    | (() => ReadableStream<Uint8Array> | Promise<ReadableStream<Uint8Array>>)
    | (() => NodeJS.ReadableStream | Promise<NodeJS.ReadableStream>);


/**
* Interface for all parser event callbacks
*/
export interface ParserCallbacks {
    /**
     * parserStarted - начало разбора
     */
    parserStarted?: () => void;

    /**
     * parserEnded - завершение разбора
     */
    parserEnded?: () => any;

    /**
     * levelUp - переход на следующий уровень иерархии
     */
    levelUp?: (lineNumber: number) => void;

    /**
     * levelDown - переход на предыдущий уровень иерархии
     */
    levelDown?: (lineNumber: number) => void;

    rowDetected?: (lineNumber: number, row: string) => void;

    /**
     * nameDetected - имя выделено
     */
    nameDetected?: (lineNumber: number, name: string) => void;

    /**
     * valuesDetected - значения выделены
     */
    valuesDetected?: (lineNumber: number, values: string[]) => void;

    /**
     * commentDetected - встречены комментарии
     */
    commentDetected?: (lineNumber: number, comment: string) => void;

    /**
     * errorDetected - встречена ошибка
     * Если обработчик не задан, то выбрасывается исключение
     */
    errorDetected?: (lineNumber: number, message: string) => void;
}
