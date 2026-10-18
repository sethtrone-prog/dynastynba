#!/usr/bin/env python3
"""Rebuild the leaderboard daily; preserve full current-era box scores for corrections."""
import argparse, gzip, concurrent.futures, datetime as dt, io, json, os, time, urllib.request
from pathlib import Path
import pyarrow.parquet as pq

from zoneinfo import ZoneInfo

BASE='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/'
FIELDS=['points','rebounds_total','assists','steals','blocks','turnovers','field_goals_made','field_goals_attempted','free_throws_made','free_throws_attempted']

def fetch(url, binary=False):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'DynastyNBA leaderboard updater'}),timeout=45) as r:
                raw=r.read()
            if raw[:2]==b'\x1f\x8b':raw=gzip.decompress(raw)
            return raw if binary else json.loads(raw)
        except Exception:
            if attempt==2: raise
            time.sleep(attempt+1)

def fantasy(r):
    return r['points']+.75*(r['rebounds_total']+r['assists'])+r['steals']+r['blocks']-r['turnovers']-.5*((r['field_goals_attempted']-r['field_goals_made'])+(r['free_throws_attempted']-r['free_throws_made']))

def archive(year,local=None):
    def read(kind):
        name=f'box-{year}.parquet' if kind=='boxscores' else f'{year}.parquet'
        if local and (Path(local)/name).exists():return pq.read_table(Path(local)/name).to_pylist()
        release='nba_stats_player_boxscores' if kind=='boxscores' else 'nba_stats_player_game_logs'
        stem='player_boxscores' if kind=='boxscores' else 'player_game_logs'
        return pq.read_table(io.BytesIO(fetch(f'https://github.com/sportsdataverse/sportsdataverse-data/releases/download/{release}/{stem}_{year}.parquet',True))).to_pylist()
    games={(r['game_id'],r['team_id']):r for r in read('logs')}
    rows=[]
    for r in read('boxscores'):
        if str(r['season_type_id'])!='2':continue
        game=games.get((r['game_id'],r['team_id']))
        if not game:raise ValueError(f'Missing archived game {r["game_id"]}')
        item={k:r[k] for k in FIELDS}
        if any(v is None for v in item.values()):raise ValueError('Incomplete archived stats')
        item.update(name=r['first_name']+' '+r['family_name'],game_date=game['game_date'],matchup=game['matchup'],game_id=r['game_id'],person_id=r['person_id'],season=year,sourceUrl=f'https://www.nba.com/game/{r["game_id"]}/box-score')
        rows.append(item)
    if len(rows)<20000:raise ValueError(f'Incomplete archived season {year}')
    return rows

def parse_summary(summary,event):
    header=summary.get('header',{})
    if int(header.get('season',{}).get('type',0))!=2:raise ValueError('Not regular season')
    comps=header.get('competitions',[])
    if not comps or not comps[0].get('status',{}).get('type',{}).get('completed'):raise ValueError('Unfinished game')
    teams=summary.get('boxscore',{}).get('players',[])
    if len(teams)!=2:raise ValueError('Missing team box score')
    rows=[]
    for team in teams:
        own=team['team'];other=next(t['team'] for t in teams if str(t['team']['id'])!=str(own['id']))
        competitor=next(c for c in comps[0]['competitors'] if str(c['team']['id'])==str(own['id']))
        matchup=own['abbreviation']+(' vs. ' if competitor['homeAway']=='home' else ' @ ')+other['abbreviation']
        group=team['statistics'][0];labels=group.get('names') or group['labels'];total=0;played=0
        for player in group.get('athletes',[]):
            if player.get('didNotPlay'):continue
            stats=dict(zip(labels,player.get('stats',[])))
            required=['PTS','REB','AST','STL','BLK','TO','FG','FT']
            if any(k not in stats or stats[k] in ('','--') for k in required):raise ValueError('Missing player statistics')
            fgm,fga=map(int,stats['FG'].split('-'));ftm,fta=map(int,stats['FT'].split('-'))
            row=dict(zip(FIELDS,[int(stats['PTS']),int(stats['REB']),int(stats['AST']),int(stats['STL']),int(stats['BLK']),int(stats['TO']),fgm,fga,ftm,fta]))
            row.update(name=player['athlete']['displayName'],person_id='ESPN:'+str(player['athlete']['id']),game_id='ESPN:'+str(event['id']),game_date=dt.datetime.fromisoformat(event['date'].replace('Z','+00:00')).astimezone(ZoneInfo('America/New_York')).date().isoformat(),matchup=matchup,season=int(header['season']['year']),sourceUrl=f'https://www.espn.com/nba/boxscore/_/gameId/{event["id"]}')
            rows.append(row);total+=row['points'];played+=1
        if not played or total!=int(competitor['score']):raise ValueError('Incomplete team scoring totals')
    return rows

