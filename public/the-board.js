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
    const winsTracker = tracker.type === 'season-wins';
    const played = team ? team.wins + team.losses : 0;
    const active = data?.started && played > 0 && (winsTracker || team?.position);
    const remaining = team ? Math.max(0, (tracker.seasonGames || 82) - played) : null;
    const pace = played ? team.wins / played * (tracker.seasonGames || 82) : null;
    let ahead = null, settled = false;
    if (active && winsTracker) {
      settled = team.wins >= tracker.threshold || team.wins + remaining < tracker.threshold;
      if (team.wins >= tracker.threshold) ahead = tracker.yesParticipant;
      else if (team.wins + remaining < tracker.threshold) ahead = tracker.noParticipant;
      else if (pace !== (tracker.paceLine ?? tracker.threshold)) ahead = pace > (tracker.paceLine ?? tracker.threshold) ? tracker.yesParticipant : tracker.noParticipant;
    } else if (active) {
      ahead = team.position <= tracker.threshold ? tracker.yesParticipant : tracker.noParticipant;
      settled = data.final;
    }
    const status = error ? 'Update unavailable' : !data ? 'Loading standings…' : !data.started || (team && !played) ? 'Awaiting season' : !active ? 'Position pending' : settled ? `${ahead} wins` : !ahead ? 'Even pace' : winsTracker ? `${ahead} is ahead · pace` : `${ahead} is ahead`;
    const metrics = winsTracker
      ? `<div><span>Current wins</span><b>${team ? team.wins : '—'}</b></div><div><span>Projected wins · pace</span><b>${active ? pace.toFixed(1) : '—'}</b></div><div><span>Target</span><b>${escape(tracker.threshold)}+</b></div>`
      : `<div><span>${data?.final ? 'Final East position' : 'Current East position'}</span><b>${active ? ordinal(team.position) : '—'}</b></div><div><span>Miami record</span><b>${team ? `${team.wins}–${team.losses}` : '—'}</b></div><div><span>Target</span><b>Top ${escape(tracker.threshold)}</b></div>`;
    const note = winsTracker
      ? `Regular-season wins only. Green follows the current ${tracker.seasonGames}-game win pace until the result is clinched. ${team ? `${remaining} games remaining.` : ''}`
      : 'Final regular-season Eastern Conference position decides the result.';
    const season = `${item.season - 1}–${String(item.season).slice(-2)}`;
    return `<article class="board-card"><div class="board-card-top"><span class="board-kicker">${escape(season)} · Season challenge</span><span class="board-status ${ahead ? 'board-ahead' : ''}">${escape(status)}</span></div><h2>${item.participants.map(escape).join(' <span class="board-versus">vs.</span> ')}</h2><p class="board-challenge">${escape(item.challenge)}</p><div class="board-sides">${item.participants.map((name,i) => `<div class="${ahead === name ? 'board-leading' : ''}"><b>${escape(name)}</b><span>${escape(item.sides[i])}</span></div>`).join('')}</div><div class="board-metrics">${metrics}</div><div class="board-prize"><span>On the line</span><strong>${escape(item.onTheLine)}</strong></div><p class="board-note">${escape(note)}</p><div class="board-update">${error ? escape(error) : data ? `ESPN · Checked ${escape(new Date(data.updatedAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))} · Refreshes every 5 minutes` : 'Connecting to ESPN…'}</div></article>`;
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
