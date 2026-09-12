"use client";

import React from "react";

export default function CreateTournamentModal() {
    if (!showCreateTournament) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Create New Tournament
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Set up the competition before adding
              teams and matches.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="tournamentName"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Tournament Name
              </label>

              <input
                id="tournamentName"
                type="text"
                autoFocus
                value={tournamentName}
                onChange={(event) =>
                  setTournamentName(
                    event.target.value,
                  )
                }
                placeholder="e.g. Corporate Cricket 2026"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placehold
er:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="tournamentSeason"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Season
              </label>

              <input
                id="tournamentSeason"
                type="text"
                value={tournamentSeason}
                onChange={(event) =>
                  setTournamentSeason(
                    event.target.value,
                  )
                }
                placeholder="e.g. 2026"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placehold
er:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="tournamentFormat"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Tournament Format
              </label>

              <select
                id="tournamentFormat"
                value={tournamentFormat}
                onChange={(event) =>
                  setTournamentFormat(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:bor
der-emerald-500 [color-scheme:dark]"
              >
                <option value="LEAGUE">
                  League
                </option>

                <option value="KNOCKOUT">
                  Knockout
                </option>

                <option value="LEAGUE_KNOCKOUT">
                  League + Knockout
                </option>

                <option value="CUSTOM">
                  Custom
                </option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              disabled={loadingCreate}
              onClick={() => {
                setShowCreateTournament(
                  false,
                );
                setError("");
              }}
              className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 transition hover:bg-s
late-800 disabled:opacity-50 [color-scheme:dark]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                loadingCreate ||
                !tournamentName.trim()
              }
              onClick={() =>
                void createTournament()
              }
              className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-
400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {loadingCreate
                ? "Creating..."
                : "Create Tournament"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
