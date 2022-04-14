import type {SimpleDOM, SimpleElement, SimpleNode} from './serv'

const serialize = (dom: SimpleDOM): string => {
    return iterate(dom, 0)
}

const iterate = (elem: SimpleNode, level: number): string => {
    let ret: string[] = []
    if (elem.nodeName == '#comment') {
        ret.push('   '.repeat(level) + '<!--' + elem.nodeValue + '-->')
    }
    else if (elem.nodeName == '#doctype') {
        ret.push('<!DOCTYPE ' + elem.nodeValue + '>')  
    }
    else if (elem.nodeName == '#text'){
        ret.push(elem.nodeValue)
    }
    else if (elem.nodeName == '#root'){
        for (const child of elem.childNodes) {
            ret.push(iterate(child, 0))
        }
    }
    else{
         
        if ((<SimpleElement>elem).children.length) {
            ret.push('   '.repeat(level) + toTag(<SimpleElement>elem, false))
            for (const child of elem.childNodes) {

                ret.push(iterate(child, level + 1))
            }
            ret.push('   '.repeat(level) + toTag(<SimpleElement>elem, true))
        }
        else{
            ret.push('   '.repeat(level) + toTag(<SimpleElement>elem, false) + elem.childNodes.reduce((total, value) => total + iterate(value, level + 1), '') + toTag(<SimpleElement>elem, true))
        }
        
    }
    
    return ret.join('\n') 
}

const toTag = (elem: SimpleElement, closed: boolean): string => '<' + (closed ? '/' : '') + elem.tagName.toLowerCase() 
+ (Object.keys(elem.attributes).length && !closed ? Object.keys(elem.attributes).reduce((total: string, value: string) => {
    return total + ` ${value}="${elem.attributes[value]}"`
},'') : '') + '>'


export default serialize
