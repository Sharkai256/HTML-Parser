import * as Simple from './classes';

interface Attr {
    type: 'attr';
    name: string;
    value: string;
    mod?: '^' | '$' | '*';
    ext: boolean
}

interface Class {
    type: 'class';
    name: string;
}

interface Id {
    type: 'id';
    name: string;
}

interface Pseudo {
    type: 'pseudo';
    name: string;
    form?: string;
    sel?: Tag[];
}

interface Tag {
    name: string;
    selectors: (Attr | Class | Id | Pseudo)[];
    separ?: ' ' | '>' | '~' | '+' | ',';
}

interface AttrSelector {
    name: string;
    mod?: '^' | '$' | '*';
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

const a_z = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
const A_Z = a_z.map((char) => char.toUpperCase());
const A_z = [...a_z, ...A_Z];
const O_9 = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const a_9 = [...a_z, ...O_9];

const parseSelector = (selector: string) => {
    const parse = (string: string, recursion: boolean = false): {index: number, tags: Tag[]} => {
        const SELECTOR_FIRST = 0; // [a-z\[\.#:\*]
        const SELECTOR_REST = 19; // [a-z\[\.#:>~\+\, ]
        const CLASS_FIRST = 1; // [a-z]
        const CLASS_REST = 2; // [\[\.#a-9-:>~\+\, ]
        const ID_FIRST = 3; // [a-z]
        const ID_REST = 4; // [\[\.#a-9-:>~\+\, ]
        const ATTRIBUTE_NAME_FIRST = 5; // [a-z]
        const ATTRIBUTE_NAME_REST = 6; // [a-z-\^\$\*=\]]
        const ATTRIBUTE_MOD = 7; // =
        const ATTRIBUTE_VAL_FIRST = 8; // [A-z"']
        const ATTRIBUTE_VAL_QUOTES = 9; // .
        const ATTRIBUTE_VAL_QUOTES_END = 10; // \]
        const ATTRIBUTE_VAL_NOT_QUOTES = 11; // [A-z\]]
        const PSEUDO_CLASS_FIRST = 12; // [a-z]
        const PSEUDO_CLASS_REST = 13; // [a-z-\(\.\#\[:>~\+\, ]
        const PSEUDO_CLASS_REST_FORMULA_START = 14; // [0-9n\+-]
        const PSEUDO_CLASS_REST_FORMULA_DIGIT = 15; // [0-9n\)]
        const PSEUDO_CLASS_REST_FORMULA_N = 16; // [\+-\)]
        const PSEUDO_CLASS_REST_FORMULA_ADD = 17; // [0-9]
        const SPEC = 18; // [\[\.#:>~\+\, ]

        const tags: Tag[] = [{
            name: '',
            selectors: []
        }];

        const lastTag = () => tags[tags.length - 1];
        const lastSel = () => lastTag().selectors[lastTag().selectors.length - 1];
        const err = () => {throw new Error(`'${string}' is not a valid selector`)}

        let state = SELECTOR_FIRST;
        let expectsSymbol = 0;

        string = string.trim();
        if (!string) err();
        for (let i = 0; i < string.length; i++) {
            const char = string[i];
            switch (state) {
                case SELECTOR_FIRST: // [a-z\[\.#:\*]
                    if (a_z.includes(char)) {
                        lastTag().name = char;
                        state = SELECTOR_REST;
                        continue;
                    }
                    switch (char) {
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case ')':
                            if (recursion) {
                                return {
                                    index: i,
                                    tags,
                                }
                            }
                            continue;

                        case '*':
                            state = SPEC;
                            continue;
                    }
                    err();

                case SELECTOR_REST: // [a-z\[\.#:>~\+\, ]
                    if (a_z.includes(char)){
                        lastTag().name += char;
                        continue;
                    }
                    switch (char) {
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case ' ':
                            if(lastTag().name && lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: ' '
                                })
                            }
                            continue;

                        case '>':
                        case '~':
                        case '+':
                        case ',':
                            if(!lastTag().name || !lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: char
                                })
                            }
                            else {
                                if (lastTag().separ !== ' ') err();
                                lastTag().separ = char;
                            }
                            continue;

                        case ')':
                            if (recursion) {
                                return {
                                    index: i,
                                    tags,
                                }
                            }
                            continue;
                    }
                    err();

