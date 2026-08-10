"use client";

import { useEffect, useState } from "react";

type BowlingMode = "NORMAL" | "DOUBLE";
type InningsMode = 2 | 4;
type PageMode =
  | "TOURNAMENTS"
  | "DASHBOARD"
  | "MATCH_SETUP"
  | "PLAYER_SELECTION"
  | "OPENING_PLAYERS"
  | "LIVE_SCORING";
type MaintenanceMode = "CLOSED" | "PIN" | "MENU";

type TournamentTeam = {
  id: string;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    _count?: {
      players: number;
    };
  };
};

type GlobalTeam = {
  id: string;
  name: string;
  shortName: string | null;
  logo?: string | null;
};

type ResumeMatchPlayer = {
  id: string;
  name?: string;
  teamId: string;
  playerId: string;
  role?: string;
  isWicketKeeper?: boolean;
  player?: GlobalPlayer;
};

type LiveMatchSummary = {
  id: string;
  tournamentId: string | null;
  teamA: { id: string; name: string; shortName: string | null };
  teamB: { id: string; name: string; shortName: string | null };
  status: string;
  bowlingMode: BowlingMode;
  oversPerInnings: number;
  inningsPerMatch: number;
  playersPerTeam: number;
  oddOvers: boolean;
  innings: Array<{
    id: string;
    inningsNumber: number;
    status: string;
    totalRuns: number;
    wickets: number;
    legalBalls: number;
    battingTeamId: string;
    bowlingTeamId: string;
    currentStrikerId: string | null;
    currentNonStrikerId: string | null;
    currentBowlerAId: string | null;
    currentBowlerBId: string | null;
    previousOverBowlerAId: string | null;
    previousOverBowlerBId: string | null;
  }>;
};

type Tournament = {
  id: string;
  name: string;
  season: string | null;
  format: string;
  startDate: string | null;
  endDate: string | null;
  teams: TournamentTeam[];
  _count: {
    matches: number;
  };
};

type ScorecardMatch = {
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

type GlobalPlayer = {
  id: string;
  name: string;
  photo?: string | null;
  jerseyNumber?: number | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
};

type TeamPlayer = {
  id: string;
  player: GlobalPlayer;
};

const playersOptions = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
];

const formatLabels: Record<string, string> = {
  LEAGUE: "League",
  KNOCKOUT: "Knockout",
  LEAGUE_KNOCKOUT: "League + Knockout",
  CUSTOM: "Custom",
};

export default function Home() {
  const [pageMode, setPageMode] =
    useState<PageMode>("TOURNAMENTS");

  const [tournaments, setTournaments] = useState<Tournament[]>(
    [],
  );

  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  const [selectedTeamId, setSelectedTeamId] =
    useState<string | null>(null);

  const [teamPlayers, setTeamPlayers] =
    useState<TeamPlayer[]>([]);

  const [availablePlayers, setAvailablePlayers] =
    useState<GlobalPlayer[]>([]);

  const [selectedExistingPlayerId, setSelectedExistingPlayerId] =
    useState("");

  const [loadingAvailablePlayers, setLoadingAvailablePlayers] =
    useState(false);

  const [loadingTeamPlayers, setLoadingTeamPlayers] =
    useState(false);
  const [showAddPlayer, setShowAddPlayer] =
    useState(false);

  const [editingPlayerId, setEditingPlayerId] =
    useState<string | null>(null);

  const [loadingPlayerUpdate, setLoadingPlayerUpdate] =
    useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerJerseyNumber, setPlayerJerseyNumber] =
    useState("");
  const [playerBattingStyle, setPlayerBattingStyle] =
    useState("");
  const [playerBowlingStyle, setPlayerBowlingStyle] =
    useState("");
  const [loadingPlayerCreate, setLoadingPlayerCreate] =
    useState(false);

  const [loadingTournaments, setLoadingTournaments] =
    useState(true);

  const [loadingCreate, setLoadingCreate] = useState(false);

  const [error, setError] = useState("");

  // Hidden maintenance menu
  const [maintenanceMode, setMaintenanceMode] =
    useState<MaintenanceMode>("CLOSED");
  const [maintenancePin, setMaintenancePin] = useState("");
  const [maintenanceError, setMaintenanceError] = useState("");
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [deletingTournamentId, setDeletingTournamentId] =
    useState<string | null>(null);

  const [showCreateTournament, setShowCreateTournament] =
    useState(false);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [globalTeams, setGlobalTeams] = useState<GlobalTeam[]>([]);
  const [loadingGlobalTeams, setLoadingGlobalTeams] = useState(false);
  const [selectedExistingTeamId, setSelectedExistingTeamId] = useState("");
  const [addTeamMode, setAddTeamMode] =
    useState<"EXISTING" | "NEW">("EXISTING");

  const [teamName, setTeamName] = useState("");
  const [teamShortName, setTeamShortName] = useState("");

  const [loadingTeamCreate, setLoadingTeamCreate] =
    useState(false);

  const [liveMatches, setLiveMatches] =
  useState<LiveMatchSummary[]>([]);

const [loadingLiveMatches, setLoadingLiveMatches] =
  useState(false);

const [completedMatches, setCompletedMatches] =
  useState<LiveMatchSummary[]>([]);

const [loadingCompletedMatches, setLoadingCompletedMatches] = useState(false);
  const [scorecardMatch, setScorecardMatch] = useState<ScorecardMatch | null>(null);
  const [loadingScorecard, setLoadingScorecard] = useState(false);

