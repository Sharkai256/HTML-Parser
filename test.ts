import fs = require('fs')
import parser = require('./index')

const file = fs.readFileSync('tests/test1.html').toString()

const dom = parser(file)

console.log(dom)