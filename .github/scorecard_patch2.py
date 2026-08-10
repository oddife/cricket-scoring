from pathlib import Path
import re

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')
if 'scorecardMatch' in s:
    raise SystemExit(0)

s = s.replace('type GlobalPlayer = {', '''type ScorecardMatch = {
  id: string;
  teamA: { id: string; name: string; shortName: string | null };
  teamB: { id: string; name: string; shortName: string | null };
  winnerId: string | null;
  oversPerInnings: number;
  inningsPerMatch: number;
  players: Array<{ playerId: string; player: GlobalPlayer; teamId: string }>;
  innings: Array<{ id: string; inningsNumber: number; totalRuns: number; wickets: number; legalBalls: number; battingTeamId: string; bowlingTeamId: string; deliveries: Array<{
    id: string; overNumber: number; ballNumber: number; bowlerId: string; strikerId: string; nonStrikerId: string; runsBat: number; runsExtra: number; runsTotal: number; isLegal: boolean; extraType: string | null; isWicket: boolean;
    striker: { id: string; name: string; jerseyNumber: number | null }; bowler: { id: string; name: string; jerseyNumber: number | null };
    wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null } | null;
  }> }>;
};

type GlobalPlayer = {''', 1)

m = re.search(r'const \[loadingCompletedMatches, setLoadingCompletedMatches\][\s\S]*?useState\(false\);', s)
assert m, 'completed state not found'
s = s[:m.start()] + 'const [loadingCompletedMatches, setLoadingCompletedMatches] = useState(false);\n  const [scorecardMatch, setScorecardMatch] = useState<ScorecardMatch | null>(null);\n  const [loadingScorecard, setLoadingScorecard] = useState(false);' + s[m.end():]

needle = '  async function resumeMatch(matchId: string) {'
assert needle in s
s = s.replace(needle, '''  async function openScorecard(matchId: string) {
    try {
      setLoadingScorecard(true);
      setError("");
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load scorecard.");
      setScorecardMatch(data.match ?? data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load scorecard.");
    } finally {
      setLoadingScorecard(false);
    }
  }

''' + needle, 1)

old = re.compile(r'                    <button\n\s+type="button"\n\s+disabled\n\s+title="Scorecard will be added next"\n\s+className="h-11 shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 font-semibold text-emerald-400"\n\s+>\n\s+Scorecard\n\s+</button>')
new = '''                    <button type="button" onClick={() => void openScorecard(match.id)} disabled={loadingScorecard} className="h-11 shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50">
                      {loadingScorecard ? "Loading..." : "Scorecard"}
                    </button>'''
s, n = old.subn(new, s, count=1)
assert n == 1, 'scorecard button not found'

