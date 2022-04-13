import serialize from './ser'

export type Element = {
    tagName: string
    children: Element[]
}

export interface SimpleDOM extends Element {
    title: string
}

const string = '<h2>juice</h2>';

//i should try something different than this
const parser = (html: string): SimpleDOM => {
    console.log(string);
    return {
        title: `${string.slice(string.indexOf('j'), string.lastIndexOf('e')+1)}`,
        tagName: ``,
        children: []
    }
}

//when this would be working i will run tests
const res = parser(string);
console.log(res);
parser.serialize = serialize
export default parser