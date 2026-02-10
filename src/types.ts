/**
 * Type definitions for NestedParser
 */

export interface ParserOptions {
    logParser: boolean
}


/**
 * Input source types for NestedParser
 */
export type ParserInput =
    | string
    | URL
    | NodeJS.ReadableStream
    | (() => string | Promise<string>)
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
