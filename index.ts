import serialize from './ser'

export type Element = {
    tagName: string
    children: Element[]
    innerText: string
    innerHTML: string
    attributes: any
}

export interface SimpleDOM extends Element {
    title: string
    // DOM here aswell
}

const parser = (html: string): SimpleDOM => {
    // Your code here
    return {
        title: '',
        tagName: 'k',
        children: [],
        innerText: 'gfggffg',
        innerHTML: 'gffgfgfg',
        attributes: {}
        // Your DOM here
    }
}

parser.serialize = serialize
export default parser