import * as Simple from './classes'

const serialize = (dom: Simple.Node): string => {
    return iterate(dom, 0)
}

const iterate = (elem: Simple.Node, level: number): string => {
    switch (elem.nodeType) {
        case Simple.Node.ELEMENT_NODE:
            return toTag(<Simple.Element>elem, false)
            + elem.childNodes.reduce((t, v) => t + iterate(v, level + 1), '')
            + toTag(<Simple.Element>elem, true)

        case Simple.Node.TEXT_NODE:
            return elem.nodeValue

        case Simple.Node.COMMENT_NODE:
            return '<!--' + elem.nodeValue + '-->'

        case Simple.Node.DOCUMENT_NODE:
            return elem.childNodes.reduce((t, v) => t + iterate(v, 0), '')

        case Simple.Node.DOCUMENT_TYPE_NODE:
            return '<!DOCTYPE ' + elem.nodeName + '>'

        default:
            return '<!-- Err: Undefined Node Type -->'
    }
}

const toTag = (elem: Simple.Element, closed: boolean): string => {
    let ret = '<'
    if (closed) ret += '/'
    ret += elem.tagName.toLowerCase()

    if (!closed) {
        for (let i = 0; i < elem.attributes.length; i++) {
            ret += ' ' + elem.attributes.item(i)
        }
    }

    return ret + '>'
}

export default serialize