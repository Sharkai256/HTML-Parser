import type { SimpleDOM, Element } from './index'

const serialize = (dom: any): string => {
  //  return iterate(dom, 0)
 // return Object.getPrototypeOf(dom.childNodes[1])
 return dom.childNodes[1]
}

const iterate = (elem: Element, level: number): string => {
    let tagNames = toTag(elem, false) 
    if (!elem.children.length) return '\n' + '   '.repeat(level) + toTag(elem, false) + toTag(elem, true) 
    for (const child of elem.children) {
        
        tagNames +=  iterate(child, level + 1)
    }

    return '\n' + '   '.repeat(level) + tagNames + '\n' + '   '.repeat(level) + toTag(elem, true)

}

const toTag = (elem: Element, closed: boolean): string => '<' + (closed ? '/' : '') + elem.tagName.toLowerCase() 
+ (Object.keys(elem.attributes).length && !closed ? Object.keys(elem.attributes).reduce((total: string, value: string) => {
    return total + ` ${value}="${elem.attributes[value]}"`
},'') : '') + '>'


export default serialize
