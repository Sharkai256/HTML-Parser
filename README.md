# HTML PS (HTML ⇄ DOM)

This module takes HTML string as input and produces simplified DOM which then, after being changed can be serialized back.

## Installation

You can install it with [npm](https://www.npmjs.com/):

```
npm i http-php
```

## Example

```JS
const fs = require('fs')
const parser = require('html-parser')

const html = fs.readFileSync('index.html').toString()
const dom = parser(html)

dom.title = 'New Title'

console.log(dom.serialize())
```