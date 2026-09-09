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

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function clean(v) { return String(v ?? '').trim(); }
function flat(row) { return row.map(clean).join(' ').replace(/\s+/g, ' ').trim(); }
function yearKey(v) { return clean(v).replace(/[–—]/g, '-').replace(/\s+/g, ''); }
function num(v) {
  const s = clean(v).replace(/,/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function findYearHeader(rows, start = 0) {
  for (let r = start; r < rows.length; r++) {
    const matches = [];
    for (let c = 0; c < rows[r].length; c++) {
      const y = yearKey(rows[r][c]);
      const idx = YEARS.findIndex(x => x === y);
      if (idx >= 0) matches.push({ idx, col: c });
    }
    if (matches.length >= 3) {
      const cols = Array(YEARS.length).fill(null);
      matches.forEach(m => cols[m.idx] = m.col);
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
    const display = clean(rows[r][playerCol]);
    if (!display) continue;
    const slotRaw = clean(rows[r][slotCol]);
    const slot = /\bTW\b|TWO\s*WAY/i.test(slotRaw + ' ' + label) ? 'TW' : slotRaw;
    const units = header.cols.map(c => c == null ? null : num(rows[r][c]));
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
      const display = clean(rows[r][gPlayerCol]);
      if (!display || /PLAYER|G[- ]?LEAGUE/i.test(display)) continue;
      const units = gHeader.cols.map(c => c == null ? null : num(rows[r][c]));
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
  for (let r = start + 1; r < rows.length; r++) {
    const cells = rows[r].map(clean);
    const line = flat(rows[r]);
    if (!line) continue;
    const yearCell = cells.find(v => /^20(2[6-9]|3[0-1])$/.test(v));
    if (yearCell) currentYear = Number(yearCell);
    const roundText = cells.find(v => /\b(1ST|2ND|FIRST|SECOND)\b.*\bROUND\b|^ROUND\s*[12]$|^[12](?:\.0)?$/.test(v.toUpperCase()));
    let round = null;
    if (roundText) {
      const u = roundText.toUpperCase();
      round = /1ST|FIRST|ROUND\s*1|^1(?:\.0)?$/.test(u) ? 1 : (/2ND|SECOND|ROUND\s*2|^2(?:\.0)?$/.test(u) ? 2 : null);
    }
    if (!currentYear || !round) continue;
    const detailCandidates = cells.filter(v => v && v !== String(currentYear) && v !== roundText && !/^OWNED$|^TRADED$|^STATUS$|^ROUND$/i.test(v));
    const note = detailCandidates.length ? detailCandidates[detailCandidates.length - 1] : '';
    const traded = /\bOUTGOING\b|\bTRADED\b|\bSENT\s+TO\b/i.test(line);
    out.push({ year: currentYear, round, label: round === 1 ? '1ST ROUND' : '2ND ROUND', traded, note });
  }
  return out;
}

async function fetchSheet(sheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url, { headers: { 'user-agent': 'DynastyNBA-SheetSync/1.0' } });
  if (!response.ok) throw new Error(`${sheetName}: Google returned ${response.status}`);
  return parseCSV(await response.text());
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60');
  const sheetId = process.env.DYNASTY_SHEET_ID;
  if (!sheetId) {
    return res.status(503).json({ ok: false, setupRequired: true, message: 'DYNASTY_SHEET_ID is not configured', refreshSeconds: 600 });
  }

  try {
    const teams = {};
    const entries = await Promise.all(Object.entries(TEAM_SHEETS).map(async ([fid, sheet]) => {
      const rows = await fetchSheet(sheetId, sheet);
      const roster = parseRoster(rows);
      const futurePicks = parseFuturePicks(rows);
      if (!roster.main.length) throw new Error(`${sheet}: no roster rows parsed`);
      return [fid, { sheet, ...roster, futurePicks }];
    }));
    entries.forEach(([fid, data]) => { teams[fid] = data; });
    return res.status(200).json({ ok: true, season: 2027, years: YEARS, refreshSeconds: 600, generatedAt: new Date().toISOString(), teams });
  } catch (error) {
    return res.status(502).json({ ok: false, refreshSeconds: 600, message: error?.message || 'Google Sheet sync failed' });
  }
}
