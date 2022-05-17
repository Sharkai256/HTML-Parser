import serialize from './ser'
import parse from './index'
import { create } from 'domain';

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
                    checkForSpec(char, () => {
                        throw new Error(`Invalid character after "()" [${char}]`)
                    })
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
                        tag.attributes.push({name, mod: <'*'>mod, value});
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
    let filter = parseSelector(selector);
    if (!filter) return null;
    /*
    for (const pseudo of filter[0].pseudo) {
        switch(pseudo.name) {
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

        for (const elem of filter.class) {
            if (!iter.classList.contains(elem)) return false;
        }

        label1: for (const obj of filter.attributes) {
            const attr = iter.attributes.get(obj.name)

            if (!attr) return false;

            if (typeof obj.value == "string")
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
        if (check(currElem, filter[0])) {
            let iter = currElem;
            for (let i = 1; i < filter.length; i++) {
                iter = iter.parentElement;
                if (!iter || !check(iter, filter[i])) {
                    iter = null;
                    break;
                }
            }
            if (iter) resArr.push(iter);
        }
        for (const child of currElem.children) {
            if (!moreThanOne && resArr.length > 0) return;
            recSearch(child);
        }
    }

    recSearch(this);
    return resArr;
}

interface JSONode {
    type?: string
    name?: string
    value?: string
    childNodes?: JSONode[]
    attributes?: JSONode[]
    params?: any[]
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

    cloneNode(deep: boolean = true) {

        const deepCheck = (): Node[] => {
            let childArr = [];
            if (deep) {
                for (const child of this.childNodes) {
                    childArr.push(child.cloneNode())
                }
            }
            return childArr;
        }

        switch (+this) {
            case Node.ELEMENT_NODE:
                let elem = new Element(this.nodeName, deepCheck())
                for (const attr of (<Element>(<unknown>this)).attributes) {
                    elem.setAttribute(attr.name, attr.value)
                }
                if (this instanceof SingleTag) {
                    elem = new SingleTag(this.nodeName, true);
                    for (const attr of (<SingleTag>(<unknown>this)).attributes) {
                        elem.setAttribute(attr.name, attr.value)
                    }
                }
                return elem;

            case Node.ATTRIBUTE_NODE:
                return new Attribute(this.nodeName, this.nodeValue);

            case Node.TEXT_NODE:
                return new Text(this.nodeValue);

            case Node.CDATA_SECTION_NODE:
                return new CDATA(this.nodeName);

            case Node.PROCESSING_INSTRUCTION_NODE:
                return new ProcessingInstruction(this.nodeName, this.nodeValue);

            case Node.COMMENT_NODE:
                return new Comment(this.nodeValue);

            case Node.DOCUMENT_NODE:
                return new DOM(deepCheck());

            case Node.DOCUMENT_TYPE_NODE:
                return new DocumentType(this.nodeName);
        }
    }

    replaceChild(newChild: Node, oldChild: Node) {
        if (oldChild.parentNode != this) throw new Error('OldChild is not a child of this element')
        if (newChild.contains(this)) throw new Error('Child node can not contain parent node')

        this.insertBefore(newChild, oldChild)
        oldChild.remove()
    }

    remove() {
        if (!this.#parentNode) return

        const cN = this.#parentNode.#childNodes
        cN.splice(cN.indexOf(this), 1)
        this.#parentNode = null
    }

    contains(node: Node) {
        if (node.parentNode == this) return true
        else if (!node.parentNode) return false
        return this.contains(node.parentNode)
    }

    toJSON(): string {
        const createObj = (node: Node): JSONode => {
            switch (+node) {
                case Node.ELEMENT_NODE:
                    const elem: JSONode = {
                        type: 'element',
                        name: node.nodeName,
                        childNodes: node.childNodes.map(v => createObj(v)),
                        attributes: [...(<Element>node).attributes].map(v => createObj(v))
                    }
                    if (node instanceof SingleTag) {
                        elem.type = 'singletag'
                        elem.params = [node.endClosed]
                    }
                    return elem;

                case Node.ATTRIBUTE_NODE:
                    return {
                        name: node.nodeName,
                        value: node.nodeValue
                    }

                case Node.TEXT_NODE:
                    return {
                        type: 'text',
                        value: node.nodeValue.replace(/\r/g, '')
                    }

                case Node.CDATA_SECTION_NODE:
                    return {
                        type: 'cdata',
                        name: node.nodeName
                    }

                case Node.PROCESSING_INSTRUCTION_NODE:
                    return {
                        type: 'proc',
                        name: node.nodeName,
                        value: node.nodeValue
                    }

                case Node.COMMENT_NODE:
                    return {
                        type: 'comment',
                        value: node.nodeValue
                    }

                case Node.DOCUMENT_NODE:
                    const res: JSONode[] = [];
                    for (const child of node.childNodes) {
                        res.push(createObj(child))
                    }
                    return {
                        type: 'document',
                        childNodes: res
                    }

                case Node.DOCUMENT_TYPE_NODE:
                    return {
                        type: 'doctype',
                        name: node.nodeName
                    }
            }
        }
        return JSON.stringify(createObj(this))
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
    #classList: ClassList
    #style: StyleList

    constructor(
        name: string,
        childNodes: Node[] = [],
        ...attributes: Attribute[]
    ) {
        super(Node.ELEMENT_NODE, name.toUpperCase(), childNodes)
        this.#attributes = new AttributeMap(this, ...attributes)
        this.#style = new StyleList(this)
        this.#classList = new ClassList(this)
    }

    append(...nodes: (Node | string)[]) {
        for (const n of nodes) {
            this.appendChild(n instanceof Node ? n : new Text(n))
        }
    }

    //! Позволяет найти элемент, на котором был вызван метод.
    //! Ошибочный запрос '' воспринимет как '*'.
    //! Ошибочный запрос '[value=one' воспринимет как '[value=one]'.
    //! Ошибочный запрос '[value=on]e' воспринимет как '[value=one]'.
    //! Принимает неопределённое количество символов '*' как валидный запрос.
    //! Не работают модификаторы сравнения аттрибутов.
    //? Добавить функционал группировки.
    //? Обобщить ошибки парсинга селектора до "'%selector%' is not a valid selector".
    querySelector(selector: string): Element {
        return querySelector.call(this, selector, false)?.[0]
    }

    querySelectorAll(selector: string): Element[] {
        return querySelector.call(this, selector, true)
    }

    prepend(...nodes: (Node | string)[]) {
        const firstNode = this.childNodes[0]
        for (const n of nodes) {
            const child = n instanceof Node ? n : new Text(n)
            if (firstNode) this.insertBefore(child, firstNode)
            else this.appendChild(child)
        }
    }

    before(...nodes: (Node | string)[]) {
        if (!this.parentElement) throw new Error('Parent element does not exist')
        for (const n of nodes) {
            this.parentNode.insertBefore(n instanceof Node ? n : new Text(n), this)
        }
    }

    after(...nodes: (Node | string)[]) {
        if (!this.parentElement) throw new Error('Parent element does not exist')
        const nextNode = this.parentElement.childNodes[this.parentElement.childNodes.indexOf(this) +1]
        for (const n of nodes) {
            this.parentNode.insertBefore(n instanceof Node ? n : new Text(n), nextNode)
        }
    }

    replaceWith(...nodes: (Node | string)[]) {
        if (!nodes.length) return this.remove()
        let node = nodes.pop()
        node = node instanceof Node ? node : new Text(node)
        this.parentElement.replaceChild(node, this)
        for (const n of nodes) {
            node.parentNode.insertBefore(n instanceof Node ? n : new Text(n), node)
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

    //! Если аттрибут существует, и метод был вызван с force=true, значение не должно исчезать.
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

    get style(): StyleList {
        return new Proxy(this.#style, {
            get(target, key) {
                let ownProp = target[key]
                if (typeof ownProp == 'function') ownProp = (<Function>ownProp).bind(target)
                return ownProp ?? target.getPropertyValue(key.toString())
            },
            set(target, key, value) {
                if (key == 'cssText') target.cssText = value?.toString()
                else target.setProperty(key.toString(), value?.toString())
                return true
            },
            ownKeys(target) {
                return Object.keys(target)
            }
        })
    }
    set style(value: any) {
        this.#style.cssText = value
    }

    get dataset(): {[key: string]: string} {
        return new Proxy({
            kk: 'one'
        }, {
            get: (target, key) => {
                return this.getAttribute('data-' + key.toString().replace(/[A-Z]/g, m => '-' + m.toLowerCase()))
            },
            set: (target, key, value) => {
                this.setAttribute('data-' + key.toString().replace(/[A-Z]/g, m => '-' + m.toLowerCase()), value)
                return true
            },
            ownKeys: () => {
                const arr = []
                for (const attr of this.#attributes) {
                    if (attr.name.startsWith('data-')) arr.push(attr.name)
                }
                return arr
            }
        })
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

    createScript(code: string, defer?: boolean, async?: boolean): Element
    createScript(options: { code: string, defer?: boolean, async?: boolean }): Element
    createScript(options: string | { code: string, defer?: boolean, async?: boolean }, defer?: boolean, async?: boolean) {
        if (typeof options == 'object') {
            var code = options.code
            defer = options.defer
            async = options.async
        } else code = options

        const script = new Element('SCRIPT', [
            new Text(code)
        ])

        if (defer) script.setAttribute('defer', '')
        if (async) script.setAttribute('async', '')

        return script
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
    constructor(name: string, value: string) {
        super(Node.ATTRIBUTE_NODE, name, [], value)
    }

    appendChild() {
        throw new Error('Attribute can not have children')
    }

    get name() {
        return this.nodeName
    }

    get value() {
        return this.nodeValue
    }
}

export class AttributeMap implements Iterable<Attribute> {
    #element: Element
    #itemsMap: {[name: string]: Attribute} = {}

    constructor(element: Element, ...attributes: Attribute[]) {
        this.#element = element

        for (const attr of attributes) {
            this.set(attr)
        }
    }

    set(attr: Attribute) {
        if (this.#element.classList)
            switch (attr.name) {
                case 'style':
                    this.#element.style.cssText = attr.value
                    break
                case 'class':
                    this.#element.classList.value = attr.value
            }
        this.#itemsMap[attr.name] = attr
    }

    get(name: string) {
        return this.#itemsMap[name]
    }

    remove(name: string) {
        switch (name) {
            case 'style':
                this.#element.style.cssText = ''
                break
            case 'class':
                this.#element.classList.value = ''
        }
        delete this.#itemsMap[name]
    }

    item(index: number) {
        return Object.values(this.#itemsMap)[index]
    }

    get length() {
        return Object.values(this.#itemsMap).length
    }

    get [Symbol.iterator]() {
        return () => {
            let index = 0
            const arr = Object.values(this.#itemsMap)

            return {
                next: () => index < arr.length
                ? {
                    value: arr[index++],
                    done: false
                }
                : {
                    done: true
                }
            } as Iterator<Attribute>
        }
    }
}

export class ClassList implements Iterable<string> {
    #elem: Element
    #classList: string[] = []

    #getClass() {
        return this.#elem.getAttribute('class')
    }

    #fillList(line: string) {
        if (line && line !== '')
            for (const name of line.split(' '))
                this.#classList.push(name)
    }

    #updateAttr() {
        this.#elem.setAttribute('class', this.value)
    }

    constructor(element: Element) {
        this.#elem = element

        this.#fillList(this.#getClass())
    }

    add(value: string) {
        this.#classList.push(value)
        this.#updateAttr()
        return this
    }

    remove(value: string) {
        const i = this.#classList.indexOf(value)
        if (i != -1) {
            this.#classList.splice(i, 1)
            this.#updateAttr()

            return true
        }
        return false
    }

    clear() {
        this.#classList = []
        this.#updateAttr()
    }

    contains(token: string) {
        return this.#classList.includes(token)
    }

    replace(oldToken: string, newToken: string) {
        const i = this.#classList.indexOf(oldToken)
        if (i != -1) {
            this.#classList.splice(i, 1, newToken)
            this.#updateAttr()

            return true
        }
        return false
    }

    toggle(token: string, force?: boolean) {
        if (force ?? !this.#classList.includes(token)) {
            return !!this.add(token)
        } else {
            !this.remove(token)
            return false
        }
    }

    item(index: number) {
        return this.#classList[index]
    }

    keys() {
        return this.#classList.keys()
    }

    values() {
        return this.#classList.values()
    }

    entries() {
        return this.#classList.entries()
    }

    forEach(callback: (currentValue: string, currentIndex: number, listObj: string[]) => never, thisArg: any = this) {
        for (let i = 0; i < this.#classList.length; i++) {
            callback.call(thisArg, this.#classList[i], i, [...this.#classList])
        }
    }

    get value() {
        return this.#classList.join(' ')
    }
    set value(value) {
        if (value == this.value) return
        this.#classList = value.split(' ')
        this.#updateAttr()
    }

    get length() {
        return this.#classList.length
    }

    get [Symbol.iterator]() {
        return () => {
            let index = 0
            const line = this.#getClass()
            const arr = (line && line !== '') ? line.split(' ') : []

            return {
                next: () => index < arr.length
                ? {
                    value: arr[index++],
                    done: false
                }
                : {
                    done: true
                }
            } as Iterator<string>
        }
    }
}

export class StyleList implements Iterable<string> {
    #elem: Element
    #styleMap: {[key: string]: string} = {}

    #fillMap(value: string) {
        for (const line of value.split(';')) {
            const [, name, value] = /^\s*([a-z-]+)\s*:\s*(.+?)?\s*$/.exec(line) ?? [null, null, null]
            if (!value) continue
            this.#styleMap[name] = value
        }
    }

    #updateAttr() {
        this.#elem.setAttribute('style', this.cssText)
    }

    #formatName = (name: string) => name?.replace(/[A-Z]/g, m => '-' + m.toLowerCase())

    constructor(element: Element) {
        this.#elem = element

        const style = this.#elem.getAttribute('style')
        if (!style) return

        this.#fillMap(style)
    }

    getPropertyValue(name: string) {
        name = this.#formatName(name)
        return this.#styleMap[name]
    }

    setProperty(name: string, value: string) {
        if (!value || !/\S/.test(value)) return this.removeProperty(name)
        name = this.#formatName(name)
        this.#styleMap[name] = value
        this.#updateAttr()
    }

    removeProperty(name: string) {
        name = this.#formatName(name)
        delete this.#styleMap[name]
        this.#updateAttr()
    }

    item(index: number) {
        return Object.values(this.#styleMap)[index]
    }

    get cssText() {
        return Object.entries(this.#styleMap).map(([k, v]) => `${k}:${v}`).join(';')
    }
    set cssText(value) {
        if (value == this.cssText) return
        this.#styleMap = {}
        this.#fillMap(value)
        this.#updateAttr()
    }

    get length() {
        return Object.keys(this.#styleMap).length
    }

    get [Symbol.iterator]() {
        return () => {
            let index = 0
            const arr = Object.keys(this.#styleMap)

            return {
                next: () => index < arr.length
                ? {
                    value: arr[index++],
                    done: false
                }
                : {
                    done: true
                }
            } as Iterator<string>
        }
    }

    [key: string | symbol]: any
}