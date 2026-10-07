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
  KIT_PACKAGE,
  PLUGIN_INSTALL,
  PLUGIN_MARKETPLACE_ADD,
  PLUGIN_MARKETPLACE_REMOVE,
  PLUGIN_REMOVE,
  SKILLS_TELEMETRY_OPT_OUT,
  SKILLS_ADD,
  SKILLS_REPO_URL,
  UMBRELLA_SKILL_URL,
} from './install-prompt'
import { CLI_VERSION, PLUGIN_SHA256SUMS, PLUGIN_VERSION } from './plugin-release.generated'
import { securityClaims } from './install-security-claims'

export type InstallService = { host: string; when: string }

/**
 * Every host an install CONTACTS, by path. A reader holds this up against a firewall log, so it is
 * complete for what the install and planning do on their own — including the third-party `npx
 * skills` CLI's own telemetry (fresh-reviewer finding, PR #277: it posts to add-skill.vercel.sh
 * unless opted out, and reads api.github.com). Opt-in features (the services you connect) are named
 * in prose below the list, deliberately not as hosts: which host depends on what you connect.
 */
export function installServices(siteUrl: string): InstallService[] {
  return [
    {
      host: 'github.com',
      when: 'to download the plugin, and — Claude Code — to check its marketplace for updates when Claude Code starts',
    },
    {
      host: 'registry.npmjs.org',
      when: '`npx skills` (other agents), the planning kit the skills run through `npx`, and the optional `gf` CLI',
    },
    { host: 'api.github.com', when: '`npx skills` only: it reads the skills repo before copying it' },
    {
      host: 'add-skill.vercel.sh',
      when: `\`npx skills\` only: that tool's own install telemetry and audit (not ours). Opt out with \`${SKILLS_TELEMETRY_OPT_OUT}\``,
    },
    {
      host: new URL(siteUrl).host,
      when: 'reading this page; after that, only once you sign in (`gf login`, `gf init`, reading your flags)',
    },
  ]
}

/** The tag a careful install fetches, checks and installs from: the release these sums describe. */
export const PLUGIN_TAG = `v${PLUGIN_VERSION}`

