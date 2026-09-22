(() => {
  const nativeFetch = window.fetch.bind(window);
  const MERGE = {
    P0038:'P0165', P0096:'P0490', P0168:'P0103', P0209:'P0105',
    P0150:'P0364', P0210:'P0222', P0294:'P0462', P0451:'P0381',
    P0406:'P0540', P0334:'P0540', P0288:'P0015', P0318:'P0032',
    P0436:'P0047', P0277:'P0054', P0419:'P0054', P0333:'P0055',
    P0069:'P0199', P0071:'P0188', P0086:'P0307', P0112:'P0194',
    P0477:'P0129', P0269:'P0136', P0226:'P0160', P0292:'P0363',
    P0514:'P0470', P0255:'P0303'
  };
  const NAMES = {
    P0165:'Marcus Morris Sr', P0490:'Jimmy Butler III', P0103:'Elfrid Payton',
    P0105:'Thad Young', P0364:'Kelly Oubre Jr', P0222:'Malik Beasley',
    P0462:'Jabari Smith Jr.', P0381:'Jaime Jaquez Jr.', P0540:'Dereck Lively II',
    P0015:'Collin Sexton', P0032:'Damian Lillard', P0047:'Dejounte Murray',
    P0054:'Bogdan Bogdanovic', P0055:'Spencer Dinwiddie', P0199:'Nicolas Batum',
    P0188:'Paul Millsap', P0307:'Malcolm Brogdon', P0194:'Victor Oladipo',
    P0129:'Giannis Antetokounmpo', P0136:'Bojan Bogdanovic', P0160:'Markelle Fultz',
    P0363:'Nic Claxton', P0470:'Kasparas Jakucionis', P0303:'Bones Hyland'
  };
  const canonical = id => MERGE[id] || id;
  const mergeDb = db => {
    if (!db || !Array.isArray(db.Players)) return db;
    const byId = new Map(db.Players.map(p => [p.Player_ID, p]));
    for (const [oldId,newId] of Object.entries(MERGE)) {
      const oldP=byId.get(oldId), newP=byId.get(newId);
      if (!oldP || !newP) continue;
      for (const key of ['ESPN_Player_ID','ESPN_Pro_Team_ID','ESPN_Default_Position_ID','ESPN_Active','ESPN_Injury_Status','ESPN_Last_Sync_Season','NBA_ID','NBA_Team','Position']) {
        if ((newP[key] == null || newP[key] === '') && oldP[key] != null && oldP[key] !== '') newP[key]=oldP[key];
      }
    }
    for (const p of db.Players) if (NAMES[p.Player_ID]) p.Player_Name=NAMES[p.Player_ID];
    db.Players = db.Players.filter(p => !MERGE[p.Player_ID]);
    for (const table of ['Rosters','Contracts','ESPN Rosters']) {
      for (const row of (db[table] || [])) if (row.Player_ID) row.Player_ID=canonical(row.Player_ID);
    }
    db.meta = db.meta || {};
    db.meta.player_merge = { applied:true, merged_records:Object.keys(MERGE).length, canonical_players:Object.keys(NAMES).length };
    return db;
  };
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const url = String(args[0]?.url || args[0] || '');
    if (!/data\/site-data\.json(?:\?|$)/.test(url)) return response;
    const db = mergeDb(await response.clone().json());
    return new Response(JSON.stringify(db), {status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
  };
})();
