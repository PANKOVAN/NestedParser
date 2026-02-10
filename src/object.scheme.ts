import { link } from 'fs';
import { ParserCallbacks } from './types';

/**
 * ObjectScheme class that implements ParserCallbacks interface
 */
interface LevelNode {
    name: string,
    node: any
}
export class ObjectScheme implements ParserCallbacks {
    //rowDetected?: (lineNumber: number, row: string) => void;
    //commentDetected?: (lineNumber: number, comment: string) => void;

    levelNodes?: LevelNode[];

    constructor() {
    }
    parserStarted(): void {
        this.levelNodes = [{ name: '', node: {} }];
    };
    parserEnded(): any {
        return this.levelNodes?.[0]?.node;
    };
    nameDetected(lineNumber: number, name: string): void {
        let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1];
        if (levelNode) {
            levelNode.name = name;
        }
        else {
            this.errorDetected(lineNumber, `Node name detected, but node is not defined`);
        }
    };
    valuesDetected(lineNumber: number, values: string[]): void {
        if (values && values.length > 0) {
            let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1];
            if (levelNode) {
                if (levelNode.name) {
                    let value: string[] | string;
                    if (values.length == 1) value = values[0];
                    else value = values;

                    levelNode.node ||= {};
                    if (levelNode.node[levelNode.name] == undefined) {
                        levelNode.node[levelNode.name] = value;
                    }
                    else {
                        this.errorDetected(lineNumber, `Value detected, but value for  ${levelNode.name} is assigned`);
                    }
                }
                else {
                    this.errorDetected(lineNumber, `Value detected, but node name is not defined`);
                }
            }
            else {
                this.errorDetected(lineNumber, `Value detected, but level node is not defined`);
            }
        }
    };
    levelUp(lineNumber: number): void {
        let levelNode: any = this.levelNodes?.[this.levelNodes.length - 1];
        if (levelNode) {
            if (levelNode.name) {
                levelNode.node ||= {};
                if (levelNode.node[levelNode.name] == undefined) {
                    levelNode.node[levelNode.name] = {};
                    this.levelNodes?.push({ name: '', node: levelNode.node[levelNode.name] })
                }
                else {
                    this.errorDetected(lineNumber, `Next level detected, but value for  ${levelNode.name} is assigned`);
                }
            }
            else {
                this.errorDetected(lineNumber, `Next level detected, but node name is not defined`);
            }
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
