import serialize from './ser'

type Element = {
    tagName: string
    children: Element[]
}

export interface SimpleDOM extends Element {
    title: string
    //DOM here aswell
}

const parser = (html: string): SimpleDOM => {
    //here
    return {
        title: '',
        tagName: '',
        children: []
    }
}

parser.serialize = serialize
export default parser