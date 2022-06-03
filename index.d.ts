import * as Simple from './classes';
declare const parse: {
    (html: string): Simple.DOM;
    fromJSON: (json: string | Simple.JSONode) => Simple.Node;
};
export = parse;