const [resumingMatchId, setResumingMatchId] =
  useState<string | null>(null);

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentSeason, setTournamentSeason] =
    useState("");

  const [tournamentFormat, setTournamentFormat] =
    useState("LEAGUE");

  // ---------------------------------------------------------
  // Match setup state
  // ---------------------------------------------------------

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");

  const [playersPerTeam, setPlayersPerTeam] = useState(11);

  const [oversInput, setOversInput] = useState("10");
  const [oversPerInnings, setOversPerInnings] = useState(10);

  const [inningsPerMatch, setInningsPerMatch] =
    useState<InningsMode>(2);

  const [bowlingMode, setBowlingMode] =
    useState<BowlingMode>("NORMAL");
  const [tossWinnerId, setTossWinnerId] =
    useState("");
  const [tossDecision, setTossDecision] =
    useState<"BAT" | "BOWL">("BAT");

  // ---------------------------------------------------------
  // Match creation / player selection
  // ---------------------------------------------------------

  const [createdMatchId, setCreatedMatchId] =
    useState<string | null>(null);

  const [matchPlayersA, setMatchPlayersA] =
    useState<string[]>([]);
  const [matchPlayersB, setMatchPlayersB] =
    useState<string[]>([]);

  const [captainA, setCaptainA] = useState("");
  const [viceCaptainA, setViceCaptainA] =
    useState("");
  const [wicketKeeperA, setWicketKeeperA] =
    useState("");

  const [captainB, setCaptainB] = useState("");
  const [viceCaptainB, setViceCaptainB] =
    useState("");
  const [wicketKeeperB, setWicketKeeperB] =
    useState("");

  const [teamAPlayers, setTeamAPlayers] =
    useState<GlobalPlayer[]>([]);
  const [teamBPlayers, setTeamBPlayers] =
    useState<GlobalPlayer[]>([]);

  const [loadingMatchCreate, setLoadingMatchCreate] =
    useState(false);
  const [loadingMatchPlayers, setLoadingMatchPlayers] =
    useState(false);

  // ---------------------------------------------------------
  // Opening players
  // ---------------------------------------------------------

  const [openingStrikerId, setOpeningStrikerId] =
    useState("");
  const [openingNonStrikerId, setOpeningNonStrikerId] =
    useState("");
  const [openingBowlerAId, setOpeningBowlerAId] =
    useState("");
  const [openingBowlerBId, setOpeningBowlerBId] =
    useState("");

  const [loadingStartInnings, setLoadingStartInnings] =
    useState(false);

  // ---------------------------------------------------------
  // Live scoring
  // ---------------------------------------------------------

  const [liveInningsId, setLiveInningsId] =
    useState<string | null>(null);
  const [liveBattingTeamId, setLiveBattingTeamId] = useState("");
  const [liveBowlingTeamId, setLiveBowlingTeamId] = useState("");
  const [liveRuns, setLiveRuns] = useState(0);
  const [liveWickets, setLiveWickets] = useState(0);
  const [liveLegalBalls, setLiveLegalBalls] = useState(0);
  const [liveOverRuns, setLiveOverRuns] = useState<number[]>([]);
  const [liveStrikerId, setLiveStrikerId] = useState("");
  const [liveNonStrikerId, setLiveNonStrikerId] =
    useState("");
  const [liveBowlerId, setLiveBowlerId] = useState("");
  const [liveBowlerAId, setLiveBowlerAId] =
    useState("");
  const [liveBowlerBId, setLiveBowlerBId] =
    useState("");
  const [livePreviousBowlerAId, setLivePreviousBowlerAId] =
    useState("");
  const [livePreviousBowlerBId, setLivePreviousBowlerBId] =
    useState("");
  const [liveDeliveryCount, setLiveDeliveryCount] =
    useState(0);
  const [liveCurrentOver, setLiveCurrentOver] =
    useState(1);
  const [liveCurrentBall, setLiveCurrentBall] =
    useState(1);
  const [liveInningsComplete, setLiveInningsComplete] =
    useState(false);
  const [liveNeedsManualSwap, setLiveNeedsManualSwap] =
    useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showWicketPanel, setShowWicketPanel] =
    useState(false);
  const [dismissedPlayerId, setDismissedPlayerId] =
    useState("");
  const [replacementPlayerId, setReplacementPlayerId] =
    useState("");
  const [wicketType, setWicketType] =
    useState("BOWLED");
  const [nextOverBowlerAId, setNextOverBowlerAId] =
    useState("");
  const [nextOverBowlerBId, setNextOverBowlerBId] =
    useState("");

  type LiveDeliveryView = {
    id: string;
    overNumber: number;
    ballNumber: number;
    bowlerId: string;
    strikerId: string;
    nonStrikerId: string;
    runsBat: number;
    runsExtra: number;
    runsTotal: number;
    isLegal: boolean;
    extraType: string | null;
    isWicket: boolean;
    createdAt: string;
    bowler: { id: string; name: string; jerseyNumber: number | null };
    striker: { id: string; name: string; jerseyNumber: number | null };
    nonStriker: { id: string; name: string; jerseyNumber: number | null };
    wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null } | null;
  };

  const [liveDeliveries, setLiveDeliveries] =
    useState<LiveDeliveryView[]>([]);
  const [liveOddOvers, setLiveOddOvers] = useState(false);
  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);

  // ---------------------------------------------------------
  // Load tournaments
  // ---------------------------------------------------------

  async function loadTournaments() {
    try {
      setLoadingTournaments(true);
      setError("");

      const response = await fetch("/api/tournaments", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load tournaments.");
      }

      const data = await response.json();

      setTournaments(Array.isArray(data) ? data : []);

      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load tournaments. Make sure the server is running.",
      );

      return [];
    } finally {
      setLoadingTournaments(false);
    }
  }

  useEffect(() => {
    void loadTournaments();
  }, []);

  // ---------------------------------------------------------
  // Refresh selected tournament
  // ---------------------------------------------------------

  async function refreshSelectedTournament(
    tournamentId: string,
  ) {
    try {
      const response = await fetch(
        "/api/tournaments",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to refresh tournaments.",
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return;
      }

      setTournaments(data);

      const updated = data.find(
        (tournament: Tournament) =>
          tournament.id === tournamentId,
      );

      if (updated) {
        setSelectedTournament(updated);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Team was created, but the tournament could not be refreshed.",
      );
    }
  }

  // ---------------------------------------------------------
  // Create tournament
  // ---------------------------------------------------------

  async function createTournament() {
    const name = tournamentName.trim();

    if (!name) {
      setError("Tournament name is required.");
      return;
    }

    try {
      setLoadingCreate(true);
      setError("");

      const response = await fetch(
        "/api/tournaments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            season: tournamentSeason.trim() || null,
            format: tournamentFormat,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to create tournament.",
        );
      }

      setTournaments((current) => [
        data,
        ...current.filter(
          (tournament) =>
            tournament.id !== data.id,
        ),
      ]);

      setSelectedTournament(data);

      setTournamentName("");
      setTournamentSeason("");
      setTournamentFormat("LEAGUE");
      setShowCreateTournament(false);
      setPageMode("DASHBOARD");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create tournament.",
      );
    } finally {
      setLoadingCreate(false);
    }
  }

  // ---------------------------------------------------------
  // Create team
  // ---------------------------------------------------------

  async function loadGlobalTeams() {
    try {
      setLoadingGlobalTeams(true);
      setError("");

      const response = await fetch("/api/teams", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load existing teams.",
        );
      }

      setGlobalTeams(
        Array.isArray(data)
          ? data.map((team) => ({
              id: team.id,
              name: team.name,
              shortName: team.shortName ?? null,
              logo: team.logo ?? null,
            }))
          : [],
      );
    } catch (err) {
      console.error(err);
      setGlobalTeams([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load existing teams.",
      );
    } finally {
      setLoadingGlobalTeams(false);
    }
  }

  function openAddTeamModal() {
    setAddTeamMode("EXISTING");
    setSelectedExistingTeamId("");
    setTeamName("");
    setTeamShortName("");
    setError("");
    setShowAddTeam(true);
    void loadGlobalTeams();
  }

  async function addExistingTeamToTournament() {
    if (!selectedTournament) {
      setError("Please select a tournament first.");
      return;
    }

    if (!selectedExistingTeamId) {
      setError("Please select an existing team.");
      return;
    }

    try {
      setLoadingTeamCreate(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${selectedTournament.id}/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: selectedExistingTeamId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to add existing team.",
        );
      }

      setSelectedExistingTeamId("");
      setShowAddTeam(false);
      await refreshSelectedTournament(
        selectedTournament.id,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add existing team.",
      );
    } finally {
      setLoadingTeamCreate(false);
    }
  }

  async function createTeam() {
    if (!selectedTournament) {
      setError("Please select a tournament first.");
      return;
    }

    const name = teamName.trim();
    const shortName = teamShortName.trim();

    if (!name) {
      setError("Team name is required.");
      return;
    }

    try {
      setLoadingTeamCreate(true);
      setError("");

      const response = await fetch(
        `/api/tournaments/${selectedTournament.id}/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            shortName: shortName || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to create team.",
        );
      }

      setTeamName("");
      setTeamShortName("");
      setSelectedExistingTeamId("");
      setShowAddTeam(false);

      await refreshSelectedTournament(
        selectedTournament.id,
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create team.",
      );
    } finally {
      setLoadingTeamCreate(false);
    }
  }

  // ---------------------------------------------------------
  // Team players
  // ---------------------------------------------------------

  async function loadTeamPlayers(teamId: string) {
    try {
      setLoadingTeamPlayers(true);
      setError("");

      const response = await fetch(
        `/api/teams/${teamId}/players`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load players.",
        );
      }

      setTeamPlayers(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      console.error(err);
      setTeamPlayers([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load players.",
      );
    } finally {
      setLoadingTeamPlayers(false);
    }
  }

  function selectTeam(teamId: string) {
    setSelectedTeamId(teamId);
    void loadTeamPlayers(teamId);
  }

  function resetPlayerForm() {
    setPlayerName("");
    setPlayerJerseyNumber("");
    setPlayerBattingStyle("");
    setPlayerBowlingStyle("");
  }

  async function createPlayerForTeam() {
    if (!selectedTeamId) {
      setError("Please select a team first.");
      return;
    }

    const name = playerName.trim();

    if (!name) {
      setError("Player name is required.");
      return;
    }

    try {
      setLoadingPlayerCreate(true);
      setError("");

      const response = await fetch(
        `/api/teams/${selectedTeamId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            jerseyNumber:
              playerJerseyNumber.trim() || null,
            battingStyle:
              playerBattingStyle.trim() || null,
            bowlingStyle:
              playerBowlingStyle.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to add player.",
        );
      }

      resetPlayerForm();
      setEditingPlayerId(null);
      setShowAddPlayer(false);

      await loadTeamPlayers(selectedTeamId);

      if (selectedTournament) {
        await refreshSelectedTournament(
          selectedTournament.id,
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to add player.",
      );
    } finally {
      setLoadingPlayerCreate(false);
    }
  }

  async function updatePlayerForTeam() {
    if (!selectedTeamId) {
      setError("Please select a team first.");
      return;
    }

    if (!editingPlayerId) {
      setError("No player selected.");
      return;
    }

    const name = playerName.trim();

    if (!name) {
      setError("Player name is required.");
      return;
    }

    try {
      setLoadingPlayerUpdate(true);
      setError("");

      const response = await fetch(
        `/api/teams/${selectedTeamId}/players`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: editingPlayerId,
            name,
            jerseyNumber:
              playerJerseyNumber.trim() || null,
            battingStyle:
              playerBattingStyle.trim() || null,
            bowlingStyle:
              playerBowlingStyle.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update player.",
        );
      }

      resetPlayerForm();
      setEditingPlayerId(null);
      setShowAddPlayer(false);

      await loadTeamPlayers(selectedTeamId);

      if (selectedTournament) {
        await refreshSelectedTournament(
          selectedTournament.id,
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update player.",
      );
    } finally {
      setLoadingPlayerUpdate(false);
    }
  }

  // ---------------------------------------------------------
  // Live match resume
  // ---------------------------------------------------------

  async function loadLiveMatches(tournamentId = selectedTournament?.id) {
    if (!tournamentId) {
      setLiveMatches([]);
      return;
    }

    try {
      setLoadingLiveMatches(true);

      const response = await fetch(
        `/api/matches?tournamentId=${encodeURIComponent(tournamentId)}&status=LIVE`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load live matches.",
        );
      }

      setLiveMatches(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      console.error(err);
      setLiveMatches([]);
    } finally {
      setLoadingLiveMatches(false);
    }
  }

  async function loadCompletedMatches(
  tournamentId = selectedTournament?.id,
) {
  if (!tournamentId) {
    setCompletedMatches([]);
    return;
  }

  try {
    setLoadingCompletedMatches(true);

    const response = await fetch(
      `/api/matches?tournamentId=${encodeURIComponent(
        tournamentId,
      )}&status=COMPLETED`,
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Failed to load previous matches.",
      );
    }

    setCompletedMatches(
      Array.isArray(data) ? data : [],
    );
  } catch (error) {
    console.error(
      "loadCompletedMatches error:",
      error,
    );

    setCompletedMatches([]);
  } finally {
    setLoadingCompletedMatches(false);
  }
}
  async function openScorecard(matchId: string) {
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

  async function resumeMatch(matchId: string) {
    try {
      setResumingMatchId(matchId);
      setError("");

      const response = await fetch(
        `/api/matches/${matchId}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to open match.",
        );
      }

      const match = data.match ?? data;
      const innings = Array.isArray(match.innings)
        ? match.innings
        : [];

      const currentInnings =
        [...innings]
          .reverse()
          .find(
            (item) => item.status === "LIVE",
          ) ?? innings[innings.length - 1];

      if (!currentInnings) {
        throw new Error(
          "This match does not have an active innings to resume.",
        );
      }

      setCreatedMatchId(match.id);
      setTeamAId(match.teamAId);
      setTeamBId(match.teamBId);
      setPlayersPerTeam(
        Number(match.playersPerTeam ?? 11),
      );
      setOversPerInnings(
        Number(match.oversPerInnings ?? 10),
      );
      setOversInput(
        String(match.oversPerInnings ?? 10),
      );
      setInningsPerMatch(
        Number(match.inningsPerMatch ?? 2) as InningsMode,
      );
      setBowlingMode(
        match.bowlingMode === "DOUBLE"
          ? "DOUBLE"
          : "NORMAL",
      );
      setTossWinnerId(match.tossWinnerId ?? "");
      setTossDecision(
        match.tossDecision === "BOWL"
          ? "BOWL"
          : "BAT",
      );
      setLiveOddOvers(
        Boolean(match.oddOvers),
      );

      const players: ResumeMatchPlayer[] =
        Array.isArray(match.players)
          ? match.players
          : [];

      const playersA: GlobalPlayer[] =
        players
          .filter(
            (item: ResumeMatchPlayer) =>
              item.teamId === match.teamAId,
          )
          .map(
            (item: ResumeMatchPlayer) =>
              item.player ?? {
                id: item.playerId,
                name: item.name ?? "Unknown Player",
              } as GlobalPlayer,
          );

      const playersB: GlobalPlayer[] =
        players
          .filter(
            (item: ResumeMatchPlayer) =>
              item.teamId === match.teamBId,
          )
          .map(
            (item: ResumeMatchPlayer) =>
              item.player ?? {
                id: item.playerId,
                name: item.name ?? "Unknown Player",
              } as GlobalPlayer,
          );

      const playerARecords =
        players.filter(
          (item: ResumeMatchPlayer) =>
            item.teamId === match.teamAId,
        );

      const playerBRecords =
        players.filter(
          (item: ResumeMatchPlayer) =>
            item.teamId === match.teamBId,
        );

      setTeamAPlayers(playersA);
      setTeamBPlayers(playersB);
      setMatchPlayersA(
        playersA.map((player) => player.id),
      );
      setMatchPlayersB(
        playersB.map((player) => player.id),
      );

      setCaptainA(
        playerARecords.find(
          (item) => item.role === "CAPTAIN",
        )?.playerId ?? "",
      );
      setViceCaptainA(
        playerARecords.find(
          (item) => item.role === "VICE_CAPTAIN",
        )?.playerId ?? "",
      );
      setWicketKeeperA(
        playerARecords.find(
          (item) => item.isWicketKeeper,
        )?.playerId ?? "",
      );
      setCaptainB(
        playerBRecords.find(
          (item) => item.role === "CAPTAIN",
        )?.playerId ?? "",
      );
      setViceCaptainB(
        playerBRecords.find(
          (item) => item.role === "VICE_CAPTAIN",
        )?.playerId ?? "",
      );
      setWicketKeeperB(
        playerBRecords.find(
          (item) => item.isWicketKeeper,
        )?.playerId ?? "",
      );

      setLiveInningsId(currentInnings.id);
      setLiveRuns(
        Number(currentInnings.totalRuns ?? 0),
      );
      setLiveWickets(
        Number(currentInnings.wickets ?? 0),
      );
      setLiveLegalBalls(
        Number(currentInnings.legalBalls ?? 0),
      );
      setLiveStrikerId(
        currentInnings.currentStrikerId ?? "",
      );
      setLiveNonStrikerId(
        currentInnings.currentNonStrikerId ?? "",
      );
      setLiveBowlerAId(
        currentInnings.currentBowlerAId ?? "",
      );
      setLiveBowlerBId(
        currentInnings.currentBowlerBId ?? "",
      );
      setLiveBowlerId(
        currentInnings.currentBowlerAId ??
          currentInnings.currentBowlerBId ??
          "",
      );
      setLivePreviousBowlerAId(
        currentInnings.previousOverBowlerAId ?? "",
      );
      setLivePreviousBowlerBId(
        currentInnings.previousOverBowlerBId ?? "",
      );
      setLiveDeliveryCount(
        Number(currentInnings.legalBalls ?? 0) % 6,
      );
      setLiveCurrentOver(
        Math.floor(
          Number(currentInnings.legalBalls ?? 0) / 6,
        ) + 1,
      );
      setLiveCurrentBall(
        (Number(currentInnings.legalBalls ?? 0) % 6) + 1,
      );
      setLiveInningsComplete(
        currentInnings.status === "COMPLETED",
      );
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      setPageMode("LIVE_SCORING");

      await refreshLiveInnings(currentInnings.id);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resume match.",
      );
    } finally {
      setResumingMatchId(null);
    }
  }

  // ---------------------------------------------------------
  // Tournament navigation
  // ---------------------------------------------------------

  function openTournament(
   tournament: Tournament,
  ) {
    setSelectedTournament(tournament);
    setSelectedTeamId(null);
    setTeamPlayers([]);
    setPageMode("DASHBOARD");
    setError("");
    void loadLiveMatches(tournament.id);
    void loadCompletedMatches(tournament.id);
  }

  function goBackToTournaments() {
    setSelectedTournament(null);
    setSelectedTeamId(null);
    setTeamPlayers([]);
    setPageMode("TOURNAMENTS");
    setError("");
  }

  function openMatchSetup() {
    if (
      selectedTournament &&
      selectedTournament.teams.length < 2
    ) {
      setError(
        "Add at least two teams to the tournament before creating a match.",
      );
      return;
    }

    setTeamAId("");
    setTeamBId("");
    setCreatedMatchId(null);
    setMatchPlayersA([]);
    setMatchPlayersB([]);
    setCaptainA("");
    setViceCaptainA("");
    setWicketKeeperA("");
    setCaptainB("");
    setViceCaptainB("");
    setWicketKeeperB("");
    setTeamAPlayers([]);
    setTeamBPlayers([]);
    setOpeningStrikerId("");
    setOpeningNonStrikerId("");
    setOpeningBowlerAId("");
    setOpeningBowlerBId("");
    setTossWinnerId("");
    setTossDecision("BAT");
    setPageMode("MATCH_SETUP");
    setError("");
  }

  function backToDashboard() {
    setPageMode("DASHBOARD");
    setError("");
  }

  // ---------------------------------------------------------
  // Overs
  // ---------------------------------------------------------

  function handleOversChange(value: string) {
    setOversInput(value);

    if (value === "") {
      return;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
      return;
    }

    if (parsed >= 2 && parsed <= 50) {
      setOversPerInnings(parsed);
    }
  }

  function handleOversBlur() {
    const parsed = Number(oversInput);

    if (!Number.isInteger(parsed) || parsed < 2) {
      setOversInput("2");
      setOversPerInnings(2);
      return;
    }

    if (parsed > 50) {
      setOversInput("50");
      setOversPerInnings(50);
      return;
    }

    setOversInput(String(parsed));
    setOversPerInnings(parsed);
  }

  // ---------------------------------------------------------
  // Match setup
  // ---------------------------------------------------------

  const canContinue =
    teamAId !== "" &&
    teamBId !== "" &&
    teamAId !== teamBId &&
    tossWinnerId !== "" &&
    (tossDecision === "BAT" || tossDecision === "BOWL");

  async function handleMatchContinue() {
    if (!canContinue) {
      return;
    }

    if (!selectedTournament) {
      setError("Tournament is not selected.");
      return;
    }

    try {
      setLoadingMatchCreate(true);
      setError("");

      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
          teamAId,
          teamBId,
          oversPerInnings,
          inningsPerMatch,
          playersPerTeam,
          bowlingMode,
          tossWinnerId,
          tossDecision,
          oddOvers:
            bowlingMode === "NORMAL"
              ? false
              : oversPerInnings % 2 === 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create match.",
        );
      }

      setCreatedMatchId(data.id);

      setMatchPlayersA([]);
      setMatchPlayersB([]);
      setCaptainA("");
      setViceCaptainA("");
      setWicketKeeperA("");
      setCaptainB("");
      setViceCaptainB("");
      setWicketKeeperB("");

      setLoadingMatchPlayers(true);

      const [playersAResponse, playersBResponse] =
        await Promise.all([
          fetch(`/api/teams/${teamAId}/players`, {
            cache: "no-store",
          }),
          fetch(`/api/teams/${teamBId}/players`, {
            cache: "no-store",
          }),
        ]);

      const playersAData = await playersAResponse.json();
      const playersBData = await playersBResponse.json();

      if (!playersAResponse.ok) {
        throw new Error(
          playersAData?.error ||
            "Failed to load Team A players.",
        );
      }

      if (!playersBResponse.ok) {
        throw new Error(
          playersBData?.error ||
            "Failed to load Team B players.",
        );
      }

      setTeamAPlayers(
        Array.isArray(playersAData)
          ? playersAData.map((item) =>
              item?.player ? item.player : item,
            )
          : [],
      );

      setTeamBPlayers(
        Array.isArray(playersBData)
          ? playersBData.map((item) =>
              item?.player ? item.player : item,
            )
          : [],
      );

      setPageMode("PLAYER_SELECTION");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create match.",
      );
    } finally {
      setLoadingMatchCreate(false);
      setLoadingMatchPlayers(false);
    }
  }

  function resetPlayerRoleIfRemoved(
    team: "A" | "B",
    playerId: string,
  ) {
    if (team === "A") {
      if (captainA === playerId) setCaptainA("");
      if (viceCaptainA === playerId)
        setViceCaptainA("");
      if (wicketKeeperA === playerId)
        setWicketKeeperA("");
    } else {
      if (captainB === playerId) setCaptainB("");
      if (viceCaptainB === playerId)
        setViceCaptainB("");
      if (wicketKeeperB === playerId)
        setWicketKeeperB("");
    }
  }

  function toggleMatchPlayer(
    team: "A" | "B",
    playerId: string,
  ) {
    if (team === "A") {
      const selected = matchPlayersA.includes(playerId);

      if (selected) {
        setMatchPlayersA((current) =>
          current.filter((id) => id !== playerId),
        );
        resetPlayerRoleIfRemoved("A", playerId);
        return;
      }

      if (matchPlayersA.length >= playersPerTeam) {
        return;
      }

      setMatchPlayersA((current) => [
        ...current,
        playerId,
      ]);
      return;
    }

    const selected = matchPlayersB.includes(playerId);

    if (selected) {
      setMatchPlayersB((current) =>
        current.filter((id) => id !== playerId),
      );
      resetPlayerRoleIfRemoved("B", playerId);
      return;
    }

    if (matchPlayersB.length >= playersPerTeam) {
      return;
    }

    setMatchPlayersB((current) => [
      ...current,
      playerId,
    ]);
  }

  const teamASelectionValid =
    matchPlayersA.length >= 3 &&
    matchPlayersA.length <= playersPerTeam &&
    captainA !== "" &&
    viceCaptainA !== "" &&
    wicketKeeperA !== "";

  const teamBSelectionValid =
    matchPlayersB.length >= 3 &&
    matchPlayersB.length <= playersPerTeam &&
    captainB !== "" &&
    viceCaptainB !== "" &&
    wicketKeeperB !== "";

  const canSaveMatchPlayers =
    createdMatchId !== null &&
    teamASelectionValid &&
    teamBSelectionValid;

  async function saveMatchPlayers() {
    if (!createdMatchId) {
      setError("Match has not been created.");
      return;
    }

    if (!teamASelectionValid) {
      setError(
        `Team A must have at least 3 and at most ${playersPerTeam} players, plus one captain, one vice-captain and one wicketkeeper.`,
      );
      return;
    }

    if (!teamBSelectionValid) {
      setError(
        `Team B must have at least 3 and at most ${playersPerTeam} players, plus one captain, one vice-captain and one wicketkeeper.`,
      );
      return;
    }

    try {
      setLoadingMatchPlayers(true);
      setError("");

      const buildPlayers = (
        ids: string[],
        captain: string,
        viceCaptain: string,
        wicketKeeper: string,
      ) =>
        ids.map((playerId) => ({
          playerId,
          role:
            playerId === captain
              ? "CAPTAIN"
              : playerId === viceCaptain
                ? "VICE_CAPTAIN"
                : "PLAYER",
          isWicketKeeper:
            playerId === wicketKeeper,
        }));

      const response = await fetch(
        `/api/matches/${createdMatchId}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamAId,
            teamBId,
            teamAPlayers: buildPlayers(
              matchPlayersA,
              captainA,
              viceCaptainA,
              wicketKeeperA,
            ),
            teamBPlayers: buildPlayers(
              matchPlayersB,
              captainB,
              viceCaptainB,
              wicketKeeperB,
            ),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save match players.",
        );
      }

      setError("");

      setOpeningStrikerId("");
      setOpeningNonStrikerId("");
      setOpeningBowlerAId("");
      setOpeningBowlerBId("");
      setPageMode("OPENING_PLAYERS");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save match players.",
      );
    } finally {
      setLoadingMatchPlayers(false);
    }
  }

  // ---------------------------------------------------------
  // Opening players / start innings
  // ---------------------------------------------------------

  const openingPlayersReady =
    openingStrikerId !== "" &&
    openingNonStrikerId !== "" &&
    openingBowlerAId !== "" &&
    openingBowlerBId !== "" &&
    openingStrikerId !== openingNonStrikerId &&
    openingBowlerAId !== openingBowlerBId;

  async function startFirstInnings() {
    if (!createdMatchId) {
      setError("Match has not been created.");
      return;
    }

    if (!openingPlayersReady) {
      setError(
        "Select two different opening batsmen and two different opening bowlers.",
      );
      return;
    }

    try {
      setLoadingStartInnings(true);
      setError("");

      const inningsOneBattingTeamId =
    tossWinnerId && tossDecision === "BAT"
      ? tossWinnerId
      : tossWinnerId && tossDecision === "BOWL"
        ? tossWinnerId === teamAId
          ? teamBId
          : teamAId
        : teamAId;

  const inningsOneBowlingTeamId =
    inningsOneBattingTeamId === teamAId
      ? teamBId
      : teamAId;

  const response = await fetch(
    `/api/matches/${createdMatchId}/innings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inningsNumber: 1,
        battingTeamId: inningsOneBattingTeamId,
        bowlingTeamId: inningsOneBowlingTeamId,
        strikerId: openingStrikerId,
        nonStrikerId: openingNonStrikerId,
        bowlerAId: openingBowlerAId,
        bowlerBId: openingBowlerBId,
      }),
    },
  );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to start innings.",
        );
      }

      setError("");

      setLiveInningsId(data.id);
      setLiveBattingTeamId(
        data.battingTeamId ?? inningsOneBattingTeamId,
      );
      setLiveBowlingTeamId(
        data.bowlingTeamId ?? inningsOneBowlingTeamId,
      );
      setLiveRuns(data.totalRuns ?? 0);
      setLiveWickets(data.wickets ?? 0);
      setLiveLegalBalls(data.legalBalls ?? 0);
      setLiveStrikerId(data.currentStrikerId ?? openingStrikerId);
      setLiveNonStrikerId(
        data.currentNonStrikerId ?? openingNonStrikerId,
      );
      setLiveBowlerAId(
        data.currentBowlerAId ?? openingBowlerAId,
      );
      setLiveBowlerBId(
        data.currentBowlerBId ?? openingBowlerBId,
      );
      setLiveBowlerId(
        data.currentBowlerAId ?? openingBowlerAId,
      );
      setLivePreviousBowlerAId("");
      setLivePreviousBowlerBId("");
      setLiveDeliveryCount(0);
      setLiveCurrentOver(1);
      setLiveCurrentBall(1);
      setLiveOverRuns([]);
      setLiveInningsComplete(false);
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      setLiveDeliveries([]);
      setLiveOddOvers(
        bowlingMode === "DOUBLE" &&
        oversPerInnings % 2 === 1,
      );
      setPageMode("LIVE_SCORING");
      void refreshLiveInnings(data.id);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to start innings.",
      );
    } finally {
      setLoadingStartInnings(false);
    }
  }

  // ---------------------------------------------------------
  // Live scoring
  // ---------------------------------------------------------

  async function refreshLiveInnings(inningsId = liveInningsId) {
    if (!inningsId) return;

    try {
      setLiveRefreshLoading(true);
      const response = await fetch(
        `/api/innings/${inningsId}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to refresh innings.",
        );
      }

      const innings = data.innings ?? data;
      const deliveries = Array.isArray(data.deliveries)
        ? data.deliveries
        : [];

      setLiveDeliveries(deliveries);
      setLiveBattingTeamId(innings.battingTeamId ?? "");
      setLiveBowlingTeamId(innings.bowlingTeamId ?? "");
      setLiveRuns(Number(innings.totalRuns ?? 0));
      setLiveWickets(Number(innings.wickets ?? 0));
      setLiveLegalBalls(Number(innings.legalBalls ?? 0));
      setLiveInningsComplete(innings.status === "COMPLETED");
      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);
      setLiveNonStrikerId(innings.currentNonStrikerId ?? liveNonStrikerId);
      const refreshedOverNumber = Math.floor(Number(innings.legalBalls ?? 0) / 6) + 1;
      const refreshedOverDeliveries = deliveries.filter(
        (delivery: LiveDeliveryView) =>
          delivery.overNumber === refreshedOverNumber,
      );
      const refreshedBowlerAId = innings.currentBowlerAId ?? "";
      const refreshedBowlerBId =
        innings.currentBowlerBId ??
        liveBowlerBId;

      setLiveBowlerAId(refreshedBowlerAId);
      setLiveBowlerBId(refreshedBowlerBId);
      const lastOverDelivery =
        refreshedOverDeliveries[refreshedOverDeliveries.length - 1];

      const refreshedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        refreshedBowlerAId &&
        refreshedBowlerBId &&
        lastOverDelivery
          ? lastOverDelivery.bowlerId === refreshedBowlerAId
            ? refreshedBowlerBId
            : refreshedBowlerAId
          : refreshedBowlerAId;

      setLiveBowlerId(refreshedCurrentBowlerId);
      setLivePreviousBowlerAId(innings.previousOverBowlerAId ?? "");
      setLivePreviousBowlerBId(innings.previousOverBowlerBId ?? "");
      setLiveOddOvers(Boolean(innings.match?.oddOvers));

      const legalBalls = Number(innings.legalBalls ?? 0);
      setLiveCurrentOver(Math.floor(legalBalls / 6) + 1);
      setLiveCurrentBall((legalBalls % 6) + 1);
      setLiveDeliveryCount(
        deliveries.filter(
          (d: LiveDeliveryView) =>
            d.overNumber === Math.floor(legalBalls / 6) + 1,
        ).length,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to refresh innings.",
      );
    } finally {
      setLiveRefreshLoading(false);
    }
  }

  const liveBattingPlayers =
    liveBattingTeamId === teamAId
      ? teamAPlayers
      : liveBattingTeamId === teamBId
        ? teamBPlayers
        : [];

  const liveBowlingPlayers =
    liveBowlingTeamId === teamAId
      ? teamAPlayers
      : liveBowlingTeamId === teamBId
        ? teamBPlayers
        : [];

  const liveStriker =
    liveBattingPlayers.find(
      (player) => player.id === liveStrikerId,
    );

  const liveNonStriker =
    liveBattingPlayers.find(
      (player) => player.id === liveNonStrikerId,
    );

  const liveBowler =
    liveBowlingPlayers.find(
      (player) => player.id === liveBowlerId,
    );

  const liveBowlerA =
    liveBowlingPlayers.find(
      (player) => player.id === liveBowlerAId,
    );

  const liveBowlerB =
    liveBowlingPlayers.find(
      (player) => player.id === liveBowlerBId,
    );

  function setNextBowlerForDelivery() {
    if (bowlingMode === "DOUBLE") {
      if (!liveBowlerAId || !liveBowlerBId) {
        return;
      }

      setLiveBowlerId(
        liveDeliveryCount % 2 === 0
          ? liveBowlerAId
          : liveBowlerBId,
      );
      return;
    }

    if (liveBowlerId) {
      return;
    }

    if (nextOverBowlerAId) {
      setLiveBowlerId(nextOverBowlerAId);
    }
  }

  async function recordLiveDelivery(input: {
    runsBat?: number;
    runsExtra?: number;
    extraType?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
    isWicket?: boolean;
    wicketType?: string;
    dismissedPlayerId?: string;
    replacementPlayerId?: string;
  }) {
    if (!liveInningsId) {
      setError("Live innings is not available.");
      return;
    }

    if (!liveStrikerId || !liveNonStrikerId) {
      setError("Both batsmen must be selected.");
      return;
    }

    if (!liveBowlerId) {
      setError("Select a bowler for this delivery.");
      return;
    }

    try {
      setLiveLoading(true);
      setError("");

      const response = await fetch(
        `/api/innings/${liveInningsId}/deliveries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bowlerId: liveBowlerId,
            strikerId: liveStrikerId,
            nonStrikerId: liveNonStrikerId,
            ...input,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to record delivery.",
        );
      }

      const result = data.result ?? {};
      const totalRuns =
        Number(input.runsBat ?? 0) +
        Number(input.runsExtra ?? 0);

      setLiveRuns(
        Number(data.innings?.totalRuns ?? data.totalRuns ?? liveRuns + totalRuns),
      );
      setLiveWickets(
        Number(
          data.innings?.wickets ??
            data.wickets ??
            liveWickets + (input.isWicket ? 1 : 0),
        ),
      );
      setLiveLegalBalls(
        Number(
          data.innings?.legalBalls ??
            data.legalBalls ??
            liveLegalBalls +
              (input.extraType === "WIDE" ||
              input.extraType === "NO_BALL"
                ? 0
                : 1),
        ),
      );

      const nextStriker =
        data.nextStrikerId ??
        result.nextStrikerId ??
        liveStrikerId;
      const nextNonStriker =
        data.nextNonStrikerId ??
        result.nextNonStrikerId ??
        liveNonStrikerId;

      setLiveStrikerId(nextStriker);
      setLiveNonStrikerId(nextNonStriker);

      if (Array.isArray(data.innings?.deliveries)) {
        const recent =
          data.innings.deliveries
            .slice(-6)
            .map((delivery: { runsTotal?: number }) =>
              Number(delivery.runsTotal ?? 0),
            );
        setLiveOverRuns(recent);
      } else {
        setLiveOverRuns((current) => [
          ...current.slice(-5),
          totalRuns,
        ]);
      }

      const overCompleted =
        Boolean(data.overCompleted ?? result.overCompleted);

      const inningsComplete =
        Boolean(
          data.inningsComplete ??
            result.inningsComplete ??
            data.innings?.status === "COMPLETED",
        );

      setLiveInningsComplete(inningsComplete);

      if (overCompleted) {
        setLiveCurrentOver(
          Number(
            data.nextOver ??
              result.nextOver ??
              liveCurrentOver + 1,
          ),
        );
        setLiveCurrentBall(1);
        setLiveDeliveryCount(0);
        setLiveOverRuns([]);
        setLivePreviousBowlerAId(liveBowlerAId);
        setLivePreviousBowlerBId(liveBowlerBId);
        setLiveNeedsManualSwap(
          Boolean(
            data.needsManualStrikeSwap ??
              result.needsManualStrikeSwap,
          ),
        );

        const combinedLegalBallsAfterOver =
          liveLegalBalls +
          (input.extraType === "WIDE" ||
          input.extraType === "NO_BALL"
            ? 0
            : 1);

        const finalOddOver =
          liveOddOvers &&
          liveCurrentOver >= oversPerInnings;

        const mustSelectFreshDoublePair =
          bowlingMode === "DOUBLE" &&
          !finalOddOver &&
          combinedLegalBallsAfterOver >= 12;

        if (
          bowlingMode === "DOUBLE" &&
          !finalOddOver &&
          !mustSelectFreshDoublePair &&
          liveBowlerAId &&
          liveBowlerBId
        ) {
          setLiveBowlerId(liveBowlerAId);
        } else {
          setLiveBowlerId("");
          setLiveBowlerAId("");
          setLiveBowlerBId("");
        }
      } else {
        setLiveCurrentBall(
          Number(
            data.nextBall ??
              result.nextBall ??
              liveCurrentBall + 1,
          ),
        );
        setLiveDeliveryCount(
          (current) => current + 1,
        );

        if (bowlingMode === "DOUBLE") {
          setLiveBowlerId(
            liveBowlerId === liveBowlerAId
              ? liveBowlerBId
              : liveBowlerAId,
          );
        }
      }

      await refreshLiveInnings(liveInningsId);

      setShowWicketPanel(false);
      setDismissedPlayerId("");
      setReplacementPlayerId("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to record delivery.",
      );
    } finally {
      setLiveLoading(false);
    }
  }

  async function manuallySwapStrikers() {
    if (!liveInningsId) {
      return;
    }

    try {
      setLiveLoading(true);
      setError("");

      const response = await fetch(
        `/api/innings/${liveInningsId}/swap-strikers`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to swap batsmen.",
        );
      }

      setLiveStrikerId(data.strikerId);
      setLiveNonStrikerId(data.nonStrikerId);
      setLiveNeedsManualSwap(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to swap batsmen.",
      );
    } finally {
      setLiveLoading(false);
    }
  }

  function selectNextOverBowlers() {
    if (!nextOverBowlerAId) {
      setError("Select the next over bowler.");
      return;
    }

    if (
      bowlingMode === "DOUBLE" &&
      (!nextOverBowlerBId ||
        nextOverBowlerAId === nextOverBowlerBId)
    ) {
      setError("Select two different bowlers.");
      return;
    }

    const requireFreshPair =
      bowlingMode !== "DOUBLE" ||
      liveLegalBalls >= 12 ||
      (liveOddOvers &&
        liveCurrentOver >= oversPerInnings);

    if (
      requireFreshPair &&
      (
        nextOverBowlerAId === livePreviousBowlerAId ||
        nextOverBowlerAId === livePreviousBowlerBId ||
        nextOverBowlerBId === livePreviousBowlerAId ||
        nextOverBowlerBId === livePreviousBowlerBId
      )
    ) {
      setError(
        "A bowler cannot bowl consecutive overs.",
      );
      return;
    }

    setLiveBowlerAId(nextOverBowlerAId);
    setLiveBowlerBId(
      bowlingMode === "DOUBLE"
        ? nextOverBowlerBId
        : "",
    );
    setLiveBowlerId(nextOverBowlerAId);
    setLiveDeliveryCount(0);
    setNextOverBowlerAId("");
    setNextOverBowlerBId("");
    setError("");
  }

  function LiveScoring() {
    const battingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === liveBattingTeamId,
    );
    const bowlingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === liveBowlingTeamId,
    );

    const legalBalls = liveLegalBalls;
    const completedOvers = Math.floor(legalBalls / 6);
    const ballsInOver = legalBalls % 6;
    const overDisplay = `${completedOvers}.${ballsInOver}`;
    const oversRemaining = Math.max(
      oversPerInnings - completedOvers - (ballsInOver > 0 ? 1 : 0),
      0,
    );
    const runRate = legalBalls > 0
      ? (liveRuns / (legalBalls / 6)).toFixed(2)
      : "0.00";
    const projected = legalBalls > 0
      ? Math.round((liveRuns / legalBalls) * oversPerInnings * 6)
      : 0;

    const currentOverNumber = completedOvers + 1;
    const currentOverDeliveries = liveDeliveries.filter(
      (delivery) => delivery.overNumber === currentOverNumber,
    );
    const recentDeliveries = [...liveDeliveries].reverse().slice(0, 7);

    const dismissedIds = new Set(
      liveDeliveries
        .filter((delivery) => delivery.wicket)
        .map((delivery) => delivery.wicket!.dismissedPlayerId),
    );

    const activeBatters = new Set([
      liveStrikerId,
      liveNonStrikerId,
    ]);

    const nextBatsmen = liveBattingPlayers.filter(
      (player) =>
        !activeBatters.has(player.id) &&
        !dismissedIds.has(player.id),
    );

    const battingStats = liveBattingPlayers.map((player) => {
      const balls = liveDeliveries.filter(
        (delivery) =>
          delivery.strikerId === player.id &&
          delivery.isLegal,
      );
      const runs = balls.reduce(
        (sum, delivery) => sum + delivery.runsBat,
        0,
      );
      const fours = balls.filter((d) => d.runsBat === 4).length;
      const sixes = balls.filter((d) => d.runsBat === 6).length;
      return {
        player,
        runs,
        balls: balls.length,
        fours,
        sixes,
        strikeRate: balls.length
          ? ((runs / balls.length) * 100).toFixed(2)
          : "0.00",
        dismissed: dismissedIds.has(player.id),
      };
    }).filter(
      (stat) =>
        stat.runs > 0 ||
        stat.balls > 0 ||
        activeBatters.has(stat.player.id),
    );

    const bowlingStats = liveBowlingPlayers.map((player) => {
      const deliveries = liveDeliveries.filter(
        (delivery) => delivery.bowlerId === player.id,
      );
      const legal = deliveries.filter((d) => d.isLegal).length;
      const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
      const runs = deliveries.reduce((sum, delivery) => {
        const excluded =
          delivery.extraType === "BYE" ||
          delivery.extraType === "LEG_BYE"
            ? delivery.runsExtra
            : 0;
        return sum + delivery.runsTotal - excluded;
      }, 0);
      const wickets = deliveries.filter(
        (delivery) =>
          delivery.wicket &&
          delivery.wicket.bowlerId === player.id,
      ).length;
      return {
        player,
        deliveries: deliveries.length,
        legal,
        overs,
        runs,
        wickets,
        economy: legal ? ((runs / legal) * 6).toFixed(2) : "0.00",
      };
    }).filter((stat) => stat.deliveries > 0);

    const currentBowlerStats = bowlingStats.find(
      (stat) => stat.player.id === liveBowlerId,
    );

    const currentPartnershipDeliveries = (() => {
      let index = liveDeliveries.length - 1;
      while (index >= 0 && !liveDeliveries[index].wicket) index -= 1;
      return liveDeliveries.slice(index + 1);
    })();
    const partnershipRuns = currentPartnershipDeliveries.reduce(
      (sum, delivery) => sum + delivery.runsTotal,
      0,
    );
    const partnershipBalls = currentPartnershipDeliveries.filter(
      (delivery) => delivery.isLegal,
    ).length;

    const extras = liveDeliveries.reduce(
      (acc, delivery) => {
        acc.total += delivery.runsExtra;
        if (delivery.extraType === "WIDE") acc.wides += delivery.runsExtra;
        if (delivery.extraType === "NO_BALL") acc.noBalls += delivery.runsExtra;
        if (delivery.extraType === "BYE") acc.byes += delivery.runsExtra;
        if (delivery.extraType === "LEG_BYE") acc.legByes += delivery.runsExtra;
        return acc;
      },
      { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    );

    const fallOfWickets = liveDeliveries
      .filter((delivery) => delivery.wicket)
      .map((delivery) => ({
        player: liveBattingPlayers.find(
          (player) => player.id === delivery.wicket!.dismissedPlayerId,
        ),
        score: liveDeliveries
          .filter((item) => item.createdAt <= delivery.createdAt)
          .reduce((sum, item) => sum + item.runsTotal, 0),
        over: `${Math.max(delivery.overNumber - 1, 0)}.${delivery.ballNumber}`,
      }));

    const doubleMode = bowlingMode === "DOUBLE";
    const oddFinalOver = liveOddOvers && currentOverNumber === oversPerInnings;
    const activeBowlerA = liveBowlingPlayers.find(
      (player) => player.id === liveBowlerAId,
    );
    const activeBowlerB = liveBowlingPlayers.find(
      (player) => player.id === liveBowlerBId,
    );

    const bowlerBallsThisOver = (id: string) =>
      currentOverDeliveries.filter(
        (delivery) =>
          delivery.bowlerId === id &&
          delivery.isLegal,
      ).length;

    const bowlerDisabledForNextOver = (id: string) =>
      id === livePreviousBowlerAId ||
      id === livePreviousBowlerBId;

    const deliveryLabel = (delivery: LiveDeliveryView) => {
      if (delivery.isWicket) return "W";
      if (delivery.extraType === "WIDE") return `Wd${delivery.runsExtra || 1}`;
      if (delivery.extraType === "NO_BALL") return `Nb${delivery.runsExtra || 1}`;
      if (delivery.extraType === "BYE") return `B${delivery.runsExtra || 1}`;
      if (delivery.extraType === "LEG_BYE") return `Lb${delivery.runsExtra || 1}`;
      return String(delivery.runsTotal);
    };

    const recordButton = (label: string, className: string, action: () => void, disabled = false) => (
      <button
        type="button"
        disabled={liveLoading || liveInningsComplete || disabled}
        onClick={action}
        className={`h-20 rounded-xl border text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {label}
      </button>
    );

    return (
      <section className="-m-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-m-8">
        {/* Top application bar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-[#07182d] px-5 text-white sm:px-7 [color-scheme:dark]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-lg">/</div>
            <div className="text-lg font-bold uppercase tracking-tight">Cricket Scorer</div>
          </div>
          <div className="hidden items-center gap-3 text-sm sm:flex">
            <span className="font-semibold">{selectedTournament?.name ?? "Tournament"}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 [color-scheme:dark]">Live Match</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshLiveInnings()}
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 [color-scheme:dark]"
          >
            {liveRefreshLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">
            {[
              ["Live Scoring", true],
              ["Scorecard", false],
              ["Players", false],
              ["Overs", false],
              ["Partnerships", false],
              ["Wagon Wheel", false],
              ["Match Info", false],
            ].map(([label, active]) => (
              <div
                key={String(label)}
                className={`mb-2 rounded-lg px-3 py-4 text-sm font-semibold ${active ? "bg-blue-600" : "text-slate-300 hover:bg-white/5"}`}
              >
                {String(label)}
              </div>
            ))}
            <div className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold">
              End Match
            </div>
          </aside>

          <div className="min-w-0 p-3 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[255px_minmax(0,1fr)_280px]">
              {/* Match information */}
              <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>
                <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold">
                  {selectedTournament?.name ?? "Tournament"}
                </div>
                <p className="mt-2 text-sm text-slate-500">Innings {1} of {inningsPerMatch}</p>

                <div className="my-5 border-y border-slate-200 py-5 [color-scheme:dark]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100" />
                    <div>
                      <p className="font-bold text-blue-700">{battingTeam?.team.shortName ?? battingTeam?.team.name ?? "Team A"}</p>
                      <p className="text-xs font-semibold text-blue-600">Batting</p>
                    </div>
                  </div>
                  <div className="py-3 text-center text-xs font-bold text-slate-400">VS</div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100" />
                    <div>
                      <p className="font-bold text-emerald-700">{bowlingTeam?.team.shortName ?? bowlingTeam?.team.name ?? "Team B"}</p>
                      <p className="text-xs font-semibold text-emerald-600">Bowling</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span>Overs per Innings</span><b>{oversPerInnings}</b></div>
                  <div className="flex justify-between"><span>Innings</span><b>{inningsPerMatch}</b></div>
                  <div className="flex justify-between gap-3">
  <span>Toss</span>
  <b className="text-right">
    {tossWinnerId
      ? `${selectedTournament?.teams.find((item) => item.team.id === tossWinnerId)?.team.name ?? "Team"} won · elected to ${tossDecision === "BAT" ? "bat" : "bowl"}`
      : "Not recorded"}
  </b>
</div>
                  <div className="flex justify-between gap-3"><span>Bowling</span><b className="text-right">{doubleMode ? "Double Bowler" : "Normal"}</b></div>
                </div>

                <div className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700">
                  LIVE &nbsp; In Progress
                </div>
              </aside>

              {/* Main scoring area */}
              <main className="min-w-0 space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm [color-scheme:dark]">
                  <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-5 text-white sm:px-7 [color-scheme:dark]">
                    <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                      <div>
                        <p className="text-xl font-bold">{battingTeam?.team.shortName ?? battingTeam?.team.name ?? "TEAM A"}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-100">Batting</p>
                      </div>
                      <div className="text-center">
                        <div className="text-5xl font-black tracking-tight">{liveRuns} / {liveWickets}</div>
                        <div className="mt-1 text-sm font-semibold">{overDisplay} overs</div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-2xl font-black">RR {runRate}</div>
                        <div className="mt-1 text-xs text-blue-100">CRR: {runRate}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 px-5 py-3 text-center text-xs font-semibold sm:px-7">
                    <div>CRR: <span className="font-bold">{runRate}</span></div>
                    <div>PROJECTED: <span className="font-bold">{projected}</span></div>
                    <div>Overs Remaining: <span className="font-bold">{oversRemaining}</span></div>
                  </div>
                </div>

                {/* Batting + bowling scorecard */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                      <div className="mb-3 grid grid-cols-[1fr_50px_50px_45px_45px_65px] gap-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-500 [color-scheme:dark]">
                        <span>Batsmen</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span>
                      </div>
                      <div className="space-y-2">
                        {battingStats.map((stat) => (
                          <div key={stat.player.id} className={`grid grid-cols-[1fr_50px_50px_45px_45px_65px] items-center gap-2 rounded-lg px-2 py-2 text-sm ${stat.player.id === liveStrikerId ? "bg-emerald-50" : ""}`}>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white [color-scheme:dark]">{stat.player.jerseyNumber ?? ""}</span>
                              <span className="truncate font-bold">{stat.player.name}{stat.player.id === liveStrikerId ? " *" : ""}</span>
                            </div>
                            <b>{stat.runs}</b><span>{stat.balls}</span><span>{stat.fours}</span><span>{stat.sixes}</span><span>{stat.strikeRate}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 grid grid-cols-[1fr_45px_45px_45px_45px_55px] gap-1 border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-500 [color-scheme:dark]">
                        <span>Bowler</span><span>O</span><span>M</span><span>R</span><span>W</span><span>ECON</span>
                      </div>
                      <div className="space-y-2">
                        {bowlingStats.map((stat) => (
                          <div key={stat.player.id} className={`grid grid-cols-[1fr_45px_45px_45px_45px_55px] items-center gap-1 rounded-lg px-2 py-2 text-sm ${stat.player.id === liveBowlerId ? "bg-blue-50" : ""}`}>
                            <div className="truncate font-bold">{stat.player.name}</div>
                            <span>{stat.overs}</span><span>0</span><span>{stat.runs}</span><span>{stat.wickets}</span><span>{stat.economy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3 [color-scheme:dark]">
                    <div><p className="text-xs font-bold uppercase text-slate-500">Extras</p><p className="mt-1 text-sm font-semibold">{extras.total} (W {extras.wides}, NB {extras.noBalls}, B {extras.byes}, LB {extras.legByes})</p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-500">Total</p><p className="mt-1 text-lg font-black">{liveRuns} / {liveWickets} <span className="text-xs font-medium">({overDisplay} overs)</span></p></div>
                    <div><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>
                  </div>
                </div>

                {/* Current over */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>
                      <p className="mt-1 text-lg font-black">Over {currentOverNumber}</p>
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-xs font-bold ${doubleMode ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                      {doubleMode ? "DOUBLE BOWLER" : "NORMAL BOWLING"}
                    </div>
                    {oddFinalOver && <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">ODD FINAL OVER - ONE BOWLER</div>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentOverDeliveries.map((delivery) => (
                      <div key={delivery.id} className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-bold ${delivery.isWicket ? "bg-red-500 text-white" : delivery.runsTotal === 4 || delivery.runsTotal === 6 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-800"}`} title={delivery.bowler.name}>
                        {deliveryLabel(delivery)}
                      </div>
                    ))}
                    {currentOverDeliveries.length === 0 && <span className="text-sm text-slate-400">No deliveries yet</span>}
                  </div>
                  {doubleMode && !oddFinalOver && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className={`rounded-lg px-3 py-2 ${liveBowlerId === liveBowlerAId ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}><b>{activeBowlerA?.name ?? "Bowler A"}</b><span className="float-right">{bowlerBallsThisOver(liveBowlerAId)} balls</span></div>
                      <div className={`rounded-lg px-3 py-2 ${liveBowlerId === liveBowlerBId ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}><b>{activeBowlerB?.name ?? "Bowler B"}</b><span className="float-right">{bowlerBallsThisOver(liveBowlerBId)} balls</span></div>
                    </div>
                  )}
                </div>

                {/* Delivery controls */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p><span className="text-xs text-slate-500">{liveBowler?.name ?? "No bowler selected"}</span></div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {recordButton("0", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 0 }))}
                    {recordButton("1", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 1 }))}
                    {recordButton("2", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 2 }))}
                    {recordButton("3", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 3 }))}
                    {recordButton("4", "bg-blue-600 text-white hover:bg-blue-700", () => void recordLiveDelivery({ runsBat: 4 }))}
                    {recordButton("6", "bg-blue-600 text-white hover:bg-blue-700", () => void recordLiveDelivery({ runsBat: 6 }))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {recordButton("WIDE", "bg-violet-600 text-white hover:bg-violet-700", () => void recordLiveDelivery({ runsExtra: 1, extraType: "WIDE" }))}
                    {recordButton("NO BALL", "bg-violet-600 text-white hover:bg-violet-700", () => void recordLiveDelivery({ runsExtra: 1, extraType: "NO_BALL" }))}
                    {recordButton("BYE", "bg-orange-500 text-white hover:bg-orange-600", () => void recordLiveDelivery({ runsExtra: 1, extraType: "BYE" }))}
                    {recordButton("LEG BYE", "bg-orange-500 text-white hover:bg-orange-600", () => void recordLiveDelivery({ runsExtra: 1, extraType: "LEG_BYE" }))}
                  </div>
                  <button type="button" disabled={liveLoading || liveInningsComplete || !liveBowlerId} onClick={() => { setDismissedPlayerId(liveStrikerId); setShowWicketPanel(true); }} className="mt-2 h-20 w-full rounded-xl bg-red-500 text-lg font-black text-white hover:bg-red-600 disabled:opacity-40 [color-scheme:dark]">WICKET</button>
                </div>

                {/* Now batting */}
                <div className="grid gap-3 md:grid-cols-2">
                  {[liveStriker, liveNonStriker].map((player, index) => {
                    if (!player) return null;
                    const stat = battingStats.find((item) => item.player.id === player.id);
                    return <div key={player.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]"><p className="text-xs font-bold uppercase text-slate-500">{index === 0 ? "Now Batting - Striker" : "Now Batting - Non-Striker"}</p><div className="mt-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black">{player.name}</p><p className="text-xs text-slate-500">{stat?.runs ?? 0}* ({stat?.balls ?? 0})</p></div><div className="text-right text-xs font-semibold text-slate-500">{stat?.fours ?? 0} Fours • {stat?.sixes ?? 0} Sixes</div></div></div>;
                  })}
                </div>
              </main>

              {/* Right rail */}
              <aside className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Over View</p>
                  <div className="mt-2 text-center text-4xl font-black">{completedOvers}</div>
                  <div className="text-center text-sm text-slate-500">{overDisplay} overs</div>
                  <div className="my-4 border-t border-slate-200" />
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Bowlers This Over</p>
                  <div className="mt-3 space-y-2">
                    {[activeBowlerA, activeBowlerB].filter(Boolean).map((player, index) => <div key={player!.id} className="flex items-center justify-between text-sm"><span className="font-bold">{index === 0 ? "B1" : "B2"} &nbsp; {player!.name}</span><b>{bowlerBallsThisOver(player!.id)} balls</b></div>)}
                  </div>
                  <div className="my-4 border-t border-slate-200" />
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Next Bowler</p>
                  <p className="mt-2 text-sm font-bold">{liveBowler?.name ?? "Select next bowler"}</p>
                </div>

                {liveNeedsManualSwap && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm [color-scheme:dark]">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-800">Over Complete</p>
                    <p className="mt-1 text-sm font-semibold text-amber-900">Double Bowler over finished. Swap batsmen for the next over.</p>
                    <button type="button" onClick={() => void manuallySwapStrikers()} disabled={liveLoading} className="mt-3 h-11 w-full rounded-lg bg-amber-500 font-bold text-white hover:bg-amber-600 disabled:opacity-40 [color-scheme:dark]">Swap Batsmen</button>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Recent Deliveries</p>
                  <div className="mt-3 space-y-2">
                    {recentDeliveries.map((delivery) => <div key={delivery.id} className="grid grid-cols-[45px_38px_1fr_30px] items-center gap-2 text-xs"><span className="text-slate-500">{delivery.overNumber}.{delivery.ballNumber}</span><span className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${delivery.isWicket ? "bg-red-500 text-white" : delivery.runsTotal === 4 || delivery.runsTotal === 6 ? "bg-blue-100 text-blue-700" : "bg-slate-100"}`}>{deliveryLabel(delivery)}</span><span className="truncate">{delivery.isWicket ? "Wicket" : delivery.runsTotal === 0 ? "Dot ball" : `${delivery.runsTotal} run${delivery.runsTotal === 1 ? "" : "s"}`}</span><span className="font-bold text-slate-500">{doubleMode ? (delivery.bowlerId === liveBowlerAId ? "B1" : "B2") : ""}</span></div>)}
                    {recentDeliveries.length === 0 && <p className="text-sm text-slate-400">No deliveries yet.</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Next Batsman</p>
                  {nextBatsmen[0] ? <div className="mt-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white [color-scheme:dark]">{nextBatsmen[0].jerseyNumber ?? ""}</span><div><p className="font-bold">{nextBatsmen[0].name}</p><p className="text-xs text-slate-500">{nextBatsmen[0].battingStyle ?? "Batting"}</p></div></div> : <p className="mt-2 text-sm text-slate-400">No eligible batsman available.</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Fall of Wickets</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {fallOfWickets.map((fall, index) => <div key={`${fall.player?.id ?? index}-${fall.over}`} className="border-r border-slate-200 pr-2 last:border-0 [color-scheme:dark]"><p className="font-bold">{index + 1}-{fall.score}</p><p className="truncate text-xs text-slate-500">{fall.player?.name ?? "Player"}</p><p className="text-xs text-slate-400">{fall.over} overs</p></div>)}
                    {fallOfWickets.length === 0 && <p className="col-span-2 text-sm text-slate-400">No wickets.</p>}
                  </div>
                </div>

                {liveBowlerId === "" && !liveInningsComplete && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Select Next Over</p>
                    <select value={nextOverBowlerAId} onChange={(event) => setNextOverBowlerAId(event.target.value)} className="mt-3 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]">
                      <option value="">Select bowler</option>
                      {liveBowlingPlayers.map((player) => <option key={player.id} value={player.id} disabled={bowlerDisabledForNextOver(player.id)}>{player.name}{bowlerDisabledForNextOver(player.id) ? " (cannot bowl consecutive over)" : ""}</option>)}
                    </select>
                    {doubleMode && !oddFinalOver && <select value={nextOverBowlerBId} onChange={(event) => setNextOverBowlerBId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="">Select second bowler</option>{liveBowlingPlayers.map((player) => <option key={player.id} value={player.id} disabled={player.id === nextOverBowlerAId || bowlerDisabledForNextOver(player.id)}>{player.name}</option>)}</select>}
                    <button type="button" onClick={selectNextOverBowlers} className="mt-3 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 [color-scheme:dark]">Start Next Over</button>
                  </div>
                )}
              </aside>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm [color-scheme:dark]">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span className="font-semibold text-emerald-600">Auto saving</span>
              <span className="font-semibold text-slate-700">All changes saved</span>
            </div>
          </div>
        </div>

        {showWicketPanel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark]">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600">Wicket</p>
              <h3 className="mt-1 text-2xl font-black">{liveStriker?.name ?? "Batsman"}</h3>
              <div className="mt-5 space-y-4">
                <div><label htmlFor="wicketType" className="mb-2 block text-sm font-semibold">Wicket type</label><select id="wicketType" value={wicketType} onChange={(event) => setWicketType(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="BOWLED" className="bg-slate-950 text-white">Bowled</option><option value="CAUGHT" className="bg-slate-950 text-white">Caught</option><option value="LBW" className="bg-slate-950 text-white">LBW</option><option value="RUN_OUT" className="bg-slate-950 text-white">Run Out</option><option value="STUMPED" className="bg-slate-950 text-white">Stumped</option><option value="HIT_WICKET" className="bg-slate-950 text-white">Hit Wicket</option><option value="OVER_FENCE" className="bg-slate-950 text-white">Over Fence</option></select></div>
                <div><label htmlFor="replacementPlayer" className="mb-2 block text-sm font-semibold">Replacement batsman</label><select id="replacementPlayer" value={replacementPlayerId} onChange={(event) => setReplacementPlayerId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="">Select replacement</option>{nextBatsmen.filter((player) => player.id !== dismissedPlayerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setShowWicketPanel(false); setReplacementPlayerId(""); }} className="h-12 rounded-lg border border-slate-300 font-semibold [color-scheme:dark]">Cancel</button><button type="button" disabled={!replacementPlayerId || liveLoading} onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, replacementPlayerId })} className="h-12 rounded-lg bg-red-500 font-bold text-white disabled:opacity-40 [color-scheme:dark]">Confirm Wicket</button></div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ---------------------------------------------------------
  // Hidden maintenance menu
  // ---------------------------------------------------------

  function handleSecretLogoTap() {
    setLogoTapCount((current) => {
      const next = current + 1;
      if (next >= 5) {
        setMaintenanceMode("PIN");
        setMaintenancePin("");
        setMaintenanceError("");
        return 0;
      }
      return next;
    });
  }

  function verifyMaintenancePin() {
    const SECRET_PIN = "2580";
    if (maintenancePin === SECRET_PIN) {
      setMaintenanceMode("MENU");
      setMaintenancePin("");
      setMaintenanceError("");
      return;
    }
    setMaintenanceError("Incorrect PIN.");
    setMaintenancePin("");
  }

  async function deleteTournament(tournament: Tournament) {
    const confirmed = window.confirm(
      `Delete "${tournament.name}"?\n\nThis will permanently delete the tournament and its matches. This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingTournamentId(tournament.id);
      setError("");
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete tournament.");
      }
      setTournaments((current) =>
        current.filter((item) => item.id !== tournament.id),
      );
      if (selectedTournament?.id === tournament.id) {
        setSelectedTournament(null);
        setPageMode("TOURNAMENTS");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to delete tournament.",
      );
    } finally {
      setDeletingTournamentId(null);
    }
  }

  // ---------------------------------------------------------
  // Header
  // ---------------------------------------------------------

  function Header() {
    return (
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Cricket Scorer"
              onClick={handleSecretLogoTap}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl shadow-lg transition active:scale-95"
            >
              ðŸ
            </button>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Cricket Scorer
              </h1>

              <p className="text-sm text-slate-400">
                {pageMode === "TOURNAMENTS"
                  ? "Tournaments"
                  : pageMode === "DASHBOARD"
                    ? selectedTournament?.name ||
                      "Tournament"
                    : pageMode === "MATCH_SETUP"
                      ? "Match Setup"
                      : pageMode === "PLAYER_SELECTION"
                        ? "Player Selection"
                        : pageMode === "OPENING_PLAYERS"
                          ? "Opening Players"
                          : "Live Scoring"}
              </p>
            </div>
          </div>

          {pageMode !== "TOURNAMENTS" && (
            <button
              type="button"
              onClick={goBackToTournaments}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-50
0 hover:bg-slate-900 [color-scheme:dark]"
            >
              {String.fromCharCode(0x2190)} Tournaments
            </button>
          )}
        </div>
      </header>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  function ErrorBanner() {
    if (!error) {
      return null;
    }

    return (
      <div className="mb-5 rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300 [color-scheme:dark]">
        {error}
      </div>
    );
  }

  // ---------------------------------------------------------
  // Tournament list
  // ---------------------------------------------------------

  function TournamentList() {
    return (
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Tournament
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Select an existing tournament or create a
            new one.
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="tournament"
            className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
          >
            Select existing tournament
          </label>

          <select
            id="tournament"
            defaultValue=""
            disabled={loadingTournaments}
            onChange={(event) => {
              const tournament =
                tournaments.find(
                  (item) =>
                    item.id ===
                    event.target.value,
                );

              if (tournament) {
                openTournament(tournament);
              }
            }}
            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition fo
cus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
          >
            <option value="">
              {loadingTournaments
                ? "Loading tournaments..."
                : tournaments.length === 0
                  ? "No tournaments available"
                  : "Select a tournament"}
            </option>

            {tournaments.map(
              (tournament) => (
                <option
                  key={tournament.id}
                  value={tournament.id}
                >
                  {tournament.name}
                  {tournament.season
                    ? ` {String.fromCharCode(0x2014)} ${tournament.season}`
                    : ""}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-4 text-xs uppercase tracking-wider text-slate-600">
              or
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateTournament(true);
            setError("");
          }}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950
 transition hover:bg-emerald-400"
        >
          + Create New Tournament
        </button>

        {tournaments.length === 0 &&
          !loadingTournaments && (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center [color-scheme:dark]">
              <div className="mb-2 text-3xl">
                {String.fromCodePoint(0x1F3C6)}
              </div>

              <p className="font-medium text-slate-300 [color-scheme:dark]">
                No tournaments yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first tournament to get
                started.
              </p>
            </div>
          )}

        {tournaments.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-slate-400">
              Existing Tournaments
            </h3>

            <div className="space-y-3">
              {tournaments.map(
                (tournament) => (
                  <button
                    type="button"
                    key={tournament.id}
                    onClick={() =>
                      openTournament(
                        tournament,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:bord
er-emerald-500/50 hover:bg-slate-950 [color-scheme:dark]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-200">
                          {tournament.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {tournament.season
                            ? `${tournament.season} ${String.fromCharCode(0x2022)} `
                            : ""}
                          {
                            formatLabels[
                              tournament.format
                            ]
                          }
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        <div>
                          {
                            tournament
                              .teams
                              .length
                          }{" "}
                          teams
                        </div>

                        <div>
                          {
                            tournament
                              ._count
                              .matches
                          }{" "}
                          matches
                        </div>
                      </div>
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </section>
    );
  }

  // ---------------------------------------------------------
  // Create tournament modal
  // ---------------------------------------------------------

  function CreateTournament() {
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
  // Add team modal
  // ---------------------------------------------------------

  function AddTeamModal() {
    if (!showAddTeam) {
      return null;
    }

    const tournamentTeamIds = new Set(
      selectedTournament?.teams.map(
        (tournamentTeam) => tournamentTeam.team.id,
      ) ?? [],
    );

    const availableExistingTeams = globalTeams.filter(
      (team) => !tournamentTeamIds.has(team.id),
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
          <div className="mb-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
              {String.fromCodePoint(0x1F3CF)}
            </div>
            <h2 className="text-xl font-semibold">Add Team</h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a team to{" "}
              <span className="font-medium text-slate-300 [color-scheme:dark]">
                {selectedTournament?.name}
              </span>.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1 [color-scheme:dark]">
            <button
              type="button"
              onClick={() => {
                setAddTeamMode("EXISTING");
                setError("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                addTeamMode === "EXISTING"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Existing Team
            </button>
            <button
              type="button"
              onClick={() => {
                setAddTeamMode("NEW");
                setError("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                addTeamMode === "NEW"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create New
            </button>
          </div>

          {addTeamMode === "EXISTING" ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="existingTeam"
                  className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
                >
                  Select Existing Team
                </label>
                <select
                  id="existingTeam"
                  autoFocus
                  value={selectedExistingTeamId}
                  onChange={(event) =>
                    setSelectedExistingTeamId(event.target.value)
                  }
                  disabled={
                    loadingGlobalTeams ||
                    availableExistingTeams.length === 0
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 disabled:opacity-50 [color-scheme:dark]"
                >
                  <option value="">
                    {loadingGlobalTeams
                      ? "Loading teams..."
                      : availableExistingTeams.length === 0
                        ? "No teams available"
                        : "Select a team"}
                  </option>
                  {availableExistingTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                      {team.shortName
                        ? ` (${team.shortName})`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Teams already in this tournament are hidden.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="teamName"
                  className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
                >
                  Team Name
                </label>
                <input
                  id="teamName"
                  type="text"
                  autoFocus
                  value={teamName}
                  onChange={(event) =>
                    setTeamName(event.target.value)
                  }
                  placeholder="e.g. Mumbai Warriors"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>
              <div>
                <label
                  htmlFor="teamShortName"
                  className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
                >
                  Short Name
                </label>
                <input
                  id="teamShortName"
                  type="text"
                  maxLength={8}
                  value={teamShortName}
                  onChange={(event) =>
                    setTeamShortName(event.target.value)
                  }
                  placeholder="e.g. MW"
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                />
                <p className="mt-2 text-xs text-slate-600">
                  Optional {String.fromCharCode(0x2014)} maximum 8 characters.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              disabled={loadingTeamCreate}
              onClick={() => {
                setShowAddTeam(false);
                setSelectedExistingTeamId("");
                setTeamName("");
                setTeamShortName("");
                setError("");
              }}
              className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 [color-scheme:dark]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                loadingTeamCreate ||
                (addTeamMode === "EXISTING"
                  ? !selectedExistingTeamId
                  : !teamName.trim())
              }
              onClick={() =>
                addTeamMode === "EXISTING"
                  ? void addExistingTeamToTournament()
                  : void createTeam()
              }
              className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {loadingTeamCreate
                ? "Adding..."
                : addTeamMode === "EXISTING"
                  ? "Add Existing Team"
                  : "Create Team"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Add player modal
  // ---------------------------------------------------------

  function AddPlayerModal() {
    const selectedTeam =
      selectedTournament?.teams.find(
        (tournamentTeam) =>
          tournamentTeam.team.id === selectedTeamId,
      )?.team ?? null;

    if (!showAddPlayer || !selectedTeam) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
              ðŸ‘¤
            </div>

            <h2 className="text-xl font-semibold">
              {editingPlayerId
                ? "Edit Player"
                : "Add Player"}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {editingPlayerId
                ? "Update player details for "
                : "Add a player to "}
              <span className="font-medium text-slate-300 [color-scheme:dark]">
                {selectedTeam.name}
              </span>
              .
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="playerName"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Player Name
              </label>

              <input
                id="playerName"
                type="text"
                autoFocus
                value={playerName}
                onChange={(event) =>
                  setPlayerName(event.target.value)
                }
                placeholder="e.g. Rahul Sharma"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="playerJerseyNumber"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Jersey Number
              </label>

              <input
                id="playerJerseyNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={playerJerseyNumber}
                onChange={(event) =>
                  setPlayerJerseyNumber(
                    event.target.value.replace(/\D/g, ""),
                  )
                }
                placeholder="Optional"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="playerBattingStyle"
                  className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
                >
                  Batting Hand
                </label>

                <select
                  id="playerBattingStyle"
                  value={playerBattingStyle}
                  onChange={(event) =>
                    setPlayerBattingStyle(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
                >
                  <option value="">
                    Select hand
                  </option>
                  <option value="Right-handed">
                    Right-handed
                  </option>
                  <option value="Left-handed">
                    Left-handed
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="playerBowlingStyle"
                  className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
                >
                  Bowling Arm
                </label>

                <select
                  id="playerBowlingStyle"
                  value={playerBowlingStyle}
                  onChange={(event) =>
                    setPlayerBowlingStyle(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
                >
                  <option value="">
                    Select arm
                  </option>
                  <option value="Right-arm">
                    Right-arm
                  </option>
                  <option value="Left-arm">
                    Left-arm
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              disabled={
                loadingPlayerCreate ||
                loadingPlayerUpdate
              }
              onClick={() => {
                setShowAddPlayer(false);
                setEditingPlayerId(null);
                resetPlayerForm();
                setError("");
              }}
              className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 [color-scheme:dark]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                loadingPlayerCreate ||
                loadingPlayerUpdate ||
                !playerName.trim()
              }
              onClick={() =>
                void (
                  editingPlayerId
                    ? updatePlayerForTeam()
                    : createPlayerForTeam()
                )
              }
              className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {editingPlayerId
                ? loadingPlayerUpdate
                  ? "Saving..."
                  : "Save Changes"
                : loadingPlayerCreate
                  ? "Adding..."
                  : "Add Player"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Hidden maintenance modal
  // ---------------------------------------------------------

  function MaintenanceModal() {
    if (maintenanceMode === "CLOSED") return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
          {maintenanceMode === "PIN" && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">ðŸ”</div>
                <h2 className="text-xl font-semibold">Maintenance</h2>
                <p className="mt-2 text-sm text-slate-400">Enter the maintenance PIN to continue.</p>
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={maintenancePin}
                onChange={(event) => setMaintenancePin(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") verifyMaintenancePin(); }}
                placeholder="PIN"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-center text-xl tracking-[0.4em] text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {maintenanceError && <p className="mt-3 text-sm text-red-400">{maintenanceError}</p>}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setMaintenanceMode("CLOSED"); setMaintenancePin(""); setMaintenanceError(""); }} className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 [color-scheme:dark]">Cancel</button>
                <button type="button" onClick={verifyMaintenancePin} className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400">Unlock</button>
              </div>
            </>
          )}

          {maintenanceMode === "MENU" && (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">ðŸ› ï¸</div>
                  <h2 className="text-xl font-semibold">Tournament Management</h2>
                  <p className="mt-2 text-sm text-slate-400">Maintenance tools</p>
                </div>
                <button type="button" onClick={() => setMaintenanceMode("CLOSED")} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-400 hover:bg-slate-800 [color-scheme:dark]">-</button>
              </div>

              <div className="max-h-[55vh] space-y-3 overflow-y-auto">
                {tournaments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">No tournaments found.</div>
                ) : (
                  tournaments.map((tournament) => (
                    <div key={tournament.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 [color-scheme:dark]">
                      <div className="mb-3">
                        <p className="font-semibold text-slate-200">{tournament.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tournament.season ? `${tournament.season} • ` : ""}
                          {tournament._count.matches} matches
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingTournamentId === tournament.id}
                        onClick={() => void deleteTournament(tournament)}
                        className="h-10 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                      >
                        {deletingTournamentId === tournament.id ? "Deleting..." : "Delete Tournament"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={() => setMaintenanceMode("CLOSED")} className="mt-6 h-12 w-full rounded-xl border border-slate-700 font-medium text-slate-300 hover:bg-slate-800 [color-scheme:dark]">Close</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Tournament dashboard
  // ---------------------------------------------------------

  function TournamentDashboard() {
    if (!selectedTournament) {
      return null;
    }

  const selectedTeam =
  selectedTournament.teams.find(
    (tournamentTeam) =>
      tournamentTeam.team.id === selectedTeamId,
  )?.team;
  
    return (
      <section>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm text-emerald-400">
              Tournament
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {selectedTournament.name}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {selectedTournament.season
                ? `${selectedTournament.season} ${String.fromCharCode(0x2022)} `
                : ""}
              {
                formatLabels[
                  selectedTournament.format
                ]
              }
            </p>
          </div>

          <button
            type="button"
            onClick={openMatchSetup}
            className="h-12 rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            + New Match
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]">
            <p className="text-sm text-slate-500">
              Teams
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-200">
              {selectedTournament.teams.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]">
            <p className="text-sm text-slate-500">
              Matches
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-200">
              {selectedTournament._count.matches}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]">
            <p className="text-sm text-slate-500">
              Format
            </p>

            <p className="mt-2 text-lg font-semibold text-slate-200">
              {
                formatLabels[
                  selectedTournament.format
                ]
              }
            </p>
          </div>
        </div>

        {/* Live Matches */}
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 [color-scheme:dark]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">
                Live Matches
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Resume a match that is already in progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
  void loadLiveMatches(
    selectedTournament.id,
  );

  void loadCompletedMatches(
    selectedTournament.id,
  );
}}
              disabled={loadingLiveMatches}
              className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50 [color-scheme:dark]"
            >
              {loadingLiveMatches
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {liveMatches.map((match) => {
              const innings =
                [...match.innings].reverse().find(
                  (item) => item.status === "LIVE",
                ) ?? match.innings[match.innings.length - 1];

              return (
                <div
                  key={match.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between [color-scheme:dark]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        LIVE
                      </span>
                    </div>

                    <p className="mt-2 text-lg font-bold">
                      {match.teamA.name}
                      {" vs "}
                      {match.teamB.name}
                    </p>

                    {innings && (
                      <p className="mt-1 text-sm text-slate-400">
                        {innings.totalRuns}/{innings.wickets}
                        {"  "}
                        <span className="text-slate-600">
                          ·
                        </span>
                        {"  "}
                        {Math.floor(
                          innings.legalBalls / 6,
                        )}
                        .
                        {innings.legalBalls % 6}
                        {" overs"}
                        {"  ·  "}
                        {match.bowlingMode === "DOUBLE"
                          ? "Double Bowler"
                          : "Normal"}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void resumeMatch(match.id)
                    }
                    disabled={
                      resumingMatchId === match.id
                    }
                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {resumingMatchId === match.id
                      ? "Opening..."
                      : "Resume Match"}
                  </button>
                </div>
              );
            })}

            {!loadingLiveMatches &&
              liveMatches.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">
                  No live matches in this tournament.
                </div>
              )}
          </div>
        </div>

        {/* Teams */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">
                Teams
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Teams participating in this tournament.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTeamName("");
                setTeamShortName("");
                setError("");
                setShowAddTeam(true);
              }}
              className="h-10 rounded-xl border border-emerald-500/50 px-4 text-sm font-semibold text-emerald-400 transition 
hover:bg-emerald-500/10 [color-scheme:dark]"
            >
              + Add Team
            </button>
          </div>

          {selectedTournament.teams.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center [color-scheme:dark]">
              <div className="text-3xl">
                {String.fromCodePoint(0x1F3CF)}
              </div>

              <p className="mt-3 font-medium text-slate-300 [color-scheme:dark]">
                No teams yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Add at least two teams before creating
                a match.
              </p>

              <button
                type="button"
                onClick={() => {
                  setTeamName("");
                  setTeamShortName("");
                  setError("");
                  setShowAddTeam(true);
                }}
                className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-4
00"
              >
                + Add First Team
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedTournament.teams.map(
                (tournamentTeam) => (
                  <div
                    key={tournamentTeam.id}
                    onClick={() => {
                      selectTeam(tournamentTeam.team.id);
                    }}
                    className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-4 [color-scheme:dark]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-200">
                          {
                            tournamentTeam
                              .team.name
                          }
                        </p>

                        {tournamentTeam.team
                          .shortName && (
                          <p className="mt-1 text-xs font-medium text-emerald-400">
                            {
                              tournamentTeam
                                .team
                                .shortName
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-lg">
                        {String.fromCodePoint(0x1F3CF)}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-800 pt-3 [color-scheme:dark]">
                      <p className="text-xs text-slate-500">
                        {tournamentTeam.team
                          ._count?.players ??
                          0}{" "}
                        players
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Players */}
        {selectedTeamId && (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-6 [color-scheme:dark]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-emerald-400">
                  Team Players
                </p>

                <h3 className="mt-1 font-semibold text-slate-200">
                  {selectedTeam?.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage the registered players for this team.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPlayerId(null);
                  resetPlayerForm();
                  setError("");
                  setShowAddPlayer(true);
                }}
                className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                + Add Player
              </button>
            </div>

            {loadingTeamPlayers ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">
                Loading players...
              </div>
            ) : teamPlayers.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-center [color-scheme:dark]">
                <div className="text-3xl">ðŸ‘¤</div>

                <p className="mt-3 font-medium text-slate-300 [color-scheme:dark]">
                  No players yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add the players registered for this team.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {teamPlayers.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4 [color-scheme:dark]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-200">
                          {membership.player.name}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {membership.player.jerseyNumber !== null && (
                            <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-400">
                              #{membership.player.jerseyNumber}
                            </span>
                          )}

                          {membership.player.battingStyle && (
                            <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-400">
                              Bat: {membership.player.battingStyle}
                            </span>
                          )}

                          {membership.player.bowlingStyle && (
                            <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-400">
                              Bowl: {membership.player.bowlingStyle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayerId(
                              membership.player.id,
                            );
                            setPlayerName(
                              membership.player.name,
                            );
                            setPlayerJerseyNumber(
                              membership.player.jerseyNumber !== null
                                ? String(
                                    membership.player.jerseyNumber,
                                  )
                                : "",
                            );
                            setPlayerBattingStyle(
                              membership.player.battingStyle || "",
                            );
                            setPlayerBowlingStyle(
                              membership.player.bowlingStyle || "",
                            );
                            setError("");
                            setShowAddPlayer(true);
                          }}
                          className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-300 transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 [color-scheme:dark]"
                        >
                          <span>âœï¸</span>
                          <span className="hidden sm:inline">
                            Edit
                          </span>
                        </button>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg">
                          ðŸ‘¤
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matches */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Previous Matches</h3>
              <p className="mt-1 text-sm text-slate-500">
                Completed matches from this tournament.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadCompletedMatches(selectedTournament.id)}
              disabled={loadingCompletedMatches}
              className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50 [color-scheme:dark]"
            >
              {loadingCompletedMatches ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {completedMatches.map((match) => {
              const innings = [...match.innings].sort(
                (a, b) => a.inningsNumber - b.inningsNumber,
              );

              const formatScore = (item: (typeof innings)[number]) =>
                `${item.totalRuns}/${item.wickets} (${Math.floor(item.legalBalls / 6)}.${item.legalBalls % 6})`;

              const firstInnings = innings[0];
              const secondInnings = innings[1];
              const winnerId =
                firstInnings && secondInnings
                  ? firstInnings.totalRuns > secondInnings.totalRuns
                    ? firstInnings.battingTeamId
                    : firstInnings.totalRuns < secondInnings.totalRuns
                      ? secondInnings.battingTeamId
                      : null
                  : null;

              const winnerName =
                winnerId === match.teamA.id
                  ? match.teamA.name
                  : winnerId === match.teamB.id
                    ? match.teamB.name
                    : null;

              return (
                <div
                  key={match.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 [color-scheme:dark]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-slate-100">
                        {match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}
                      </p>

                      {innings.length > 0 ? (
                        <div className="mt-3 space-y-1 text-sm">
                          {innings.map((item) => {
                            const battingTeamName =
                              item.battingTeamId === match.teamA.id
                                ? match.teamA.name
                                : match.teamB.name;

                            return (
                              <div key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium text-slate-300">{battingTeamName}</span>
                                <span className="font-bold text-slate-100">{formatScore(item)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">No innings data available.</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {winnerName ? (
                          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400">
                            {winnerName} won
                          </span>
                        ) : (
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-semibold text-slate-400">
                            Match drawn / tied
                          </span>
                        )}
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-500">
                          {match.oversPerInnings} overs
                        </span>
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-500">
                          {match.inningsPerMatch} innings
                        </span>
                      </div>
                    </div>

                    <button type="button" onClick={() => void openScorecard(match.id)} disabled={loadingScorecard} className="h-11 shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50">
                      {loadingScorecard ? "Loading..." : "Scorecard"}
                    </button>
                  </div>
                </div>
              );
            })}

            {!loadingCompletedMatches && completedMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">
                No completed matches in this tournament.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------
  // Player selection
  // ---------------------------------------------------------

  function PlayerSelection() {
    const teamA = selectedTournament?.teams.find(
      (team) => team.team.id === teamAId,
    );

    const teamB = selectedTournament?.teams.find(
      (team) => team.team.id === teamBId,
    );

    function renderPlayerCard(
      player: GlobalPlayer,
      team: "A" | "B",
    ) {
      const selected =
        team === "A"
          ? matchPlayersA.includes(player.id)
          : matchPlayersB.includes(player.id);

      const captain =
        team === "A"
          ? captainA === player.id
          : captainB === player.id;

      const viceCaptain =
        team === "A"
          ? viceCaptainA === player.id
          : viceCaptainB === player.id;

      const wicketKeeper =
        team === "A"
          ? wicketKeeperA === player.id
          : wicketKeeperB === player.id;

      return (
        <div
          key={player.id}
          className={`rounded-2xl border p-4 transition ${
            selected
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-700 bg-slate-950 hover:border-slate-600"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              toggleMatchPlayer(team, player.id)
            }
            className="flex w-full items-center gap-4 text-left"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                selected
                  ? "border-emerald-400 bg-emerald-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-400"
              }`}
            >
              {player.jerseyNumber ??
                String.fromCharCode(0x2022)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold">
                {player.name}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {player.battingStyle ||
                  "Batting style N/A"}
                {" · "}
                {player.bowlingStyle ||
                  "Bowling style N/A"}
              </div>
            </div>

            <div
              className={`h-5 w-5 rounded border ${
                selected
                  ? "border-emerald-400 bg-emerald-400"
                  : "border-slate-600"
              }`}
            />
          </button>

          {selected && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setCaptainA(
                      captain ? "" : player.id,
                    );
                  } else {
                    setCaptainB(
                      captain ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  captain
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Captain
              </button>

              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setViceCaptainA(
                      viceCaptain ? "" : player.id,
                    );
                  } else {
                    setViceCaptainB(
                      viceCaptain ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  viceCaptain
                    ? "bg-blue-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Vice
              </button>

              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setWicketKeeperA(
                      wicketKeeper ? "" : player.id,
                    );
                  } else {
                    setWicketKeeperB(
                      wicketKeeper ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  wicketKeeper
                    ? "bg-purple-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                WK
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <section>
        <button
          type="button"
          onClick={() => setPageMode("MATCH_SETUP")}
          className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
        >
          {String.fromCharCode(0x2190)} Back to Match Setup
        </button>

        <h2 className="text-2xl font-semibold">
          Select Match Players
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Select at least 3 and up to {playersPerTeam} players for each team
          and assign the captain, vice-captain and
          wicketkeeper.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {teamA?.team.name ?? "Team A"}
                </h3>
                <p className="text-xs text-slate-500">
                  {matchPlayersA.length} / {playersPerTeam} players
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  teamASelectionValid
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {teamASelectionValid
                  ? "Ready"
                  : "Incomplete"}
              </div>
            </div>

            <div className="space-y-3">
              {teamAPlayers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No players available for this team.
                </p>
              ) : (
                teamAPlayers.map((player) =>
                  renderPlayerCard(player, "A"),
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {teamB?.team.name ?? "Team B"}
                </h3>
                <p className="text-xs text-slate-500">
                  {matchPlayersB.length} / {playersPerTeam} players
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  teamBSelectionValid
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {teamBSelectionValid
                  ? "Ready"
                  : "Incomplete"}
              </div>
            </div>

            <div className="space-y-3">
              {teamBPlayers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No players available for this team.
                </p>
              ) : (
                teamBPlayers.map((player) =>
                  renderPlayerCard(player, "B"),
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => void saveMatchPlayers()}
            disabled={
              !canSaveMatchPlayers ||
              loadingMatchPlayers
            }
            className="h-12 w-full rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
          >
            {loadingMatchPlayers
              ? "Saving Players..."
              : "Continue to Opening Players â†’"}
          </button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------
  // Opening Players
  // ---------------------------------------------------------

  function OpeningPlayers() {
  const teamA = selectedTournament?.teams.find(
    (team) => team.team.id === teamAId,
  );

  const teamB = selectedTournament?.teams.find(
    (team) => team.team.id === teamBId,
  );

  // ---------------------------------------------------------
  // Determine who bats first from the toss.
  //
  // BAT:
  //   toss winner bats
  //
  // BOWL:
  //   toss winner bowls, therefore the other team bats
  // ---------------------------------------------------------

  const inningsOneBattingTeamId =
    tossWinnerId && tossDecision === "BAT"
      ? tossWinnerId
      : tossWinnerId && tossDecision === "BOWL"
        ? tossWinnerId === teamAId
          ? teamBId
          : teamAId
        : "";

  const inningsOneBowlingTeamId =
    inningsOneBattingTeamId === teamAId
      ? teamBId
      : inningsOneBattingTeamId === teamBId
        ? teamAId
        : "";

  const battingTeam =
    inningsOneBattingTeamId === teamAId
      ? teamA
      : inningsOneBattingTeamId === teamBId
        ? teamB
        : undefined;

  const bowlingTeam =
    inningsOneBowlingTeamId === teamAId
      ? teamA
      : inningsOneBowlingTeamId === teamBId
        ? teamB
        : undefined;

  const battingPlayers =
    inningsOneBattingTeamId === teamAId
      ? teamAPlayers
      : inningsOneBattingTeamId === teamBId
        ? teamBPlayers
        : [];

  const bowlingPlayers =
    inningsOneBowlingTeamId === teamAId
      ? teamAPlayers
      : inningsOneBowlingTeamId === teamBId
        ? teamBPlayers
        : [];

  const selectedStriker = battingPlayers.find(
    (player) => player.id === openingStrikerId,
  );

  const selectedNonStriker = battingPlayers.find(
    (player) => player.id === openingNonStrikerId,
  );

  const selectedBowlerA = bowlingPlayers.find(
    (player) => player.id === openingBowlerAId,
  );

  const selectedBowlerB = bowlingPlayers.find(
    (player) => player.id === openingBowlerBId,
  );

  return (
    <section>
      <button
        type="button"
        onClick={() => setPageMode("PLAYER_SELECTION")}
        className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
      >
        {String.fromCharCode(0x2190)} Back to Match Players
      </button>

      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-400">
          Innings 1
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Opening Players
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Choose the two opening batsmen and the two opening bowlers
          before starting the innings.
        </p>
      </div>

      {/* ----------------------------------------------------- */}
      {/* Toss summary                                          */}
      {/* ----------------------------------------------------- */}

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Toss
            </p>

            <p className="mt-1 font-semibold text-slate-100">
              {tossWinnerId === teamAId
                ? teamA?.team.name
                : tossWinnerId === teamBId
                  ? teamB?.team.name
                  : "Toss winner not selected"}
              {tossWinnerId && tossDecision
                ? ` elected to ${
                    tossDecision === "BAT" ? "bat" : "bowl"
                  }`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs text-slate-500">Batting</p>
              <p className="mt-1 font-semibold text-emerald-400">
                {battingTeam?.team.name ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 px-4 py-3">
              <p className="text-xs text-slate-500">Bowling</p>
              <p className="mt-1 font-semibold text-blue-400">
                {bowlingTeam?.team.name ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* --------------------------------------------------- */}
        {/* BATTING                                             */}
        {/* --------------------------------------------------- */}

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Batting
            </p>

            <h3 className="mt-1 text-xl font-semibold">
              {battingTeam?.team.name ?? "Batting Team"}
            </h3>
          </div>

          <div className="space-y-5">
            {/* Striker */}
            <div>
              <label
                htmlFor="openingStriker"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Striker
              </label>

              <select
                id="openingStriker"
                value={openingStrikerId}
                onChange={(event) => {
                  const value = event.target.value;

                  setOpeningStrikerId(value);

                  if (value === openingNonStrikerId) {
                    setOpeningNonStrikerId("");
                  }
                }}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="">Select striker</option>

                {battingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-striker */}
            <div>
              <label
                htmlFor="openingNonStriker"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Non-striker
              </label>

              <select
                id="openingNonStriker"
                value={openingNonStrikerId}
                onChange={(event) =>
                  setOpeningNonStrikerId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="">Select non-striker</option>

                {battingPlayers.map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === openingStrikerId}
                  >
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Opening pair
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Striker
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedStriker?.name ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Non-striker
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedNonStriker?.name ?? "Not selected"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------- */}
        {/* BOWLING                                             */}
        {/* --------------------------------------------------- */}

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
              Bowling
            </p>

            <h3 className="mt-1 text-xl font-semibold">
              {bowlingTeam?.team.name ?? "Bowling Team"}
            </h3>
          </div>

          <div className="space-y-5">
            {/* Bowler A */}
            <div>
              <label
                htmlFor="openingBowlerA"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Bowler A
              </label>

              <select
                id="openingBowlerA"
                value={openingBowlerAId}
                onChange={(event) => {
                  const value = event.target.value;

                  setOpeningBowlerAId(value);

                  if (value === openingBowlerBId) {
                    setOpeningBowlerBId("");
                  }
                }}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-500 [color-scheme:dark]"
              >
                <option value="">Select bowler A</option>

                {bowlingPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bowler B */}
            <div>
              <label
                htmlFor="openingBowlerB"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Bowler B
              </label>

              <select
                id="openingBowlerB"
                value={openingBowlerBId}
                onChange={(event) =>
                  setOpeningBowlerBId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-500 [color-scheme:dark]"
              >
                <option value="">Select bowler B</option>

                {bowlingPlayers.map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === openingBowlerAId}
                  >
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Opening bowlers
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Bowler A
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedBowlerA?.name ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Bowler B
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedBowlerB?.name ?? "Not selected"}
                </p>
              </div>
            </div>
          </div>

          {bowlingMode === "DOUBLE" && (
            <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-medium text-blue-300">
                Double Bowler mode
              </p>

              <p className="mt-1 text-xs text-slate-400">
                The two selected bowlers will alternate every
                delivery.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------- */}
      {/* ACTIONS                                               */}
      {/* ----------------------------------------------------- */}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setPageMode("PLAYER_SELECTION")}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => void startFirstInnings()}
          disabled={!openingPlayersReady || loadingStartInnings}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {loadingStartInnings
            ? "Starting Innings..."
            : "Start Innings â†’"}
        </button>
      </div>
    </section>
  );
}

  // ---------------------------------------------------------
  // Match setup
  // ---------------------------------------------------------

  function MatchSetup() {
    return (
      <section>
        <div className="mb-8">
          <button
            type="button"
            onClick={backToDashboard}
            className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
          >
            {String.fromCharCode(0x2190)} Back to Tournament
          </button>

          <h2 className="text-xl font-semibold">
            Create Match
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure the match before selecting the
            players.
          </p>

          {selectedTournament && (
            <div className="mt-4 inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text
-emerald-400 [color-scheme:dark]">
              {String.fromCodePoint(0x1F3C6)} {selectedTournament.name}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="teamA"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Team A
            </label>

            <select
              id="teamA"
              value={teamAId}
              onChange={(event) => {
                const value = event.target.value;
                setTeamAId(value);
                if (value === teamBId) {
                  setTeamBId("");
                }
              }}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
            >
              <option value="">Select Team A</option>
              {selectedTournament?.teams.map((tournamentTeam) => (
                <option
                  key={tournamentTeam.team.id}
                  value={tournamentTeam.team.id}
                >
                  {tournamentTeam.team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="teamB"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Team B
            </label>

            <select
              id="teamB"
              value={teamBId}
              onChange={(event) => setTeamBId(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
            >
              <option value="">Select Team B</option>
              {selectedTournament?.teams.map((tournamentTeam) => (
                <option
                  key={tournamentTeam.team.id}
                  value={tournamentTeam.team.id}
                  disabled={tournamentTeam.team.id === teamAId}
                >
                  {tournamentTeam.team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {teamAId && teamBId && teamAId === teamBId && (
          <p className="mt-3 text-sm text-red-400">
            Team A and Team B must be different.
          </p>
        )}

        {/* Configuration */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="players"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Players per team
            </label>

            <select
              id="players"
              value={playersPerTeam}
              onChange={(event) =>
                setPlayersPerTeam(
                  Number(event.target.value),
                )
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:borde
r-emerald-500 [color-scheme:dark]"
            >
              {playersOptions.map((count) => (
                <option
                  key={count}
                  value={count}
                >
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="overs"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Overs per innings
            </label>

            <input
              id="overs"
              type="number"
              min={2}
              max={50}
              step={1}
              value={oversInput}
              onChange={(event) =>
                handleOversChange(
                  event.target.value,
                )
              }
              onBlur={handleOversBlur}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition 
focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter 2{String.fromCharCode(0x2013)}50 overs
            </p>
          </div>

          <div>
            <label
              htmlFor="innings"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Match format
            </label>

            <select
              id="innings"
              value={inningsPerMatch}
              onChange={(event) =>
                setInningsPerMatch(
                  Number(
                    event.target.value,
                  ) as InningsMode,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:borde
r-emerald-500 [color-scheme:dark]"
            >
              <option value={2}>
                2 innings
              </option>

              <option value={4}>
                4 innings
              </option>
            </select>
          </div>
        </div>

        {/* Toss */}
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-300">
              Toss
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record who won the toss and what they elected to do.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="tossWinner" className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Toss Winner
              </label>
              <select
                id="tossWinner"
                value={tossWinnerId}
                onChange={(event) => setTossWinnerId(event.target.value)}
                disabled={!teamAId || !teamBId}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="" className="bg-slate-950 text-white">Select toss winner</option>
                {teamAId && (
                  <option value={teamAId} className="bg-slate-950 text-white">
                    {selectedTournament?.teams.find((item) => item.team.id === teamAId)?.team.name ?? "Team A"}
                  </option>
                )}
                {teamBId && (
                  <option value={teamBId} className="bg-slate-950 text-white">
                    {selectedTournament?.teams.find((item) => item.team.id === teamBId)?.team.name ?? "Team B"}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="tossDecision" className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Decision
              </label>
              <select
                id="tossDecision"
                value={tossDecision}
                onChange={(event) => setTossDecision(event.target.value as "BAT" | "BOWL")}
                disabled={!tossWinnerId}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="BAT" className="bg-slate-950 text-white">Elected to bat</option>
                <option value="BOWL" className="bg-slate-950 text-white">Elected to bowl</option>
              </select>
            </div>
          </div>

          {tossWinnerId && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <span className="font-semibold">
                {selectedTournament?.teams.find((item) => item.team.id === tossWinnerId)?.team.name ?? "Selected team"}
              </span>{" "}
              won the toss and elected to{" "}
              <span className="font-semibold">
                {tossDecision === "BAT" ? "bat" : "bowl"}.
              </span>
            </div>
          )}
        </div>

        {/* Bowling mode */}
        <div className="mt-8">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-300 [color-scheme:dark]">
              Bowling Mode
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Normal mode does not use odd-over
              settings.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setBowlingMode("NORMAL")
              }
              className={`rounded-2xl border p-5 text-left transition ${
                bowlingMode === "NORMAL"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-slate-700 bg-slate-950 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Normal
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Different bowler for each over,
                    following normal cricket rules.
                  </p>
                </div>

                <div
                  className={`mt-1 h-5 w-5 rounded-full border-2 ${
                    bowlingMode === "NORMAL"
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-slate-600"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-slate-400">
                Over 1 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Over 2 {String.fromCharCode(0x2192)} B
                <br />
                Over 3 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Over 4 {String.fromCharCode(0x2192)} B
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setBowlingMode("DOUBLE")
              }
              className={`rounded-2xl border p-5 text-left transition ${
                bowlingMode === "DOUBLE"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-slate-700 bg-slate-950 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Double
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Two bowlers alternate every ball.
                  </p>
                </div>

                <div
                  className={`mt-1 h-5 w-5 rounded-full border-2 ${
                    bowlingMode === "DOUBLE"
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-slate-600"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-slate-400">
                Ball 1 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Ball 2 {String.fromCharCode(0x2192)} B
                <br />
                Ball 3 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Ball 4 {String.fromCharCode(0x2192)} B
              </div>
            </button>
          </div>
        </div>

        {/* Player information */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 [color-scheme:dark]">
          <div className="flex gap-3">
            <span className="text-lg">
              {String.fromCodePoint(0x2139, 0xFE0F)}
            </span>

            <div>
              <p className="text-sm font-medium text-slate-300 [color-scheme:dark]">
                Player selection comes next
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                After continuing, you&apos;ll select
                the match players, opening batsmen and
                opening bowler(s). Additional eligible
                players can be added later during the
                match.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => void handleMatchContinue()}
            disabled={!canContinue || loadingMatchCreate}
            className="h-12 w-full rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
          >
            {loadingMatchCreate
              ? "Creating Match..."
              : `Continue to Player Selection ${String.fromCharCode(0x2192)}`}
          </button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------
  // Main
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 text-white [color-scheme:dark]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8">
        <Header />

        <ErrorBanner />

        <section className="flex-1">
          <div className={
            pageMode === "LIVE_SCORING"
              ? "rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
              : "rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8"
          }>
            {pageMode === "TOURNAMENTS" && (
              <TournamentList />
            )}

            {pageMode === "DASHBOARD" && (
              <TournamentDashboard />
            )}

            {pageMode === "MATCH_SETUP" && (
              <MatchSetup />
            )}

            {pageMode === "PLAYER_SELECTION" && (
              <PlayerSelection />
            )}

            {pageMode === "OPENING_PLAYERS" && (
              <OpeningPlayers />
            )}

            {pageMode === "LIVE_SCORING" && (
              <LiveScoring />
            )}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-slate-600">
          Cricket Scorer
        </footer>
      </div>

      {scorecardMatch && (
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
      <AddTeamModal />
      {AddPlayerModal()}
      <MaintenanceModal />
    </main>
  );
}

