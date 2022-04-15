import * as Simple from './classes'

export default (html: string): Simple.DOM => {
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
    
    console.log('tag is: ', tag); // ⤵
    console.log('title is: ', title); // Move this to run.ts

    return new Simple.DOM() // Your DOM here
}