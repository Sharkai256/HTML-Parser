module.exports = dom => {
    const inp1 = dom.querySelector?.('input')
    const inp2 = dom.querySelector?.('[type]')
    const inp3 = dom.querySelector?.('[type=text]')
    const inp4 = dom.querySelector?.('[type="text"]')
    if (inp1?.getAttribute('value') !== 'Ohayo Sekai!') return '\x1b[31mErr: Selector by tag name failed'
    if (inp2?.getAttribute('value') !== 'Ohayo Sekai!') return '\x1b[31mErr: Selector by attribute\'s presence failed'
    if (inp3?.getAttribute('value') !== 'Ohayo Sekai!') return '\x1b[31mErr: Selector by attribute value without quotes failed'
    if (inp4?.getAttribute('value') !== 'Ohayo Sekai!') return '\x1b[31mErr: Selector by attribute value with quotes failed'
    const sel = dom.getElementById?.('my-id')
    if (sel?.getAttribute('value') !== 'one') return '\x1b[31mErr: ID Selector failed'
    if (typeof sel.getAttribute('value') === 'undefined') return '\x1b[31mErr: Empty attribute is not present'
    return '\x1b[32mPassed'
}