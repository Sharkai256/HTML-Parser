import * as Simple from './classes';

const fromJSON = (json: string | Simple.JSONode): Simple.Node => {
    let obj: Simple.JSONode
    if (typeof json == 'string') obj = JSON.parse(json)
    else obj = json

    const parseNode = (json: Simple.JSONode): Simple.Node => {
        const children: Simple.Node[] = []
        const attr: Simple.Attribute[] = []
        switch (json.type) {
            case 'element':
                for (const child of json.childNodes) {
                    children.push(parseNode(child))
                }

                for (const attribute of json.attributes) {
                    attr.push(<Simple.Attribute>parseNode(attribute))
                }
                return new Simple.Element(json.name, children, ...attr)
                
            case 'singletag':
                for (const attribute of json.attributes) {
                    attr.push(<Simple.Attribute>parseNode(attribute))
                }
                return new Simple.SingleTag(json.name, json.params[0], ...attr)

            case 'attr':
                return new Simple.Attribute(json.name, json.value)

            case 'text':
                return new Simple.Text(json.value)

            case 'cdata':
                return new Simple.CDATA(json.name)

            case 'proc':
                return new Simple.ProcessingInstruction(json.name, json.value)

            case 'comment':
                return new Simple.Comment(json.value)

            case 'document':
                for (const child of json.childNodes) {
                    children.push(parseNode(child))
                }
                return new Simple.DOM(children)

            case 'doctype':
                return new Simple.DocumentType(json.name)
        }
    }
    
    return parseNode(obj)
}

const parse = (html: string): Simple.DOM => {
    var tags: Simple.Node[] = [];
    var inTag = false;
    var escape = false;
    var buffer = '';
    label1: for (const char of html) {
        if (char === escape)
            escape = 0;
        if (char == '>' && !escape) {
            inTag = false;
            if (buffer[0] == '!') {
                if (/!\[CDATA\[.*\]\]/s.test(buffer)) {
                    tags.push(new Simple.CDATA(buffer.substring(8, buffer.length - 2)));
                } else if (/!--.*--/s.test(buffer)) {
                    tags.push(new Simple.Comment(buffer.substring(3, buffer.length - 2)));
                } else if (/!DOCTYPE .*/s.test(buffer)) {
                    tags.push(new Simple.DocumentType(buffer.substring(9)));
                }
            } else if (buffer[0] == '?') {
                const array = /\?([a-z]+)\s(.*)\s\?/s.exec(buffer);
                tags.push(new Simple.ProcessingInstruction(array[1], array[2]));
            } else {
                if (buffer[0] == '/') {
                    buffer = buffer.substring(1);
                    var array = [];
                    for (let i = tags.length - 1; i >= 0; i--) {
                        const item = tags[i];
                        if (item instanceof Simple.SingleTag && item.nodeName == buffer.toUpperCase()) {
                            let atrArr = [];
                            for (let j = 0; j < item.attributes.length; j++) {
                                atrArr.push(item.attributes.item(j));
                            }
                            tags[i] = new Simple.Element(buffer, array.reverse(), ...atrArr);
                            buffer = '';
                            continue label1;
                        } else {
                            array.push(tags.pop());
                        }
                    }
                    throw new Error(`Invalid HTML input (No opening tag) [${buffer}]`);
                }
                const sIndx = buffer.indexOf(' ');
                let name = buffer;
                let atrArr = [];
                if (sIndx != -1) {
                    name = buffer.substring(0, sIndx);
                    const atr = buffer.substring(sIndx);
                    atrArr = atr.match(/[a-z-]+(=('.+?'|".+?"|\S+))?/g).map(v => {
                        const [, atrName, atrValue] = /([a-z-]+)(?:=(.+))?/.exec(v);
                        if (typeof atrValue == 'undefined') return new Simple.Attribute(atrName, '');
                        if (atrValue[0] != '"' && atrValue[0] != "'") return new Simple.Attribute(atrName, atrValue);
                        return new Simple.Attribute(atrName, atrValue.substring(1, atrValue.length - 1));
                    });
                }
                tags.push(new Simple.SingleTag(name, buffer[buffer.length - 1] == '/', ...atrArr));
            }
            buffer = '';
        }
        if (inTag) {
            if (escape === 0) escape = false;
            else if ((char === '"' || char === "'") && !escape) escape = char;
            buffer += char;
        }
        if (char == '<' && !escape) {
            inTag = true;
            buffer = buffer.substring(1);
            if (buffer.length) {
                tags.push(new Simple.Text(buffer));
            }
            buffer = '';
        }
        if (!inTag) {
            buffer += char;
        }
    }

    return new Simple.DOM(tags);
}

parse.fromJSON = fromJSON

export = parse;