                case ATTRIBUTE_NAME_FIRST: // [a-z]
                    if (a_z.includes(char)) {
                        lastSel().name += char;
                        state = ATTRIBUTE_NAME_REST;
                        continue;
                    }
                    err()

                case ATTRIBUTE_NAME_REST: // [a-z-\^\$\*=\]]
                    if (char == '-' || a_z.includes(char)) {
                        lastSel().name += char;
                        continue;
                    }
                    switch (char) {
                        case '=':
                            (<Attr>lastSel()).ext = true;
                            state = ATTRIBUTE_VAL_FIRST;
                            continue;
                        case '^':
                        case '$':
                        case '*':
                            (<Attr>lastSel()).ext = true;
                            (<Attr>lastSel()).mod = char;
                            state = ATTRIBUTE_MOD;
                            continue;
                        case ']':
                            expectsSymbol--;
                            state = SELECTOR_FIRST;
                            continue;
                    }
                    err();

                case ATTRIBUTE_MOD: // =
                    if (char == '=') {
                        state = ATTRIBUTE_VAL_FIRST;
                        continue;
                    }
                    err();

                case ATTRIBUTE_VAL_FIRST: // [A-z"']
                    if (A_z.includes(char)) {
                        (<Attr>lastSel()).value += char;
                        state = ATTRIBUTE_VAL_NOT_QUOTES;
                        continue;
                    }
                    if (char == "'" || char == '"') {
                        state = ATTRIBUTE_VAL_QUOTES;
                        continue;
                    }
                    err();

                case ATTRIBUTE_VAL_NOT_QUOTES: // [A-z\]]
                    if (A_z.includes(char)) {
                        (<Attr>lastSel()).value += char;
                        continue;
                    }
                    if (char == ']') {
                        expectsSymbol--;
                        state = SPEC;
                        continue;
                    }
                    err()

                case ATTRIBUTE_VAL_QUOTES: // .
                    if (char == "'" || char == '"') {
                        state = ATTRIBUTE_VAL_QUOTES_END;
                        continue;
                    }
                    (<Attr>lastSel()).value += char;
                    continue;

                case ATTRIBUTE_VAL_QUOTES_END: // \]
                    if (char == ']') {
                        expectsSymbol--;
                        state = SPEC;
                        continue;
                    }
                    err()

                case CLASS_FIRST: // [a-z]
                    if (a_z.includes(char)) {
                        (<Class>lastSel()).name += char;
                        state = CLASS_REST;
                        continue;
                    }
                    err()

