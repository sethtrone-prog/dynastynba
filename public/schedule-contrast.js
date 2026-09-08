// Keep team names readable on the Schedule page's light matchup cards.
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .matchup-row .match-team b,
    .matchup-row .match-team strong,
    .matchup-row .match-vs {
      color:#0b2744 !important;
    }
    .matchup-row .match-team b {
      font-weight:800;
    }
  `;
  document.head.appendChild(style);
})();
