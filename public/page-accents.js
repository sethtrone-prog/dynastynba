/* Route-scoped color accents; no roster, scoring, or layout changes. */
(function(){
const style=document.createElement('style');
style.id='page-color-accents';
style.textContent=`
#app.accent-team .section-title h2,#app.accent-team .team-subhead h2,
#app.accent-wins .section-title h2,#app.accent-history .section-title h2{color:#d9a93b}
#app.accent-team .player-link,#app.accent-team .contract-player-col .player-link,
#app.accent-team .owner-timeline p,#app.accent-team .rivals-table .inline-link{color:#9ac9eb}
#app.accent-team .team-record-panel b,#app.accent-team .team-kpi-row b,
#app.accent-team .snapshot-list b,#app.accent-team .archive-facts b,
#app.accent-team .future-pick-year-title,#app.accent-team .pick-card-no,
#app.accent-team .owner-timeline b,#app.accent-team .rivals-card-stats b{color:#d9a93b}
#app.accent-team .contract-year-head,#app.accent-team .future-picks-table thead th,
#app.accent-team .team-table thead th,#app.accent-team .rivals-table thead th{color:#9ac9eb}
#app.accent-team .contract-year-total,#app.accent-team .team-total-row{color:#d9a93b}
#app.accent-wins .wins-pool-standings-table thead th,
#app.accent-wins .owner-selections-table thead th{color:#d9a93b}
#app.accent-wins .wins-pool-standings-table td:nth-child(2) b{color:#9ac9eb}
#app.accent-wins .wins-pool-standings-table td:nth-child(4){color:#6ee7a5;font-weight:700}
#app.accent-wins .owner-selections-table .record{color:#dce9f3}
#app.accent-history .history-summary b,#app.accent-history .historical-summary b,
#app.accent-history .history-season-year,#app.accent-history .history-season-stats b{color:#d9a93b}
#app.accent-history .ownership-head b,#app.accent-history .ownership-row button b,
#app.accent-history .playoff-finish.runner b,#app.accent-history .playoff-other b{color:#9ac9eb}
#app.accent-history .playoff-finish.champion b{color:#f2c55d}
#app.accent-history #statTable tbody td:first-child,
#app.accent-history #statTable tbody td:first-child b,
#app.accent-history .performance-table td:nth-child(2),
#app.accent-history .performance-table td:nth-child(2) b{color:#9ac9eb}
#app.accent-history .performance-table td:nth-child(4){color:#6ee7a5}
`;
document.head.appendChild(style);
function scope(){
const route=window.DynastyLocation.hash.replace(/^#\/?/,'').split('/')[0];
const app=document.getElementById('app');if(!app)return;
app.classList.toggle('accent-team',route==='team');
app.classList.toggle('accent-wins',route==='wins-pool');
app.classList.toggle('accent-history',route==='history'||route==='statistics');
}
window.addEventListener('hashchange',scope);scope();
})();