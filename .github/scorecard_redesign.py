from pathlib import Path
import re

p = Path("src/app/page.tsx")
s = p.read_text()

old_type = re.search(r'type ScorecardMatch = \{.*?\n\};\n\ntype GlobalPlayer', s, re.S)
if not old_type:
    raise SystemExit("ScorecardMatch type not found")
new_type = '''type ScorecardMatch = {
  id: string;
  status: string;
  teamA: { id: string; name: string; shortName: string | null };
  teamB: { id: string; name: string; shortName: string | null };
  tossWinnerId: string | null;
  tossDecision: "BAT" | "BOWL" | null;
  tossWinner: { id: string; name: string; shortName: string | null } | null;
  winnerId: string | null;
  winner: { id: string; name: string; shortName: string | null } | null;
  bowlingMode: BowlingMode;
  oversPerInnings: number;
  inningsPerMatch: number;
  players: Array<{ playerId: string; player: GlobalPlayer; teamId: string }>;
  innings: Array<{ id: string; inningsNumber: number; totalRuns: number; wickets: number; legalBalls: number; target: number | null; battingTeamId: string; bowlingTeamId: string; deliveries: Array<{
    id: string; overNumber: number; ballNumber: number; bowlerId: string; strikerId: string; nonStrikerId: string; runsBat: number; runsExtra: number; runsTotal: number; isLegal: boolean; extraType: string | null; isWicket: boolean;
    striker: { id: string; name: string; jerseyNumber: number | null }; bowler: { id: string; name: string; jerseyNumber: number | null };
    wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null } | null;
  }> }>;
};

type GlobalPlayer'''
s = s[:old_type.start()] + new_type + s[old_type.end():]

start = s.find('      {scorecardMatch && (\n')
if start < 0:
    raise SystemExit("scorecard modal start not found")
end = s.find('\n      <CreateTournament />', start)
if end < 0:
    raise SystemExit("scorecard modal end marker not found")

