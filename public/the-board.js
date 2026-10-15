(function () {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th'));
  let items, itemRequest, refreshTimer;
  async function loadItems() {
    if (!itemRequest) itemRequest = fetch('/board-items.json', {cache:'no-store'}).then(r => {if (!r.ok) throw Error(); return r.json();}).then(data => {
      if (!Array.isArray(data)) throw Error();
      items = data; return items;
    }).catch(error => {itemRequest = null; throw error;});
    return itemRequest;
  }
  function card(item, data, error) {
    const tracker = item.tracker;
    const team = data?.teams.find(t => t.id === tracker?.teamId);
    const active = data?.started && team?.position && team.wins + team.losses > 0;
    const ahead = active ? (team.position <= tracker.threshold ? tracker.yesParticipant : tracker.noParticipant) : null;
    let status = error ? 'Update unavailable' : !data ? 'Loading standings…' : !data.started ? 'Awaiting season' : !active ? 'Position pending' : data.final ? `${ahead} wins` : `${ahead} is ahead`;
    const season = `${item.season - 1}–${String(item.season).slice(-2)}`;
    return `<article class="board-card"><div class="board-card-top"><span class="board-kicker">${escape(season)} · Season challenge</span><span class="board-status ${ahead ? 'board-ahead' : ''}">${escape(status)}</span></div><h2>${item.participants.map(escape).join(' <span class="board-versus">vs.</span> ')}</h2><p class="board-challenge">${escape(item.challenge)}</p><div class="board-sides">${item.participants.map((name,i) => `<div class="${ahead === name ? 'board-leading' : ''}"><b>${escape(name)}</b><span>${escape(item.sides[i])}</span></div>`).join('')}</div><div class="board-metrics"><div><span>${data?.final ? 'Final East position' : 'Current East position'}</span><b>${active ? ordinal(team.position) : '—'}</b></div><div><span>Miami record</span><b>${team ? `${team.wins}–${team.losses}` : '—'}</b></div><div><span>Target</span><b>Top ${escape(tracker.threshold)}</b></div></div><div class="board-prize"><span>On the line</span><strong>${escape(item.onTheLine)}</strong></div><p class="board-note">Final regular-season Eastern Conference position decides the result.</p><div class="board-update">${error ? escape(error) : data ? `ESPN · Checked ${escape(new Date(data.updatedAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))} · Refreshes every 5 minutes` : 'Connecting to ESPN…'}</div></article>`;
  }
  async function mount() {
    clearTimeout(refreshTimer);
    const root = document.getElementById('theBoard');
    if (!root) return;
    root.innerHTML = '<p class="board-note" role="status">Loading The Board…</p>';
    try {
      await loadItems();
      if (!root.isConnected) return;
      root.innerHTML = items.map(item => `<div data-board-id="${escape(item.id)}" data-board-season="${item.season}">${card(item)}</div>`).join('') || '<p>No challenges on The Board yet.</p>';
      await Promise.all([...new Set(items.map(i => i.season))].map(async season => {
        let data, error;
        try {
          const response = await fetch(`/api/board-standings?season=${season}`, {cache:'no-store'});
          data = await response.json();
          if (!response.ok || !data.ok) throw Error();
        } catch { data = null; error = 'Live standings unavailable. Retrying automatically in 5 minutes.'; }
        if (!root.isConnected) return;
        root.querySelectorAll(`[data-board-season="${season}"]`).forEach(el => {
          const item = items.find(i => i.id === el.dataset.boardId);
          el.innerHTML = card(item, data, error);
        });
      }));
    } catch { if (root.isConnected) root.innerHTML = '<p class="board-note">The Board could not be loaded. Please reload to try again.</p>'; }
    if (root.isConnected) refreshTimer = setTimeout(mount, 300000);
  }
  window.DynastyBoard = {mount};
})();
