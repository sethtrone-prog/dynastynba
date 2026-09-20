// Isolated historical control test for the DynastyNBA 2024-25 manual tier sheet.
// ESPN seasonId 2024 = 2023-24 NBA regular season.
// This file is validation-only and is not imported by the production website.

export const allNba2024 = new Set([
  'Giannis Antetokounmpo','Luka Doncic','Shai Gilgeous-Alexander','Nikola Jokic','Jayson Tatum',
  'Jalen Brunson','Anthony Davis','Kevin Durant','Anthony Edwards','Kawhi Leonard',
  'Devin Booker','Stephen Curry','Tyrese Haliburton','LeBron James','Domantas Sabonis'
]);

export const tierD2024 = new Set([
  'Victor Wembanyama','Alperen Sengun','Scottie Barnes','Paolo Banchero','Cade Cunningham',
  'Evan Mobley','Chet Holmgren','Jalen Johnson','Jalen Williams','Franz Wagner','Jalen Duren',
  'Cam Thomas','Mark Williams','Jalen Green','Austin Reaves'
]);

// Historical A/B protection values transcribed from the uploaded manual control sheet.
// These are deliberately explicit so the engine can report when a result depends on protection.
export const protected2024 = new Map([
  ['Joel Embiid','A'],['Donovan Mitchell','A'],['Kyrie Irving','A'],['Ja Morant','A'],
  ['Julius Randle','A'],['Karl-Anthony Towns','A'],['Jimmy Butler','A'],['Bradley Beal','A'],
  ['Trae Young','B'],['Lauri Markkanen','B'],['LaMelo Ball','B'],['Kristaps Porzingis','B'],
  ['Jamal Murray','B'],['Deandre Ayton','B'],['Anfernee Simons','B'],['Terry Rozier','B'],
  ['Tyler Herro','B'],['Zach LaVine','B'],['Jerami Grant','B'],['Darius Garland','B'],
  ['Jakob Poeltl','B'],['Khris Middleton','B']
]);

export function calculateHistorical2024(players) {
  const ranked = [...players].sort((a,b)=>b.ppg-a.ppg);
  const result = ranked.map(p => {
    let tier = null, reason = null;
    if (tierD2024.has(p.player)) { tier='D'; reason='Tier D historical eligibility'; }
    else if (allNba2024.has(p.player)) { tier='A'; reason='2024 All-NBA'; }
    else if (protected2024.get(p.player)==='A') { tier='A'; reason='Historical Tier A protection'; }
    else if (protected2024.get(p.player)==='B') { tier='B'; reason='Historical Tier B protection'; }
    return {...p,tier,reason};
  });

  // Fill unassigned Tier B slots by PPG after A/D/protected classifications.
  // Boundary/tie behavior is intentionally surfaced rather than silently assumed.
  const alreadyB = result.filter(p=>p.tier==='B').length;
  const candidates = result.filter(p=>!p.tier);
  const slots = Math.max(0,50-alreadyB);
  const cutoff = slots ? candidates[Math.min(slots-1,candidates.length-1)]?.ppg : null;
  for (const p of candidates) {
    if (cutoff !== null && p.ppg >= cutoff) { p.tier='B'; p.reason='Tier B PPG field (including cutoff ties)'; }
    else { p.tier='C'; p.reason='Remaining player pool'; }
  }
  return result.map(p=>({...p,baseUnits:p.tier==='A'?3:p.tier==='B'?2:1}));
}
