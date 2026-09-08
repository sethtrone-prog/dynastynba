// Team Overview contract grid: cap-sheet style yearly unit columns with team totals.
// Runs after normal team-page rendering and does not use a MutationObserver.
(function () {
  function normalizedStatus(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  }

  function normText(value) {
    return String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function isTwoWay(value) {
    const s = normalizedStatus(value);
    return s === 'tw' || s === 'two way' || s.includes('two way');
  }

  function isGLeagueStatus(value) {
    const s = normalizedStatus(value);
    return s.includes('g league') || s.includes('gleague') || s.includes('g-league') || s.includes('reserve');
  }

  function statusRank(value) {
    const s = normalizedStatus(value);
    if (s === 'active') return 0;
    if (isTwoWay(s)) return 1;
    return 2;
  }

  function numeric(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function yearLabel(endYear) {
    const end = Number(endYear);
    return `${end - 1}-${end}`;
  }

  function extractYearFromValue(value) {
    if (value === null || value === undefined || value === '') return null;
    const s = String(value).trim();
    let m = s.match(/(20\d{2})\s*[-–/]\s*(20\d{2})/);
    if (m) return Number(m[2]);
    m = s.match(/(20\d{2})\s*[-–/]\s*(\d{2})(?!\d)/);
    if (m) return Number(`20${m[2]}`);
    if (/^20\d{2}$/.test(s)) return Number(s);
    return null;
  }

  function explicitContractYear(row) {
    const preferred = [
      'Contract_Year','Contract_Season','Contract_Year_Label','Contract_Period',
      'Salary_Year','Salary_Season','League_Year','League_Season','Year_Label'
    ];
    for (const key of preferred) {
      const y = extractYearFromValue(row?.[key]);
      if (y) return y;
    }
    for (const [key, value] of Object.entries(row || {})) {
      if (['Season_ID','Workbook_Year','End_Season','Start_Season'].includes(key)) continue;
      if (!/(year|season|period)/i.test(key)) continue;
      const y = extractYearFromValue(value);
      if (y) return y;
    }
    return null;
  }

  function contractEndYear(value, fallback) {
    const y = extractYearFromValue(value);
    if (y) return y;
    const n = Number(String(value ?? '').replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n >= 2000 ? n : Number(fallback);
  }

  function buildContractMatrix(contracts, capRoster, selectedSeason) {
    const currentEnd = Number(selectedSeason);
    const grouped = new Map();
    contracts.forEach(c => {
      if (!c.Player_ID) return;
      if (!grouped.has(c.Player_ID)) grouped.set(c.Player_ID, []);
      grouped.get(c.Player_ID).push(c);
    });

    const matrix = new Map();
    let maxEnd = currentEnd + 4;
    grouped.forEach(rows => {
      rows.forEach(r => {
        const explicit = explicitContractYear(r);
        if (explicit) maxEnd = Math.max(maxEnd, explicit);
        maxEnd = Math.max(maxEnd, contractEndYear(r.End_Season, currentEnd));
      });
    });
    maxEnd = Math.min(maxEnd, currentEnd + 6);
    const years = [];
    for (let end = currentEnd; end <= maxEnd; end++) years.push(yearLabel(end));

    grouped.forEach((rows, pid) => {
      const pm = new Map();
      const withYears = rows.map((row, index) => ({ row, index, year: explicitContractYear(row) }));
      const explicitRows = withYears.filter(x => x.year);
      if (explicitRows.length) {
        explicitRows.forEach(({row, year}) => {
          const units = numeric(row.Units);
          if (units !== null && year >= currentEnd && year <= maxEnd) pm.set(yearLabel(year), units);
        });
      } else if (rows.length > 1) {
        rows.forEach((row, index) => {
          const end = currentEnd + index;
          if (end > maxEnd) return;
          const units = numeric(row.Units);
          if (units !== null) pm.set(yearLabel(end), units);
        });
      } else if (rows.length === 1) {
        const row = rows[0];
        const units = numeric(row.Units);
        const endYear = contractEndYear(row.End_Season, currentEnd);
        if (units !== null) {
          pm.set(yearLabel(currentEnd), units);
          for (let end = currentEnd + 1; end <= Math.min(endYear, maxEnd); end++) pm.set(yearLabel(end), units);
        }
      }
      matrix.set(pid, pm);
    });

    // CAP TOTAL is the 25-unit cap total. Two-way and G-League players never count.
    const totals = new Map(years.map(y => [y, 0]));
    capRoster.forEach(r => {
      const pm = matrix.get(r.Player_ID);
      if (!pm) return;
      years.forEach(y => {
        const u = pm.get(y);
        if (u !== null && u !== undefined) totals.set(y, (totals.get(y) || 0) + Number(u));
      });
    });
    return { years, matrix, totals };
  }

  function formatUnits(value) {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function isOverviewRoute() {
    const parts = location.hash.replace(/^#/, '').split('/');
    return parts[0] === 'team' && !!parts[1] && (!parts[2] || parts[2] === 'overview');
  }

  function firstValue(row, keys) {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
    }
    return '';
  }

  function ownerAliasesForFranchise(fid, sid) {
    const aliases = new Set();
    const fs = (DB?.['Franchise Seasons'] || []).find(r => String(r.Franchise_ID) === String(fid) && String(r.Season_ID) === String(sid));
    const f = (DB?.Franchises || []).find(r => String(r.Franchise_ID) === String(fid));
    [fs?.Owner_Name, f?.Current_Owner].filter(Boolean).forEach(v => aliases.add(normText(v)));
    (DB?.['Owner Aliases'] || []).filter(r => String(r.Franchise_ID) === String(fid)).forEach(r => {
      [r.Alias, r.Canonical_Owner].filter(Boolean).forEach(v => aliases.add(normText(v)));
    });
    // Current team label can also be used as a column header in some source sheets.
    const et = (DB?.['ESPN Teams'] || []).find(r => String(r.Franchise_ID) === String(fid));
    [et?.ESPN_Team_Name].filter(Boolean).forEach(v => aliases.add(normText(v)));
    return [...aliases].filter(Boolean);
  }

  function looksLikePlayerName(value) {
    const s = String(value ?? '').trim();
    if (!s || /^[-–—]+$/.test(s)) return false;
    if (/^\d+(?:\.\d+)?$/.test(s)) return false;
    if (/^(gp|games? played|player|name)$/i.test(s)) return false;
    return /[a-z]/i.test(s);
  }

  function headerMatchesOwner(header, aliases) {
    const h = normText(header).replace(/\b(gp|games played|games)\b/g, '').trim();
    if (!h) return false;
    return aliases.some(a => h === a || h.startsWith(a + ' ') || a.startsWith(h + ' '));
  }

  function getGLeagueRows(fid, sid, roster) {
    const rows = [];
    const aliases = ownerAliasesForFranchise(fid, sid);

    // G-League data can exist either as a normalized table or in the original wide
    // Google-Sheet layout (owner/player column followed by a Games Played column).
    Object.entries(DB || {}).forEach(([tableName, value]) => {
      if (!Array.isArray(value) || !value.length) return;
      const tableLooksGLeague = /g\s*[-_ ]?league|gleague|development\s*roster|reserve\s*roster/i.test(tableName);
      if (!tableLooksGLeague) return;

      value.forEach(r => {
        if (!r || typeof r !== 'object') return;

        // Normalized row format.
        const rf = firstValue(r, ['Franchise_ID','Current_Franchise_ID','Team_Franchise_ID']);
        const rs = firstValue(r, ['Season_ID']);
        const ry = Number(firstValue(r, ['Workbook_Year','End_Year','Season','Year']));
        const seasonMatch = rs ? String(rs) === String(sid) : (!ry || ry === Number(season));
        if (rf && String(rf) === String(fid) && seasonMatch) {
          rows.push(r);
          return;
        }

        // Wide source-sheet format: owner/player column + adjacent Games Played column.
        for (const [header, value] of Object.entries(r)) {
          if (/gp|games?\s*played/i.test(header)) continue;
          if (!headerMatchesOwner(header, aliases)) continue;
          if (!looksLikePlayerName(value)) continue;
          rows.push({ Player_Name_Raw: String(value).trim(), Source_Table: tableName });
        }
      });
    });

    // Also honor roster rows explicitly marked as G-League/reserve.
    roster.filter(r => isGLeagueStatus(r.Roster_Status) || isGLeagueStatus(r.Slot)).forEach(r => rows.push(r));

    const seen = new Set();
    return rows.filter(r => {
      const pid = firstValue(r, ['Player_ID']);
      const raw = firstValue(r, ['Player_Name','Player_Name_Raw','Player','Name']);
      const key = pid ? `id:${pid}` : `name:${normText(raw)}`;
      if (!raw && !pid) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function gLeaguePlayerName(row) {
    const pid = firstValue(row, ['Player_ID']);
    if (pid) {
      const p = player(pid);
      if (p && p.Player_Name) return p.Player_Name;
    }
    const raw = firstValue(row, ['Player_Name','Player_Name_Raw','Player','Name']);
    if (raw) {
      const match = (DB?.Players || []).find(p => normText(p.Player_Name) === normText(raw));
      return match?.Player_Name || raw;
    }
    return 'Unknown player';
  }

  function gLeaguePlayerId(row) {
    const pid = firstValue(row, ['Player_ID']);
    if (pid) return pid;
    const raw = firstValue(row, ['Player_Name','Player_Name_Raw','Player','Name']);
    return (DB?.Players || []).find(p => normText(p.Player_Name) === normText(raw))?.Player_ID || '';
  }

  function renderGLeagueReserves(panel, rows) {
    document.querySelector('.g-league-reserves-card')?.remove();
    if (!rows.length || !panel) return;
    const section = document.createElement('section');
    section.className = 'card team-panel g-league-reserves-card';
    section.innerHTML = `
      <div class="card-pad section-title"><div><div class="eyebrow">DEVELOPMENT ROSTER</div><h2>G-League Reserves</h2></div><span>Does not count toward 25-unit cap</span></div>
      <div class="table-wrap"><table class="data-table g-league-table"><thead><tr><th>Player</th></tr></thead><tbody>
        ${rows.map(r => {
          const pid = gLeaguePlayerId(r);
          const name = gLeaguePlayerName(r);
          return `<tr><td>${pid ? `<span class="player-link" onclick="go('player/${pid}')">${esc(name)}</span>` : esc(name)}</td></tr>`;
        }).join('')}
      </tbody></table></div>`;
    panel.insertAdjacentElement('afterend', section);
  }

  function renderContractGrid() {
    if (!isOverviewRoute() || typeof DB === 'undefined' || !DB) return;
    const parts = location.hash.replace(/^#/, '').split('/');
    const fid = parts[1];
    const sid = typeof seasonId === 'function' ? seasonId(season) : `S${season}`;
    const fullRoster = (DB.Rosters || []).filter(r => r.Franchise_ID === fid && r.Season_ID === sid);
    const gLeagueRows = getGLeagueRows(fid, sid, fullRoster);
    const gLeagueIds = new Set(gLeagueRows.map(r => gLeaguePlayerId(r)).filter(Boolean).map(String));

    // Main cap table contains active + two-way players. G-League reserves are broken out below.
    const roster = fullRoster.filter(r => !isGLeagueStatus(r.Roster_Status) && !isGLeagueStatus(r.Slot) && !gLeagueIds.has(String(r.Player_ID || '')));
    const capRoster = roster.filter(r => !isTwoWay(r.Roster_Status) && !isTwoWay(r.Slot));
    const contracts = (DB.Contracts || []).filter(c => c.Franchise_ID === fid && c.Season_ID === sid);
    if (!roster.length && !gLeagueRows.length) return;
    const table = document.querySelector('.team-panel .team-table');
    if (!table) return;
    const panel = table.closest('.team-panel');

    const { years, matrix, totals } = buildContractMatrix(contracts, capRoster, season);
    const currentYear = years[0];
    const sortedRoster = roster.slice().sort((a, b) => {
      const aStatus = isTwoWay(a.Roster_Status) || isTwoWay(a.Slot) ? 'two way' : a.Roster_Status;
      const bStatus = isTwoWay(b.Roster_Status) || isTwoWay(b.Slot) ? 'two way' : b.Roster_Status;
      const sr = statusRank(aStatus) - statusRank(bStatus);
      if (sr) return sr;
      const au = matrix.get(a.Player_ID)?.get(currentYear);
      const bu = matrix.get(b.Player_ID)?.get(currentYear);
      const diff = (bu ?? -Infinity) - (au ?? -Infinity);
      if (diff) return diff;
      const an = player(a.Player_ID).Player_Name || a.Player_Name_Raw || '';
      const bn = player(b.Player_ID).Player_Name || b.Player_Name_Raw || '';
      return String(an).localeCompare(String(bn));
    });

    table.classList.add('contract-year-grid');
    table.innerHTML = `
      <thead><tr><th class="contract-player-col">Player</th>${years.map(y => `<th class="contract-year-head">${esc(y)}</th>`).join('')}</tr></thead>
      <tbody>${sortedRoster.map(r => {
        const pm = matrix.get(r.Player_ID) || new Map();
        const name = player(r.Player_ID).Player_Name || r.Player_Name_Raw || '';
        const status = String(r.Roster_Status || r.Slot || '').trim();
        const twoWay = isTwoWay(r.Roster_Status) || isTwoWay(r.Slot);
        return `<tr class="contract-roster-row status-${esc(status.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}${twoWay?' two-way-cap-exempt':''}">
          <td class="contract-player-col"><span class="player-link" onclick="go('player/${r.Player_ID}')">${esc(name)}</span>${twoWay ? `<small class="contract-status-note">TWO WAY · CAP EXEMPT</small>` : (status && status.toLowerCase() !== 'active' ? `<small class="contract-status-note">${esc(status)}</small>` : '')}</td>
          ${years.map(y => `<td class="contract-year-unit">${formatUnits(pm.get(y))}</td>`).join('')}
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="contract-grid-total"><th>CAP TOTAL</th>${years.map(y => `<th class="contract-year-total">${formatUnits(totals.get(y) || 0)}</th>`).join('')}</tr></tfoot>`;

    renderGLeagueReserves(panel, gLeagueRows);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[onclick*="go(\'team/"], [data-route="teams"]')) setTimeout(renderContractGrid, 0);
  });
  const seasonSelect = document.getElementById('seasonSelect');
  if (seasonSelect) seasonSelect.addEventListener('change', () => setTimeout(renderContractGrid, 0));
  if (location.hash.startsWith('#team/')) setTimeout(renderContractGrid, 0);

  const style = document.createElement('style');
  style.textContent = `
    .team-panel{overflow-x:auto}
    .contract-year-grid{width:100%;min-width:720px;table-layout:fixed}
    .contract-year-grid .contract-player-col{width:210px;max-width:210px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:12px}
    .contract-year-grid th.contract-year-head,
    .contract-year-grid td.contract-year-unit,
    .contract-year-grid th.contract-year-total{width:94px;min-width:94px;white-space:nowrap;text-align:center !important;vertical-align:middle}
    .contract-year-grid .contract-status-note{display:inline;margin-left:7px;font-size:10px;opacity:.65;text-transform:uppercase;letter-spacing:.03em}
    .contract-year-grid .two-way-cap-exempt td{opacity:.82}
    .contract-year-grid tfoot .contract-grid-total th{font-weight:800;border-top:2px solid currentColor;white-space:nowrap}
    .contract-year-grid tfoot .contract-grid-total th:first-child{text-align:left}
    .g-league-reserves-card{margin-top:16px;overflow:hidden}
    .g-league-reserves-card .g-league-table{width:100%}
    @media(max-width:760px){
      .contract-year-grid{min-width:680px}
      .contract-year-grid .contract-player-col{width:175px;max-width:175px}
      .contract-year-grid th.contract-year-head,.contract-year-grid td.contract-year-unit,.contract-year-grid th.contract-year-total{width:88px;min-width:88px}
    }
  `;
  document.head.appendChild(style);
})();