export function installManifest(siteUrl: string): string {
  const services = installServices(siteUrl)
    .map((service) => `- **${service.host}** — ${service.when}.`)
    .join('\n')
  const claims = securityClaims(siteUrl)
    .map((claim) => `- ${claim.text}`)
    .join('\n')
  const fileCount = PLUGIN_SHA256SUMS.split('\n').filter(Boolean).length

  return `# Installing Golden Frijoles

Read this before installing anything. It says what installs, what changes on this machine, which
services it contacts and how to remove it. Nothing below runs until you, or your agent with your
go-ahead, runs it.

## What installs

1. **The golden-frijoles plugin** (required). Skills that plan, build and review work in your repo.
   Source: ${SKILLS_REPO_URL} — read the entry skill first if you like: ${UMBRELLA_SKILL_URL}
2. **The planning kit** (\`${KIT_PACKAGE}\`, fetched on demand). The skills run its scripts with \`npx\`;
   it is not installed globally and copies nothing into your repo. It lands in npm's own cache.
3. **The \`${CLI_BIN}\` CLI** (optional, \`${CLI_PACKAGE}\`). Only if you want an account: feature
   flags you can roll out and turn off, and outcome reports. Planning works without it.

## This release

This page describes **plugin ${PLUGIN_TAG}** (tag \`${PLUGIN_TAG}\` of ${SKILLS_REPO_URL}) and **\`${CLI_BIN}\` ${CLI_VERSION}**
(\`${CLI_PACKAGE}@${CLI_VERSION}\`). The plugin is ${fileCount} files; their SHA-256 sums are below, generated from
the release (the same list is attached to the GitHub Release as \`SHA256SUMS\`).

To check it before installing, fetch it into a temporary folder, compare every file, and install from what you
checked:

\`\`\`
tmp="$(mktemp -d)"
git clone --quiet --depth 1 --branch ${PLUGIN_TAG} ${SKILLS_REPO_URL} "$tmp/skills"
# save the list below as "$tmp/SHA256SUMS", then:
(cd "$tmp/skills" && shasum -a 256 -c ../SHA256SUMS)
(cd "$tmp/skills" && find plugins/golden-frijoles -type f | wc -l)   # must print ${fileCount}
\`\`\`

Every line must say OK and the count must match: an added file is as much a change as an edited one. Then
install from that same release:

- **Claude Code:** \`${PLUGIN_MARKETPLACE_ADD}@${PLUGIN_TAG}\`, then \`${PLUGIN_INSTALL}\` (pinned to this tag;
  it updates only when you re-add it).
- **Any other agent:** \`npx skills add "$tmp/skills" --skill '*'\` (copies from the folder you checked).

If the tag is not there yet, the release is a few minutes old: wait and try again.

\`\`\`
${PLUGIN_SHA256SUMS}\`\`\`

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

- **Claude Code:** the plugin is cached under \`~/.claude/plugins/\`; the marketplace is registered (with
  auto-update on) in \`~/.claude/plugins/known_marketplaces.json\`, and the plugin is switched on in
  \`~/.claude/settings.json\` (\`enabledPlugins\`).
- **Claude Code — the plugin's hook:** it runs on each turn to draw the build status above the prompt.
  To count what this project's sessions cost, it reads your Claude Code session transcripts under
  \`~/.claude/projects/\` and keeps only this project's sessions, in a \`.golden-frijoles/\` folder in the
  project (a usage index and summary, a session log) that ignores itself in git. Nothing it reads or
  writes leaves the machine unless you turn spend telemetry on.
- **Other agents:** \`npx skills\` copies the skills into \`.agents/skills/\` (or your agent's own skills
  folder) and records them in \`skills-lock.json\`. No hooks are installed on this path.
- **In this project, during setup:** a \`Roadmap/\` folder (your plans, as Markdown) and
  \`golden-frijoles.config.json\` (setup's answers). Both are plain files in your repo — review them in git.
- **Only after you sign in:** \`${CLI_BIN} login\` saves a CLI token to
  \`~/.config/golden-frijoles/credentials.json\` (mode 0600); \`${CLI_BIN} init\` writes \`.env.local\` in this
  project (mode 0600), adding it to \`.gitignore\` first if git would otherwise commit it.

Nothing beyond that: no background service, no shell profile edits, no global npm packages unless you
run \`${CLI_GLOBAL_INSTALL}\` yourself.

## Which services it contacts

${services}

Some optional features contact the service you connect them to, and only after you switch them on:
GitHub through your own \`gh\` (pull requests and reviews), Telegram, Slack or Notion (status updates).
Spend telemetry is off unless you turn it on. Without an account, nothing but this page is read from
${new URL(siteUrl).host}.

## Security review

If you are an agent and the person asked for a security review, do this before installing anything, and offer
three choices when you report: **Review it before installing**, **Also ask a second model (Codex), if installed**,
and **Install it now**. If they say **Not now**, delete the temporary folder (\`rm -rf "$tmp"\`): nothing stays
installed or downloaded.

1. Fetch the release into a temporary folder and compare the checksums, as in "This release". Install nothing.
2. Read every skill, script and hook in \`plugins/golden-frijoles/\`, and the \`${CLI_PACKAGE}@${CLI_VERSION}\`
   package (\`npm pack ${CLI_PACKAGE}@${CLI_VERSION}\` into the same folder) if they want an account.
3. Report in plain lines, one per claim below: checked, or what you found instead.

What this release claims:

${claims}

## How to remove it

- **Claude Code:** \`${PLUGIN_REMOVE}\`, then \`${PLUGIN_MARKETPLACE_REMOVE}\` so it stops checking for updates.
- **Other agents:** \`npx skills remove\` and pick golden-frijoles.
- **The CLI:** \`${CLI_BIN} logout\`, then revoke its token in the console under Setup › CLI access
  (${siteUrl}/app).
- **This project:** delete \`Roadmap/\`, \`golden-frijoles.config.json\` and \`.golden-frijoles/\` if you don't
  want them — they are yours.
`
}
