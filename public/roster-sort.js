// Sort the roster shown on each team page:
// 1) Active players
// 2) Two-way / TW players
// 3) Any other roster status
// Within each status group, sort by Units from largest to smallest.
(function () {
  function statusRank(value) {
    const s = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
    if (s === 'active') return 0;
    if (s === 'tw' || s === 'two way' || s.includes('two way')) return 1;
    return 2;
  }

  function unitValue(row) {
    const raw = row.cells?.[2]?.textContent || '';
    const n = Number(String(raw).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : -Infinity;
  }

  function sortOverviewRoster(root = document) {
    root.querySelectorAll?.('.team-panel .team-table tbody').forEach(tbody => {
      const rows = Array.from(tbody.rows).filter(row => row.cells.length >= 3 && !row.cells[0]?.hasAttribute('colspan'));
      if (rows.length < 2) return;

      const sorted = rows.slice().sort((a, b) => {
        const rankDiff = statusRank(a.cells[1]?.textContent) - statusRank(b.cells[1]?.textContent);
        if (rankDiff) return rankDiff;

        const unitDiff = unitValue(b) - unitValue(a);
        if (unitDiff) return unitDiff;

        return String(a.cells[0]?.textContent || '').trim().localeCompare(String(b.cells[0]?.textContent || '').trim());
      });

      // Only touch the DOM when the order actually needs to change.
      // This prevents the MutationObserver from repeatedly triggering itself.
      const changed = sorted.some((row, index) => row !== rows[index]);
      if (!changed) return;

      const fragment = document.createDocumentFragment();
      sorted.forEach(row => fragment.appendChild(row));
      tbody.appendChild(fragment);
    });
  }

  sortOverviewRoster();

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      sortOverviewRoster();
    });
  });

  observer.observe(document.getElementById('app') || document.body, {
    childList: true,
    subtree: true
  });
})();
