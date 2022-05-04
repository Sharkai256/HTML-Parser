import serialize from './ser'
import parse from './index'

type NodeType = 1 | 2 | 3 | 4 | 7 | 8 | 9 | 10

interface Selector {
    type: 'class' | 'id' | 'attr' | 'pseudo';
    value: string;
    sub?: Tag[];
}

interface Tag {
    name: string;
    selectors: Selector[];
    separ?: ' ' | '>' | '~' | '+' | ',';
}

interface AttrSelector {
    name: string;
    mod: string;
    value: string;
}

interface PseudoSelector {
    name: string;
    value?: TagSelector[]
}

interface TagSelector {
    name: string
    id: string
    class: string[]
    attributes: AttrSelector[]
    pseudo: PseudoSelector[]
    separ?: ' ' | '>' | '~' | '+' | ',';
}

const parseSelector = (selector: string) => {
    const parse = (string: string) => {
        const SELECTOR = 0;
        const CLASS = 1;
        const ID = 2;
        const ATTRIBUTE = 3;
        const PSEUDO = 4;
        const SUB = 5;
        const SPEC = 6;
        const SEP = 7;

        const tags: Tag[] = [{
            name: '',
            selectors: []
        }];

        let buffer = '';
        let counter = 0;

        const lastTag = () => tags[tags.length - 1];
        const lastSel = () => lastTag().selectors[lastTag().selectors.length - 1];

        const checkForSpec = (char: string, callback: () => void) => {
            switch (char) {
                case ',':
                case ' ':
                case '>':
                case '~':
                case '+':
                    if (state !== SEP) {
                        buffer = '';
                        tags.push({
                            name: '',
                            selectors: []
                        })
                    }
                    buffer += char;
                    if (!/^ *[,>~\+]? *$/.test(buffer)) throw new Error(`Invalid separator [${char}] in [${buffer}]`)
                    lastTag().separ = <' '>buffer.trim() || ' '
                    state = SEP;
                    break;
                case '.':
                    state = CLASS;
                    lastTag().selectors.push({
                        type: 'class',
                        value: ''
                    })
                    break;
                case '#':
                    state = ID;
                    lastTag().selectors.push({
                        type: 'id',
                        value: ''
                    })
                    break;
                case '[':
                    state = ATTRIBUTE;
                    lastTag().selectors.push({
                        type: 'attr',
                        value: ''
                    })
                    break;
                case ']':
                    break;
                case ':':
                    state = PSEUDO;
                    lastTag().selectors.push({
                        type: 'pseudo',
                        value: ''
                    })
                    break;
                default:
                    callback();
                    break;
            }
        }

        let state = SELECTOR;

        for (const char of string) {
            switch (state) {
                case SPEC:
                    checkForSpec(char, () => {throw new Error(`Invalid character after "()" [${char}]`)})
                    break;
                case SEP:
                    let flag = true;
                    checkForSpec(char, () => {
                        state = SELECTOR;
                        flag = false;
                    })
                    if (flag) break;
                case SELECTOR:
                    if (char == '*') lastTag().name = '*';
                    else checkForSpec(char, () => {
                        if (!/^[a-z-]+$/.test(char)) throw new Error(`Invalid character in tag name [${char}]`)
                        lastTag().name += char;
                    });
                    break;
                case PSEUDO:
                    if (char == '(') {
                        state = SUB;
                        buffer = '';
                        counter = 1;
                        break;
                    }
                case CLASS:
                case ID:
                    checkForSpec(char, () => {
                        if (!/^[a-z-]+$/.test(char)) throw new Error(`Invalid character [${char}]`)
                        lastSel().value += char
                    });
                    break;
                case ATTRIBUTE:
                    checkForSpec(char, () => {
                        lastSel().value += char;
                        if (!/^[a-z-]+([\^\$\*]?(=.*?)?)?$/.test(lastSel().value)) throw new Error(`Invalid character in attribute name [${char}]`)
                    });
                    break;
                case SUB:
                    if (char == '(') counter++;
                    if (char == ')') {
                        counter--;
                        if (!counter) {
                            state = SPEC;
                            lastSel().sub = parse(buffer);
                            break;
                        }
                    }
                    buffer += char;
                    break;
            }
        }
        return tags;
    }

    const res = parse(selector);
    if (!res.length) return null;

    const checkName = (name: string, err: string) => {
        if (!/^[a-z]+(-[a-z]+)*$/.test(name)) throw new Error(err);
    }

    const transform = (array: Tag[]): TagSelector[] => {
        if (!array?.length) return null
        const selectors = [];
        for (const item of array) {
            const tag: TagSelector = {
                name: item.name || '*',
                id: '',
                class: [],
                attributes: [],
                pseudo: [],
                separ: item.separ
            }
            for (const sel of item.selectors) {
                switch (sel.type) {
                    case 'attr':
                        let [, name, mod, value] = /^([a-z]+(?:-[a-z]+)*)(?:([\^\$\*]?)=((?:".*")|(?:'.*')|(?:\S+)))?$/.exec(sel.value) ?? ['', ''];
                        if (!name) throw new Error(`Invalid attribute selector [${sel.value}]`)
                        if (/^(".*")|('.*')$/.test(value)) value = value.substring(1, value.length - 1);
                        tag.attributes.push({name, mod, value});
                        break;
                    case 'class':
                        checkName(sel.value, `Invalid class selector [${sel.value}]`)
                        tag.class.push(sel.value)
                        break;
                    case 'id':
                        checkName(sel.value, `Invalid id selector [${sel.value}]`)
                        if (tag.id) throw new Error(`Two id occurences in selector  [${tag.id}]`);
                        tag.id = sel.value;
                        break;
                    case 'pseudo':
                        checkName(sel.value, `Invalid pseudo class selector [${sel.value}]`)
                        tag.pseudo.push({
                            name: sel.value,
                            value: transform(sel.sub)
                        })
                        break;
                }
            }
            tag.id = tag.id || '*'
            selectors.push(tag)
        }
        return selectors;
    }
    return transform(res)
}

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

    appendChild(node: Node) {
        if (node instanceof Attribute) throw new Error('Attribute can not be appended')
        if (node instanceof DOM) throw new Error('DOM can not be appended')
        if (node.contains(this)) throw new Error('Child node can not contain parent node')
        node.remove()
        this.#childNodes.push(node)
        node.#parentNode = this
    }

    //* Позволяет дублировать ноды.
    //* Позволяет циклит дерево.
    //* Позволяет аппендить ноды, которые аппендить нельзя.
    insertBefore(newNode: Node, referenceNode: Node) {
        this.#childNodes.splice(this.#childNodes.indexOf(referenceNode), 0, newNode)
    }

    removeChild(node: Node) {
        if (node.parentNode != this) throw new Error('Passed node is not a child of the current node')
        node.remove()
        return node
    }

    replaceChild(newChild: Node, oldChild: Node) {
        if (oldChild.parentNode != this) throw new Error('OldChild is not a child of this element')
        if (newChild.contains(this)) throw new Error('Child node can not contain parent node')
        this.insertBefore(newChild, oldChild)
        oldChild.remove()
    }

    remove() {
        if(!this.#parentNode) return
        const cN = this.#parentNode.#childNodes
        cN.splice(cN.indexOf(this), 1)
        this.#parentNode = null
    }

    contains(node: Node) {
        if (node.parentNode == this) return true
        else if(!node.parentNode) return false
        return this.contains(node.parentNode)
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

    get parentElement(): Element {
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
    #attributes: AttributeMap
    #classList: TokenList

    constructor(
        name: string,
        childNodes: Node[] = [],
        ...attributes: Attribute[]
    ) {
        super(Node.ELEMENT_NODE, name.toUpperCase(), childNodes)
        this.#attributes = new AttributeMap(...attributes)
        this.#classList = new TokenList(arr => {
            this.#attributes.set(new Attribute('class', arr.join(' ')))
        })
    }

    append(...node: (Node | string)[]) {
        for (const n of node) {
            this.appendChild(n instanceof Node ? n : new Text(n))
        }
    }

    //! Добавляет ноды в обратном порядке.
    prepend(...node: (Node | string)[]) {
        for (const n of node) {
            const firstNode = this.childNodes[0]
            const child = n instanceof Node ? n : new Text(n)
            if (firstNode) this.insertBefore(child, firstNode)
            else this.appendChild(child)
        }
    }

    before(...node: (Node | string)[]) {
        if (!this.parentElement) throw new Error('Parent element does not exist')
        for (const n of node) {
            this.parentNode.insertBefore(n instanceof Node ? n : new Text(n), this)
        }
    }

    after(...node: (Node | string)[]) {
        if (!this.parentElement) throw new Error('Parent element does not exist')
        const nextNode = this.parentElement.childNodes[this.parentElement.childNodes.indexOf(this) +1]
        for (const n of node) {
            this.parentNode.insertBefore(n instanceof Node ? n : new Text(n), nextNode)
        }
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

    get innerHTML() {
        return this.childNodes.map(v => v.toString()).join('')
    }
    set innerHTML(value) {
        this.childNodes.forEach(v => v.remove())

        parse(value).childNodes.forEach(this.appendChild)
    }

    get attributes() {
        return this.#attributes
    }

    get id() {
        return this.#attributes.get('id')?.nodeValue
    }
    set id(value: string) {
        this.#attributes.set(new Attribute('id', value))
    }

    get classList() {
        return this.#classList
    }

    get className() {
        return this.classList.value
    }
    set className(value) {
        this.classList.value = value
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

    createNode(html: string) {
        return parse(html).childNodes[0]
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
            this.#itemsMap[attr.name] = this.#items.push(attr) - 1
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

export class TokenList extends Set<string> {
    #callback: (arr :string[]) => void

    constructor(callback: (arr: string[]) => void) {
        super()
        this.#callback = callback
    }

    replace(oldToken: string, newToken: string): boolean {
        if (this.delete(oldToken)) return !!this.add(newToken)
        return false
    }

    toggle(token: string, force?: boolean): boolean {
        if (typeof force == 'boolean')
        if (force) return !!this.add(token)
        else return this.delete(token)

        if (this.delete(token)) return false
        return !!this.add(token)
    }

    add(value: string): this {
        super.add(value)
        this.#callback([...this])
        return this
    }

    delete(value: string): boolean {
        const del = super.delete(value)
        this.#callback([...this])
        return del
    }

    clear(): void {
        super.clear()
        this.#callback([])
    }

    get value() {
        return Array.from(this.values()).join(' ')
    }
    set value(value) {
        this.clear()
        value.split(' ').forEach(v => this.add(v))
    }

    get [Symbol.toStringTag]() {
        return 'TokenList'
    }
}