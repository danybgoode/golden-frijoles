import { test } from 'node:test'
import assert from 'node:assert/strict'
import { playSetupReveal, REVEAL_WIDTH, revealFrame } from './setup-reveal.ts'

test('the final frame reveals the approved FRIJOLES lettering and bean transition', () => {
  const green = revealFrame(0, 0, true)
  const gold = revealFrame(2, REVEAL_WIDTH, true)
  assert.match(green, /green bean/)
  assert.match(gold, /golden frijol/)
  assert.match(gold, /███████╗██████╗/)
  assert.ok(green.includes('\x1b[38;2;85;75;60m'), 'unrevealed letters begin dim')
  assert.ok(!gold.includes('\x1b[38;2;85;75;60m████'), 'sweep reaches the end')
})

test('no-motion, no-color and narrow terminals stay readable without cursor control', async () => {
  for (const mode of [
    { width: 80, noMotion: true, noColor: false },
    { width: 80, noMotion: false, noColor: true },
    { width: 35, noMotion: false, noColor: false },
  ]) {
    let output = ''
    await playSetupReveal({
      enabled: true,
      env: {},
      ...mode,
      write: (text) => {
        output += text
      },
    })
    assert.match(output, /FRIJOLES/)
    assert.ok(!output.includes('\x1b[?25l'))
    assert.ok(!output.includes('\x1b[2K'))
  }
})

test('machine mode calls no writer', async () => {
  let output = ''
  await playSetupReveal({
    enabled: false,
    noMotion: false,
    noColor: false,
    env: {},
    width: 80,
    write: (text) => {
      output += text
    },
  })
  assert.equal(output, '')
})

test('animated frames sweep to gold without hiding the shell cursor', async () => {
  const writes: string[] = []
  await playSetupReveal({
    enabled: true,
    noMotion: false,
    noColor: false,
    env: { TERM: 'xterm-256color' },
    width: 80,
    write: (text) => writes.push(text),
  })
  assert.equal(writes.length, 12)
  assert.match(writes[0], /green bean/)
  assert.match(writes.at(-1)!, /golden frijol/)
  assert.ok(writes.some((frame) => frame.includes('\x1b[38;2;85;75;60m')))
  assert.ok(writes.every((frame) => !frame.includes('\x1b[?25l')))
  assert.ok(writes.every((frame) => !frame.includes('\x1b[?25h')))
})
