# Video wave 1: three cuts (traffic relaunch)

Three formats, one week, so we learn which one works: **a shocking number** (1), **pure visuals** (2), **a product
demo** (3). Vertical 9:16, burned-in captions, the hook inside 1.5 s, 30–45 s each. Post each one to TikTok, Reels and
Shorts; recut the best one for LinkedIn and X with a voice-over.

Every clip links to its own URL, so `events count landing_visited --by utm_content` credits it:
`https://goldenfrijoles.com/?utm_source=<tiktok|instagram|youtube|linkedin|x>&utm_medium=video&utm_campaign=wave1&utm_content=<clip id>`

Read the results at **72 hours** and at **7 days**. Retire the weakest format, and make three variants of the best one.

---

## Clip 1: `analytics-4-vs-287`: "Our analytics saw 4 visitors. We had 287."

**Why it works:** every founder with a cookie banner has this problem and doesn't know it. A real, checkable number.
**Facts (keep them exact):** Microsoft Clarity recorded **4 sessions** in the 30 days to 3 Nov 2026. Our own first-party
counter recorded **287 landing visits** in the 30 days to 4 Nov. The cause: GA4 and Clarity waited for a "yes" on a
cookie banner, everywhere, and almost nobody clicks yes. (Units differ, sessions vs page visits, so say "visitors" in
speech and keep both numbers on screen.)

| Time | Picture | Words (founder to camera, or voice-over) |
|---|---|---|
| 0–1.5 s | Clarity dashboard, the number **4** circled | "Our analytics said four people visited our site last month." |
| 1.5–6 s | Cut to the terminal: `events count landing_visited --days 30` → **287** | "Our own counter said two hundred and eighty-seven." |
| 6–15 s | The cookie banner, a cursor hovering, nobody clicks | "The difference? A cookie banner. GA and Clarity waited for a yes. Almost nobody says yes." |
| 15–28 s | A world map: EU, UK, CH, BR, CA lit; the rest dark | "So now we only ask where the law requires it, Europe, the UK, Switzerland, Brazil, Canada, and count our own visits everywhere, without third-party cookies." |
| 28–38 s | The terminal: `--by utm_source` table | "And every visit knows where it came from. Including this video." |
| 38–42 s | End card: goldenfrijoles.com | "Check your own numbers." |

**On-screen text (first frame):** `4 vs 287`
**Caption:** Our analytics were missing almost everyone. Here's why, and the fix.
**Shots to capture:** the Clarity dashboard (30 days), `npx -y @golden-frijoles/cli events count landing_visited --days 30`
run in a clean terminal, the banner on the live site from a German VPN, the `--by utm_source` table.
**Not legal advice:** say "where the law requires it", never "you don't need consent".

---

## Clip 2: `screensavers`: "My coding agent has screensavers."

**Why it works:** pure visual, no context needed, and nobody else has it. It also feeds the screensavers bet (target:
more unique cloners of `golden-frijoles/skills`).
**Facts:** the Golden Frijoles Claude Code plugin plays text-art pieces (96 one-ink, plus 15 colour) in its build-view
band when the session goes quiet: after 3 minutes idle, or 9 minutes while the agent works. Never during your own turn.

| Time | Picture | Words |
|---|---|---|
| 0–1.5 s | A full-screen piece mid-animation in a real terminal | (text) "my coding agent has screensavers" |
| 1.5–20 s | Fast cuts: 6–8 pieces, 2–3 s each, synced to music | (no speech; music) |
| 20–30 s | Pull back: the band above a real Claude Code session, the agent working | "They play while Claude Code works. Golden Frijoles plugin." |
| 30–35 s | The two install lines | `claude plugin marketplace add golden-frijoles/skills` · `claude plugin install golden-frijoles@golden-frijoles` |

**Caption:** Claude Code, but with screensavers. One plugin.
**Shots to capture:** record the terminal at native resolution in a dark theme, with a large font so it reads on a phone.
**⚠️ Check first:** the colour pieces' look on a real terminal is still owed (the earlier colour "scenes" were rejected
because a 256-colour table washed them grey). Record on a truecolor terminal, and lead with the one-ink pieces if in doubt.

---

## Clip 3: `ab-test-60s`: "My agent launched an A/B test in 60 seconds."

**Why it works:** the demo IS the product. Shows the agent doing PM work, not just writing code.
**Facts:** the commands are the CLI's own (`frijoles flags …`, `frijoles experiments …`). A test can start at any
traffic level. Don't claim a result in 60 seconds: the test *starts* in 60 seconds; results take traffic.

| Time | Picture | Words |
|---|---|---|
| 0–1.5 s | A stopwatch at 0:00 over the terminal | "Watch my agent launch an A/B test." |
| 1.5–10 s | Prompt to Claude Code: "test a shorter headline on the landing, measure sign-ups" | "I asked for one thing." |
| 10–40 s | The agent runs, sped up: `frijoles flags create landing_headline_b --enablement --all-envs` → `frijoles experiments create --flag landing_headline_b --metric signup_started` → `frijoles experiments start landing_headline_b` | "It made the flag, set the metric, and started the test. From the terminal." |
| 40–50 s | Stopwatch stops (under 1:00); `frijoles experiments show landing_headline_b` shows "running" | "Under a minute. Now it collects the evidence." |
| 50–55 s | End card | "Golden Frijoles. Plan, ship, and prove it worked." |

**Caption:** Your agent can build anything. Can it tell you if it worked?
**Shots to capture:** a real run on the golden-frijoles project, using a real copy idea we actually want to test (it
doubles as the next landing test). Speed the agent's thinking up 4–8×, and keep the commands readable.

---

## Posting checklist
- [ ] Golden Frijoles handles on TikTok, Instagram, YouTube and LinkedIn (and X), added to Buffer (a paid plan or a second organisation: the current one is Miyagi's free plan, 3 channels full).
- [ ] One link per clip and platform, with `utm_content` = the clip id above.
- [ ] Post on Tue/Wed/Thu, morning US Central.
- [ ] At 72 h: `npx -y @golden-frijoles/cli events count landing_visited --days 3 --by utm_content --project golden-frijoles`.
