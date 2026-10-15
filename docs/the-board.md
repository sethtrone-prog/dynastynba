# The Board

Resources → The Board (`#resources/board`). Public labels are “challenge” and “on the line.”

Add entries by appending an object to `public/board-items.json`. Each entry needs a unique ID, NBA ending season (2027 = 2026–27), two participants, matching side descriptions, challenge, onTheLine, and tracker. The conference-position tracker currently supports Eastern Conference teams (ESPN conference ID 5). `yesParticipant` has finish at or above `threshold`; `noParticipant` has below it. Keep names consistent with participants.

The read-only `/api/board-standings?season=2027` endpoint reads ESPN NBA regular-season conference standings, caches for five minutes, and validates season/type and records. The client refreshes every five minutes while the page is open. Use ESPN's playoffSeed position instead of sorting tied records ourselves. Before games begin, or when position is unreported, do not name a leader. Mark final only when every East team has at least 82 regular-season games. An interrupted/shortened schedule would need commissioner review before finalizing. No odds or probabilities are shown.

A new kind of challenge can use a new tracker implementation. No roster, Google Sheet, Wins Pool renderer, or salary logic is involved.

Playoff-finish entries use commissioner-verified finish values: null = pending, 0 = missed playoffs, 1 = first round, 2 = second round, 3 = conference finals, 4 = Finals runner-up, 5 = champion. Both finish values must be entered before resolving; equal values are a push. This tracker is not connected to an automatic playoff results feed.
