import serialize from './ser'

export class Node {
    static get ELEMENT_NODE(): 1 { return 1 }
    static get ATTRIBUTE_NODE(): 2 { return 2 }
    static get TEXT_NODE(): 3 { return 3 }
    static get CDATA_SECTION_NODE(): 4 { return 4 }
    static get PROCESSING_INSTRUCTION_NODE(): 7 { return 7 }
    static get COMMENT_NODE(): 8 { return 8 }
    static get DOCUMENT_NODE(): 9 { return 9 }
    static get DOCUMENT_TYPE_NODE(): 10 { return 10 }

    childNodes: Node[]
    nodeType: number
    nodeName: string
    nodeValue: string

    constructor(type: number, name: string, children: Node[] = [], value: string = null) {
        this.nodeType = type
        this.nodeName = name
        this.childNodes = children
        this.nodeValue = value
    }

    toString() {
        return serialize(this)
    }
}

export class Element extends Node {
    children: Element[] = []
    attributes: AttributeMap

    constructor(name: string, children: Node[] = [], ...attributes: Attribute[]) {
        super(Node.ELEMENT_NODE, name.toUpperCase(), children)
        this.attributes = new AttributeMap(...attributes)
        this.children = <Element[]>children.filter(v => v instanceof Element)
    }

    get tagName() {
        return this.nodeName
    }
    set tagName(value) {
        this.nodeName = value.toUpperCase()
    }
}

export class DOM extends Element {
    children: Element[] = []

    constructor(children: Node[] = []) {
        super('', children)
        this.nodeName = '#document'
        this.nodeType = Node.DOCUMENT_NODE
    }

    createElement(tagName: string) {
        return new Element(tagName)
    }
}

export class Comment extends Node {
    constructor(text: string) {
        super(Node.COMMENT_NODE, '#comment', [], text)
    }
}

export class DocumentType extends Node {
    constructor(type: string) {
        super(Node.DOCUMENT_TYPE_NODE, type)
    }
}

export class Text extends Node {
    constructor(text: string) {
        super(Node.TEXT_NODE, '#text', [], text)
    }
}

export class Attribute extends Node {
    constructor(name: string, value: string) {
        super(Node.ATTRIBUTE_NODE, name, [], value)
    }

    get name() {
        return this.nodeName
    }
    set name(value) {
        this.nodeName = value
    }

    get value() {
        return this.nodeValue
    }
    set value(value) {
        this.nodeValue = value
    }

    get [Symbol.toPrimitive]() {
        return () => `${this.name}="${this.value}"`
    }
}

export class AttributeMap {
    #items: Attribute[] = []
    #itemsMap: {[name: string]: number} = {}

    constructor(...attributes: Attribute[]) {
        for (const attr of attributes) {
            this.set(attr)
        }
    }

    set(attr: Attribute) {
        const found = this.#itemsMap[attr.name]
        if (typeof found == 'number') {
            this.#items[found] = attr
        } else {
            this.#itemsMap[attr.name] = this.#items.push(attr)
        }
    }

    get(name: string) {
        return this.#items[this.#itemsMap[name]]
    }

    remove(name: string) {
        const found = this.#itemsMap[name]
        if (typeof found == 'number') {
            this.#items.splice(found, 1)
            delete this.#itemsMap[name]
        }
    }

    item(index: number) {
        return this.#items[index]
    }

    get length() {
        return this.#items.length
    }
}