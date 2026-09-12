"use client";

type ScorecardModalProps = {
  scorecardMatch: any;
  selectedTournament: any;
  exportScorecardPdf: () => void;
  setScorecardMatch: (value: any) => void;
};

export default function ScorecardModal({
  scorecardMatch,
  selectedTournament,
  exportScorecardPdf,
  setScorecardMatch,
}: ScorecardModalProps) {
  if (!scorecardMatch) return null;

  const match = scorecardMatch;
  const teamName = (id: string) => id === match.teamA.id ? match.teamA.name : match.teamB.name;
  const teamShortName = (id: string) => id === match.teamA.id ? (match.teamA.shortName ?? match.teamA.name) : (match.teamB.shortName ?? match.teamB.name);
  const playerName = (id: string) => match.players.find((item: any) => item.playerId === id)?.player.name ?? "Player";
  const dismissalText = (wicket: any) => {
    const bowler = wicket.bowlerId ? playerName(wicket.bowlerId) : "Bowler";
    const fielder = wicket.fielderId ? playerName(wicket.fielderId) : "";
    switch (wicket.type) {
      case "BOWLED": return `b ${bowler}`;
      case "CAUGHT": return fielder ? `c ${fielder}\u00a0\u00a0\u00a0b ${bowler}` : `c b ${bowler}`;
      case "LBW": return `lbw b ${bowler}`;
      case "RUN_OUT": return fielder ? `run out (${fielder})` : "run out";
      case "STUMPED": return fielder ? `st ${fielder}\u00a0\u00a0\u00a0b ${bowler}` : `st b ${bowler}`;
      case "HIT_WICKET": return `hit wicket b ${bowler}`;
      case "RETIRED_OUT": return "retired out";
      case "RETIRED_HURT": return "retired hurt";
      case "OVER_FENCE": return "over fence";
      default: return "out";
    }
  };
  const teamAInnings = match.innings.filter((item: any) => item.battingTeamId === match.teamA.id).sort((a: any, b: any) => a.inningsNumber - b.inningsNumber);
  const teamBInnings = match.innings.filter((item: any) => item.battingTeamId === match.teamB.id).sort((a: any, b: any) => a.inningsNumber - b.inningsNumber);
  const scoreText = (inning: any) => inning ? `${inning.totalRuns}/${inning.wickets}` : "-/-";
  const orderedInnings = [...match.innings].sort((a: any, b: any) => a.inningsNumber - b.inningsNumber);
  const finalInning = orderedInnings[orderedInnings.length - 1];
  const targetInning = match.innings.find((item: any) => item.target != null) ?? finalInning;
  const target = targetInning?.target ?? null;
  const targetTeam = targetInning ? teamShortName(targetInning.battingTeamId) : "";
  const matchStatus = String(match.status).toUpperCase();
  const resultText = match.winner ? `${match.winner.shortName ?? match.winner.name} won` : matchStatus === "COMPLETED" ? "Match completed" : "In Progress";
  const tossText = match.tossWinner ? `${match.tossWinner.shortName ?? match.tossWinner.name} won  -  elected to ${match.tossDecision === "BOWL" ? "bowl" : "bat"}` : "-";
  const bowlingText = match.bowlingMode === "DOUBLE" ? "Double Bowler" : "Normal Bowling";
  const displayInningsNumber = matchStatus === "COMPLETED" ? (orderedInnings.length || 1) : (orderedInnings[orderedInnings.length - 1]?.inningsNumber ?? 1);

  return (
    <div className="scorecard-print-root fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto my-2 w-full max-w-6xl rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl sm:my-4 sm:p-6 [color-scheme:light]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Match</p>
            <div className="mt-2 rounded-xl bg-slate-100 px-4 py-3"><h2 className="text-xl font-black">{selectedTournament?.name ?? "Cricket Match"}</h2></div>
            <p className="mt-2 text-sm text-slate-500">Innings {displayInningsNumber} of {match.inningsPerMatch}</p>
          </div>
          <div className="scorecard-no-print flex shrink-0 gap-2 pt-5">
            <button type="button" onClick={exportScorecardPdf} className="h-9 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">Export PDF</button>
            <button type="button" onClick={() => setScorecardMatch(null)} className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600">Close</button>
          </div>
        </div>

        <div className="mt-3 grid items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
          <div className="flex items-center px-2 text-sm font-black text-blue-700 sm:px-3 sm:text-base">{teamShortName(match.teamA.id)}</div>
          <div className={`grid min-w-0 ${match.inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {
              const inning = teamAInnings[index];
              return <div key={`a-${index}`} className="border-l border-slate-100 px-2 py-2 text-center sm:px-3"><p className="truncate text-sm font-black sm:text-base">{scoreText(inning)}</p><p className="text-[10px] text-slate-400">({index + 1})</p></div>;
            })}
          </div>
          <div className="flex items-center justify-center px-2 text-xs font-black text-slate-400 sm:text-sm">VS</div>
          <div className={`grid min-w-0 ${match.inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {
              const inning = teamBInnings[index];
              return <div key={`b-${index}`} className="border-l border-slate-100 px-2 py-2 text-center sm:px-3"><p className="truncate text-sm font-black sm:text-base">{scoreText(inning)}</p><p className="text-[10px] text-slate-400">({index + 1})</p></div>;
            })}
          </div>
          <div className="flex items-center justify-end px-2 text-sm font-black text-emerald-700 sm:px-3 sm:text-base">{teamShortName(match.teamB.id)}</div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <section><h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Match Format</h3><dl className="mt-2 grid gap-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Overs per Innings</dt><dd className="font-bold">{match.oversPerInnings}</dd></div><div className="flex justify-between gap-4"><dt>Innings</dt><dd className="font-bold">{match.inningsPerMatch}</dd></div></dl></section>
          <section><h3 className="sr-only">Match Details</h3><dl className="grid gap-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Toss</dt><dd className="text-right font-bold">{tossText}</dd></div><div className="flex justify-between gap-4"><dt>Bowling</dt><dd className="text-right font-bold">{bowlingText}</dd></div></dl></section>
        </div>
        <div className={`mt-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 text-sm font-bold sm:flex-row sm:items-center sm:justify-between ${matchStatus === "COMPLETED" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}><div className="flex items-center gap-3 whitespace-nowrap"><span>{matchStatus === "COMPLETED" ? "COMPLETED" : "LIVE"}</span><span>{resultText}</span></div>{target != null && <div className="text-xs font-semibold text-slate-700 sm:text-right">Target for <b>{targetTeam}</b> (batting last) in <b>inning {match.inningsPerMatch}</b>: <b className="text-emerald-700">{target} runs</b></div>}</div>

        <div className="mt-5 space-y-5">
          {match.innings.map((i: any) => {
            const bat = new Map<string, { r: number; b: number; f: number; s: number; out: boolean; d: string }>();
            const bowl = new Map<string, { b: number; r: number; w: number }>();
            const fall: Array<{ p: string; score: number; over: string }> = [];
            let score = 0;
            for (const x of i.deliveries) {
              const a = bat.get(x.strikerId) || { r: 0, b: 0, f: 0, s: 0, out: false, d: "" };
              a.r += x.runsBat; if (x.isLegal) a.b++; if (x.runsBat === 4) a.f++; if (x.runsBat === 6) a.s++;
              if (x.isWicket && x.wicket?.dismissedPlayerId === x.strikerId) { a.out = true; a.d = dismissalText(x.wicket); fall.push({ p: playerName(x.strikerId), score: score + x.runsTotal, over: `${x.overNumber}.${x.ballNumber}` }); }
              bat.set(x.strikerId, a);
              const q = bowl.get(x.bowlerId) || { b: 0, r: 0, w: 0 }; if (x.isLegal) q.b++; q.r += x.runsTotal; if (x.isWicket && x.wicket?.bowlerId === x.bowlerId) q.w++; bowl.set(x.bowlerId, q); score += x.runsTotal;
            }
            return (
              <section key={i.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Innings {i.inningsNumber}</p><h3 className="font-black">{teamName(i.battingTeamId)}</h3></div><b className="text-xl">{i.totalRuns}/{i.wickets}</b></div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div><div className="mb-1 grid grid-cols-[1fr_40px_40px_35px_35px_50px] text-[10px] font-bold uppercase text-slate-400"><span>Batter</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>{Array.from(bat).map(([id, v]) => <div key={id} className="grid grid-cols-[1fr_40px_40px_35px_35px_50px] items-center py-1.5 text-xs"><div><b>{playerName(id)}{!v.out ? " *" : ""}</b><p className="whitespace-pre text-[9px] text-slate-400">{v.out ? v.d : "NOT OUT"}</p></div><b>{v.r}</b><span>{v.b}</span><span>{v.f}</span><span>{v.s}</span><span>{v.b ? (v.r / v.b * 100).toFixed(2) : "0.00"}</span></div>)}</div>
                  <div><div className="mb-1 grid grid-cols-[1fr_40px_40px_40px_50px] text-[10px] font-bold uppercase text-slate-400"><span>Bowler</span><span>O</span><span>R</span><span>W</span><span>ECON</span></div>{Array.from(bowl).map(([id, v]) => <div key={id} className="grid grid-cols-[1fr_40px_40px_40px_50px] items-center py-1.5 text-xs"><b>{playerName(id)}</b><span>{Math.floor(v.b / 6)}.{v.b % 6}</span><span>{v.r}</span><span>{v.w}</span><span>{v.b ? (v.r / v.b * 6).toFixed(2) : "0.00"}</span></div>)}</div>
                </div>
                {fall.length > 0 && <div className="mt-3 border-t border-slate-200 pt-2"><p className="text-[10px] font-bold uppercase text-slate-400">Fall of Wickets</p><div className="mt-1 flex flex-wrap gap-1.5">{fall.map((f, n) => <span key={n} className="rounded-md bg-slate-100 px-2 py-1 text-[10px]"><b>{n + 1}-{f.score}</b> {f.p} ({f.over})</span>)}</div></div>}
                <div className="mt-3 border-t border-slate-200 pt-2"><p className="text-[10px] font-bold uppercase text-slate-400">Ball by Ball</p><div className="mt-1.5 flex flex-wrap gap-1">{i.deliveries.map((d: any) => <span key={d.id} title={`${playerName(d.bowlerId)} to ${playerName(d.strikerId)}`} className={`rounded-full px-2 py-1 text-[10px] font-bold ${d.isWicket ? "bg-red-500 text-white" : d.runsTotal === 4 || d.runsTotal === 6 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"}`}>{d.isWicket ? "W" : d.extraType ? `${d.runsTotal} ${d.extraType.replaceAll("_", " ")}` : d.runsBat}</span>)}</div></div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
