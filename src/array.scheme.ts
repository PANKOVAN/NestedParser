import { link } from 'fs';
import { ParserCallbacks } from './types';

interface LevelNode {
    name: string,
    values?: string[],
    children?: LevelNode[]
}

/**
 * ObjectScheme class that implements ParserCallbacks interface
 */
export class ArrayScheme implements ParserCallbacks {
    //rowDetected?: (lineNumber: number, row: string) => void;
    //commentDetected?: (lineNumber: number, comment: string) => void;

    levelNodes?: LevelNode[];

    constructor() {
    }
    parserStarted(): void {
        this.levelNodes = [];
        this.levelNodes.push({ name: '', children: [] });
    };
    parserEnded(): any {
        return this.levelNodes?.[0]?.children;
    };
    nameDetected(lineNumber: number, name: string): void {
        let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1]?.children;
        if (levelNode) {
            levelNode.push({ name: name });
        }
        else {
            this.errorDetected(lineNumber, `Value detected, but level node is not defined`);
        }
    };
    valuesDetected(lineNumber: number, values: string[]): void {
        if (values && values.length > 0) {
            let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1];
            if (levelNode) {
                levelNode.children = levelNode.children || [{ children: [{}] }];
                levelNode = levelNode.children[levelNode.children.length - 1];
                levelNode.values = values;
            }
            else {
                this.errorDetected(lineNumber, `Value detected, but level node is not defined`);
            }
        }
    };
    levelUp(lineNumber: number): void {
        let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1];
        if (levelNode) {
            levelNode.children = levelNode.children || [{ children: [{}] }];
            levelNode = levelNode.children[levelNode.children.length - 1];
            levelNode.children = levelNode.children || [];
            this.levelNodes?.push(levelNode);
        }
        else {
            this.errorDetected(lineNumber, `Next level detected, but level node is not defined`);
        }
    }
    levelDown(lineNumber: number): void {
        if (this.levelNodes && this.levelNodes.length > 1) {
            this.levelNodes?.pop();
        }
        else {
            this.errorDetected(lineNumber, `Invalid indentation`);
        }
    }
    errorDetected(lineNumber: number, message: string): void {
        throw new Error(`Parse error. Line ${lineNumber ?? 'unknown'}. ${message}`);
    }
}
