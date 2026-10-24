# GTS-04B. Raids, bosses, threats and rare wandering groups

> Status: Design review. Implementation has not started.

## Raids

At sufficient faction pressure send a recognizable squad from outside view. Once GTS-05 is available, some squads arrive by car, stop at valid unload nodes, disembark and engage. Before that, foot reinforcements provide a complete working path; do not block core combat on traffic. Avoid spawning a second full raid just because one actor moved offscreen. Vehicle occupants count toward the same actor budget.

## Boss state proposal

Each faction has an ordered chain of four bosses, as confirmed in D03. A cumulative hostility threshold makes the next boss eligible. A short threat presentation/entrance is allowed, but there is no elapsed-time, three-minute or cooldown requirement. Only the previous boss in that faction's chain must be defeated before its successor appears. Record eligibility once and prevent duplicate summons.

If several factions become eligible together, all may send bosses immediately (D04). No global boss cap, global arrival queue or time grace period may suppress them. Each faction still advances its own chain in order; already-earned thresholds can make its next boss arrive as soon as the predecessor dies. At most one chain member per faction is alive under this ordering, allowing four faction bosses concurrently. Process same-frame eligibility/deaths deterministically. Reduce assistant counts and reserve actor capacity for boss entities rather than delaying an eligible boss because the ordinary enemy pool is full. Communicate every incoming faction independently in the HUD and map.

## Presentation

Faction name, original simple portrait, short catalogued threat, boss name/tier and clear map marker. Provide reduced-motion/skip behavior and never obscure the player's immediate danger without pausing explicitly. Bosses have assistants from the same encounter budget and legible attack tells. No bullet sponge health scaling as the only difference between tiers.

## Drops

A resolved boss death creates one owned crate; interacting opens three-choice new-weapon rewards via GTS-03B. Define whether the crate is auto-collected or requires proximity. Boss/rare group markers need shape/icon + text, not color alone.

## Rare group concepts

Original parody archetypes, not real-person portraits or the GTA Elvis lineup. Recommended working concept: **Ring-Light Pilgrims**, a synchronized group of tracksuit "hustle" content creators carrying small square lights and filming each other. Alternatives: **Cold-Plunge Club**, robes/towels and exaggerated warm-up marching; **Prompt Gurus**, matching blazers and fake keynote placards. These are proposals for discussion, not a claim about a current meme trend.

Spawn a group rarely at valid nearby offscreen sidewalks using independent seeded chance and a population cap. Assign group/member IDs and an explicit completion ledger. Initially wander; a deliberate attack makes survivors flee in different reachable directions. One configurable bonus for defeating every member, never once per surviving entity. Mark the group and show remaining members after engagement. Set escape distance/time and completion/failure rules; ordinary distance culling cannot silently count as killing or erase a live challenge.

## Acceptance

- Hostility alone triggers boss eligibility. Frame hitches cannot create duplicate bosses.
- Each faction's chain waits for its previous boss to die. Every eligible faction can send its boss without a global queue.
- Threat messages, portraits and markers disappear when their encounter ends.
- Crates grant one reward. A rare group grants its completion bonus once and only when every member dies.
- Tests resolve simultaneous final-member death and escape according to the agreed rule.

## Confirmed

Each faction has four bosses. Eligible factions can send bosses simultaneously.

## Decisions needed

Choose the boss identities, crate pickup interaction and rare group design. Set its reward after the XP curve has a playable baseline.
