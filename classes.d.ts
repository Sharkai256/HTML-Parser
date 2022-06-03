declare type NodeType = 1 | 2 | 3 | 4 | 7 | 8 | 9 | 10;
export interface JSONode {
    type?: string;
    name?: string;
    value?: string;
    childNodes?: JSONode[];
    attributes?: JSONode[];
    params?: any[];
}
export declare class Node {
    #private;
    static get ELEMENT_NODE(): 1;
    static get ATTRIBUTE_NODE(): 2;
    static get TEXT_NODE(): 3;
    static get CDATA_SECTION_NODE(): 4;
    static get PROCESSING_INSTRUCTION_NODE(): 7;
    static get COMMENT_NODE(): 8;
    static get DOCUMENT_NODE(): 9;
    static get DOCUMENT_TYPE_NODE(): 10;
    constructor(type: NodeType, name: string, children?: Node[], value?: string);
    appendChild(node: Node): void;
    insertBefore(newNode: Node, referenceNode: Node): void;
    removeChild(node: Node): Node;
    cloneNode(deep?: boolean): any;
    replaceChild(newChild: Node, oldChild: Node): void;
    remove(): void;
    contains(node: Node): any;
    toJSON(): string;
    toString(): string;
    get nodeType(): NodeType;
    get nodeName(): string;
    get nodeValue(): string;
    get childNodes(): Node[];
    get textContent(): string;
    set textContent(text: string);
    get parentNode(): Node;
    get parentElement(): Element;
    get [Symbol.toPrimitive](): (hint: string) => string | NodeType;
}
export declare class Element extends Node {
    #private;
    constructor(name: string, childNodes?: Node[], ...attributes: Attribute[]);
    append(...nodes: (Node | string)[]): void;
    querySelector(selector: string): Element;
    querySelectorAll(selector: string): Element[];
    prepend(...nodes: (Node | string)[]): void;
    before(...nodes: (Node | string)[]): void;
    after(...nodes: (Node | string)[]): void;
    replaceWith(...nodes: (Node | string)[]): void;
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string;
    removeAttribute(name: string): void;
    toggleAttribute(name: string, force?: boolean): void;
    hasAttribute(name: string): boolean;
    getElementById(id: string): Element;
    getElementsByTagName(name: string): Element[];
    getElementsByName(name: string): Element[];
    getElementsByClassName(names: string): Element[];
    get children(): Element[];
    get tagName(): string;
    get innerText(): string;
    set innerText(value: string);
    get innerHTML(): string;
    set innerHTML(value: string);
    get attributes(): AttributeMap;
    get id(): string;
    set id(value: string);
    get classList(): ClassList;
    get className(): string;
    set className(value: string);
    get style(): StyleList;
    set style(value: any);
    get dataset(): {
        [key: string]: string;
    };
}
export declare class SingleTag extends Element {
    #private;
    constructor(name: string, endClosed?: boolean, ...attributes: Attribute[]);
    appendChild(): void;
    get endClosed(): boolean;
}
export declare class Text extends Node {
    constructor(text: string);
}
export declare class CDATA extends Node {
    constructor(data: string);
    appendChild(): void;
}
export declare class ProcessingInstruction extends Node {
    constructor(name: string, instruction: string);
    appendChild(): void;
}
export declare class Comment extends Node {
    constructor(text?: string);
    appendChild(): void;
}
export declare class DOM extends Element {
    constructor(childNodes?: Node[]);
    createElement(tagName: string): Element;
    createNode(html: string): Node;
    createScript(code: string, defer?: boolean, async?: boolean): Element;
    createScript(options: {
        code: string;
        defer?: boolean;
        async?: boolean;
    }): Element;
    get nodeName(): string;
    get title(): string;
    set title(value: string);
    get head(): Element;
    get body(): Element;
    get nodeType(): 9;
    get doctype(): DocumentType;
    get documentElement(): Element;
}
export declare class DocumentType extends Node {
    constructor(type?: string);
    appendChild(): void;
}
export declare class Attribute extends Node {
    constructor(name: string, value: string);
    appendChild(): void;
    get name(): string;
    get value(): string;
}
export declare class AttributeMap implements Iterable<Attribute> {
    #private;
    constructor(element: Element, ...attributes: Attribute[]);
    set(attr: Attribute): void;
    get(name: string): Attribute;
    remove(name: string): void;
    item(index: number): Attribute;
    get length(): number;
    get [Symbol.iterator](): () => Iterator<Attribute, any, undefined>;
}
export declare class ClassList implements Iterable<string> {
    #private;
    constructor(element: Element);
    add(value: string): this;
    remove(value: string): boolean;
    clear(): void;
    contains(token: string): boolean;
    replace(oldToken: string, newToken: string): boolean;
    toggle(token: string, force?: boolean): boolean;
    item(index: number): string;
    keys(): IterableIterator<number>;
    values(): IterableIterator<string>;
    entries(): IterableIterator<[number, string]>;
    forEach(callback: (currentValue: string, currentIndex: number, listObj: string[]) => never, thisArg?: any): void;
    get value(): string;
    set value(value: string);
    get length(): number;
    get [Symbol.iterator](): () => Iterator<string, any, undefined>;
}
export declare class StyleList implements Iterable<string> {
    #private;
    constructor(element: Element);
    getPropertyValue(name: string): string;
    setProperty(name: string, value: string): void;
    removeProperty(name: string): void;
    item(index: number): string;
    get cssText(): string;
    set cssText(value: string);
    get length(): number;
    get [Symbol.iterator](): () => Iterator<string, any, undefined>;
    [key: string | symbol]: any;
}
export {};