def current_events(today,cache):
    year=today.year+(today.month>=9)
    start=dt.date(year-1,10,1)
    current=fetch(BASE+'scoreboard?dates='+today.strftime('%Y%m%d')+'&limit=100')
    calendar=current.get('leagues',[{}])[0].get('calendar')
    if not isinstance(calendar,list):raise ValueError('Missing ESPN season calendar')
    dates=sorted({str(d)[:10] for d in calendar if isinstance(d,str) and start.isoformat()<=d[:10]<=today.isoformat()})
    checked=set(cache.get('checkedDates',[]));cutoff=(today-dt.timedelta(days=14)).isoformat()
    pending=[d for d in dates if d not in checked or d>=cutoff]
    events={}
    def day(date):
        data=current if date==today.isoformat() else fetch(BASE+'scoreboard?dates='+date.replace('-','')+'&limit=100')
        if 'events' not in data or len(data['events'])>=100:raise ValueError('Invalid or truncated ESPN schedule')
        return date,data['events']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for date,items in pool.map(day,pending):
            for e in items:
                if int(e.get('season',{}).get('year',0))==year and int(e.get('season',{}).get('type',0))==2 and e.get('status',{}).get('type',{}).get('completed'):
                    events[str(e['id'])]=e
            checked.add(date)
    cache['checkedDates']=sorted(checked)
    return year,events

def rebuild(today,cache,archives_dir=None):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        historical=[r for season in pool.map(lambda y:archive(y,archives_dir),range(2019,2027)) for r in season]
    year,events=current_events(today,cache)
    # Retain every game's stats, not only top-50 candidates, so corrections can
    # move a formerly lower-ranked performance into the leaderboard.
    saved=cache.setdefault('games',{})
    cutoff=(today-dt.timedelta(days=14)).isoformat()
    pending=[e for k,e in events.items() if k not in saved or e['date'][:10]>=cutoff]
    def get(e):return str(e['id']),parse_summary(fetch(BASE+'summary?event='+str(e['id'])),e)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for game_id,rows in pool.map(get,pending):saved[game_id]={'season':year,'rows':rows}
    # If ESPN retracts a recent event, remove its cached results as well.
    for k in list(saved):
        row=saved[k]
        if row['season']==year and row['rows'][0]['game_date']>=cutoff and k not in events:del saved[k]
    all_rows=historical+[r for game in saved.values() for r in game['rows']]
    unique={(r['game_id'],r['person_id']):r for r in all_rows}
    for r in unique.values():r['fantasy']=fantasy(r)
    ordered=sorted(unique.values(),key=lambda r:(-r['fantasy'],-r['points'],r['game_date'],str(r['person_id'])))[:50]
    for i,r in enumerate(ordered):r['rank']=next(j+1 for j,g in enumerate(ordered) if g['fantasy']==r['fantasy'])
    output={'updatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'checkedThrough':today.isoformat(),'updateFrequency':'daily','playerBoxScoresReviewed':len(unique),'formula':'PTS + 0.75 × (REB + AST) + STL + BLK − TO − 0.5 × ((FGA − FGM) + (FTA − FTM))','games':ordered}
    cache['checkedThrough']=today.isoformat();return output

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='public/data/top-performances.json');parser.add_argument('--cache',default='data/performance-game-cache.json');parser.add_argument('--archives-dir');args=parser.parse_args()
    cache_path=Path(args.cache);cache=json.loads(cache_path.read_text()) if cache_path.exists() else {'games':{}}
    from zoneinfo import ZoneInfo
    today=dt.datetime.now(ZoneInfo('America/New_York')).date()
    output=rebuild(today,cache,args.archives_dir)
    # Write only after all required upstreams have succeeded; never publish a
    # partial leaderboard after a failed feed or incomplete box score.
    cache_path.parent.mkdir(parents=True,exist_ok=True);Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    cache_path.write_text(json.dumps(cache,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n')
    Path(args.output).write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(f'Updated top 50 from {output["playerBoxScoresReviewed"]:,} box scores; checked through {today}; cached {len(cache["games"])} live-era games.')
if __name__=='__main__':main()
