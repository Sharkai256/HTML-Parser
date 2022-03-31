import fs = require('fs')
import parser = require('./index')

const file = fs.readFileSync('tests/test1.html').toString()

console.time('test')
const dom = parser(file)
console.timeEnd('test')

console.log(dom)