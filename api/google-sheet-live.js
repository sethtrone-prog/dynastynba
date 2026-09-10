import crypto from 'node:crypto';

const TEAM_SHEETS = {
  F01: 'Andrew Cap',
  F02: 'Brandon Cap',
  F03: 'Jake Cap',
  F04: 'Jordan F Cap',
  F05: 'Derek Cap',
  F06: 'J & Js Cap',
  F07: 'Diaz Cap',
  F08: 'Tom Cap',
  F09: 'Nate A Cap',
  F10: 'Seth Cap'
};

const YEARS = ['2026-2027','2027-2028','2028-2029','2029-2030','2030-2031'];
const SHEET_RANGE = 'A1:Q80';

function clean(v) { return String(v ?? '').trim(); }
function flat(row) { return row.map(cell => clean(cell?.formattedValue)).join(' ').replace(/\s+/g, ' ').trim(); }
function yearKey(v) { return clean(v).replace(/[–—]/g, '-').replace(/\s+/g, ''); }
function num(v) {
  const s = clean(v).replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function value(row, col) { return row?.[col]?.formattedValue ?? ''; }
function struck(row, col) { return Boolean(row?.[col]?.effectiveFormat?.textFormat?.strikethrough); }

function findYearHeader(rows, start = 0) {
  for (let r = start; r < rows.length; r++) {
    const matches = [];
    for (let c = 0; c < (rows[r]?.length || 0); c++) {
      const y = yearKey(value(rows[r], c));
      const idx = YEARS.findIndex(x => x === y);
      if (idx >= 0) matches.push({ idx, col: c });
    }
    if (matches.length >= 3) {
      const cols = Array(YEARS.length).fill(null);
      matches.forEach(m => { cols[m.idx] = m.col; });
      return { row: r, cols, firstYearCol: Math.min(...matches.map(m => m.col)) };
    }
  }
  return null;
}

function markerIndex(rows, pattern, start = 0) {
  for (let i = start; i < rows.length; i++) if (pattern.test(flat(rows[i]))) return i;
  return -1;
}

function parseRoster(rows) {
  const header = findYearHeader(rows);
  if (!header) throw new Error('Could not locate contract-year header');
  const gMarker = markerIndex(rows, /\bG[- ]?LEAGUE\b/i, header.row + 1);
  const picksMarker = markerIndex(rows, /\bDRAFT\s+PICKS?\b/i, header.row + 1);
  const stop = [gMarker, picksMarker].filter(x => x > header.row).sort((a,b) => a-b)[0] ?? rows.length;
  const playerCol = Math.max(0, header.firstYearCol - 1);
  const slotCol = Math.max(0, playerCol - 1);
  const main = [];

  for (let r = header.row + 1; r < stop; r++) {
    const label = flat(rows[r]);
    if (!label || /TEAM\s*TOTAL|TOTAL\s*UNITS|SALARY\s*CAP/i.test(label)) continue;
    const display = clean(value(rows[r], playerCol));
    if (!display) continue;
    const slotRaw = clean(value(rows[r], slotCol));
    const slot = /\bTW\b|TWO\s*WAY/i.test(slotRaw + ' ' + label) ? 'TW' : slotRaw;
    const units = header.cols.map(c => c == null ? null : num(value(rows[r], c)));
    if (!units.some(v => v != null) && /DRAFT|ROUND|PICK/i.test(display)) continue;
    main.push({ slot, display, units });
  }

  const totals = YEARS.map((_, i) => main.reduce((sum, row) => row.slot === 'TW' ? sum : sum + (row.units[i] || 0), 0));
  const gLeague = [];

  if (gMarker >= 0) {
    const gHeader = findYearHeader(rows, gMarker) || header;
    const gPlayerCol = Math.max(0, gHeader.firstYearCol - 1);
    const gEnd = picksMarker > gMarker ? picksMarker : rows.length;
    for (let r = Math.max(gMarker + 1, gHeader.row + 1); r < gEnd && gLeague.length < 5; r++) {
      const label = flat(rows[r]);
      if (!label || /TEAM\s*TOTAL|TOTAL\s*UNITS/i.test(label)) continue;
      const display = clean(value(rows[r], gPlayerCol));
      if (!display || /PLAYER|G[- ]?LEAGUE/i.test(display)) continue;
      const units = gHeader.cols.map(c => c == null ? null : num(value(rows[r], c)));
      gLeague.push({ display, units });
    }
  }

  while (gLeague.length < 5) gLeague.push({ display: '', units: [null,null,null,null,null] });
  return { main, totals, gLeague };
}

function parseFuturePicks(rows) {
  const start = markerIndex(rows, /\bDRAFT\s+PICKS?\b/i);
  if (start < 0) return [];
  const out = [];
  let currentYear = null;
  let parsedAny = false;

  for (let r = start + 1; r < rows.length; r++) {
    const cells = (rows[r] || []).map(cell => clean(cell?.formattedValue));
    const line = flat(rows[r]);

    // The pick table is contiguous. Once we've parsed at least one pick,
    // the first blank row marks the end of the table.
    if (!line) {
      if (parsedAny) break;
      continue;
    }

    const yearCell = cells.find(v => /^20(2[7-9]|3[0-1])(?:\s+DRAFT)?$/i.test(v));
    if (yearCell) currentYear = Number(yearCell.match(/20\d{2}/)?.[0]);

    let roundCol = -1;
    for (let c = 0; c < cells.length; c++) {
      const u = cells[c].toUpperCase();
      // Only accept dedicated round cells from the table, not free-form notes
      // such as "2028 2nd Round Pick to ..." below the table.
      if (/^(1ST|2ND|FIRST|SECOND)\s+ROUND$|^ROUND\s*[12]$/.test(u)) {
        roundCol = c;
        break;
      }
    }
    if (!currentYear || currentYear < 2027 || currentYear > 2031 || roundCol < 0) continue;

    const roundText = cells[roundCol];
    const u = roundText.toUpperCase();
    const round = /1ST|FIRST|ROUND\s*1/.test(u) ? 1 : (/2ND|SECOND|ROUND\s*2/.test(u) ? 2 : null);
    if (!round) continue;

    const detailCandidates = cells.filter(v => v && v !== roundText && !/^20\d{2}(?:\s+DRAFT)?$/i.test(v) && !/^OWNED$|^TRADED$|^STATUS$|^ROUND$/i.test(v));
    const note = detailCandidates.length ? detailCandidates[detailCandidates.length - 1] : '';
    const traded = struck(rows[r], roundCol) || /\bOUTGOING\b|\bTRADED\b|\bSENT\s+TO\b/i.test(line);
    out.push({ year: currentYear, round, label: round === 1 ? '1ST ROUND' : '2ND ROUND', traded, note });
    parsedAny = true;
  }

  return out;
}

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
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });
  if (!response.ok) throw new Error(`Google OAuth returned ${response.status}`);
  const json = await response.json();
  if (!json.access_token) throw new Error('Google OAuth did not return an access token');
  return json.access_token;
}