marker = '      <CreateTournament />\n      <AddTeamModal />'
assert marker in s
modal = '''      {scorecardMatch && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-4 w-full max-w-6xl rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:my-8 sm:p-6 [color-scheme:dark]">
            {(() => {
              const match = scorecardMatch;
              const teamName = (id: string) => id === match.teamA.id ? match.teamA.name : match.teamB.name;
              const playerName = (id: string) => match.players.find((item) => item.playerId === id)?.player.name ?? "Player";
              return <>
                <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Match Scorecard</p><h2 className="mt-1 text-2xl font-black">{match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}</h2><p className="mt-2 text-sm text-slate-500">{match.oversPerInnings} overs · {match.inningsPerMatch} innings</p></div><button type="button" onClick={() => setScorecardMatch(null)} className="h-10 rounded-xl border border-slate-700 px-4 font-semibold text-slate-300">Close</button></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">{match.innings.map((i) => <div key={i.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center justify-between"><div><p className="text-xs uppercase text-slate-500">Innings {i.inningsNumber}</p><p className="mt-1 font-bold">{teamName(i.battingTeamId)}</p></div><div className="text-right"><p className="text-3xl font-black">{i.totalRuns}/{i.wickets}</p><p className="text-xs text-slate-500">{Math.floor(i.legalBalls/6)}.{i.legalBalls%6} overs</p></div></div></div>)}</div>
                <div className="mt-6 space-y-6">{match.innings.map((i) => { const bat=new Map<string,{r:number;b:number;f:number;s:number;out:boolean;d:string}>(); const bowl=new Map<string,{b:number;r:number;w:number}>(); const fall:Array<{p:string;score:number;over:string}>=[]; let score=0; for(const x of i.deliveries){const a=bat.get(x.strikerId)||{r:0,b:0,f:0,s:0,out:false,d:""};a.r+=x.runsBat;if(x.isLegal)a.b++;if(x.runsBat===4)a.f++;if(x.runsBat===6)a.s++;if(x.isWicket&&x.wicket?.dismissedPlayerId===x.strikerId){a.out=true;a.d=x.wicket.type.replaceAll("_"," ");fall.push({p:x.striker.name,score:score+x.runsTotal,over:`${x.overNumber}.${x.ballNumber}`})}bat.set(x.strikerId,a);const q=bowl.get(x.bowlerId)||{b:0,r:0,w:0};if(x.isLegal)q.b++;q.r+=x.runsTotal;if(x.isWicket&&x.wicket?.bowlerId===x.bowlerId)q.w++;bowl.set(x.bowlerId,q);score+=x.runsTotal;} return <section key={i.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"><div className="flex justify-between border-b border-slate-800 pb-4"><h3 className="text-xl font-black">{teamName(i.battingTeamId)}</h3><b className="text-2xl">{i.totalRuns}/{i.wickets}</b></div><div className="mt-5 grid gap-6 lg:grid-cols-2"><div><div className="mb-2 grid grid-cols-[1fr_45px_45px_40px_40px_55px] text-[11px] font-bold uppercase text-slate-500"><span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>{Array.from(bat).map(([id,v])=><div key={id} className="grid grid-cols-[1fr_45px_45px_40px_40px_55px] items-center py-2 text-sm"><div><b>{playerName(id)}{!v.out?" *":""}</b><p className="text-[10px] uppercase text-slate-500">{v.out?v.d:"not out"}</p></div><b>{v.r}</b><span>{v.b}</span><span>{v.f}</span><span>{v.s}</span><span>{v.b?(v.r/v.b*100).toFixed(2):"0.00"}</span></div>)}</div><div><div className="mb-2 grid grid-cols-[1fr_45px_45px_45px_55px] text-[11px] font-bold uppercase text-slate-500"><span>Bowler</span><span>O</span><span>R</span><span>W</span><span>ECON</span></div>{Array.from(bowl).map(([id,v])=><div key={id} className="grid grid-cols-[1fr_45px_45px_45px_55px] items-center py-2 text-sm"><b>{playerName(id)}</b><span>{Math.floor(v.b/6)}.{v.b%6}</span><span>{v.r}</span><span>{v.w}</span><span>{v.b?(v.r/v.b*6).toFixed(2):"0.00"}</span></div>)}</div></div>{fall.length>0&&<div className="mt-4 border-t border-slate-800 pt-4"><p className="text-xs font-bold uppercase text-slate-500">Fall of Wickets</p><div className="mt-2 flex flex-wrap gap-2">{fall.map((f,n)=><span key={n} className="rounded-lg bg-slate-800 px-3 py-2 text-xs"><b>{n+1}-{f.score}</b> {f.p} ({f.over})</span>)}</div></div>}<div className="mt-4 border-t border-slate-800 pt-4"><p className="text-xs font-bold uppercase text-slate-500">Ball by Ball</p><div className="mt-3 flex flex-wrap gap-2">{i.deliveries.map((d)=><span key={d.id} title={`${d.bowler.name} to ${d.striker.name}`} className={`rounded-full px-3 py-2 text-xs font-bold ${d.isWicket?"bg-red-500 text-white":d.runsTotal===4||d.runsTotal===6?"bg-blue-500 text-white":"bg-slate-800 text-slate-300"}`}>{d.isWicket?"W":d.extraType?`${d.runsTotal} ${d.extraType.replaceAll("_"," ")}`:d.runsBat}</span>)}</div></div></section>})}</div>
              </>;
            })()}
          </div>
        </div>
      )}

      <CreateTournament />
      <AddTeamModal />'''
s=s.replace(marker,modal,1)
p.write_text(s,encoding='utf-8')
print('patched')
