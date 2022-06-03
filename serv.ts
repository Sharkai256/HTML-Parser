import * as Simple from './src/classes'

export default new Simple.DOM([
    new Simple.Comment('Start of file'),
    new Simple.Text('\n'),
    new Simple.DocumentType('html'),
    new Simple.Text('\n'),
    new Simple.Element('html', [
        new Simple.Text('\n'),
        new Simple.Element('head', [
            new Simple.Text('\n    '),
            new Simple.Comment(' Ohayo Sekai! '),
            new Simple.Text('\n    '),
            new Simple.SingleTag('meta', false, new Simple.Attribute('charset', 'UTF-8')),
            new Simple.Text('\n    '),
            new Simple.SingleTag('meta', false, new Simple.Attribute('http-equip', 'X-UA-Compatible'), new Simple.Attribute('content', 'IE=edge')),
            new Simple.Text('\n    '),
            new Simple.SingleTag('meta', false, new Simple.Attribute('name', 'viewport'), new Simple.Attribute('content', 'width=device-width, initial-scale=1.0')),
            new Simple.Text('\n    '),
            new Simple.Element('title', [
                new Simple.Text('Base struct + Double byte 🚀')
            ]),
            new Simple.Text('\n')
        ]),
        new Simple.Text('\n'),
        new Simple.Element('body', [
            new Simple.Text('\n    '),
            new Simple.Element('form', [
                new Simple.Text('\n        '),
                new Simple.SingleTag('input', true, new Simple.Attribute('type', 'text'), new Simple.Attribute('value', 'Ohayo Sekai!')),
                new Simple.Text('\n        '),
                new Simple.Element('select', [
                    new Simple.Text('\n            '),
                    new Simple.Element('option', [
                        new Simple.Text('One')
                    ], new Simple.Attribute('value', 'one')),
                    new Simple.Text('\n            '),
                    new Simple.Element('option', [
                        new Simple.Text('Two')
                    ], new Simple.Attribute('value', 'two')),
                    new Simple.Text('\n            '),
                    new Simple.Element('option', [
                        new Simple.Text('Three')
                    ], new Simple.Attribute('value', 'three')),
                    new Simple.Text('\n        '),
                ], new Simple.Attribute('id', 'my-id'), new Simple.Attribute('value', 'one'), new Simple.Attribute('required', '')),
                new Simple.Text('\n    ')
            ]),
            new Simple.Text('\n')
        ]),
        new Simple.Text('\n')
    ])
])