async function fetchSheet(sheetId, sheetName, token) {
  const range = `'${sheetName.replace(/'/g, "''")}'!${SHEET_RANGE}`;
  const fields = 'sheets(data(rowData(values(formattedValue,effectiveFormat(textFormat(strikethrough))))))';
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`);
  url.searchParams.append('ranges', range);
  url.searchParams.set('includeGridData', 'true');
  url.searchParams.set('fields', fields);

  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`${sheetName}: Google Sheets API returned ${response.status}`);
  const json = await response.json();
  const rowData = json?.sheets?.[0]?.data?.[0]?.rowData || [];
  return rowData.map(row => row.values || []);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
  const sheetId = process.env.DYNASTY_SHEET_ID;
  if (!sheetId) return res.status(503).json({ ok: false, setupRequired: true, message: 'DYNASTY_SHEET_ID is not configured', refreshSeconds: 600 });

  try {
    const token = await getAccessToken();
    const entries = await Promise.all(Object.entries(TEAM_SHEETS).map(async ([fid, sheet]) => {
      const rows = await fetchSheet(sheetId, sheet, token);
      const roster = parseRoster(rows);
      const futurePicks = parseFuturePicks(rows);
      if (!roster.main.length) throw new Error(`${sheet}: no roster rows parsed`);
      return [fid, { sheet, ...roster, futurePicks }];
    }));

    const teams = Object.fromEntries(entries);
    return res.status(200).json({
      ok: true,
      season: 2027,
      years: YEARS,
      refreshSeconds: 600,
      generatedAt: new Date().toISOString(),
      teams
    });
  } catch (error) {
    return res.status(502).json({ ok: false, refreshSeconds: 600, message: error?.message || 'Google Sheet sync failed' });
  }
}
