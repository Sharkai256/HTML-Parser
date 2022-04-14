class SimpleNode {
    childNodes: SimpleNode[]
    nodeName: string
    nodeValue: string

    constructor(name: string, children: SimpleNode[] = [], value: string = null) {
        this.nodeName = name
        this.childNodes = children
        this.nodeValue = value
    }
}

class SimpleElement extends SimpleNode {
    children: SimpleElement[] = []
    attributes: {[name: string]: string}

    constructor(name: string, children: (SimpleNode | SimpleElement)[] = [], attributes: {[name: string]: string} = {}) {
        super(name.toUpperCase(), children)
        this.attributes = attributes
        this.children = <SimpleElement[]>children.filter(v => Object.getPrototypeOf(v) === SimpleElement.prototype)
    }

    get tagName() {
        return this.nodeName
    }
    set tagName(value) {
        this.nodeName = value.toUpperCase()
    }
}

class SimpleDOM extends SimpleNode {
    children: SimpleElement[]

    constructor(children: (SimpleNode | SimpleElement)[] = []) {
        super('#root', children)
        this.children = <SimpleElement[]>children.filter(v => v instanceof SimpleElement)
    }
}

const dom = new SimpleDOM([
    new SimpleNode('#comment', [], 'Start of file'),
    new SimpleNode('#doctype', [], 'html5'),
    new SimpleElement('html', [
        new SimpleElement('head', [
            new SimpleNode('#comment', [], ' Ohayo Sekai! '),
            new SimpleElement('meta', [], {
                charset: 'UTF-8'
            }),
            new SimpleElement('meta', [], {
                'http-equip': 'X-UA-Compatible',
                content: 'IE=edge'
            }),
            new SimpleElement('meta', [], {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1.0'
            }),
            new SimpleElement('title', [
                new SimpleNode('#text', [], 'Base struct + Double byte 🚀')
            ])
        ]),
        new SimpleElement('body', [
            new SimpleElement('form', [
                new SimpleElement('imput', [], {
                    type: 'text',
                    value: 'Ohayo Sekai!'
                }),
                new SimpleElement('select', [
                    new SimpleElement('option', [
                        new SimpleNode('#text', [], 'One')
                    ], {
                        value: 'one'
                    }),
                    new SimpleElement('option', [
                        new SimpleNode('#text', [], 'Two')
                    ], {
                        value: 'two'
                    }),
                    new SimpleElement('option', [
                        new SimpleNode('#text', [], 'Three')
                    ], {
                        value: 'three'
                    })
                ], {
                    id: 'my-id',
                    value: 'one',
                    required: ''
                })
            ])
        ])
    ])
])

export default dom