                case CLASS_REST: // [\[\.#a-9-:>~\+\, ]
                    if (char == '-' || a_9.includes(char)) {
                        (<Class>lastSel()).name += char;
                        continue;
                    }
                    switch (char) {
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case ' ':
                            if(lastTag().name && lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: ' '
                                })
                            }
                            state = SPEC;
                            continue;

                        case '>':
                        case '~':
                        case '+':
                        case ',':
                            if(!lastTag().name || !lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: char
                                })
                            }
                            else {
                                if (lastTag().separ !== ' ') err();
                                lastTag().separ = char;
                            }
                            state = SELECTOR_FIRST;
                            continue;
                    }
                    err()

                case ID_FIRST: // [a-z]
                    if (a_z.includes(char)) {
                        (<Id>lastSel()).name += char;
                        state = ID_REST;
                        continue;
                    }
                    err();
                    
                case ID_REST: // [\[\.#a-9-:>~\+\, ]
                    if (char == '-' || a_9.includes(char)) {
                        (<Id>lastSel()).name += char;
                        continue;
                    }
                    switch (char) {
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case ' ':
                            if(lastTag().name && lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: ' '
                                })
                            }
                            state = SELECTOR_REST;
                            continue;

                        case '>':
                        case '~':
                        case '+':
                        case ',':
                            if(!lastTag().name || !lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: char
                                })
                            }
                            else {
                                if (lastTag().separ !== ' ') err();
                                lastTag().separ = char;
                            }
                            state = SELECTOR_FIRST;
                            continue;
                    }
                    err();
                case PSEUDO_CLASS_FIRST: // [a-z]
                    if (a_z.includes(char)) {
                        (<Pseudo>lastSel()).name += char;
                        state = PSEUDO_CLASS_REST;
                        continue;
                    }
                    err();

                case PSEUDO_CLASS_REST: // [a-z-\(\.\#\[:>~\+\, ]
                    if (char == '-' || a_z.includes(char)) {
                        (<Pseudo>lastSel()).name += char;
                        continue;
                    }
                    switch (char) {
                        case ')':
                            if (recursion) {
                                return {
                                    index: i,
                                    tags,
                                }
                            }
                            continue;
                            
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case ' ':
                            if(lastTag().name && lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: ' '
                                })
                            }
                            state = SELECTOR_REST;
                            continue;

                        case '>':
                        case '~':
                        case '+':
                        case ',':
                            if(!lastTag().name || !lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: char
                                })
                            }
                            else {
                                if (lastTag().separ !== ' ') err();
                                lastTag().separ = char;
                            }
                            state = SELECTOR_FIRST;
                            continue;

                        case '(':
                            switch ((<Pseudo>lastSel()).name) {
                                case 'nth-child':
                                case 'nth-last-child':
                                case 'nth-of-type':
                                case 'nth-last-of-type':
                                    state = PSEUDO_CLASS_REST_FORMULA_START;
                                    continue;

                                case 'not':
                                    const {index, tags: sub} = parse(string.substring(i), true);
                                    i = index;
                                    (<Pseudo>lastSel()).sel = sub;
                                    continue;

                                case 'lang': // not implemented yet
                                    continue;

                                default:
                                    err();
                            }

                        case ')':
                            if (recursion) {
                                return {
                                    index: i,
                                    tags,
                                }
                            }
                            continue;
                    }
                    err();

                case PSEUDO_CLASS_REST_FORMULA_START: // [0-9n\+-]
                    if (O_9.includes(char)) {
                        (<Pseudo>lastSel()).form += char;
                        state = PSEUDO_CLASS_REST_FORMULA_DIGIT;
                        continue;
                    }
                    switch (char) {
                        case 'n':
                            (<Pseudo>lastSel()).form += char;
                            state = PSEUDO_CLASS_REST_FORMULA_N;
                            continue;
                        case '+':
                        case '-':
                            (<Pseudo>lastSel()).form += char;
                            state = PSEUDO_CLASS_REST_FORMULA_DIGIT;
                            continue;
                    }
                    err();
                    
                case PSEUDO_CLASS_REST_FORMULA_DIGIT: // [0-9n\)]
                    if (O_9.includes(char)) {
                        (<Pseudo>lastSel()).form += char;
                        state = PSEUDO_CLASS_REST_FORMULA_DIGIT;
                        continue;
                    }
                    if (char == 'n') {
                        (<Pseudo>lastSel()).form += char;
                        state = PSEUDO_CLASS_REST_FORMULA_N;
                        continue;
                    }
                    if (char == ')') {
                        if (recursion) {
                            return {
                                index: i,
                                tags,
                            }
                        }
                        state = SELECTOR_REST;
                        continue;
                    }
                    err();

                case PSEUDO_CLASS_REST_FORMULA_N: // [\+-\)]
                    if (char == '+' || char == '-') {
                        (<Pseudo>lastSel()).form += char;
                        state = PSEUDO_CLASS_REST_FORMULA_ADD;
                        continue;
                    }
                    if (char == ')') {
                        if (recursion) {
                            return {
                                index: i,
                                tags,
                            }
                        }
                        state = SELECTOR_REST;
                        continue;
                    }
                    err();
                    
                case PSEUDO_CLASS_REST_FORMULA_ADD: // [0-9]
                    if (O_9.includes(char)) {
                        (<Pseudo>lastSel()).form += char;
                        state = SELECTOR_REST;
                        continue;
                    }
                    err();
                
                case SPEC: // [\[\.#:>~\+\, ]
                    switch (char) {
                        case '[':
                            lastTag().selectors.push({
                                type: 'attr',
                                name: '',
                                value: '',
                                ext: false
                            })
                            expectsSymbol++;
                            state = ATTRIBUTE_NAME_FIRST;
                            continue;

                        case '.':
                            lastTag().selectors.push({
                                type: 'class',
                                name: ''
                            })
                            state = CLASS_FIRST;
                            continue;

                        case '#':
                            lastTag().selectors.push({
                                type: 'id',
                                name: ''
                            })
                            state = ID_FIRST;
                            continue;

                        case ':':
                            lastTag().selectors.push({
                                type: 'pseudo',
                                name: ''
                            })
                            state = PSEUDO_CLASS_FIRST;
                            continue;

                        case '>':
                        case '~':
                        case '+':
                        case ',':
                            if(!lastTag().name || !lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: char
                                })
                            }
                            else {
                                if (lastTag().separ !== ' ') err();
                                lastTag().separ = char;
                            }
                            state = SELECTOR_FIRST;
                            continue;

                        case ' ':
                            if(lastTag().name && lastTag().selectors.length) {
                                tags.push({
                                    name: '',
                                    selectors: [],
                                    separ: ' '
                                })
                            }
                            state = SELECTOR_REST;
                            continue;
                    }
                    err();
            }
            err();
        }
        if (expectsSymbol) {
            err()
        }
        return {index: -1, tags};
    }

    const res = parse(selector);
    if (!res) return null;

    const transform = (tags: Tag[]): TagSelector[] => {
        if (!tags) return null
        const selectors = [];
        for (const item of tags) {
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
                        tag.attributes.push({
                            name: sel.name,
                            value: sel.ext ? sel.value : null,
                            mod: sel.mod
                        });
                        break;
                    case 'class':
                        tag.class.push(sel.name)
                        break;
                    case 'id':
                        if (tag.id) throw new Error(`Two id occurences in selector  [${tag.id}]`);
                        tag.id = sel.name;
                        break;
                    case 'pseudo':
                        tag.pseudo.push({
                            name: sel.name,
                            value: sel.name
                        })
                        break;
                }
            }
            tag.id = tag.id || '*'
            selectors.push(tag)
        }
        return selectors;
    }
    return transform(res.tags)
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

    const check = (iter: Simple.Element, filter: TagSelector) => {
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
                    break;

                case '*':
                    if (!attr.value.includes(obj.value)) return false;
                    break;

                case '^':
                    if (!attr.value.startsWith(obj.value)) return false;
                    break;

                default:
                    if (attr.value !== obj.value) return false;
            }
        }

        return true;
    }

    let resArr: Simple.Element[] = [];
    filter = filter.reverse();

    const recSearch = (currElem: Simple.Element): Simple.Element => {
        for (const child of currElem.children) {
            if (check(child, filter[0])) {
                let iter = child;
                for (let i = 1; i < filter.length; i++) {
                    iter = iter.parentElement;
                    if (!iter || !check(iter, filter[i])) {
                        iter = null;
                        break;
                    }
                }
                if (iter) resArr.push(iter);
            }
            if (!moreThanOne && resArr.length > 0) return;
            recSearch(child);
        }
    }

    recSearch(this);
    return resArr;
    
}

export = querySelector;