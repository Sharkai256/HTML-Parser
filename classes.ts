import serialize from './ser'

type NodeType = 1 | 2 | 3 | 4 | 7 | 8 | 9 | 10

export class Node {
    static get ELEMENT_NODE(): 1 { return 1 }
    static get ATTRIBUTE_NODE(): 2 { return 2 }
    static get TEXT_NODE(): 3 { return 3 }
    static get CDATA_SECTION_NODE(): 4 { return 4 }
    static get PROCESSING_INSTRUCTION_NODE(): 7 { return 7 }
    static get COMMENT_NODE(): 8 { return 8 }
    static get DOCUMENT_NODE(): 9 { return 9 }
    static get DOCUMENT_TYPE_NODE(): 10 { return 10 }

    #nodeType: NodeType
    #nodeName: string
    #nodeValue: string
    #childNodes: Node[] = []
    #parentNode: Node = null

    constructor(
        type: NodeType,
        name: string,
        children: Node[] = [],
        value: string = null
    ) {
        this.#nodeType = type
        this.#nodeName = name
        for (const child of children) {
            this.appendChild(child)
        }
        this.#nodeValue = value
    }

    //! Нода не может существовать в двух местах одновременно.
    //! div1.appendChild(a); div2.appendChild(a); - выдаст неправильный результат.
    appendChild(node: Node) {
        if (node instanceof Attribute) throw new Error('Attribute can not be appended')
        if (node instanceof DOM) throw new Error('DOM can not be appended')
        this.#childNodes.push(node)
        node.#parentNode = this
    }

    remove() {
        const cN = this.#parentNode.#childNodes
        cN.splice(cN.indexOf(this), 1)
        this.#parentNode = null
    }

    toString() {
        return serialize(this)
    }

    get nodeType() {
        return this.#nodeType
    }

    get nodeName() {
        return this.#nodeName
    }

    get nodeValue() {
        return this.#nodeValue
    }

    get childNodes() {
        return [...this.#childNodes]
    }

    get textContent() {
        return this.#childNodes.map(v => v instanceof Text ? v.nodeValue : v.textContent).join('')
    }
    set textContent(text: string) {
        this.#childNodes = [new Text(text)]
    }

    get parentNode() {
        return this.#parentNode
    }

    get parentElement() {
        return (this.#parentNode instanceof Element ? this.#parentNode : null)
    }

    get [Symbol.toPrimitive]() {
        return (hint: string) => {
            if (hint == 'number') return this.nodeType
            return this.toString()
        }
    }
}

export class Element extends Node {
    attributes: AttributeMap

    constructor(
        name: string,
        childNodes: Node[] = [],
        ...attributes: Attribute[]
    ) {
        super(Node.ELEMENT_NODE, name.toUpperCase(), childNodes)
        this.attributes = new AttributeMap(...attributes)
    }

    append(node: Node | string) {
        if (node instanceof Node) {
            this.appendChild(node)
        }
        else {
            this.appendChild(new Text(node))
        }
        this.appendChild(node instanceof Node ? node : new Text(node))
    }

    get children(): Element[] {
        return <Element[]>this.childNodes.filter(v => v instanceof Element)
    }

    get tagName() {
        return this.nodeName
    }

    get innerText() {
        return this.textContent
    }
    set innerText(value) {
        this.textContent = value
    }
}

export class SingleTag extends Element {
    #endClosed: boolean

    constructor(
        name: string,
        endClosed: boolean = false,
        ...attributes: Attribute[]
    ) {
        super(name, [], ...attributes)
        this.#endClosed = endClosed
    }

    appendChild() {
        throw new Error('SingleTag can not have children')
    }

    get endClosed() {
        return this.#endClosed
    }
}

export class Text extends Node {
    constructor(text: string) {
        super(Node.TEXT_NODE, '#text', [], text)
    }
}

export class CDATA extends Node {
    constructor(data: string) {
        super(Node.CDATA_SECTION_NODE, data)
    }

    appendChild() {
        throw new Error('CDATA can not have children')
    }
}

export class ProcessingInstruction extends Node {
    constructor(name: string, instruction: string) {
        super(Node.PROCESSING_INSTRUCTION_NODE, name, [], instruction)
    }

    appendChild() {
        throw new Error('ProcessingInstruction can not have children')
    }
}

export class Comment extends Node {
    constructor(text: string = '') {
        super(Node.COMMENT_NODE, '#comment', [], text)
    }

    appendChild() {
        throw new Error('Comment can not have children')
    }
}

export class DOM extends Element {
    constructor(childNodes: Node[] = []) {
        super('', childNodes)
    }

    createElement(tagName: string) {
        return new Element(tagName)
    }

    get nodeName() {
        return '#document'
    }

    get nodeType() {
        return Node.DOCUMENT_NODE
    }
}

export class DocumentType extends Node {
    constructor(type: string = 'html') {
        super(Node.DOCUMENT_TYPE_NODE, type)
    }

    appendChild() {
        throw new Error('DocumentType can not have children')
    }
}

export class Attribute extends Node {
    #nodeName: string
    #nodeValue: string

    constructor(name: string, value: string) {
        super(Node.ATTRIBUTE_NODE, name, [], value)
        this.#nodeName = name
        this.#nodeValue = value
    }

    appendChild() {
        throw new Error('Attribute can not have children')
    }

    get nodeName() {
        return this.#nodeName
    }

    get nodeValue() {
        return this.#nodeValue
    }

    get name() {
        return this.#nodeName
    }
    set name(value) {
        this.#nodeName = value
    }

    get value() {
        return this.#nodeValue
    }
    set value(value) {
        this.#nodeValue = value
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