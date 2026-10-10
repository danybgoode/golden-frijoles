---
title: "The build view tells one story: one status, said once"
slug: build-view-one-story
status: raw
area: "09"
type: feature
appetite: M
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-10
intent_ask: verbatim
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — the build view tells one story (after launch)

From Daniel's feedback, 2026-10-10 (the Why line itself is `why-as-a-story`, before launch):

> As you can see we have many different status communicated at the same time on different lines. Please show me a
> suggested streamlined reorganization, we have the data, lets just make sure its all coherent and telling a story so
> humans always have the context clearly.

The layout proposed and liked in that session:

```
golden-frijoles ▸ One bet, wired                               Building · S1.2 of 6
  Why      <the Why, in full>
  Target   none yet: <grounded_reason> · intent match 88
  Track    Refining ─ Ready ─ ◉ Building ─ QA ─ Shipped    ▰▰▱│▱▱▱  2 of 6 done
  Now      S1.2 <story>: as a founder, I want … so that …
  Spend    ≈$22 of $56–79 · 1 session
  Around   3 ready · 5 in QA · next up: Night garden (#80)  ↗ hub
```

1. **One stage, said once:** the headline and the track. "from docs: status … (snapshot) · phase …" goes; a source is
   named only when two disagree.
2. **Target with its reason:** "none yet: <grounded_reason>" instead of "no target set".
3. **Intent match on screen:** on the Target line ("intent 88 → yes" after the close), on the epic page and the board
   card. Leave it out wherever it crowds.
4. **The Story line never says "session journal":** the last story with a commit, or "between stories".
5. **Board → Around**, labelled as other work.
6. **The 5-hour line below the prompt, to the minute:** "resets 9:20 pm (in 1h 29m)" from the reset time itself
   (seen: at 7:51 pm it said "-1h" for a 9:20 pm reset).
7. A shipped epic's view reads as shipped (today it shows "0 of 6 stories done" on main).
