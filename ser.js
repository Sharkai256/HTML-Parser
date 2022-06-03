"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
const Simple = __importStar(require("./classes"));
const serialize = (dom) => {
    return iterate(dom);
};
const iterate = (elem) => {
    switch (+elem) {
        case Simple.Node.ELEMENT_NODE:
            return toTag(elem, false)
                + (elem instanceof Simple.SingleTag
                    ? ''
                    : elem.childNodes.map(iterate).join('')
                        + toTag(elem, true));
        case Simple.Node.ATTRIBUTE_NODE:
            return `${elem.nodeName}="${elem.nodeValue}"`;
        case Simple.Node.TEXT_NODE:
            return elem.nodeValue;
        case Simple.Node.CDATA_SECTION_NODE:
            return `<![CDATA[${elem.nodeName}]]>`;
        case Simple.Node.PROCESSING_INSTRUCTION_NODE:
            return `<?${elem.nodeName} ${elem.nodeValue} ?>`;
        case Simple.Node.COMMENT_NODE:
            return `<!--${elem.nodeValue}-->`;
        case Simple.Node.DOCUMENT_NODE:
            return elem.childNodes.map(iterate).join('');
        case Simple.Node.DOCUMENT_TYPE_NODE:
            return `<!DOCTYPE ${elem.nodeName}>`;
        default:
            return '<!-- Err: Undefined Node Type -->';
    }
};
const toTag = (elem, closed) => {
    let ret = '<';
    if (closed)
        ret += '/';
    ret += elem.tagName.toLowerCase();
    if (!closed) {
        for (let i = 0; i < elem.attributes.length; i++) {
            ret += ' ' + elem.attributes.item(i);
        }
    }
    if (elem.endClosed) {
        ret += '/';
    }
    return ret + '>';
};
module.exports = serialize;
