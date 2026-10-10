// A first-run welcome owned by the Golden Frijoles CLI. Keep it off stdout: --json is a protocol.
const LETTERS = [
  '███████╗██████╗ ██╗     ██╗ ██████╗ ██╗     ███████╗███████╗',
  '██╔════╝██╔══██╗██║     ██║██╔═══██╗██║     ██╔════╝██╔════╝',
  '█████╗  ██████╔╝██║     ██║██║   ██║██║     █████╗  ███████╗',
  '██╔══╝  ██╔══██╗██║██   ██║██║   ██║██║     ██╔══╝  ╚════██║',
  '██║     ██║  ██║██║╚█████╔╝╚██████╔╝███████╗███████╗███████║',
  '╚═╝     ╚═╝  ╚═╝╚═╝ ╚════╝  ╚═════╝ ╚══════╝╚══════╝╚══════╝',
] as const

const GREEN = '\x1b[38;2;127;208;105m'
const OLIVE = '\x1b[38;2;142;166;78m'
const GOLD = '\x1b[38;2;232;185;60m'
const GHOST = '\x1b[38;2;85;75;60m'
const RESET = '\x1b[0m'

export const REVEAL_WIDTH = Math.max(...LETTERS.map((line) => [...line].length))

/** A fixed-height frame so the terminal can redraw in place without scrolling. */
export function revealFrame(ripeness: 0 | 1 | 2, sweep: number, color: boolean): string {
  const tint = [GREEN, OLIVE, GOLD][ripeness]
  const bean = ['◜·◝', '◜◡◝', '◜✦◝'][ripeness]
  const label = ['green bean', 'ripening…', 'golden frijol'][ripeness]
  const head = color ? `${tint}${bean}  ${label}${RESET}` : `${bean}  ${label}`
  const banner = LETTERS.map((line) => {
    if (!color) return line
    const chars = [...line]
    const cut = Math.max(0, Math.min(chars.length, sweep))
    return `${GOLD}${chars.slice(0, cut).join('')}${GHOST}${chars.slice(cut).join('')}${RESET}`
  })
  return [head, '', ...banner, '', 'GOLDEN FRIJOLES  ·  Plan · build · run with context'].join('\n')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type RevealOptions = {
  enabled: boolean
  noMotion: boolean
  noColor: boolean
  env: NodeJS.ProcessEnv
  width: number
  write: (text: string) => void
}

export async function playSetupReveal(options: RevealOptions): Promise<void> {
  if (!options.enabled) return
  const { env, write } = options
  const compact = options.width < REVEAL_WIDTH + 2 || env.TERM === 'dumb'
  if (compact) {
    write('✦ FRIJOLES ✦\n')
    return
  }
  const color = !options.noColor && env.NO_COLOR === undefined
  const staticOnly = options.noMotion || options.noColor || env.NO_COLOR !== undefined || env.FRIJOLES_NO_MOTION === '1' || env.CI !== undefined
  if (staticOnly) {
    write(`${revealFrame(2, REVEAL_WIDTH, color)}\n`)
    return
  }
  const frames: Array<[0 | 1 | 2, number, number]> = [
    [0, 0, 170], [1, 0, 170], [2, 0, 120],
    ...Array.from({ length: 9 }, (_, index) => [2, Math.ceil(((index + 1) / 9) * REVEAL_WIDTH), 65] as [2, number, number]),
  ]
  const height = revealFrame(0, 0, color).split('\n').length
  write('\x1b[?25l')
  try {
    for (const [index, [ripeness, sweep, delay]] of frames.entries()) {
      const frame = revealFrame(ripeness, sweep, color)
      write(`${index === 0 ? '' : `\x1b[${height}A`}${frame.split('\n').map((line) => `\x1b[2K${line}`).join('\n')}\n`)
      await sleep(delay)
    }
  } finally {
    write('\x1b[?25h')
  }
}
