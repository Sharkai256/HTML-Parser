import serialize from './ser'
import parse from './index'

type NodeType = 1 | 2 | 3 | 4 | 7 | 8 | 9 | 10

interface Selector {
    type: 'class' | 'id' | 'attr' | 'pseudo';
    value: string;
    sub?: string;
}

interface Tag {
    name: string;
    selectors: Selector[];
    separ?: ' ' | '>' | '~' | '+' | ',';
}

interface AttrSelector {
    name: string;
    mod: "^" | "$" | "*";
    value: string;
}

interface PseudoSelector {
    name: string;
    value?: string
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
                            lastSel().sub = buffer;
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
                        tag.attributes.push({name, mod:<'*'>mod, value});
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
                            value: sel.sub
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

function querySelector(selector: string, moreThanOne: boolean = false) {
    
    const equals = (array1: string[], array2: string[]) => {
        if (!array2)
            return false;
        if (array1.length != array2.length)
            return false;
        for (var i = 0, l=array1.length; i < l; i++) {          
            if (array1[i] != array2[i]) { 
                return false;
            }       
        } 
        return true;
    }

    let filter = parseSelector(selector);
    if(!filter) return null;
    /*
    for (const pseudo of filter[0].pseudo) {
        switch(pseudo.name){
            case 'first-child':
                if (this.parentElement.children[0] !== this) {
                    flag = false;
                    break;
                } 
                break;
            case 'last-child':
                if (this.parentElement.children[this.parentElement.children.length - 1] !== this) {
                    flag = false;
                    break;
                }
                break;
            // I'm not gonna do math OMEGALUL
            // case 'nth-child':
            //      const index = this.parentElement.children.indexOf(this) + 1;
            //      if (index % pseudo.value == 0) {
            //          flag = false;
            //          break;
            //      }
            //     break;
            // case 'nth-last-child':
            //     break;
            // case 'nth-of-type':
            //     break;
            // case 'nth-last-of-type':
            //     break;
            case 'only-child':
                if (this.parentElement.children[0] !== this && this.parentElement.children.length !== 1) {
                    flag = false;
                    break;
                }
                break;
            // I'll add this functionallity later, not promise
            // case 'first-of-type':
            //     break;
            // case 'last-of-type':
            //     break;
            // case 'only-of-type':
            //     break;
            // case 'not':
            //     break;
            default:
                break;
        }
    }
    */

    const check = (iter: Element, filter: TagSelector) => {
        if (filter.name !== '*' && iter.tagName !== filter.name.toUpperCase()) return false;
        if (filter.id !== '*' && iter.id !== filter.id) return false;
        if (!equals([...iter.classList], filter.class)) return false;
        label1: for (const obj of filter.attributes) {
            const attr = iter.attributes.get(obj.name)
            if (!attr) return false;    
            if (typeof obj.value !== "string" && !attr) return false;
            switch (obj.mod) {
                case '$':
                    if (!attr.value.endsWith(obj.value)) return false;
                case '*':
                    if (!attr.value.includes(obj.value)) return false;
                case '^':
                    if (!attr.value.startsWith(obj.value)) return false;
                default:
                    if (attr.value !== obj.value) return false;
            }
        }
        return true;
    }

    let resArr: Element[] = [];
    filter = filter.reverse();
    const recSearch = (currElem: Element): Element => {
        if(check(currElem, filter[0])) {
            let iter = currElem;
            for (let i=1; i < filter.length; i++) {
                iter = iter.parentElement;
                if (!iter || !check(iter, filter[i])) {
                    iter = null;
                    break;
                }
            }
            if(iter) resArr.push(iter);
        }
        for (const child of currElem.children) {
            if (!moreThanOne && resArr.length > 0) return;
            recSearch(child);
        }
    }
    recSearch(this);
    return resArr;
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

    insertBefore(newNode: Node, referenceNode: Node) {
        if (newNode.contains(this)) throw new Error('Child node can not contain parent node')
        if (newNode instanceof Attribute) throw new Error('Attribute can not be inserted')
        if (newNode instanceof DOM) throw new Error('DOM can not be inserted')
        newNode.remove()
        newNode.#parentNode = this
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
    #style: StringMap
    #dataset: StringMap

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
        this.#style = new StringMap(arr => {
            this.#attributes.set(new Attribute('style', arr.map(v => v[0].replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + ':' + v[1]).join(';')))
        })
        this.#dataset = new StringMap((arr, state, keys, val) => {
            switch (state) {
                case 'clear':
                    for (const key of keys) {
                        this.#attributes.remove('data-' + key.replace(/[A-Z]/g, m => '-' + m.toLowerCase()))    
                    } 
                    break
                case 'delete':
                    this.#attributes.remove('data-' + keys[0].replace(/[A-Z]/g, m => '-' + m.toLowerCase()))
                    break
                case 'set':
                    this.#attributes.set(new Attribute('data-' + keys[0].replace(/[A-Z]/g, m => '-' + m.toLowerCase()), val))
            }
        })
    }

    append(...node: (Node | string)[]) {
        for (const n of node) {
            this.appendChild(n instanceof Node ? n : new Text(n))
        }
    }

    querySelector(selector: string): Element {
        return querySelector.call(this, selector, false)?.[0]
    }

    querySelectorAll(selector: string): Element[] {
        return querySelector.call(this, selector, true)
    }
    
    prepend(...node: (Node | string)[]) {
        const firstNode = this.childNodes[0]
        for (const n of node) {
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

    replaceWith(...node: (Node | string)[]) {
        if(!node.length) return this.remove()
        let nod = node.pop()
        nod = nod instanceof Node ? nod : new Text(nod)
        this.parentElement.replaceChild(nod, this)
        for (const n of node) {
            nod.parentNode.insertBefore(n instanceof Node ? n : new Text(n), nod)
        }    
    }

    setAttribute(name: string, value: string) {
        this.#attributes.set(new Attribute(name, value))
    }

    getAttribute(name: string) {
        return this.#attributes.get(name)?.value
    }

    removeAttribute(name: string) {
        this.#attributes.remove(name)
    }

    toggleAttribute(name: string, force?: boolean) {
        if (typeof force == 'boolean')
        if (force) this.setAttribute(name, '')
        else this.removeAttribute(name)

        else if (this.hasAttribute(name)) this.removeAttribute(name)
        else this.setAttribute(name, '')
    }

    hasAttribute(name: string) {
        return !!this.#attributes.get(name)
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

    get style() {
        return this.#style
    }

    get dataset() {
        return this.#dataset
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

    get title() {
        const head = this.head
        if (!head) return null
        for (const child of head.children) {
            if (child.tagName == 'TITLE') {
                return child.innerText
            }
        }
        return ''
    }
    set title(value) {
        const head = this.head
        if (!head) return
        for (const child of head.children) {
            if (child.tagName == 'TITLE') {
                child.innerText = value
                return
            }
        }
        head.appendChild(new Element('TITLE', [
            new Text(value)
        ]))
    }

    get head() {
        const html = this.documentElement
        if (!html) return null
        for (const child of html.children) {
            if (child.tagName == 'HEAD') return child
        }
    }

    get body() {
        const html = this.documentElement
        if (!html) return null
        for (const child of html.children) {
            if (child.tagName == 'BODY') return child
        }
    }

    get nodeType() {
        return Node.DOCUMENT_NODE
    }

    get doctype() {
        for (const node of this.childNodes) {
            if (node instanceof DocumentType) return node
        }
    }
    
    get documentElement() {
        for (const elem of this.children) {
            if (elem.tagName == 'HTML') return elem
        }
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
    #itemsMap: {[name: string]: Attribute} = {}

    constructor(...attributes: Attribute[]) {
        for (const attr of attributes) {
            this.set(attr)
        }
    }

    set(attr: Attribute) {
        this.#itemsMap[attr.name] = attr
    }

    get(name: string) {
        return this.#itemsMap[name]
    }

    remove(name: string) {
        delete this.#itemsMap[name]
    }

    item(index: number) {
        return Object.values(this.#itemsMap)[index]
    }

    get length() {
        return Object.values(this.#itemsMap).length
    }
}

export class TokenList extends Set<string> {
    #callback: (arr: string[]) => void

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

export class StringMap implements Map<string, string> {
    [key: string | symbol]: any

    private _callback: (arr: [string, string][], state: 'set' | 'clear' | 'delete', key?: string[], val?: string) => void
    private _map = new Map<string, string>()

    constructor(callback: (arr: [string, string][], state: 'set' | 'clear' | 'delete', key?: string[], val?: string) => void) {
        this._callback = callback
        return new Proxy(this, {
            get: (target, key) => target[key] ?? target.get(key.toString()),
            set: (target, key, value) => !!target.set(key.toString(), value),
            ownKeys: (target) => [...target.keys()]
        })
    }
    
    clear(): void {
        const keys = [...this.keys()]
        this._map.clear()
        this._callback([...this], 'clear', keys)
        return 
    }

    delete(key: string): boolean {
        const del = this._map.delete(key)
        this._callback([...this], 'delete', [key])
        return del
    }

    entries(): IterableIterator<[string, string]> {
        return this._map.entries()
    }

    forEach(callbackfn: (value: string, key: string, map: Map<string, string>) => void, thisArg?: any): void {
        return this._map.forEach(callbackfn, thisArg)
    }

    get(key: string): string {
        return this._map.get(key)
    }

    has(key: string): boolean {
        return this._map.has(key)
    }

    keys(): IterableIterator<string> {
        return this._map.keys()
    }

    set(key: string, value: string): this {
        this._map.set(key, value)
        this._callback([...this], 'set', [key], value)
        return this
    }

    values(): IterableIterator<string> {
        return this._map.values()
    }

    get size() {
        return this._map.size
    }

    get [Symbol.iterator]() {
        return () => this.entries()
    }

    get [Symbol.toStringTag]() {
        return 'StringMap'
    }
}