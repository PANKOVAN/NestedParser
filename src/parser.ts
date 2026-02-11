import { ParserOptions, ParserInput, ParserCallbacks } from './types';

// Conditional imports for Node.js
let Readable: any;
let readline: any;

// Detect environment
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// Lazy load Node.js modules
let nodeModulesLoaded = false;
async function loadNodeModules() {
    if (nodeModulesLoaded || !isNode) {
        return;
    }
    try {
        const stream = await import('stream');
        Readable = stream.Readable;
        const readlineModule = await import('readline');
        readline = readlineModule.default || readlineModule;
        nodeModulesLoaded = true;
    } catch (e) {
        // Modules not available
    }
}

/**
 * Default parse options
 */
const DEFAULT_OPTIONS: Required<ParserOptions> = {
    logParser: false
};



/**
 * NestedParser class for parsing hierarchical texts
 */
export class NestedParser {
    // Схема обработчиков событий парсинга
    private schema?: ParserCallbacks;
    /**
     * Creates a new NestedParser instance
     */
    constructor(private options: ParserOptions = DEFAULT_OPTIONS, schema?: ParserCallbacks) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.schema = schema;
    }

    /**
     * Creates a line generator from input source
     * Works directly with streams without loading entire content into memory
     * 
     * @param input - Input source: string or ReadableStream
     * @returns Async generator that yields lines
     */
    private async * readLines(input: ParserInput): AsyncGenerator<string, void, unknown> {
        // Handle string directly
        if (typeof input === 'string') {
            const lines = input.split(/\r\n|\n|\r/);
            for (const line of lines) {
                yield line;
            }
            return;
        }

        // Handle function - resolve first
        let resolvedInput: string | ReadableStream<Uint8Array> | NodeJS.ReadableStream;
        if (typeof input === 'function') {
            resolvedInput = await input();
        } else {
            resolvedInput = input;
        }

        // Handle Web ReadableStream - read line by line
        if (resolvedInput instanceof ReadableStream) {
            yield* this.readLinesFromWebStream(resolvedInput);
            return;
        }

        // Handle Node.js ReadableStream - use readline
        if (isNode && (typeof resolvedInput === 'object' && resolvedInput != null && 'read' in resolvedInput)) {
            // Load Node.js modules to check if it's a Readable stream
            await loadNodeModules();
            if (Readable && (resolvedInput instanceof Readable || (typeof resolvedInput === 'object' && resolvedInput != null && 'read' in resolvedInput))) {
                yield* this.readLinesFromNodeStream(resolvedInput as NodeJS.ReadableStream);
                return;
            }
        }

        // Handle string from function
        if (typeof resolvedInput === 'string') {
            const lines = resolvedInput.split(/\r\n|\n|\r/);
            for (const line of lines) {
                yield line;
            }
            return;
        }

        throw new Error('Unsupported input type. Expected string or ReadableStream.');
    }

    /**
     * Reads lines from Web ReadableStream line by line
     * Doesn't load entire stream into memory
     */
    private async * readLinesFromWebStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process remaining buffer
                    if (buffer.length > 0) {
                        yield buffer;
                    }
                    break;
                }

                // Decode chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });

                // Split buffer by line endings
                while (true) {
                    const newlineIndex = buffer.indexOf('\n');
                    if (newlineIndex === -1) {
                        // Check for \r without \n
                        const crIndex = buffer.indexOf('\r');
                        if (crIndex === -1) {
                            break; // No line ending found, wait for more data
                        }
                        // Found \r, yield line
                        const line = buffer.substring(0, crIndex);
                        buffer = buffer.substring(crIndex + 1);
                        yield line;
                    } else {
                        // Found \n, check if preceded by \r
                        const line = buffer.substring(0, newlineIndex).replace(/\r$/, '');
                        buffer = buffer.substring(newlineIndex + 1);
                        yield line;
                    }
                }
            }
            // Decode any remaining bytes
            const remaining = decoder.decode();
            if (remaining.length > 0) {
                buffer += remaining;
                if (buffer.length > 0) {
                    yield buffer;
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Reads lines from Node.js ReadableStream using readline
     * Already works line by line, no need to load entire stream
     */
    private async * readLinesFromNodeStream(stream: NodeJS.ReadableStream): AsyncGenerator<string, void, unknown> {
        if (!isNode) {
            throw new Error('Node.js stream reading is only available in Node.js');
        }

        // Load Node.js modules if not already loaded
        await loadNodeModules();

        if (!readline) {
            throw new Error('readline module is not available');
        }

        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity, // Handle both \r\n and \n
        });

        for await (const line of rl) {
            yield line;
        }
    }
    /**
     * Parses a hierarchical text into a tree structure
     * Works in both Node.js and browser environments
     * Reads directly from stream line by line without loading entire content
     * 
     * @param input - Input source: string or ReadableStream
     * @returns Promise that resolves to parsed result
     */
    async parse(input: ParserInput): Promise<any | void> {
        let lineNumber: number = 0;
        let levels: number[] = [];
        let useSpace: boolean = false;
        let useTab: boolean = false;
        let spaces: string = '';
        let lineContent: string = '';

        this.invokeCallback('parserStarted', lineNumber);

        const linesGenerator = this.readLines(input);
        for await (const line of linesGenerator) {
            lineNumber++;
            // Set level and test indentation consistency
            {
                let match = line.match(/^(\s*)(.*)$/);
                spaces = match?.[1] ?? '';
                lineContent = match?.[2] ?? '';


                if (!useSpace && !useTab && spaces.length > 0) {
                    useSpace = spaces.startsWith(' ');
                    useTab = spaces.startsWith('\t');
                }
                if ((useSpace && spaces.includes('\t')) || (useTab && spaces.includes(' '))) {
                    this.invokeCallback('errorDetected', lineNumber, 'Mixed space and tab indentation');
                }

                let currentLevel: number = spaces.length;
                if (levels.length === 0) {
                    levels.push(currentLevel);
                }

                if (currentLevel > levels[levels.length - 1]) {
                    levels.push(currentLevel);
                    this.invokeCallback('levelUp', lineNumber);
                } else {
                    while (currentLevel < levels[levels.length - 1]) {
                        levels.pop();
                        this.invokeCallback('levelDown', lineNumber);
                    }
                }

                if (levels.length === 0 || currentLevel !== levels[levels.length - 1])
                    this.invokeCallback('errorDetected', lineNumber, 'Invalid indentation');
            }

            // Concatenate lines with back quotes or ended ','
            {
                lineContent = lineContent.trim();

                if (lineContent.startsWith('#')) {
                    this.invokeCallback('commentDetected', lineNumber, lineContent);
                    continue;
                }

                while (this.countBackQuotes(lineContent) % 2 !== 0 || lineContent.endsWith(',') || lineContent.endsWith(',\n')) {
                    let nextLine = await linesGenerator.next();
                    if (nextLine.done) {
                        if (this.countBackQuotes(lineContent) % 2 !== 0)
                            this.invokeCallback('errorDetected', lineNumber, 'Unbalanced back quotes');
                        break;
                    }
                    lineNumber++;

                    let commentLine: string = (nextLine.value || '').trim();
                    if (commentLine.startsWith('#')) {
                        this.invokeCallback('commentDetected', lineNumber, commentLine);
                        continue;
                    }

                    lineContent += '\n' + nextLine.value.trim();
                }
            }
            // Parse the line content
            {
                if (lineContent.length > 0) {

                    this.invokeCallback('rowDetected', lineNumber, lineContent)
                    if (this.schema?.nameDetected && this.schema?.valuesDetected || this.options.logParser) {
                        let match = lineContent.match(/^`[^`]*?`|^[^`\s]+\s*/);
                        if (match) {
                            let name = match[0].trim();
                            let content = lineContent.substring(name.length).trim();
                            if (name.startsWith('`') && name.endsWith('`')) name = name.substring(1, name.length - 1);

                            this.invokeCallback('nameDetected', lineNumber, name);

                            let values: string[] = [];
                            if (content.length > 0) {
                                match = content.match(/(`[^`]*`|[^`,]+),*?/g);
                                if (match) {
                                    for (let v of match) {
                                        v = v.trim();
                                        if (v.startsWith('`') && v.endsWith('`')) v = v.substring(1, v.length - 1);
                                        values.push(v);
                                    }
                                }
                            }
                            if (values.length > 0) {
                                this.invokeCallback('valuesDetected', lineNumber, values);
                            }

                        }
                    }
                }
            }

        }

        return this.invokeCallback('parserEnded', lineNumber);

    }
    private countBackQuotes(text: string): number {
        return text.split('`').length - 1;
    }

    /**
     * Установка всех обработчиков событий через интерфейс
     */
    setSchema(schema: ParserCallbacks): void {
        this.schema = { ...this.schema, ...schema };
    }


    /**
     * Вызов обработчика события (вспомогательный метод)
     */
    private invokeCallback(callbackName: keyof ParserCallbacks, lineNumber?: number, value?: string | string[]): any {
        if (this.options.logParser) {
            console.debug(callbackName, lineNumber, value);
        }
        if (this.schema) {
            const callback = this.schema[callbackName]
            if (callback) {
                return (callback as any).call(this.schema, lineNumber, value);
            }
            else if (callbackName === 'errorDetected') {
                throw new Error(`Parse error. Line ${lineNumber ?? 'unknown'}. ${value}`);
            }
        }
        else {
            throw new Error(`Undefined scheme`);
        }
    }
}
