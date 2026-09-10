import crypto from 'node:crypto';

const RANGE = "'Wins Pool'!B2:N64";
const DISPLAY_SEASON = 2027;
const HISTORY_YEAR = 2026;

function clean(v) { return String(v ?? '').trim(); }
function num(v) {
  const s = clean(v).replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function value(row, col) { return row?.[col]?.formattedValue ?? ''; }
function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) throw new Error('Google service account is not configured');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey);
  const assertion = `${unsigned}.${b64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth-grant-type:jwt-bearer',
      assertion
    })
  });
  if (!response.ok) throw new Error(`Google OAuth returned ${response.status}`);
  const json = await response.json();
  if (!json.access_token) throw new Error('Google OAuth did not return an access token');
  return json.access_token;
}

async function fetchRows(sheetId, token) {
  const fields = 'sheets(data(rowData(values(formattedValue))))';
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`);
  url.searchParams.append('ranges', RANGE);
  url.searchParams.set('includeGridData', 'true');
  url.searchParams.set('fields', fields);
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Wins Pool: Google Sheets API returned ${response.status}`);
  const json = await response.json();
  const rowData = json?.sheets?.[0]?.data?.[0]?.rowData || [];
  return rowData.map(row => row.values || []);
}

function parse(rows) {
  // RANGE begins at column B, so indexes below are relative to B.
  // Workbook rows 3-32: owner totals + three NBA selections per owner.
  const owners = [];
  for (let r = 1; r <= 30; r += 3) {
    const owner = clean(value(rows[r], 0));
    if (!owner) continue;
    const total = num(value(rows[r], 1));
    const pickPosition = num(value(rows[r], 2));
    const teams = [];
    for (let j = 0; j < 3; j++) {
      const row = rows[r + j] || [];
      const team = clean(value(row, 3));
      if (!team) continue;
      teams.push({
        pick: num(value(row, 2)),
        team,
        wins: num(value(row, 4)),
        losses: num(value(row, 5)),
        remaining: num(value(row, 6)),
        projected: num(value(row, 7)),
        diff: num(value(row, 8))
      });
    }
    owners.push({ owner, total, pickPosition, teams });
  }

  // Workbook rows 35-64: preseason totals/O-U and slot selection order.
  const preseasonByOwner = new Map();
  const ouByPick = new Map();
  const slotOrder = [];
  for (let r = 33; r <= 62; r++) {
    const owner = clean(value(rows[r], 0));
    const preTotal = num(value(rows[r], 1));
    if (owner && preTotal != null) preseasonByOwner.set(owner, preTotal);
    const pick = num(value(rows[r], 2));
    const ou = num(value(rows[r], 4));
    if (pick != null && ou != null) ouByPick.set(pick, ou);
    const slot = num(value(rows[r], 10));
    const slotOwner = clean(value(rows[r], 11));
    if (slot != null && slotOwner) slotOrder.push({ position: slot, owner: slotOwner });
  }

  owners.forEach(entry => {
    entry.preseason = preseasonByOwner.get(entry.owner) ?? null;
    entry.projected = entry.teams.reduce((sum, t) => sum + (t.projected ?? 0), 0);
    entry.remaining = entry.teams.reduce((sum, t) => sum + (t.remaining ?? 0), 0);
    entry.teams.forEach(t => { t.preseasonOU = ouByPick.get(t.pick) ?? null; });
  });

  const standings = owners
    .slice()
    .sort((a, b) => (b.total ?? -Infinity) - (a.total ?? -Infinity) || (b.projected ?? -Infinity) - (a.projected ?? -Infinity) || a.owner.localeCompare(b.owner))
    .map((x, i) => ({ owner: x.owner, position: i + 1, total: x.total, projected: x.projected, remaining: x.remaining, preseason: x.preseason }));

  const draft = owners
    .flatMap(x => x.teams.map(t => ({ pick: t.pick, owner: x.owner, team: t.team })))
    .filter(x => x.pick != null)
    .sort((a, b) => a.pick - b.pick);

  slotOrder.sort((a, b) => a.position - b.position);
  return { owners, standings, draft, slotOrder };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
  const sheetId = process.env.DYNASTY_SHEET_ID;
  if (!sheetId) return res.status(503).json({ ok: false, message: 'DYNASTY_SHEET_ID is not configured', refreshSeconds: 600 });

  try {
    const token = await getAccessToken();
    const rows = await fetchRows(sheetId, token);
    const data = parse(rows);
    if (data.owners.length !== 10) throw new Error(`Wins Pool: expected 10 owners, parsed ${data.owners.length}`);
    return res.status(200).json({
      ok: true,
      displaySeason: DISPLAY_SEASON,
      historyYear: HISTORY_YEAR,
      refreshSeconds: 600,
      generatedAt: new Date().toISOString(),
      ...data
    });
  } catch (error) {
    return res.status(502).json({ ok: false, refreshSeconds: 600, message: error?.message || 'Wins Pool sync failed' });
  }
}
