import fs from 'fs'
import parser from './index'

/**
 * Type for any iterable object
 */
type Iterable = {[key: string | number]: any}

/**
 * Recursively iterates through first object and checks if all it's properties present in second. Throws error and path if not
 */
const iterateObject = (testobj: Iterable, retobj: Iterable, trace: string) => {
    for (const key in testobj) {
        const testval = testobj[key]
        const retval = retobj[key]
        // Traces path of recurse iterations
        const newTrace = trace + (Number.isNaN(+key) ? '.' + key : '[' + key + ']')

        switch (typeof testval) {
            case 'boolean':
            case 'number':
            case 'string':
                if (typeof testval !== typeof retval) throw new Error('Types do not match\n' + 'Trace - ' + newTrace)
                if (testval != retval) throw new Error('Values do not match\n' + 'Trace - ' + newTrace)
                break
            case 'object':
                if ((typeof testval !== typeof retval) || (Array.isArray(testval) !== Array.isArray(retval))) throw new Error('Types do not match\n' + 'Trace - ' + newTrace)
                iterateObject(testval, retval, newTrace)
                break
            default:
                // This should never happen. If it does, report issue to developer
                throw new Error('Unexpected behavior')
        }
    }

    return true
}

/**
 * Actual tester code. Accepts file name for test
 */
const test = (name: number | string) => {
    let fullTime = Date.now()

    const html = fs.readFileSync(`tests/${name}.html`).toString().replace(/\r\n/g, '\n')

    let state = '\x1b[31mErr: Test not found'
    let parsed = {}
    let parseTime = Date.now()
    try {
        parsed = parser(html)
    } catch (err) {
        state = '\x1b[31mErr: Parser returned error\n' + err
    }
    parseTime = Date.now() - parseTime
    fullTime = Date.now() - fullTime

    if (fs.existsSync(`tests/${name}.json`) && state == '\x1b[31mErr: Test not found') {
        const json = JSON.parse(fs.readFileSync(`tests/${name}.json`).toString())
        try {
            iterateObject(json, parsed, 'root')
            state = '\x1b[32mPassed'
        } catch (err) {
            state = `\x1b[31mErr: ${(<Error>err).message}`
        }
    }
    if (fs.existsSync(`tests/${name}.js`) && (state == '\x1b[31mErr: Test not found' || state == '\x1b[32mPassed')) {
        try {
            const tester = require('./tests/2')
            state = tester(parsed)
        } catch (err) {
            state = '\x1b[31mErr: Test execution failed\n' + err
        }
    }

    return `Test #${name}
          \rState - \x1b[1m${parseTime > 5 && !state.startsWith('\x1b[31m') ? '\x1b[33mTime exceeded' : state}\x1b[0m
          \rFull elapsed time - \x1b[1m\x1b[36m${fullTime}\x1b[0m
          \rParse elapsed time - \x1b[1m${parseTime <= 5 ? '\x1b[32m' : '\x1b[31m'}${parseTime}\x1b[0m`
}

const testArr = new Array(2).fill(null).map((v, i) => test(i + 1))

console.log(testArr.join('\n\n'))