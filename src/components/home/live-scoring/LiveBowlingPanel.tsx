"use client";

type LiveBowlingPanelProps = {
  activeBowlerA: any;
  activeBowlerB: any;
  liveBowler: any;
  doubleMode: boolean;
  oddFinalOver: boolean;

  completedOvers: number;
  overDisplay: string;

  liveBowlerId: string;
  liveInningsComplete: boolean;
  liveLegalBalls: number;
  liveCurrentOver: number;
  oversPerInnings: number;

  liveBowlingPlayers: any[];
  nextOverBowlerAId: string;
  nextOverBowlerBId: string;

  bowlerBallsThisOver: (playerId: string) => number;
  bowlerDisabledForNextOver: (playerId: string) => boolean;

  setNextOverBowlerAId: (value: string) => void;
  setNextOverBowlerBId: (value: string) => void;
  selectNextOverBowlers: () => void;
};

export default function LiveBowlingPanel({
  activeBowlerA,
  activeBowlerB,
  liveBowler,
  doubleMode,
  oddFinalOver,
  completedOvers,
  overDisplay,
  liveBowlerId,
  liveInningsComplete,
  liveLegalBalls,
  liveCurrentOver,
  oversPerInnings,
  liveBowlingPlayers,
  nextOverBowlerAId,
  nextOverBowlerBId,
  bowlerBallsThisOver,
  bowlerDisabledForNextOver,
  setNextOverBowlerAId,
  setNextOverBowlerBId,
  selectNextOverBowlers,
}: LiveBowlingPanelProps) {
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Over View
        </p>

        <div className="mt-2 text-center text-4xl font-black">
          {completedOvers}
        </div>

        <div className="text-center text-sm text-slate-500">
          {overDisplay} overs
        </div>

        <div className="my-4 border-t border-slate-200" />

        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Bowlers This Over
        </p>

        <div className="mt-3 space-y-2">
          {[activeBowlerA, activeBowlerB]
            .filter(Boolean)
            .map((player, index) => (
              <div
                key={player!.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-bold">
                  {index === 0 ? "B1" : "B2"} &nbsp; {player!.name}
                </span>
                <b>{bowlerBallsThisOver(player!.id)} balls</b>
              </div>
            ))}
        </div>

        <div className="my-4 border-t border-slate-200" />

        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Next Bowler
        </p>

        <p className="mt-2 text-sm font-bold">
          {liveBowler?.name ?? "Select next bowler"}
        </p>
      </div>

      {!liveBowlerId &&
        !liveInningsComplete &&
        (!doubleMode ||
          liveLegalBalls % 12 === 0 ||
          liveCurrentOver >= oversPerInnings) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Select Next Over
            </p>

            <select
              value={nextOverBowlerAId}
              onChange={(event) =>
                setNextOverBowlerAId(event.target.value)
              }
              className="mt-3 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"
            >
              <option value="">Select bowler</option>

              {liveBowlingPlayers.map((player) => (
                <option
                  key={player.id}
                  value={player.id}
                  disabled={bowlerDisabledForNextOver(player.id)}
                >
                  {player.name}
                  {bowlerDisabledForNextOver(player.id)
                    ? " (cannot bowl consecutive over)"
                    : ""}
                </option>
              ))}
            </select>

            {doubleMode && !oddFinalOver && (
              <select
                value={nextOverBowlerBId}
                onChange={(event) =>
                  setNextOverBowlerBId(event.target.value)
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"
              >
                <option value="">Select second bowler</option>

                {liveBowlingPlayers.map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={
                      player.id === nextOverBowlerAId ||
                      bowlerDisabledForNextOver(player.id)
                    }
                  >
                    {player.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={selectNextOverBowlers}
              className="mt-3 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 [color-scheme:dark]"
            >
              {oddFinalOver ? "Start Final Over" : "Start Next Over"}
            </button>
          </div>
        )}
    </>
  );
}