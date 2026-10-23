# Relay Zones

Five-stage Hemi side runner. The run reads the public Hemi mainnet block when you press start (chain 43111, `https://rpc.hemi.network/rpc`). An even block plants a Shard behind the gate. An odd block plants a Hex. The page’s score comes from that same block. The wallet button can switch to Hemi mainnet. It does not sign or send. Each stage keeps its own score, and the score is marked Hemigo or Orami. The best on Hemi Rise stays apart from the best on Hemi Crown. The high-score list ranks each Hemi wallet on each stage. The app stores those scores. Nothing is signed or sent. Losing all five marks costs 500 points. On Deep, Gale, and Crown, librarian acid that hits the ground stays for about three seconds.

Space jumps. Hold Ctrl, S, or Down to crouch. E attacks. Hold Q to guard. The mouse wheel cycles weapons. F confirms the relay. I opens armor.

## Story

The hero carries one encrypted page, a secret sealed on the Hemi chain. The Librarians catalogue every page in every zone and want this one opened. The Hemi block stamp is the seal, and the page stays safe while the hero keeps moving and the relay stays confirmed. Four NPCs stand along the stages: Courier Tam, Archivist Quill, Apprentice Nib, and Sentinel Ward. Walk up to one to hear a line. The Shard (even block) bargains and the Hex (odd block) tricks. The secret itself is never shown. All story text is in the `STORY` object in `public/game.js`.

## Reset

The map screen has a Reset journey button. It asks "Forget your past?" and, on Forget, clears every `relay-zone-` key in this browser (clears, gear, armor, Orami's fireball, chosen hero, best scores) and reloads. Orami is locked again and the map shows a new-start line. The online high-score list (`/api/scores`) is not touched. Cancel, Esc, or a click outside the box keeps everything.

## Stage lengths and routes

Each stage is longer than the last, measured from the start to the exit door (game units). The climb, gate, and arena at the end are the same size on every stage, so the extra length is all route. Mobs, pits, pads, bridges, roofs, and checkpoints grow with it.

| Stage | Old | New | Route |
| --- | --- | --- | --- |
| Hemi Rise | 4906 | 5887 (+20%) | Flat meadow. A lone ditch, a widening stutter of three, one-hop steps to a secret canopy over the stutter. |
| Hemi Span | 6508 | 8460 (+30%) | Pads and terraces. A rising terrace, a causeway of pads over open air, a falling terrace. Secret skyway over the causeway (needs the spark). |
| Hemi Deep | 7788 | 10903 (+40%) | Roofs and roots. Three low roofs, root pads in pairs and trios, long basins. Secret canopy over the basin (needs the spark). |
| Hemi Gale | 9460 | 14190 (+50%) | Ferries and ice. Six sliding bridges (the first three are small one-third-width pieces you hop on and off), a wind row of two ferries between isles, frozen floes, a long skimmer lane. Secret skyway over the wind row (needs the spark). |
| Hemi Crown | 12034 | 20458 (+70%) | The high step, then peaks. Ash dunes, a peak climb to a summit and back down, a run of three ferries, a long slag walk. Two secret skyways (need the spark). |

The lengths come from `STAGE_OLD_EXIT` and `STAGE_GROWTH` in `public/game.js`. `buildStage` ends the route where the climb begins, so the exit lands on the target. The secret paths are floating decks marked `loft`. They never carry items, and every stage can be cleared without them. The time bonus is scaled by the stage length.

## Credits

- Character, armor, weapon, and stage art was generated with Grok.
- Mobs were drawn by jax.
- The sprite sheet was shared on the Hemi Discord by Rick 401.

## License

MIT. See [LICENSE](LICENSE).
