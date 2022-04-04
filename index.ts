import serialize from './ser'

type Element = {
    tagName: string
    children: Element[]
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
        children: []
        // Your DOM here
    }
}

parser.serialize = serialize
export default parser