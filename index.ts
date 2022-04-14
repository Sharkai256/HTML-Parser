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
    //DOM here aswell
}

const parser = (html: string): SimpleDOM => {
    //here
    //yes, it's not working properly, im trying to figure out the solution, chill
    var tag = '';
    var inTag: boolean;
    var title = '';
    for (const item of html) {
        if(item == '<'){
            inTag=true;
        }
        if(inTag){
            tag+=item;
            if(item == '>'){
                inTag=false;
            }
            
        }
        if(item !== '>' && !inTag){
            title+=item;
        }
    }
    console.log('tag is: ', tag);
    console.log('title is: ', title);
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