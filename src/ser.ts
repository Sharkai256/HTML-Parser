import * as Simple from './classes'

const serialize = (dom: Simple.Node): string => {
    return iterate(dom)
}

const iterate = (elem: Simple.Node): string => {
    switch (+elem) {
        case Simple.Node.ELEMENT_NODE:
            return toTag(<Simple.Element>elem, false)
            + (elem instanceof Simple.SingleTag
                ? ''
                : elem.childNodes.map(iterate).join('')
                + toTag(<Simple.Element>elem, true))

        case Simple.Node.ATTRIBUTE_NODE:
            return `${elem.nodeName}="${elem.nodeValue}"`

        case Simple.Node.TEXT_NODE:
            return elem.nodeValue

        case Simple.Node.CDATA_SECTION_NODE:
            return `<![CDATA[${elem.nodeName}]]>`

        case Simple.Node.PROCESSING_INSTRUCTION_NODE:
            return `<?${elem.nodeName} ${elem.nodeValue} ?>`

        case Simple.Node.COMMENT_NODE:
            return `<!--${elem.nodeValue}-->`

        case Simple.Node.DOCUMENT_NODE:
            return elem.childNodes.map(iterate).join('')

        case Simple.Node.DOCUMENT_TYPE_NODE:
            return `<!DOCTYPE ${elem.nodeName}>`

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

    if ((<Simple.SingleTag>elem).endClosed) {
        ret += '/'
    }

    return ret + '>'
}

export default serialize