import { ParserOptions, ParserInput, ParserCallbacks } from './types';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { Readable } from 'stream';
import * as readline from 'readline';

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
     * Gets the input stream from the input source
     * 
     * @param input - Input source: string, file path, URL, ReadableStream, or function returning string/stream
     * @returns Promise that resolves to the readable stream
     */
    private async getInputStream(input: ParserInput): Promise<NodeJS.ReadableStream> {
        // Handle string directly
        if (typeof input === 'string') {
            // Check if it's a URL (starts with http:// or https://)
            if (input.startsWith('http://') || input.startsWith('https://')) {
                // It's a URL string
                return await this.getStreamFromUrl(new URL(input));
            } else if (input.startsWith('file://')) {
                // It's a file path (by prefix)
                return this.getStreamFromFile(input.substring(7));
            } else if (input.startsWith('./') || input.startsWith('../')) {
                // It's a file path (by prefix)
                return this.getStreamFromFile(input);
            } else {
                // It's just a text string - create a stream from it
                return Readable.from([input]);
            }
        }

        // Handle URL object
        if (input instanceof URL) {
            return await this.getStreamFromUrl(input);
        }

        // Handle ReadableStream
        if (input instanceof Readable || (typeof input === 'object' && 'read' in input)) {
            return input as NodeJS.ReadableStream;
        }

        // Handle function
        if (typeof input === 'function') {
            const result = await input();
            if (typeof result === 'string') {
                return Readable.from([result]);
            } else {
                return result;
            }
        }
        throw new Error('Unsupported input type');
    }


    /**
     * Gets a stream from a file
     */
    private getStreamFromFile(filePath: string): NodeJS.ReadableStream {
        return fs.createReadStream(filePath, { encoding: 'utf8' });
    }

    /**
     * Gets a stream from a URL
     */
    private async getStreamFromUrl(url: URL): Promise<NodeJS.ReadableStream> {
        return new Promise((resolve, reject) => {
            const client = url.protocol === 'https:' ? https : http;

            client.get(url, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to fetch URL: ${res.statusCode}`));
                    return;
                }

                // Response is already a readable stream
                resolve(res);
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Reads lines from a ReadableStream
     * 
     * @param stream - The readable stream to read from
     * @returns Async generator that yields lines
     */
    private async* readLines(stream: NodeJS.ReadableStream): AsyncGenerator<string, void, unknown> {
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
     * 
     * @param input - Input source: string, file path, URL, ReadableStream, or function returning string/stream
     * @returns Promise that resolves to array of root nodes
     */
    async parse(input: ParserInput): Promise<any | void> {
        const stream = await this.getInputStream(input);

        let lineNumber: number = 0;
        let levels: number[] = [];
        let useSpace: boolean = false;
        let useTab: boolean = false;
        let spaces: string = '';
        let lineContent: string = '';

        this.invokeCallback('parserStarted', lineNumber);

        const linesGenerator = this.readLines(stream);
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
                    lineNumber++;

                    let commentLine: string = (nextLine.value || '').trim()
                    if (commentLine.startsWith('#')) {
                        this.invokeCallback('commentDetected', lineNumber, commentLine);
                        continue;
                    }

                    if (nextLine.done) {
                        if (this.countBackQuotes(lineContent) % 2 !== 0)
                            this.invokeCallback('errorDetected', lineNumber, 'Unbalanced back quotes');
                        break;
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
