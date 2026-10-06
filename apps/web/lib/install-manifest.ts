// account-from-the-terminal · Sprint 1, Story 1.1 — `install.md`, the page an agent reads BEFORE it
// installs anything (epic D1).
//
// ── Why this is generated, and from what ──────────────────────────────────────────────────────
// Every command on the page is a constant from `lib/install-prompt.ts` (the plugin) or
// `lib/cli-install.ts` (the `gf` CLI) — the same constants `/install` renders — so the page cannot
// describe an install the site does not show. Pure and env-free: the route passes `getSiteUrl()`.
//
// ── The claims on it are exact, and the tests hold them to that ──────────────────────────────
// "Which services it contacts" is a list a careful founder will check against their firewall log.
// `INSTALL_SERVICES` is the whole list, the page renders exactly it, and
// `install-manifest.test.ts` asserts every host named anywhere on the page is in it. Adding a host
// to the prose without adding it here goes red.

import { CLI_BIN, CLI_GLOBAL_INSTALL, CLI_NPX_INIT, CLI_NPX_LOGIN, CLI_PACKAGE } from './cli-install'
import {
  PLUGIN_INSTALL,
  PLUGIN_MARKETPLACE_ADD,
  PLUGIN_REMOVE,
  SKILLS_ADD,
  SKILLS_REPO_URL,
  UMBRELLA_SKILL_URL,
} from './install-prompt'

export type InstallService = { host: string; when: string }

export function installServices(siteUrl: string): InstallService[] {
  return [
    {
      host: 'github.com',
      when: 'to download the plugin (its skills are plain Markdown and scripts in a public repo)',
    },
    {
      host: 'registry.npmjs.org',
      when: '`npx skills` (other agents), the planning kit the skills run with `npx`, and the optional `gf` CLI',
    },
    {
      host: new URL(siteUrl).host,
      when: 'only once you sign in: `gf login`, `gf init` and reading your flags',
    },
  ]
}

export function installManifest(siteUrl: string): string {
  const services = installServices(siteUrl)
    .map((service) => `- **${service.host}** — ${service.when}.`)
    .join('\n')

  return `# Installing Golden Frijoles

Read this before installing anything. It says what installs, what changes on this machine, which
services it contacts and how to remove it. Nothing below runs until you, or your agent with your
go-ahead, runs it.

## What installs

1. **The golden-frijoles plugin** (required). Skills that plan, build and review work in your repo.
   Source: ${SKILLS_REPO_URL} — read the entry skill first if you like: ${UMBRELLA_SKILL_URL}
2. **The \`${CLI_BIN}\` CLI** (optional, \`${CLI_PACKAGE}\`). Only if you want an account: feature
   flags you can roll out and turn off, and outcome reports. Planning works without it.

## How, per agent

**Claude Code** — two commands:

\`\`\`
${PLUGIN_MARKETPLACE_ADD}
${PLUGIN_INSTALL}
\`\`\`

**Any other agent** (Codex, Cursor, anything \`npx skills\` supports) — one command, then pick your agent:

\`\`\`
${SKILLS_ADD}
\`\`\`

Use one method, not both. Then run the golden-frijoles skill and start its setup.

**The CLI, only if you want an account:**

\`\`\`
${CLI_NPX_LOGIN}
${CLI_NPX_INIT}
\`\`\`

(or install it once: \`${CLI_GLOBAL_INSTALL}\`)

## What changes on this machine

- **Claude Code:** the plugin is cached under \`~/.claude/plugins/\`.
- **Other agents:** \`npx skills\` copies the skills into \`.agents/skills/\` (or your agent's own skills
  folder) and records them in \`skills-lock.json\`.
- **In this project, during setup:** a \`Roadmap/\` folder (your plans, as Markdown) and
  \`golden-frijoles.config.json\` (setup's answers). Both are plain files in your repo — review them in git.
- **Only after you sign in:** \`${CLI_BIN} login\` saves a CLI token to
  \`~/.config/golden-frijoles/credentials.json\` (mode 0600); \`${CLI_BIN} init\` writes \`.env.local\` in this
  project and refuses if git would commit it.

Nothing else: no background service, no shell profile edits, no global npm packages unless you run
\`${CLI_GLOBAL_INSTALL}\` yourself.

## Which services it contacts

${services}

That is the whole list for installing and planning. Some optional features contact the service you
connect them to, and only after you switch them on: GitHub through your own \`gh\` (pull requests and
reviews), Telegram, Slack or Notion (status updates). Spend telemetry is off unless you turn it on.
Without an account, nothing is sent to ${new URL(siteUrl).host}.

## How to remove it

- **Claude Code:** \`${PLUGIN_REMOVE}\`
- **Other agents:** \`npx skills remove\` and pick golden-frijoles.
- **The CLI:** \`${CLI_BIN} logout\`, then revoke its token at ${siteUrl}/app/setup/cli.
- **This project:** delete \`Roadmap/\` and \`golden-frijoles.config.json\` if you don't want them — they are yours.
`
}