new_modal = '''      {scorecardMatch && (
        <div className="scorecard-print-root fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-2 w-full max-w-6xl rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl sm:my-4 sm:p-6 [color-scheme:light]">
            {(() => {
              const match = scorecardMatch;
              const teamName = (id: string) => id === match.teamA.id ? match.teamA.name : match.teamB.name;
              const teamShortName = (id: string) => id === match.teamA.id ? (match.teamA.shortName ?? match.teamA.name) : (match.teamB.shortName ?? match.teamB.name);
              const playerName = (id: string) => match.players.find((item) => item.playerId === id)?.player.name ?? "Player";
              const teamAInnings = match.innings.filter((item) => item.battingTeamId === match.teamA.id).sort((a, b) => a.inningsNumber - b.inningsNumber);
              const teamBInnings = match.innings.filter((item) => item.battingTeamId === match.teamB.id).sort((a, b) => a.inningsNumber - b.inningsNumber);
              const scoreText = (inning: (typeof match.innings)[number] | undefined) => inning ? `${inning.totalRuns}/${inning.wickets}` : "—/—";
              const orderedInnings = [...match.innings].sort((a, b) => a.inningsNumber - b.inningsNumber);
              const finalInning = orderedInnings[orderedInnings.length - 1];
              const targetInning = match.innings.find((item) => item.target != null) ?? finalInning;
              const target = targetInning?.target ?? null;
              const targetTeam = targetInning ? teamShortName(targetInning.battingTeamId) : "";
              const matchStatus = String(match.status).toUpperCase();
              const resultText = match.winner ? `${match.winner.shortName ?? match.winner.name} won` : matchStatus === "COMPLETED" ? "Match completed" : "In Progress";
              const tossText = match.tossWinner ? `${match.tossWinner.shortName ?? match.tossWinner.name} won · elected to ${match.tossDecision === "BOWL" ? "bowl" : "bat"}` : "—";
              const bowlingText = match.bowlingMode === "DOUBLE" ? "Double Bowler" : "Normal Bowling";
              const displayInningsNumber = matchStatus === "COMPLETED" ? (orderedInnings.length || 1) : (orderedInnings[orderedInnings.length - 1]?.inningsNumber ?? 1);

              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Match</p>
                      <div className="mt-2 rounded-xl bg-slate-100 px-4 py-3">
                        <h2 className="text-xl font-black">{selectedTournament?.name ?? "Cricket Match"}</h2>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Innings {displayInningsNumber} of {match.inningsPerMatch}</p>
                    </div>
                    <div className="scorecard-no-print flex shrink-0 gap-2 pt-5">
                      <button type="button" onClick={exportScorecardPdf} className="h-9 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">Export PDF</button>
                      <button type="button" onClick={() => setScorecardMatch(null)} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600">Close</button>
                    </div>
                  </div>

                  <div className={`mt-3 grid items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white ${match.inningsPerMatch === 4 ? "grid-cols-[auto_repeat(2,minmax(0,1fr))_auto_repeat(2,minmax(0,1fr))_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]"}`}>
                    <div className="flex items-center px-3 text-lg font-black text-blue-700">1</div>
                    {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {
                      const inning = teamAInnings[index];
                      return <div key={`a-${index}`} className="border-l border-slate-100 px-3 py-2 text-center"><p className="text-base font-black">{scoreText(inning)}</p><p className="text-[10px] text-slate-400">({index + 1})</p></div>;
                    })}
                    <div className="flex items-center justify-center px-2 text-sm font-black text-slate-400">VS</div>
                    {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {
                      const inning = teamBInnings[index];
                      return <div key={`b-${index}`} className="border-l border-slate-100 px-3 py-2 text-center"><p className="text-base font-black">{scoreText(inning)}</p><p className="text-[10px] text-slate-400">({index + 1})</p></div>;
                    })}
                    <div className="flex items-center justify-end px-3 text-lg font-black text-emerald-700">2</div>
                  </div>

                  <div className="mt-4 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                    <section>
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Match Format</h3>
                      <dl className="mt-3 space-y-2.5 text-sm">
                        <div className="flex justify-between gap-4"><dt>Overs per Innings</dt><dd className="font-bold">{match.oversPerInnings}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Innings</dt><dd className="font-bold">{match.inningsPerMatch}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Toss</dt><dd className="text-right font-bold">{tossText}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Bowling</dt><dd className="text-right font-bold">{bowlingText}</dd></div>
                      </dl>
                    </section>

                    <section>
                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Innings Details</h3>
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 bg-slate-50"><div className="border-r border-slate-200 px-3 py-2 text-center font-bold text-blue-700">{teamShortName(match.teamA.id)}</div><div className="px-3 py-2 text-center font-bold text-emerald-700">{teamShortName(match.teamB.id)}</div></div>
                        {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => <div key={index} className="grid grid-cols-2 border-t border-slate-200 text-sm"><div className="flex justify-between gap-3 border-r border-slate-200 px-3 py-2.5"><span>Inning {index + 1}</span><b>{scoreText(teamAInnings[index])}</b></div><div className="flex justify-between gap-3 px-3 py-2.5"><span>Inning {index + 1}</span><b>{scoreText(teamBInnings[index])}</b></div></div>)}
                      </div>
                      {target != null && <div className="mt-3 border-t border-slate-300 pt-2 text-sm">Target for <b>{targetTeam}</b> (batting last) in <b>inning {match.inningsPerMatch}</b>: <b className="text-emerald-700">{target} runs</b></div>}
                    </section>
                  </div>

                  <div className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-bold ${matchStatus === "COMPLETED" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}><span className="mr-3">{matchStatus === "COMPLETED" ? "✓ COMPLETED" : "● LIVE"}</span><span>{resultText}</span></div>

                  <div className="mt-5 space-y-5">
                    {match.innings.map((i) => {
                      const bat = new Map<string, { r: number; b: number; f: number; s: number; out: boolean; d: string }>();
                      const bowl = new Map<string, { b: number; r: number; w: number }>();
                      const fall: Array<{ p: string; score: number; over: string }> = [];
                      let score = 0;
                      for (const x of i.deliveries) {
                        const a = bat.get(x.strikerId) || { r: 0, b: 0, f: 0, s: 0, out: false, d: "" };
                        a.r += x.runsBat; if (x.isLegal) a.b++; if (x.runsBat === 4) a.f++; if (x.runsBat === 6) a.s++;
                        if (x.isWicket && x.wicket?.dismissedPlayerId === x.strikerId) { a.out = true; a.d = x.wicket.type.replaceAll("_", " "); fall.push({ p: playerName(x.strikerId), score: score + x.runsTotal, over: `${x.overNumber}.${x.ballNumber}` }); }
                        bat.set(x.strikerId, a);
                        const q = bowl.get(x.bowlerId) || { b: 0, r: 0, w: 0 }; if (x.isLegal) q.b++; q.r += x.runsTotal; if (x.isWicket && x.wicket?.bowlerId === x.bowlerId) q.w++; bowl.set(x.bowlerId, q); score += x.runsTotal;
                      }
                      return (
                        <section key={i.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Innings {i.inningsNumber}</p><h3 className="font-black">{teamName(i.battingTeamId)}</h3></div><b className="text-xl">{i.totalRuns}/{i.wickets}</b></div>
                          <div className="mt-3 grid gap-4 lg:grid-cols-2">
                            <div><div className="mb-1 grid grid-cols-[1fr_40px_40px_35px_35px_50px] text-[10px] font-bold uppercase text-slate-400"><span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>{Array.from(bat).map(([id, v]) => <div key={id} className="grid grid-cols-[1fr_40px_40px_35px_35px_50px] items-center py-1.5 text-xs"><div><b>{playerName(id)}{!v.out ? " *" : ""}</b><p className="text-[9px] uppercase text-slate-400">{v.out ? v.d : "not out"}</p></div><b>{v.r}</b><span>{v.b}</span><span>{v.f}</span><span>{v.s}</span><span>{v.b ? (v.r / v.b * 100).toFixed(2) : "0.00"}</span></div>)}</div>
                            <div><div className="mb-1 grid grid-cols-[1fr_40px_40px_40px_50px] text-[10px] font-bold uppercase text-slate-400"><span>Bowler</span><span>O</span><span>R</span><span>W</span><span>ECON</span></div>{Array.from(bowl).map(([id, v]) => <div key={id} className="grid grid-cols-[1fr_40px_40px_40px_50px] items-center py-1.5 text-xs"><b>{playerName(id)}</b><span>{Math.floor(v.b / 6)}.{v.b % 6}</span><span>{v.r}</span><span>{v.w}</span><span>{v.b ? (v.r / v.b * 6).toFixed(2) : "0.00"}</span></div>)}</div>
                          </div>
                          {fall.length > 0 && <div className="mt-3 border-t border-slate-200 pt-2"><p className="text-[10px] font-bold uppercase text-slate-400">Fall of Wickets</p><div className="mt-1 flex flex-wrap gap-1.5">{fall.map((f, n) => <span key={n} className="rounded-md bg-slate-100 px-2 py-1 text-[10px]"><b>{n + 1}-{f.score}</b> {f.p} ({f.over})</span>)}</div></div>}
                          <div className="mt-3 border-t border-slate-200 pt-2"><p className="text-[10px] font-bold uppercase text-slate-400">Ball by Ball</p><div className="mt-1.5 flex flex-wrap gap-1">{i.deliveries.map((d) => <span key={d.id} title={`${playerName(d.bowlerId)} to ${playerName(d.strikerId)}`} className={`rounded-full px-2 py-1 text-[10px] font-bold ${d.isWicket ? "bg-red-500 text-white" : d.runsTotal === 4 || d.runsTotal === 6 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"}`}>{d.isWicket ? "W" : d.extraType ? `${d.runsTotal} ${d.extraType.replaceAll("_", " ")}` : d.runsBat}</span>)}</div></div>
                        </section>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}'''

s = s[:start] + new_modal + s[end:]
p.write_text(s)
