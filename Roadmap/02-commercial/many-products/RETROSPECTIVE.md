# Many products — Retrospective

_Closed: 2026-10-14_
_Intent: yes_
_Quote vs actual: $15–33 (M, n=23, p25–p75) → ≈$61.25 (+86% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$56.66 (architect: every auth/tenancy/migration story, all fixes) · claude-sonnet-5-5 ≈$4.59 (builders: S1.5, S2.1 console + S2.3, S2.5, S3) · reviewers: verifier (×6, same family), agy gpt-oss/gemini (general ×6, security ×1 landed), vibe (402 all day), codex excluded by the product owner · prose: the architect — the run cost about 2× the top of the quote because three verifier rounds each found a real defect that needed a fix + re-review, and two account limits forced resumptions._

## What shipped
- **S1 · Products, headlessly** — #356 (`7755438`). One product per signup, not per person (`from_signup` + the same-name
  partial index, safe in either order); `createProductForUser` in the caller's own workspace; `POST /api/v1/cli/projects
  { slug }` creates (already-yours / conflict / invalid; a product-scoped token can't make siblings); login mints an
  account-wide token (the approve page asks for no product and says how many it reaches); `frijoles init --project |
  --create` binds the repo (`project.slug` in golden-frijoles.config.json, announced on every command); **+ New product**
  in the console. Added at review: a per-workspace product cap (`workspaces.product_limit`, default 10 — the product
  owner's call) enforced atomically by a workspace-locking trigger. Migrations `20261014100000/110000/120000`.
- **S2 · Delete, /connect and the folded-in fixes** — #359 (`7dc7dc0`). Soft delete through the database (six credential
  views filter `deleted_at`; membership, connector and every other `projects` read filter it, pinned by a source
  guard); owner delete from the CLI and the console; owner purge after 30 days (SECURITY DEFINER, clears the nine
  FK-less tables, gets through the append-only ledgers only once the product is gone); `/connect` install lines; agents
  may `supabase db push` (`db reset` stays denied); `roadmap-push` works in a first-day repo. Kit 1.9.0, CLI 1.6.0.
  Migration `20261015100000`.
- **S3 · Each product's own horizon** — #361 (`d481548`). `Roadmap/horizon.md` + `destination: <id>[, <id>]`; the push
  carries an optional `horizon`; `/hub/<product>/horizon` reads the product's own artifact; `hub-horizon-empty` approved.
  Golden Frijoles' six destinations moved into its own file and render exactly as before (lit). Kit 1.9.1.

## What went well
- **The lock disproved scope before code**: two epics light two destinations each (D14), the 3-argument device-code
  overload already existed (no migration for S1.3), and the backfill guaranteed every workspace a creator.
- **Fresh verifier passes earned their cost**: each round found a real defect — an uncapped create multiplying quota,
  purge blocked by `input_values`, the same trigger's cascade exit erasing a LIVE product's ledger, the kit shipping
  without `lib/horizon.mjs`, and `horizon.md` in a folder the kit makes private. Three of these were caught before the
  migration reached production.
- **Specs that drove real seams caught real gaps**: the purge spec found nine tables whose `project_id` has no foreign key,
  and the service_role grant that made purge a SECURITY DEFINER.

## What we learned
- A cascade exit (`pg_trigger_depth() > 1`) on an append-only ledger opens EVERY cascade, not just the one you meant.
  Gate the exit on the fact you mean ("the parent project is gone").
- Before you rely on `ON DELETE CASCADE` to remove a tenant, list the tables whose tenant column has no foreign key.
- A new shared script module must be declared in every skill that runs it, or the kit ships without it — check the BUILT
  kit, not the source tree.
- A file a product's roadmap depends on cannot live in a folder the kit makes private.
- Two local e2e runners on one machine share port 3110 and one database: a spec can hit the other worktree's server.

## Gaps / follow-ups
- **Owed to the product owner:** `npm publish` of `@golden-frijoles/cli@1.6.0` (2FA) — the CLI steps of S1 and S2's
  walkthroughs wait on it; the signed-in walkthroughs (approve page, New product, console delete on Setup › CLI, /connect,
  the aomx horizon); the hypothesis read (`bets_placed_per_workspace` 0 → 3, read 30 days after shipping).
- The external security lens was DARK on #356 and #359 (agy returned only its trailer at full scope; vibe out of budget;
  codex excluded); it landed Clean on #361 at small scope. Same-family verifier security passes stood in.
- The `bets_placed_per_workspace` reading counting bets across every product (S3.2's last acceptance line) is not wired;
  read the target by hand until it is.
- Single-product users see no switcher menu, so `+ New product` reaches them only via `/app/portfolio`.
- `defaultProjectSlug`, the 4-argument `decide_cli_device_code` and the `not_member` approve message are now dead —
  a contract migration can drop them.
