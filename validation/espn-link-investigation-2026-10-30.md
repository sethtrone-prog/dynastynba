# ESPN player-link investigation — October 30, 2026

Source: main branch public/data/site-data.json and validation/espn-2026-full-player-pool.csv.

## Verified ESPN IDs from stored NBA player pool
Day'Ron Sharpe 4432194; Dereck Lively II 4683688; Adou Thiero 5060631; Liam McNeeley 5239590; Ty Jerome 4065733; Yanic Konan Niederhauser 5108024; Will Richard 4897262; Kobe Sanders 4702352.

## Critical discrepancy
The current main Players array does not contain exact-name records for seven of these eight players. Dereck Lively II exists as P0540 with ESPN_Player_ID 4683688 already. Therefore, running the current targeted script with --apply against main would not connect the seven missing player records. Do not invent permanent Player_ID values or add records without reconciling live roster source.

## Other aliases
Christian Anderson Jr. is P0536 on main, ESPN ID null. Yaxel Landeborg is P0515, ESPN ID null. User submitted Christian Anderson and Yaxel Lendeburg. Verify identity before any mapping.

## Next actions
Determine which source the live site uses for rostered players and whether an upstream roster import replaces main data. Audit roster entries by permanent Player_ID. Match against ESPN NBA (not college) profiles. Preserve roster/contracts/history. Validate beta before production merge.
