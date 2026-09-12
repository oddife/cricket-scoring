"use client";

import CreateTournamentModal from "./home/CreateTournamentModal";
import TournamentDashboard from "./home/TournamentDashboard";
import MatchSetup from "./home/MatchSetup";
import PlayerSelection from "./home/PlayerSelection";
import OpeningPlayers from "./home/OpeningPlayers";
import TournamentList from "./home/TournamentList";
import MaintenanceModal from './home/MaintenanceModal';
import ManagementModal from './home/ManagementModal';
import LiveScoreHeader from "./home/live-scoring/LiveScoreHeader";
import LiveScorecardPanel from "./home/live-scoring/LiveScorecardPanel";
import LiveOverPanel from "./home/live-scoring/LiveOverPanel";
import { useEffect, useMemo, useState } from "react";
import LeaguePanel from "@/components/LeaguePanel";
import { calculateLiveScoringStats } from "@/lib/live-scoring/stats";
import Header from "./home/Header";
import ErrorBanner from "./home/ErrorBanner";
import ScorecardModal from "./home/ScorecardModal";
import LiveBowlingPanel from "./home/live-scoring/LiveBowlingPanel";
import LiveBattingPanel from "./home/live-scoring/LiveBattingPanel";


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
  players?: GlobalPlayer[];
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
  result?: string;
  winnerId?: string | null;
  createdAt: string;
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
      logo: string | null;
      startDate: string | null;
      endDate: string | null;
      status: "ACTIVE" | "COMPLETED";
      winner: {
        id: string;
        name: string;
        shortName: string | null;
        logo: string | null;
      } | null;
      teams: TournamentTeam[];
      _count: {
        matches: number;
      };
    };

type ScorecardMatch = {
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
    wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null; fielderId: string | null } | null;
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

const APP_NAME = "New Castle Cricket Scorer";
const ACTIVE_MATCH_STORAGE_KEY = "new-castle-cricket-scorer-active-match";
const ACTIVE_MATCH_RESUME_KEY = "new-castle-cricket-scorer-resume-allowed";

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
  const [addPlayerMode, setAddPlayerMode] =
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

const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
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
  const [liveAutoSwapNotice, setLiveAutoSwapNotice] = useState(false);  
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
  const [manualActionMenu, setManualActionMenu] = useState<"BATSMAN" | "BOWLER" | null>(null);
  const [manualStrikerId, setManualStrikerId] = useState("");
  const [manualNonStrikerId, setManualNonStrikerId] = useState("");
  const [manualBowlerAId, setManualBowlerAId] = useState("");
  const [manualBowlerBId, setManualBowlerBId] = useState("");
  const [liveUndoAvailable, setLiveUndoAvailable] = useState(false);
  const [dismissedPlayerId, setDismissedPlayerId] =
    useState("");
  const [runOutDismissedEnd, setRunOutDismissedEnd] =
    useState<"STRIKER" | "NON_STRIKER">("STRIKER");
  const [replacementPlayerId, setReplacementPlayerId] =
    useState("");
  const [wicketType, setWicketType] =
    useState("BOWLED");
  const [fielderId, setFielderId] = useState("");
  const [liveWicketDetailsByPlayerId, setLiveWicketDetailsByPlayerId] = useState<Record<string, { type: string; bowlerId: string | null; fielderId: string | null }>>({});
  const [showCustomDeliveryPanel, setShowCustomDeliveryPanel] =
    useState(false);
  const [customDeliveryType, setCustomDeliveryType] =
    useState<"BAT" | "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE">("BAT");
  const [customDeliveryRuns, setCustomDeliveryRuns] = useState("5");
  const [customDeliveryWicket, setCustomDeliveryWicket] = useState(false);
  const [pendingWicketExtraType, setPendingWicketExtraType] =
    useState<"WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null>(null);
  const [pendingWicketExtraRuns, setPendingWicketExtraRuns] =
    useState(0);
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
    wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null; fielderId?: string | null } | null;
  };

  const [liveDeliveries, setLiveDeliveries] =
    useState<LiveDeliveryView[]>([]);
  const [liveOddOvers, setLiveOddOvers] = useState(false);
  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);

  type LiveTab = "LIVE" | "SCORECARD" | "PLAYERS" | "OVERS" | "PARTNERSHIPS" | "WAGON_WHEEL" | "MATCH_INFO";
  const [liveTab, setLiveTab] = useState<LiveTab>("LIVE");
  type LiveInningsHistory = {
    inningsNumber: number;
    totalRuns: number;
    wickets?: number;
    battingTeamId: string;
    target: number | null;
  };

  const [liveInningsNumber, setLiveInningsNumber] = useState(1);
  const [liveInningsHistory, setLiveInningsHistory] = useState<LiveInningsHistory[]>([]);
  const [nextInningsStrikerId, setNextInningsStrikerId] = useState("");
  const [nextInningsNonStrikerId, setNextInningsNonStrikerId] = useState("");
  const [nextInningsBowlerAId, setNextInningsBowlerAId] = useState("");
  const [nextInningsBowlerBId, setNextInningsBowlerBId] = useState("");

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

      const message =
        err instanceof Error
          ? err.message
          : "Failed to record delivery.";

      // The user may tap a scoring button after the final ball has
      // already completed the innings. The backend correctly rejects
      // that extra input, but the scorer should show the completion
      // screen instead of displaying "Innings is not live".
      if (message === "Innings is not live." && liveInningsId) {
        try {
          await refreshLiveInnings(
            liveInningsId,
            createdMatchId,
          );

          setError("");
          return;
        } catch (refreshError) {
          console.error(
            "Failed to refresh completed innings:",
            refreshError,
          );
        }
      }

      setError(message);
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
              players: Array.isArray(team.players)
                ? team.players
                    .map((entry: { player?: GlobalPlayer }) => entry?.player ?? null)
                    .filter((player: GlobalPlayer | null): player is GlobalPlayer => Boolean(player))
                : [],
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

  async function loadAvailablePlayers() {
    try {
      setLoadingAvailablePlayers(true);
      setError("");

      const response = await fetch("/api/players", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load existing players.",
        );
      }

      setAvailablePlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAvailablePlayers([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load existing players.",
      );
    } finally {
      setLoadingAvailablePlayers(false);
    }
  }

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

  function openAddPlayerModal() {
    setEditingPlayerId(null);
    setAddPlayerMode("EXISTING");
    setSelectedExistingPlayerId("");
    resetPlayerForm();
    setError("");
    setShowAddPlayer(true);
    void loadAvailablePlayers();
  }

  async function addExistingPlayerToTeam() {
    if (!selectedTeamId) {
      setError("Please select a team first.");
      return;
    }
    if (!selectedExistingPlayerId) {
      setError("Please select an existing player.");
      return;
    }
    try {
      setLoadingPlayerCreate(true);
      setError("");
      const response = await fetch(`/api/teams/${selectedTeamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedExistingPlayerId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to add existing player.");
      }
      setSelectedExistingPlayerId("");
      setShowAddPlayer(false);
      setAddPlayerMode("EXISTING");
      await loadTeamPlayers(selectedTeamId);
      if (selectedTournament) {
        await refreshSelectedTournament(selectedTournament.id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add existing player.");
    } finally {
      setLoadingPlayerCreate(false);
    }
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

  async function removePlayerFromCurrentRoster(playerId: string, playerName: string) {
    if (!selectedTeamId) return;
    if (!window.confirm(`Remove "${playerName}" from this team's current roster?\n\nThe global player and historical match data will remain.`)) return;
    try {
      setError("");
      const response = await fetch(`/api/teams/${selectedTeamId}/players`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to remove player from roster.");
      await loadTeamPlayers(selectedTeamId);
      if (selectedTournament) await refreshSelectedTournament(selectedTournament.id);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to remove player from roster.");
    }
  }

  async function removeTeamFromCurrentTournament(teamId: string, teamName: string) {
    if (!selectedTournament) return;
    if (!window.confirm(`Remove "${teamName}" from ${selectedTournament.name}?\n\nThe global team, players and historical match data will remain.`)) return;
    try {
      setError("");
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/teams`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to remove team from tournament.");
      if (selectedTeamId === teamId) { setSelectedTeamId(null); setTeamPlayers([]); }
      await refreshSelectedTournament(selectedTournament.id);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to remove team from tournament.");
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

  function exportScorecardPdf() {
    if (!scorecardMatch) return;

    const previousTitle = document.title;
    document.title = `${scorecardMatch.teamA.name} vs ${scorecardMatch.teamB.name} - Scorecard`;

    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.title = previousTitle;
      }, 500);
    }, 50);
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

      setLiveInningsHistory(
        innings.map((item: { inningsNumber: number; totalRuns: number; battingTeamId: string; target?: number | null }) => ({
          inningsNumber: Number(item.inningsNumber),
          totalRuns: Number(item.totalRuns ?? 0),
          battingTeamId: item.battingTeamId,
          target: item.target ?? null,
        })),
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
      const resumedDeliveries = Array.isArray(currentInnings.deliveries)
        ? currentInnings.deliveries
        : [];
      const lastResumedDelivery =
        resumedDeliveries[resumedDeliveries.length - 1] ?? null;
      const currentOverNumberFromData =
        lastResumedDelivery?.overNumber ?? 1;
      const currentOverDeliveriesFromData =
        resumedDeliveries.filter(
          (delivery: { overNumber: number }) =>
            delivery.overNumber === currentOverNumberFromData,
        );
      const currentOverLegalBallsFromData =
        currentOverDeliveriesFromData.filter(
          (delivery: { isLegal: boolean }) => delivery.isLegal,
        ).length;

      const observedCurrentOverBowlers = [
        ...new Set(
          currentOverDeliveriesFromData
            .map((delivery: { bowlerId: string }) => delivery.bowlerId)
            .filter(Boolean),
        ),
      ];

      const resumedBowlerAId =
        observedCurrentOverBowlers[0] ??
        currentInnings.currentBowlerAId ??
        currentInnings.currentBowlerBId ??
        "";
      const resumedBowlerBId =
        observedCurrentOverBowlers[1] ??
        currentInnings.currentBowlerBId ??
        (resumedBowlerAId !== currentInnings.currentBowlerAId
          ? currentInnings.currentBowlerAId
          : "") ??
        "";

      setLiveBowlerAId(resumedBowlerAId);
      setLiveBowlerBId(resumedBowlerBId);

      const resumedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        !liveOddOvers &&
        resumedBowlerAId &&
        resumedBowlerBId
          ? currentOverDeliveriesFromData.length % 2 === 0
            ? resumedBowlerAId
            : resumedBowlerBId
          : resumedBowlerAId || resumedBowlerBId;

      setLiveBowlerId(resumedCurrentBowlerId);
      setLivePreviousBowlerAId(
        currentInnings.previousOverBowlerAId ?? "",
      );
      setLivePreviousBowlerBId(
        currentInnings.previousOverBowlerBId ?? "",
      );
      setLiveDeliveryCount(currentOverDeliveriesFromData.length);
      setLiveCurrentOver(
        lastResumedDelivery && currentOverLegalBallsFromData < 6
          ? currentOverNumberFromData
          : currentOverNumberFromData + 1,
      );
      setLiveCurrentBall(
        lastResumedDelivery && currentOverLegalBallsFromData < 6
          ? currentOverLegalBallsFromData + 1
          : 1,
      );
      setLiveInningsComplete(
        currentInnings.status === "COMPLETED",
      );
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      window.sessionStorage.setItem(
        ACTIVE_MATCH_STORAGE_KEY,
        match.id,
      );
      window.sessionStorage.setItem(
        ACTIVE_MATCH_RESUME_KEY,
        "true",
      );
      setPageMode("LIVE_SCORING");

      await refreshLiveInnings(currentInnings.id, match.id);
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

  // The active scorer may survive an accidental browser refresh,
  // but only while the user is actually in LIVE_SCORING.
  // Intentional navigation clears this state explicitly.
  // ---------------------------------------------------------
  // Restore active scorer after an accidental browser refresh
  // ---------------------------------------------------------

  useEffect(() => {
    const resumeAllowed = window.sessionStorage.getItem(
      ACTIVE_MATCH_RESUME_KEY,
    );

    const savedMatchId = window.sessionStorage.getItem(
      ACTIVE_MATCH_STORAGE_KEY,
    );

    if (resumeAllowed !== "true" || !savedMatchId) {
      return;
    }

    const activeMatchId = savedMatchId;
    let cancelled = false;

    async function restoreActiveMatch() {
      try {
        const response = await fetch(
          `/api/matches/${savedMatchId}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          window.sessionStorage.removeItem(
            ACTIVE_MATCH_STORAGE_KEY,
          );
          window.sessionStorage.removeItem(
            ACTIVE_MATCH_RESUME_KEY,
          );
          return;
        }

        const data = await response.json();
        const match = data.match ?? data;
        const innings = Array.isArray(match.innings)
          ? match.innings
          : [];

        const hasLiveInnings = innings.some(
          (item: { status?: string }) =>
            item.status === "LIVE",
        );

        if (!hasLiveInnings) {
          window.sessionStorage.removeItem(
            ACTIVE_MATCH_STORAGE_KEY,
          );
          window.sessionStorage.removeItem(
            ACTIVE_MATCH_RESUME_KEY,
          );
          return;
        }

        if (cancelled) {
          return;
        }

        const tournamentId = match.tournamentId;

        if (tournamentId) {
          const tournamentResponse = await fetch(
            "/api/tournaments",
            { cache: "no-store" },
          );

          if (tournamentResponse.ok) {
            const tournamentData =
              await tournamentResponse.json();

            if (Array.isArray(tournamentData)) {
              setTournaments(tournamentData);

              const tournament =
                tournamentData.find(
                  (item: Tournament) =>
                    item.id === tournamentId,
                );

              if (tournament) {
                setSelectedTournament(tournament);
              }
            }
          }
        }

        if (!cancelled) {
          await resumeMatch(activeMatchId);
        }
      } catch (err) {
        console.error(
          "Automatic active-match restore failed:",
          err,
        );

        window.sessionStorage.removeItem(
          ACTIVE_MATCH_STORAGE_KEY,
        );
        window.sessionStorage.removeItem(
          ACTIVE_MATCH_RESUME_KEY,
        );
      }
    }

    void restoreActiveMatch();

    return () => {
      cancelled = true;
    };
  }, []);

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
    window.sessionStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    window.sessionStorage.removeItem(ACTIVE_MATCH_RESUME_KEY);
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
    window.sessionStorage.removeItem(ACTIVE_MATCH_STORAGE_KEY);
    window.sessionStorage.removeItem(ACTIVE_MATCH_RESUME_KEY);
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
      setLiveInningsNumber(1);
      setLiveInningsHistory([{
        inningsNumber: 1,
        totalRuns: Number(data.totalRuns ?? 0),
        battingTeamId: data.battingTeamId ?? inningsOneBattingTeamId,
        target: data.target ?? null,
      }]);
      setLiveTab("LIVE");
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      setLiveDeliveries([]);
      setLiveOddOvers(
        bowlingMode === "DOUBLE" &&
        oversPerInnings % 2 === 1,
      );
      window.sessionStorage.setItem(
        ACTIVE_MATCH_STORAGE_KEY,
        createdMatchId,
      );
      window.sessionStorage.setItem(
        ACTIVE_MATCH_RESUME_KEY,
        "true",
      );
      setPageMode("LIVE_SCORING");
      void refreshLiveInnings(data.id, createdMatchId);
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

  async function startNextInnings() {
    if (!createdMatchId || !liveInningsComplete) {
      return;
    }

    const nextNumber = liveInningsNumber + 1;
    if (nextNumber > inningsPerMatch) {
      setPageMode("DASHBOARD");
      if (selectedTournament) {
        void loadLiveMatches(selectedTournament.id);
        void loadCompletedMatches(selectedTournament.id);
      }
      return;
    }

    if (
      !nextInningsStrikerId ||
      !nextInningsNonStrikerId ||
      !nextInningsBowlerAId ||
      !nextInningsBowlerBId
    ) {
      setError("Select two different opening batsmen and two different opening bowlers.");
      return;
    }

    if (
      nextInningsStrikerId === nextInningsNonStrikerId ||
      nextInningsBowlerAId === nextInningsBowlerBId
    ) {
      setError("Opening batsmen and bowlers must be different.");
      return;
    }

    const battingTeamId = liveBowlingTeamId;
    const bowlingTeamId = liveBattingTeamId;
    const completedInningsSnapshot: LiveInningsHistory = {
      inningsNumber: liveInningsNumber,
      totalRuns: liveRuns,
      battingTeamId: liveBattingTeamId,
      target: liveInningsHistory.find((item) => item.inningsNumber === liveInningsNumber)?.target ?? null,
    };

    try {
      setLoadingStartInnings(true);
      setError("");

      const response = await fetch(
        `/api/matches/${createdMatchId}/innings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inningsNumber: nextNumber,
            battingTeamId,
            bowlingTeamId,
            strikerId: nextInningsStrikerId,
            nonStrikerId: nextInningsNonStrikerId,
            bowlerAId: nextInningsBowlerAId,
            bowlerBId: nextInningsBowlerBId,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to start next innings.");
      }

      setLiveInningsHistory((current) => [
        ...current.filter((item) => item.inningsNumber !== completedInningsSnapshot.inningsNumber && item.inningsNumber !== nextNumber),
        completedInningsSnapshot,
        {
          inningsNumber: nextNumber,
          totalRuns: Number(data.totalRuns ?? 0),
          battingTeamId,
          target: data.target ?? null,
        },
      ]);
      setLiveInningsId(data.id);
      setLiveInningsNumber(nextNumber);
      setLiveBattingTeamId(battingTeamId);
      setLiveBowlingTeamId(bowlingTeamId);
      setLiveRuns(Number(data.totalRuns ?? 0));
      setLiveWickets(Number(data.wickets ?? 0));
      setLiveLegalBalls(Number(data.legalBalls ?? 0));
      setLiveStrikerId(data.currentStrikerId ?? nextInningsStrikerId);
      setLiveNonStrikerId(data.currentNonStrikerId ?? nextInningsNonStrikerId);
      setLiveBowlerAId(data.currentBowlerAId ?? nextInningsBowlerAId);
      setLiveBowlerBId(data.currentBowlerBId ?? nextInningsBowlerBId);
      setLiveBowlerId(data.currentBowlerAId ?? nextInningsBowlerAId);
      setLivePreviousBowlerAId("");
      setLivePreviousBowlerBId("");
      setLiveDeliveryCount(0);
      setLiveCurrentOver(1);
      setLiveCurrentBall(1);
      setLiveOverRuns([]);
      setLiveDeliveries([]);
      setLiveInningsComplete(false);
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      setLiveOddOvers(
        bowlingMode === "DOUBLE" && oversPerInnings % 2 === 1,
      );
      setNextInningsStrikerId("");
      setNextInningsNonStrikerId("");
      setNextInningsBowlerAId("");
      setNextInningsBowlerBId("");
      setLiveTab("LIVE");
      setPageMode("LIVE_SCORING");
      void refreshLiveInnings(data.id, createdMatchId);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to start next innings.",
      );
    } finally {
      setLoadingStartInnings(false);
    }
  }

  // ---------------------------------------------------------
  // Live scoring
  // ---------------------------------------------------------

  async function refreshLiveInnings(inningsId = liveInningsId, matchId = createdMatchId) {
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

      const matchInnings = Array.isArray(data.innings?.match?.innings)
        ? data.innings.match.innings
        : [];
      if (matchInnings.length > 0) {
        setLiveInningsHistory(
          matchInnings.map((item: { inningsNumber: number; totalRuns: number; wickets?: number; battingTeamId: string; target?: number | null }) => ({
            inningsNumber: Number(item.inningsNumber),
            totalRuns: Number(item.totalRuns ?? 0),
            wickets: Number(item.wickets ?? 0),
            battingTeamId: item.battingTeamId,
            target: item.target ?? null,
          })),
        );
      }
      setLiveBattingTeamId(innings.battingTeamId ?? "");
      setLiveBowlingTeamId(innings.bowlingTeamId ?? "");
      setLiveRuns(Number(innings.totalRuns ?? 0));
      setLiveWickets(Number(innings.wickets ?? 0));
      setLiveLegalBalls(Number(innings.legalBalls ?? 0));
      setLiveInningsComplete(innings.status === "COMPLETED");
      setLiveUndoAvailable(Boolean(innings.undoState));
      setLiveInningsNumber(Number(innings.inningsNumber ?? liveInningsNumber));
      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);
      setLiveNonStrikerId(innings.currentNonStrikerId ?? liveNonStrikerId);
      const refreshedOverNumber = Math.floor(Number(innings.legalBalls ?? 0) / 6) + 1;
      const refreshedOverDeliveries = deliveries.filter(
        (delivery: LiveDeliveryView) =>
          delivery.overNumber === refreshedOverNumber,
      );
      // Rebuild the active bowling pair from the actual deliveries
      // in the current over. This makes resume/reload deterministic
      // even if the persisted UI pair is stale.
      const observedBowlers = [
        ...new Set(
          refreshedOverDeliveries.map(
            (delivery: LiveDeliveryView) => delivery.bowlerId,
          ),
        ),
      ];

      const refreshedOverIsOddFinalOver =
        innings.match?.bowlingMode === "DOUBLE" &&
        Boolean(innings.match?.oddOvers) &&
        refreshedOverNumber >= Number(innings.match?.oversPerInnings ?? 0);

      const refreshedBowlerAId =
        observedBowlers[0] ??
        innings.currentBowlerAId ??
        "";
      const refreshedBowlerBId = refreshedOverIsOddFinalOver
        ? ""
        : observedBowlers[1] ??
          innings.currentBowlerBId ??
          liveBowlerBId;

      setLiveBowlerAId(refreshedBowlerAId);
      setLiveBowlerBId(refreshedBowlerBId);

      const lastRefreshedBowlerId =
  refreshedOverDeliveries.length > 0
    ? refreshedOverDeliveries[
        refreshedOverDeliveries.length - 1
      ].bowlerId
    : "";

const hasDoubleBowlerPair =
  Boolean(refreshedBowlerAId) &&
  Boolean(refreshedBowlerBId);

let refreshedCurrentBowlerId = refreshedBowlerAId;

if (refreshedOverIsOddFinalOver) {
  // Odd final over uses one bowler for the whole over.
  refreshedCurrentBowlerId = refreshedBowlerAId;
} else if (
  hasDoubleBowlerPair &&
  lastRefreshedBowlerId
) {
  // Double Bowler: always select the OTHER bowler
  // from the one who bowled the last delivery.
  if (lastRefreshedBowlerId === refreshedBowlerAId) {
    refreshedCurrentBowlerId = refreshedBowlerBId;
  } else if (
    lastRefreshedBowlerId === refreshedBowlerBId
  ) {
    refreshedCurrentBowlerId = refreshedBowlerAId;
  }
}

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

  function openWicketPanel(
    extraType: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null = null,
    runsExtra = 0,
  ) {
    setPendingWicketExtraType(extraType);
    setPendingWicketExtraRuns(runsExtra);
    setDismissedPlayerId(liveStrikerId);
    setRunOutDismissedEnd("STRIKER");
    setReplacementPlayerId("");
    setFielderId("");
    setWicketType(extraType ? "RUN_OUT" : "BOWLED");
    setShowWicketPanel(true);
  }

  function openCustomDeliveryPanel() {
    setCustomDeliveryType("BAT");
    setCustomDeliveryRuns("5");
    setCustomDeliveryWicket(false);
    setShowCustomDeliveryPanel(true);
  }

  function openExtraDeliveryPanel(
    type: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE",
  ) {
    setCustomDeliveryType(type);
    setCustomDeliveryRuns(
      type === "WIDE" || type === "NO_BALL" ? "0" : "1",
    );
    setCustomDeliveryWicket(false);
    setShowCustomDeliveryPanel(true);
  }

  async function submitCustomDelivery(includeWicket = customDeliveryWicket) {
    const parsedRuns = Number(customDeliveryRuns);

    if (!Number.isInteger(parsedRuns) || parsedRuns < 0 || parsedRuns > 99) {
      setError("Runs must be a whole number from 0 to 99.");
      return;
    }

    let totalExtraRuns = parsedRuns;

    if (customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL") {
      if (parsedRuns > 98) {
        setError("Additional runs must be between 0 and 98.");
        return;
      }
      totalExtraRuns = parsedRuns + 1;
    } else if (customDeliveryType === "BYE" || customDeliveryType === "LEG_BYE") {
      if (parsedRuns < 1) {
        setError("Bye and leg-bye runs must be at least 1.");
        return;
      }
    }

    setShowCustomDeliveryPanel(false);

    if (includeWicket && customDeliveryType !== "BAT") {
      openWicketPanel(customDeliveryType, totalExtraRuns);
      return;
    }

    if (customDeliveryType === "BAT") {
      await recordLiveDelivery({ runsBat: parsedRuns });
      return;
    }

    await recordLiveDelivery({
      runsExtra: totalExtraRuns,
      extraType: customDeliveryType,
    });
  }

  async function recordLiveDelivery(input: {
    runsBat?: number;
    runsExtra?: number;
    extraType?: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";
    isWicket?: boolean;
    wicketType?: string;
    dismissedPlayerId?: string;
    replacementPlayerId?: string;
    fielderId?: string;
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
        const serverError = String(
          data?.error || "Failed to record delivery.",
        );

        if (
          serverError.toLowerCase().includes("innings is not live") &&
          liveInningsId
        ) {
          try {
            await refreshLiveInnings(
              liveInningsId,
              createdMatchId,
            );

            setError("");
            return;
          } catch (refreshError) {
            console.error(
              "Failed to refresh completed innings:",
              refreshError,
            );
          }
        }

        throw new Error(serverError);
      }

      const result = data.result ?? {};
      const totalRuns =
        Number(input.runsBat ?? 0) +
        Number(input.runsExtra ?? 0);

      setLiveRuns(
        Number(data.innings?.totalRuns ?? data.totalRuns ?? liveRuns + totalRuns),
      );
      if (input.isWicket && input.dismissedPlayerId) {
        setLiveWicketDetailsByPlayerId((current) => ({
          ...current,
          [input.dismissedPlayerId!]: {
            type: input.wicketType ?? "OUT",
            bowlerId: liveBowlerId || null,
            fielderId: input.fielderId ?? null,
          },
        }));
      }

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
const needsAutomaticStrikeSwap = Boolean(
  data.needsManualStrikeSwap ??
    result.needsManualStrikeSwap,
);

setLiveNeedsManualSwap(false);

if (needsAutomaticStrikeSwap && liveInningsId && !inningsComplete) {
  try {
    const swapResponse = await fetch(
      `/api/innings/${liveInningsId}/swap-strikers`,
      {
        method: "POST",
      },
    );

    const swapData = await swapResponse.json();

    if (!swapResponse.ok) {
      throw new Error(
        swapData?.error || "Failed to automatically swap batsmen.",
      );
    }

    setLiveStrikerId(swapData.strikerId);
    setLiveNonStrikerId(swapData.nonStrikerId);
    setLiveUndoAvailable(true);

    setLiveAutoSwapNotice(true);

    window.setTimeout(() => {
      setLiveAutoSwapNotice(false);
    }, 2500);
  } catch (swapError) {
    console.error("Automatic batsman swap failed:", swapError);

    // Keep the existing notification/button available if
    // the automatic swap could not be completed.
    setLiveNeedsManualSwap(true);
  }
}
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
          combinedLegalBallsAfterOver % 12 === 0;

        if (finalOddOver && liveBowlerId) {
          // Preserve the manually selected single bowler for an odd final over.
          setLiveBowlerAId(liveBowlerId);
          setLiveBowlerBId("");
          setLiveBowlerId(liveBowlerId);
        } else if (
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

        const finalOddOverInProgress =
          liveOddOvers &&
          liveCurrentOver >= oversPerInnings;

        if (bowlingMode === "DOUBLE" && !finalOddOverInProgress) {
          setLiveBowlerId(
            liveBowlerId === liveBowlerAId
              ? liveBowlerBId
              : liveBowlerAId,
          );
        } else if (finalOddOverInProgress && liveBowlerId) {
          // Odd final over: the scorer selects one bowler and that bowler
          // remains active for the entire over. Do not alternate or clear it.
          setLiveBowlerId(liveBowlerId);
        }
      }

      // The delivery POST already returns the persisted delivery and the
      // authoritative innings state. Update local scorer state directly
      // instead of downloading the entire innings history again after
      // every ball. A full refresh remains available for resume/manual
      // recovery and the explicit Refresh button.
      const persistedDelivery = data.delivery ?? result.delivery;
      if (persistedDelivery?.id) {
        const deliveryView: LiveDeliveryView = {
          id: String(persistedDelivery.id),
          overNumber: Number(persistedDelivery.overNumber ?? data.currentOver ?? result.currentOver ?? liveCurrentOver),
          ballNumber: Number(persistedDelivery.ballNumber ?? data.currentBall ?? result.currentBall ?? liveCurrentBall),
          bowlerId: String(persistedDelivery.bowlerId ?? liveBowlerId),
          strikerId: String(persistedDelivery.strikerId ?? liveStrikerId),
          nonStrikerId: String(persistedDelivery.nonStrikerId ?? liveNonStrikerId),
          runsBat: Number(persistedDelivery.runsBat ?? input.runsBat ?? 0),
          runsExtra: Number(persistedDelivery.runsExtra ?? input.runsExtra ?? 0),
          runsTotal: Number(persistedDelivery.runsTotal ?? result.runsTotal ?? totalRuns),
          isLegal: Boolean(persistedDelivery.isLegal ?? (input.extraType !== "WIDE" && input.extraType !== "NO_BALL")),
          extraType: persistedDelivery.extraType ?? input.extraType ?? null,
          isWicket: Boolean(persistedDelivery.isWicket ?? input.isWicket),
          createdAt: String(persistedDelivery.createdAt ?? new Date().toISOString()),
          bowler: persistedDelivery.bowler ?? liveBowlingPlayers.find((player) => player.id === liveBowlerId) ?? { id: liveBowlerId, name: "Bowler", jerseyNumber: null },
          striker: persistedDelivery.striker ?? liveBattingPlayers.find((player) => player.id === liveStrikerId) ?? { id: liveStrikerId, name: "Batsman", jerseyNumber: null },
          nonStriker: persistedDelivery.nonStriker ?? liveBattingPlayers.find((player) => player.id === liveNonStrikerId) ?? { id: liveNonStrikerId, name: "Batsman", jerseyNumber: null },
          wicket: persistedDelivery.wicket ?? (input.isWicket && input.dismissedPlayerId ? { type: input.wicketType ?? "OUT", dismissedPlayerId: input.dismissedPlayerId, bowlerId: liveBowlerId || null, fielderId: input.fielderId ?? null } : null),
        };
        setLiveDeliveries((current) => current.some((delivery) => delivery.id === deliveryView.id) ? current : [...current, deliveryView]);
      }
      if (data.innings) {
        const historyEntry: LiveInningsHistory = {
          inningsNumber: Number(data.innings.inningsNumber ?? liveInningsNumber),
          totalRuns: Number(data.innings.totalRuns ?? liveRuns + totalRuns),
          wickets: Number(data.innings.wickets ?? liveWickets + (input.isWicket ? 1 : 0)),
          battingTeamId: data.innings.battingTeamId ?? liveBattingTeamId,
          target: data.innings.target ?? null,
        };
        setLivePreviousBowlerAId(
          data.innings.previousOverBowlerAId ?? livePreviousBowlerAId,
        );
        setLivePreviousBowlerBId(
          data.innings.previousOverBowlerBId ?? livePreviousBowlerBId,
        );
        setLiveBowlerAId(data.innings.currentBowlerAId ?? liveBowlerAId);
        setLiveBowlerBId(data.innings.currentBowlerBId ?? liveBowlerBId);
        setLiveInningsHistory((current) => [...current.filter((item) => item.inningsNumber !== historyEntry.inningsNumber), historyEntry].sort((a, b) => a.inningsNumber - b.inningsNumber));
      }
      setLiveUndoAvailable(true);

      setShowWicketPanel(false);
      setShowCustomDeliveryPanel(false);
      setPendingWicketExtraType(null);
      setPendingWicketExtraRuns(0);
      setDismissedPlayerId("");
      setReplacementPlayerId("");
      setRunOutDismissedEnd("STRIKER");
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

  async function performUndo() {
    if (!liveInningsId || !liveUndoAvailable) return;
    if (!window.confirm("Undo the last action? The previous scoring/player state will be restored.")) return;
    try {
      setLiveLoading(true); setError("");
      const response = await fetch(`/api/innings/${liveInningsId}/undo`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to undo action.");
      setLiveUndoAvailable(false);
      await refreshLiveInnings(liveInningsId, createdMatchId);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to undo action."); }
    finally { setLiveLoading(false); }
  }

  async function changeLivePlayer(change: "STRIKER" | "NON_STRIKER" | "BOWLER_A" | "BOWLER_B", playerId: string) {
    if (!liveInningsId || !playerId) return;
    const isDismissed = dismissedIdsForCurrentInnings().has(playerId);
    if ((change === "STRIKER" || change === "NON_STRIKER") && isDismissed) {
      if (!window.confirm("This player was previously dismissed in this innings. Bring them back as a correction?")) return;
    }
    const label = change === "STRIKER" ? "striker" : change === "NON_STRIKER" ? "non-striker" : change === "BOWLER_A" ? "Bowler A" : "Bowler B";
    if (!window.confirm(`Change ${label} to this player? This applies from the next delivery and does not change previous deliveries.`)) return;
    try {
      setLiveLoading(true); setError("");
      const response = await fetch(`/api/innings/${liveInningsId}/manual-state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ change, playerId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to change player.");
      setManualActionMenu(null); setLiveUndoAvailable(true);
      await refreshLiveInnings(liveInningsId, createdMatchId);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to change player."); }
    finally { setLiveLoading(false); }
  }

  function dismissedIdsForCurrentInnings() {
    return new Set(liveDeliveries.filter((delivery) => delivery.wicket).map((delivery) => delivery.wicket!.dismissedPlayerId));
  }

  async function manuallySwapStrikers() {
    if (!liveInningsId) {
      return;
    }

    if (!window.confirm(`Swap batsmen?\n\nStriker: ${liveStriker?.name ?? "Striker"}  /  Non-striker: ${liveNonStriker?.name ?? "Non-striker"}`)) return;

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
      setLiveUndoAvailable(true);
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

    // The final over can be configured as an odd/single-bowler over.
    // In that case only bowler A is required; there is no bowler B.
    const oddFinalOver =
      liveOddOvers &&
      liveCurrentOver >= oversPerInnings;

    const requiresSecondBowler =
      bowlingMode === "DOUBLE" &&
      !oddFinalOver;

    if (
      requiresSecondBowler &&
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
      requiresSecondBowler
        ? nextOverBowlerBId
        : "",
    );
    setLiveBowlerId(nextOverBowlerAId);
    setLiveDeliveryCount(0);
    setNextOverBowlerAId("");
    setNextOverBowlerBId("");
    setError("");
  }

  async function endCurrentMatch() {
    if (!createdMatchId) {
      setError("Match ID is not available.");
      return;
    }

    if (!window.confirm("End this match? It will be moved to Previous Matches.")) {
      return;
    }

    try {
      setLiveLoading(true);
      setError("");
      const response = await fetch(`/api/matches/${createdMatchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to end match.");
      }

      setPageMode("DASHBOARD");
      if (selectedTournament) {
        await loadLiveMatches(selectedTournament.id);
        await loadCompletedMatches(selectedTournament.id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to end match.");
    } finally {
      setLiveLoading(false);
    }
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

    const currentInningsRecord = liveInningsHistory.find(
      (item) => item.inningsNumber === liveInningsNumber,
    );
    const liveTarget = currentInningsRecord?.target ?? null;
    const runsNeeded = liveTarget !== null
      ? Math.max(liveTarget - liveRuns, 0)
      : null;

    const firstInnings = liveInningsHistory.find((item) => item.inningsNumber === 1);
    const secondInnings = liveInningsHistory.find((item) => item.inningsNumber === 2);
    const currentTeamPriorRuns =
      liveBattingTeamId === firstInnings?.battingTeamId
        ? firstInnings?.totalRuns ?? null
        : liveBattingTeamId === secondInnings?.battingTeamId
          ? secondInnings?.totalRuns ?? null
          : null;
    const opponentPriorRuns =
      liveBattingTeamId === firstInnings?.battingTeamId
        ? secondInnings?.totalRuns ?? null
        : liveBattingTeamId === secondInnings?.battingTeamId
          ? firstInnings?.totalRuns ?? null
          : null;
    const firstInningsLeadOrDeficit =
      liveInningsNumber >= 3 &&
      currentTeamPriorRuns !== null &&
      opponentPriorRuns !== null
        ? currentTeamPriorRuns - opponentPriorRuns
        : null;

    const currentOverNumber = completedOvers + 1;
    const liveScoringStats = useMemo(
  () =>
    calculateLiveScoringStats(
      liveDeliveries,
      liveBattingPlayers,
      liveBowlingPlayers,
    ),
  [liveDeliveries, liveBattingPlayers, liveBowlingPlayers],
);


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


    const battingStats = liveScoringStats.batting.map((stat) => ({
      player: liveBattingPlayers.find((player) => player.id === stat.id)!,
      runs: stat.runs, balls: stat.balls, fours: stat.fours, sixes: stat.sixes,
      strikeRate: stat.balls ? ((stat.runs / stat.balls) * 100).toFixed(2) : "0.00",
      dismissed: dismissedIds.has(stat.id),
    }));

    const bowlingStats = liveScoringStats.bowling.map((stat) => ({
      player: liveBowlingPlayers.find((player) => player.id === stat.id)!,
      deliveries: stat.legalBalls, legal: stat.legalBalls, overs: stat.overs, runs: stat.runs, wickets: stat.wickets, economy: stat.legalBalls ? stat.economy.toFixed(2) : "0.00",
    }));

    const partnershipRuns = liveScoringStats.partnership.runs;
    const partnershipBalls = liveScoringStats.partnership.balls;


    const extras = liveScoringStats.extras;

    const fallOfWickets = liveScoringStats.fallOfWickets.map((wicket) => ({
      player: liveBattingPlayers.find((player) => player.id === wicket.playerId),
      score: wicket.runs,
      over: `${Math.max(wicket.overNumber - 1, 0)}.${wicket.ballNumber}`,
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

    const liveDismissalText = (playerId: string) => {
      const detail = liveWicketDetailsByPlayerId[playerId];
      if (!detail) return "OUT";
      const playerName = (id: string | null) =>
        liveBowlingPlayers.find((player) => player.id === id)?.name ?? "Player";
      const bowler = playerName(detail.bowlerId);
      const fielder = detail.fielderId ? playerName(detail.fielderId) : "";
      switch (detail.type) {
        case "BOWLED": return `b ${bowler}`;
        case "CAUGHT": return fielder ? `c ${fielder}   b ${bowler}` : `c b ${bowler}`;
        case "LBW": return `lbw b ${bowler}`;
        case "RUN_OUT": return fielder ? `run out (${fielder})` : "run out";
        case "STUMPED": return fielder ? `st ${fielder}   b ${bowler}` : `st b ${bowler}`;
        case "HIT_WICKET": return `hit wicket b ${bowler}`;
        case "OVER_FENCE": return "over fence";
        default: return "OUT";
      }
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

    const liveTabTarget: Record<LiveTab, string> = {
      LIVE: "live-top",
      SCORECARD: "live-scorecard",
      PLAYERS: "live-players",
      OVERS: "live-overs",
      PARTNERSHIPS: "live-partnership",
      WAGON_WHEEL: "live-deliveries",
      MATCH_INFO: "live-match-info",
    };

    const selectLiveTab = (tab: LiveTab) => {
      setLiveTab(tab);
      window.setTimeout(() => {
        document.getElementById(liveTabTarget[tab])?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    };

    return (
      <section className="-mx-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-mx-8">
        {liveInningsComplete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark] sm:p-8">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Innings Complete</p>
              <h2 className="mt-2 text-3xl font-black">End of Innings {liveInningsNumber}</h2>
              <p className="mt-2 text-slate-500">
                {battingTeam?.team.name ?? "Batting team"} finished on <b>{liveRuns}/{liveWickets}</b> after {oversPerInnings} overs.
              </p>
              {liveInningsNumber < inningsPerMatch ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm font-bold">Innings {liveInningsNumber + 1}: {bowlingTeam?.team.name ?? "Next batting team"} will bat</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={nextInningsStrikerId} onChange={(e) => setNextInningsStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select striker</option>
                      {liveBowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsNonStrikerId} onChange={(e) => setNextInningsNonStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select non-striker</option>
                      {liveBowlingPlayers.filter((p) => p.id !== nextInningsStrikerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsBowlerAId} onChange={(e) => setNextInningsBowlerAId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select bowler A</option>
                      {liveBattingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsBowlerBId} onChange={(e) => setNextInningsBowlerBId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select bowler B</option>
                      {liveBattingPlayers.filter((p) => p.id !== nextInningsBowlerAId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button type="button" disabled={loadingStartInnings} onClick={() => void startNextInnings()} className="h-12 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-40">
                    {loadingStartInnings ? "Starting..." : `Start Innings ${liveInningsNumber + 1}`}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => {
                  setPageMode("DASHBOARD");
                  if (selectedTournament) {
                    void loadLiveMatches(selectedTournament.id);
                    void loadCompletedMatches(selectedTournament.id);
                  }
                }} className="mt-6 h-12 w-full rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top application bar */}


                <div id="live-top" className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">
            {[
              ["LIVE", "Live Scoring"],
              ["SCORECARD", "Scorecard"],
              ["PLAYERS", "Players"],
              ["OVERS", "Overs"],
              ["PARTNERSHIPS", "Partnerships"],
              ["WAGON_WHEEL", "Wagon Wheel"],
              ["MATCH_INFO", "Match Info"],
            ].map(([tab, label]) => (
              <button type="button" key={tab} onClick={() => selectLiveTab(tab as LiveTab)} className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => void endCurrentMatch()} disabled={liveLoading} className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
              {liveLoading ? "Ending..." : "End Match"}
            </button>
          </aside>

          <div className="min-w-0 p-3 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[255px_minmax(0,1fr)_280px]">
              {/* Match information */}
              <aside id="live-match-info" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>
                <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold">
                  {selectedTournament?.name ?? "Tournament"}
                </div>
                <p className="mt-2 text-sm text-slate-500">Innings {liveInningsNumber} of {inningsPerMatch}</p>

                <div className="my-3 overflow-hidden rounded-lg border-y border-slate-200 py-2.5 [color-scheme:dark]">
                  <div className="grid grid-cols-[minmax(42px,auto)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(42px,auto)] items-center gap-1 px-1 text-sm">
                    <span className="truncate font-black text-blue-700">{selectedTournament?.teams.find((item) => item.team.id === teamAId)?.team.shortName ?? "T1"}</span>
                    <div className={`grid min-w-0 ${inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {[1, ...(inningsPerMatch === 4 ? [3] : [])].map((inningNumber) => { const history = liveInningsHistory.find((item) => item.inningsNumber === inningNumber); const isCurrent = liveInningsNumber === inningNumber && liveBattingTeamId === teamAId; const value = isCurrent ? `${liveRuns}/${liveWickets}` : history ? `${history.totalRuns}/${history.wickets ?? 0}` : "-/-"; return <div key={`live-a-${inningNumber}`} className="text-center"><div className="whitespace-nowrap font-black text-slate-900">{value}</div><div className="text-[10px] font-medium text-slate-400">({inningNumber === 1 ? 1 : 2})</div></div>; })}
                    </div>
                    <span className="px-1 text-xs font-black text-slate-400">VS</span>
                    <div className={`grid min-w-0 ${inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {[2, ...(inningsPerMatch === 4 ? [4] : [])].map((inningNumber) => { const history = liveInningsHistory.find((item) => item.inningsNumber === inningNumber); const isCurrent = liveInningsNumber === inningNumber && liveBattingTeamId === teamBId; const value = isCurrent ? `${liveRuns}/${liveWickets}` : history ? `${history.totalRuns}/${history.wickets ?? 0}` : "-/-"; return <div key={`live-b-${inningNumber}`} className="text-center"><div className="whitespace-nowrap font-black text-slate-900">{value}</div><div className="text-[10px] font-medium text-slate-400">({inningNumber === 2 ? 1 : 2})</div></div>; })}
                    </div>
                    <span className="truncate text-right font-black text-emerald-700">{selectedTournament?.teams.find((item) => item.team.id === teamBId)?.team.shortName ?? "T2"}</span>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>
                <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2"><span>Overs per Innings</span><b>{oversPerInnings}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Toss</span><b className="text-right">{tossWinnerId ? `${selectedTournament?.teams.find((item) => item.team.id === tossWinnerId)?.team.name ?? "Team"} won  -  elected to ${tossDecision === "BAT" ? "bat" : "bowl"}` : "Not recorded"}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Innings</span><b>{inningsPerMatch}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Bowling</span><b className="text-right">{doubleMode ? "Double Bowler" : "Normal"}</b></div>
                </div>

                <div className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700">
                  LIVE &nbsp; In Progress
                </div>
              </aside>

              {/* Main scoring area */}
              <main className="min-w-0 space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm [color-scheme:dark]">
                  <LiveScoreHeader
                    battingTeamName={
                      battingTeam?.team.shortName ??
                      battingTeam?.team.name ??
                      "TEAM A"
                    }
                    liveRuns={liveRuns}
                    liveWickets={liveWickets}
                    overDisplay={overDisplay}
                    runRate={runRate}
                    projected={projected}
                    oversRemaining={oversRemaining}
                    liveTarget={liveTarget}
                    runsNeeded={runsNeeded}
                    firstInningsLeadOrDeficit={firstInningsLeadOrDeficit}
                  />                  <div className="grid gap-2 px-5 py-3 text-center text-xs font-semibold sm:grid-cols-4 sm:px-7">
                    <div>CRR: <span className="font-bold">{runRate}</span></div>
                    <div>PROJECTED: <span className="font-bold">{projected}</span></div>
                    <div>Overs Remaining: <span className="font-bold">{oversRemaining}</span></div>
                    <div>
                      {liveTarget !== null ? (
                        <>TARGET: <span className="font-black">{liveTarget}</span>  -  NEED <span className="font-black">{runsNeeded}</span></>
                      ) : firstInningsLeadOrDeficit !== null ? (
                        <>{firstInningsLeadOrDeficit >= 0 ? "1ST INN LEAD" : "1ST INN DEFICIT"}: <span className="font-black">{Math.abs(firstInningsLeadOrDeficit)}</span></>
                      ) : (
                        <>1ST INNINGS</>
                      )}
                    </div>
                  </div>
                </div>

                <LiveScorecardPanel
                  battingStats={battingStats}
                  bowlingStats={bowlingStats}
                  liveStrikerId={liveStrikerId}
                  liveBowlerId={liveBowlerId}
                  liveDismissalText={liveDismissalText}
                  extras={extras}
                  liveRuns={liveRuns}
                  liveWickets={liveWickets}
                  overDisplay={overDisplay}
                  partnershipRuns={partnershipRuns}
                  partnershipBalls={partnershipBalls}
                />
                <LiveOverPanel
                  doubleMode={doubleMode}
                  oddFinalOver={oddFinalOver}
                  currentOverNumber={currentOverNumber}
                  currentOverDeliveries={currentOverDeliveries}
                  deliveryLabel={deliveryLabel}
                  liveBowlerId={liveBowlerId}
                  liveBowlerAId={liveBowlerAId}
                  liveBowlerBId={liveBowlerBId}
                  activeBowlerA={activeBowlerA}
                  activeBowlerB={activeBowlerB}
                  bowlerBallsThisOver={bowlerBallsThisOver}
                />
                <div className={`rounded-xl border p-3 shadow-sm transition-all [color-scheme:dark] ${liveNeedsManualSwap ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200/80" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => void performUndo()} disabled={liveLoading || !liveUndoAvailable} className="h-11 rounded-lg border border-slate-300 bg-slate-100 px-4 font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Undo</button>
                    <button  type="button"  onClick={() => void manuallySwapStrikers()}  disabled={liveLoading ||  liveInningsComplete ||  !liveStrikerId ||   !liveNonStrikerId  }  className={`h-11 rounded-lg px-4 font-bold transition disabled:opacity-40 ${liveAutoSwapNotice
      ? "bg-emerald-600 text-white shadow-md"
      : liveNeedsManualSwap
        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md"
        : "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
  }`}
>
  {liveAutoSwapNotice ? "Auto-swapped ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“" : "Swap Batsmen"}
</button>
                    <button type="button" onClick={() => { setManualStrikerId(liveStrikerId); setManualNonStrikerId(liveNonStrikerId); setManualActionMenu("BATSMAN"); }} disabled={liveLoading || liveInningsComplete} className="h-11 rounded-lg border border-slate-300 bg-slate-100 px-4 font-bold text-slate-800 disabled:opacity-40">Change Batsman</button>
                    <button type="button" onClick={() => { setManualBowlerAId(liveBowlerAId || liveBowlerId); setManualBowlerBId(liveBowlerBId); setManualActionMenu("BOWLER"); }} disabled={liveLoading || liveInningsComplete} className="h-11 rounded-lg border border-slate-300 bg-slate-100 px-4 font-bold text-slate-800 disabled:opacity-40">Change Bowler</button>
                  </div>
                  {liveNeedsManualSwap && <p className="mt-2 text-xs font-bold text-amber-800">Over complete - check the batsmen and swap ends if required.</p>}
                </div>

                {/* Delivery controls */}
                <div id="live-deliveries" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p><span className="text-xs text-slate-500">{liveBowler?.name ?? "No bowler selected"}</span></div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                    {recordButton("0", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 0 }))}
                    {recordButton("1", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 1 }))}
                    {recordButton("2", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 2 }))}
                    {recordButton("3", "bg-white hover:bg-slate-50", () => void recordLiveDelivery({ runsBat: 3 }))}
                    {recordButton("4", "bg-blue-600 text-white hover:bg-blue-700", () => void recordLiveDelivery({ runsBat: 4 }))}
                    {recordButton("5", "bg-blue-600 text-white hover:bg-blue-700", () => void recordLiveDelivery({ runsBat: 5 }))}
                    {recordButton("6", "bg-blue-600 text-white hover:bg-blue-700", () => void recordLiveDelivery({ runsBat: 6 }))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {recordButton("WIDE", "bg-violet-600 text-white hover:bg-violet-700", () => openExtraDeliveryPanel("WIDE"))}
                    {recordButton("NO BALL", "bg-violet-600 text-white hover:bg-violet-700", () => openExtraDeliveryPanel("NO_BALL"))}
                    {recordButton("BYE", "bg-orange-600 text-white hover:bg-orange-700", () => openExtraDeliveryPanel("BYE"))}
                    {recordButton("LEG BYE", "bg-orange-600 text-white hover:bg-orange-700", () => openExtraDeliveryPanel("LEG_BYE"))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={liveLoading || liveInningsComplete || !liveBowlerId}
                      onClick={() => openWicketPanel()}
                      className="col-span-2 h-20 rounded-xl bg-red-500 text-lg font-black text-white hover:bg-red-600 disabled:opacity-40 [color-scheme:dark]"
                    >
                      WICKET
                    </button>
                    {recordButton(
                      "MORE RUNS",
                      "col-span-1 bg-slate-800 text-white hover:bg-slate-900 h-20",
                      () => openCustomDeliveryPanel(),
                    )}
                  </div>
                </div>

                {/* Now batting */}
                <div id="live-players" className="grid gap-3 md:grid-cols-2">
                  {[liveStriker, liveNonStriker].map((player, index) => {
                    if (!player) return null;
                    const stat = battingStats.find((item) => item.player.id === player.id);
                    return <div key={player.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]"><p className="text-xs font-bold uppercase text-slate-500">{index === 0 ? "Now Batting - Striker" : "Now Batting - Non-Striker"}</p><div className="mt-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black">{player.name}</p><p className="text-xs text-slate-500">{stat?.runs ?? 0}* ({stat?.balls ?? 0})</p></div><div className="text-right text-xs font-semibold text-slate-500">{stat?.fours ?? 0} Fours  -  {stat?.sixes ?? 0} Sixes</div></div></div>;
                  })}
                </div>
              </main>

              {/* Right rail */}
              <aside className="space-y-3">
              <LiveBowlingPanel
  activeBowlerA={activeBowlerA}
  activeBowlerB={activeBowlerB}
  liveBowler={liveBowler}
  doubleMode={doubleMode}
  oddFinalOver={oddFinalOver}
  completedOvers={completedOvers}
  overDisplay={overDisplay}
  liveBowlerId={liveBowlerId}
  liveInningsComplete={liveInningsComplete}
  liveLegalBalls={liveLegalBalls}
  liveCurrentOver={liveCurrentOver}
  oversPerInnings={oversPerInnings}
  liveBowlingPlayers={liveBowlingPlayers}
  nextOverBowlerAId={nextOverBowlerAId}
  nextOverBowlerBId={nextOverBowlerBId}
  bowlerBallsThisOver={bowlerBallsThisOver}
  bowlerDisabledForNextOver={bowlerDisabledForNextOver}
  setNextOverBowlerAId={setNextOverBowlerAId}
  setNextOverBowlerBId={setNextOverBowlerBId}
  selectNextOverBowlers={selectNextOverBowlers}
/>

<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
    Recent Deliveries
  </p>
  <div className="mt-3 space-y-2">
    {recentDeliveries.map((delivery) => (
      <div
        key={delivery.id}
        className="grid grid-cols-[45px_38px_1fr_30px] items-center gap-2 text-xs"
      >
        <span className="text-slate-500">
          {delivery.overNumber}.{delivery.ballNumber}
        </span>

        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
            delivery.isWicket
              ? "bg-red-500 text-white"
              : delivery.runsTotal === 4 || delivery.runsTotal === 6
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100"
          }`}
        >
          {deliveryLabel(delivery)}
        </span>

        <span className="truncate">
          {delivery.isWicket
            ? "Wicket"
            : delivery.runsTotal === 0
              ? "Dot ball"
              : `${delivery.runsTotal} run${delivery.runsTotal === 1 ? "" : "s"}`}
        </span>

        <span className="font-bold text-slate-500">
          {doubleMode
            ? delivery.bowlerId === liveBowlerAId
              ? "B1"
              : "B2"
            : ""}
        </span>
      </div>
    ))}

    {recentDeliveries.length === 0 && (
      <p className="text-sm text-slate-400">No deliveries yet.</p>
    )}
  </div>
</div>

<LiveBattingPanel
  nextBatsmen={nextBatsmen}
/>

<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
    Fall of Wickets
  </p>
  <div className="mt-3 grid grid-cols-2 gap-3">
    {fallOfWickets.map((fall, index) => (
      <div
        key={`${fall.player?.id ?? index}-${fall.over}`}
        className="border-r border-slate-200 pr-2 last:border-0 [color-scheme:dark]"
      >
        <p className="font-bold">
          {index + 1}-{fall.score}
        </p>
        <p className="truncate text-xs text-slate-500">
          {fall.player?.name ?? "Player"}
        </p>
        <p className="text-xs text-slate-400">
          {fall.over} overs
        </p>
      </div>
    ))}

    {fallOfWickets.length === 0 && (
      <p className="col-span-2 text-sm text-slate-400">
        No wickets.
      </p>
    )}
  </div>
</div>
              </aside>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm [color-scheme:dark]">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span className="font-semibold text-emerald-600">Auto saving</span>
              <span className="font-semibold text-slate-700">All changes saved</span>
            </div>
          </div>
        </div>

        {manualActionMenu && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark]">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Manual Correction</p><h3 className="mt-1 text-2xl font-black">{manualActionMenu === "BATSMAN" ? "Change Batsman" : "Change Bowler"}</h3></div>
                <button type="button" onClick={() => setManualActionMenu(null)} className="h-9 rounded-lg border border-slate-300 px-3 font-semibold">Close</button>
              </div>
              {manualActionMenu === "BATSMAN" ? (
                <div className="mt-5 space-y-4">
                  <div><label className="mb-2 block text-sm font-semibold">Striker</label><div className="flex gap-2"><select value={manualStrikerId} onChange={(e) => setManualStrikerId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">{liveBattingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}{dismissedIdsForCurrentInnings().has(p.id) ? " - DISMISSED" : ""}</option>)}</select><button type="button" onClick={() => void changeLivePlayer("STRIKER", manualStrikerId)} className="h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Apply</button></div></div>
                  <div><label className="mb-2 block text-sm font-semibold">Non-striker</label><div className="flex gap-2"><select value={manualNonStrikerId} onChange={(e) => setManualNonStrikerId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">{liveBattingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}{dismissedIdsForCurrentInnings().has(p.id) ? " - DISMISSED" : ""}</option>)}</select><button type="button" onClick={() => void changeLivePlayer("NON_STRIKER", manualNonStrikerId)} className="h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Apply</button></div></div>
                  <p className="text-xs text-slate-500">Previous deliveries remain credited to the original players. A dismissed player can be selected for a correction.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div><label className="mb-2 block text-sm font-semibold">Bowler A</label><div className="flex gap-2"><select value={manualBowlerAId} onChange={(e) => setManualBowlerAId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">{liveBowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" onClick={() => void changeLivePlayer("BOWLER_A", manualBowlerAId)} className="h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Apply</button></div></div>
                  {doubleMode && !oddFinalOver && <div><label className="mb-2 block text-sm font-semibold">Bowler B</label><div className="flex gap-2"><select value={manualBowlerBId} onChange={(e) => setManualBowlerBId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">{liveBowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" onClick={() => void changeLivePlayer("BOWLER_B", manualBowlerBId)} className="h-11 rounded-lg bg-blue-600 px-4 font-bold text-white">Apply</button></div></div>}
                  <p className="text-xs text-slate-500">In Double Bowler mode either bowling position can be corrected independently. The change applies from the next delivery.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {showCustomDeliveryPanel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark]">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {customDeliveryType === "BAT" ? "More Runs" : customDeliveryType.replace("_", " ")}
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {customDeliveryType === "BAT" ? "Record any run value" : "Additional delivery runs"}
              </h3>

              {customDeliveryType !== "BAT" ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {(customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"
                      ? [0, 1, 2]
                      : [1, 2, 3]
                    ).map((runs) => (
                      <button
                        key={runs}
                        type="button"
                        onClick={() => setCustomDeliveryRuns(String(runs))}
                        className={`h-14 rounded-xl border text-lg font-black ${
                          Number(customDeliveryRuns) === runs
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-900"
                        }`}
                      >
                        {customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL" ? `+${runs}` : runs}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const value = window.prompt(
                          customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"
                            ? "Enter additional runs (0-98):"
                            : "Enter total bye/leg-bye runs (1-99):",
                          customDeliveryRuns,
                        );
                        if (value !== null) setCustomDeliveryRuns(value);
                      }}
                      className="h-14 rounded-xl border border-slate-300 bg-slate-100 text-sm font-black text-slate-900"
                    >
                      MANUAL
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    {customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"
                      ? `Base 1 run + ${customDeliveryRuns || "0"} additional = ${Number(customDeliveryRuns || 0) + 1} total runs.`
                      : `${customDeliveryRuns || "0"} total ${customDeliveryType === "BYE" ? "bye" : "leg-bye"} runs.`}
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={customDeliveryWicket}
                      onChange={(event) => setCustomDeliveryWicket(event.target.checked)}
                      className="h-5 w-5 accent-red-500"
                    />
                    Wicket on this delivery
                  </label>
                </div>
              ) : (
                <div className="mt-5">
                  <label htmlFor="customDeliveryRuns" className="mb-2 block text-sm font-semibold">Bat runs</label>
                  <input
                    id="customDeliveryRuns"
                    type="number"
                    min={0}
                    max={99}
                    step={1}
                    inputMode="numeric"
                    value={customDeliveryRuns}
                    onChange={(event) => setCustomDeliveryRuns(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"
                  />
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCustomDeliveryPanel(false); setCustomDeliveryWicket(false); }}
                  className="h-12 rounded-lg border border-slate-300 font-semibold [color-scheme:dark]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={liveLoading || liveInningsComplete || !liveBowlerId}
                  onClick={() => void submitCustomDelivery()}
                  className="h-12 rounded-lg bg-blue-600 font-bold text-white disabled:opacity-40 [color-scheme:dark]"
                >
                  {customDeliveryWicket ? "Continue to Wicket" : "Record Delivery"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showWicketPanel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark]">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600">Wicket</p>
              <h3 className="mt-1 text-2xl font-black">{liveBattingPlayers.find((player) => player.id === dismissedPlayerId)?.name ?? "Batsman"}</h3>
              {pendingWicketExtraType && (
                <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800">
                  This delivery will be recorded as {pendingWicketExtraType === "WIDE" ? "Wide" : pendingWicketExtraType === "NO_BALL" ? "No Ball" : pendingWicketExtraType === "BYE" ? "Bye" : "Leg Bye"} + {pendingWicketExtraRuns} extra run{pendingWicketExtraRuns === 1 ? "" : "s"} + wicket.
                </p>
              )}
              <div className="mt-5 space-y-4">
                <div><label htmlFor="wicketType" className="mb-2 block text-sm font-semibold">Wicket type</label><select id="wicketType" value={wicketType} onChange={(event) => { const value = event.target.value; setWicketType(value); if (value !== "RUN_OUT") { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } else { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } setReplacementPlayerId(""); setFielderId(""); }} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="BOWLED" className="bg-slate-950 text-white">Bowled</option><option value="CAUGHT" className="bg-slate-950 text-white">Caught</option><option value="LBW" className="bg-slate-950 text-white">LBW</option><option value="RUN_OUT" className="bg-slate-950 text-white">Run Out</option><option value="STUMPED" className="bg-slate-950 text-white">Stumped</option><option value="HIT_WICKET" className="bg-slate-950 text-white">Hit Wicket</option><option value="OVER_FENCE" className="bg-slate-950 text-white">Over Fence</option></select></div>
                {(wicketType === "CAUGHT" || wicketType === "RUN_OUT" || wicketType === "STUMPED") && (
                  <div>
                    <label htmlFor="fielderPlayer" className="mb-2 block text-sm font-semibold">{wicketType === "CAUGHT" ? "Caught by" : wicketType === "STUMPED" ? "Stumped by" : "Run out by"}</label>
                    <select id="fielderPlayer" value={fielderId} onChange={(event) => setFielderId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select player</option>
                      {liveBowlingPlayers.map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {wicketType === "RUN_OUT" && (
                  <div>
                    <p className="mb-2 block text-sm font-semibold">Who was run out?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>
                        <span className="block text-xs uppercase tracking-wide text-slate-500">Striker</span>
                        <span className="mt-1 block font-bold">{liveStriker?.name ?? "Striker"}</span>
                      </button>
                      <button type="button" onClick={() => { setRunOutDismissedEnd("NON_STRIKER"); setDismissedPlayerId(liveNonStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "NON_STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>
                        <span className="block text-xs uppercase tracking-wide text-slate-500">Non-striker</span>
                        <span className="mt-1 block font-bold">{liveNonStriker?.name ?? "Non-striker"}</span>
                      </button>
                    </div>
                  </div>
                )}
                {nextBatsmen.length > 0 ? (
        <div>
          <label htmlFor="replacementPlayer" className="mb-2 block text-sm font-semibold">Replacement batsman</label>
          <select id="replacementPlayer" value={replacementPlayerId} onChange={(event) => setReplacementPlayerId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
            <option value="">Select replacement</option>
            {nextBatsmen.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
          </select>
        </div>
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-black text-red-700">ALL OUT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no replacement batsman available.</div>
      )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setShowWicketPanel(false); setPendingWicketExtraType(null); setPendingWicketExtraRuns(0); setReplacementPlayerId(""); setFielderId(""); }} className="h-12 rounded-lg border border-slate-300 font-semibold [color-scheme:dark]">Cancel</button><button type="button" disabled={(nextBatsmen.length > 0 && !replacementPlayerId) || liveLoading || ((wicketType === "CAUGHT" || wicketType === "RUN_OUT" || wicketType === "STUMPED") && !fielderId)} onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, replacementPlayerId, ...(fielderId ? { fielderId } : {}), ...(pendingWicketExtraType ? { runsExtra: pendingWicketExtraRuns, extraType: pendingWicketExtraType } : {}) })} className="h-12 rounded-lg bg-red-500 font-bold text-white disabled:opacity-40 [color-scheme:dark]">Confirm Wicket</button></div>
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
  // Main
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 text-white [color-scheme:dark]">
      <div
  className={
    pageMode === "LIVE_SCORING"
      ? "mx-auto flex min-h-screen w-full flex-col px-3 py-4 sm:px-4 lg:px-6"
      : "mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8"
  }
>
        <Header
          appName={APP_NAME}
          selectedTournament={selectedTournament}
          pageMode={pageMode}
          goBackToTournaments={goBackToTournaments}
          liveRefreshLoading={liveRefreshLoading}
          refreshLiveInnings={refreshLiveInnings}
          handleSecretLogoTap={handleSecretLogoTap}
        />

        <ErrorBanner error={error} />

        <section className="flex-1">
          <div className={
            pageMode === "LIVE_SCORING"
              ? "rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
              : "rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8"
          }>
            {pageMode === "TOURNAMENTS" && (
              <TournamentList
                tournaments={tournaments}
                loadingTournaments={loadingTournaments}
                formatLabels={formatLabels}
                openTournament={openTournament}
                setShowCreateTournament={setShowCreateTournament}
                setError={setError}
              />
            )}

            {pageMode === "DASHBOARD" && selectedTournament && (
              <TournamentDashboard
                selectedTournament={selectedTournament}
                selectedTeamId={selectedTeamId}
                teamPlayers={teamPlayers}
                liveMatches={liveMatches}
                completedMatches={completedMatches}
                loadingLiveMatches={loadingLiveMatches}
                loadingCompletedMatches={loadingCompletedMatches}
                expandedMatchId={expandedMatchId}
                loadingScorecard={loadingScorecard}
                formatLabels={formatLabels}
                openMatchSetup={openMatchSetup}
                openAddTeamModal={openAddTeamModal}
                selectTeam={selectTeam}
                removeTeamFromCurrentTournament={removeTeamFromCurrentTournament}
                openAddPlayerModal={openAddPlayerModal}
                setEditingPlayerId={setEditingPlayerId}
                setPlayerName={setPlayerName}
                setPlayerJerseyNumber={setPlayerJerseyNumber}
                setPlayerBattingStyle={setPlayerBattingStyle}
                setPlayerBowlingStyle={setPlayerBowlingStyle}
                setShowAddPlayer={setShowAddPlayer}
                removePlayerFromCurrentRoster={removePlayerFromCurrentRoster}
                loadLiveMatches={loadLiveMatches}
                loadCompletedMatches={loadCompletedMatches}
                setExpandedMatchId={setExpandedMatchId}
                openScorecard={openScorecard}
                resumeMatch={resumeMatch}
                resumingMatchId={resumingMatchId}
              />
            )}

            {pageMode === "MATCH_SETUP" && (
              <MatchSetup
                selectedTournament={selectedTournament}
                teamAId={teamAId}
                setTeamAId={setTeamAId}
                teamBId={teamBId}
                setTeamBId={setTeamBId}
                playersPerTeam={playersPerTeam}
                setPlayersPerTeam={setPlayersPerTeam}
                playersOptions={playersOptions}
                oversInput={oversInput}
                handleOversChange={handleOversChange}
                handleOversBlur={handleOversBlur}
                inningsPerMatch={inningsPerMatch}
                setInningsPerMatch={setInningsPerMatch}
                tossWinnerId={tossWinnerId}
                setTossWinnerId={setTossWinnerId}
                tossDecision={tossDecision}
                setTossDecision={setTossDecision}
                bowlingMode={bowlingMode}
                setBowlingMode={setBowlingMode}
                canContinue={canContinue}
                loadingMatchCreate={loadingMatchCreate}
                handleMatchContinue={handleMatchContinue}
                backToDashboard={backToDashboard}
              />
            )}

            {pageMode === "PLAYER_SELECTION" && (
              <PlayerSelection
                  selectedTournament={selectedTournament}
                  teamAId={teamAId}
                  teamBId={teamBId}
                  matchPlayersA={matchPlayersA}
                  matchPlayersB={matchPlayersB}
                  captainA={captainA}
                  captainB={captainB}
                  viceCaptainA={viceCaptainA}
                  viceCaptainB={viceCaptainB}
                  wicketKeeperA={wicketKeeperA}
                  wicketKeeperB={wicketKeeperB}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                  playersPerTeam={playersPerTeam}
                  teamASelectionValid={teamASelectionValid}
                  teamBSelectionValid={teamBSelectionValid}
                  canSaveMatchPlayers={canSaveMatchPlayers}
                  loadingMatchPlayers={loadingMatchPlayers}
                  setMatchPlayersA={setMatchPlayersA}
                  setMatchPlayersB={setMatchPlayersB}
                  setCaptainA={setCaptainA}
                  setCaptainB={setCaptainB}
                  setViceCaptainA={setViceCaptainA}
                  setViceCaptainB={setViceCaptainB}
                  setWicketKeeperA={setWicketKeeperA}
                  setWicketKeeperB={setWicketKeeperB}
                  setPageMode={setPageMode}
                  saveMatchPlayers={saveMatchPlayers}
                  toggleMatchPlayer={toggleMatchPlayer}                />
            )}

            {pageMode === "OPENING_PLAYERS" && (
              <OpeningPlayers
                  selectedTournament={selectedTournament}
                  teamAId={teamAId}
                  teamBId={teamBId}
                  matchPlayersA={matchPlayersA}
                  matchPlayersB={matchPlayersB}
                  openingStrikerId={openingStrikerId}
                  openingNonStrikerId={openingNonStrikerId}
                  openingBowlerAId={openingBowlerAId}
                  openingBowlerBId={openingBowlerBId}
                  loadingStartInnings={loadingStartInnings}
                  openingPlayersReady={openingPlayersReady}
                  bowlingMode={bowlingMode}
                  tossWinnerId={tossWinnerId}
                  tossDecision={tossDecision}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                  setOpeningStrikerId={setOpeningStrikerId}
                  setOpeningNonStrikerId={setOpeningNonStrikerId}
                  setOpeningBowlerAId={setOpeningBowlerAId}
                  setOpeningBowlerBId={setOpeningBowlerBId}
                  setPageMode={setPageMode}
                  startFirstInnings={startFirstInnings}
                />
            )}

            {pageMode === "LIVE_SCORING" && (
              <LiveScoring />
            )}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-slate-600">
          {APP_NAME}
        </footer>
      </div>
      <ScorecardModal
        scorecardMatch={scorecardMatch}
        selectedTournament={selectedTournament}
        exportScorecardPdf={exportScorecardPdf}
        setScorecardMatch={setScorecardMatch}
/>
      <CreateTournamentModal
        showCreateTournament={showCreateTournament}
        loadingCreate={loadingCreate}
        tournamentName={tournamentName}
        tournamentSeason={tournamentSeason}
        tournamentFormat={tournamentFormat}
        setTournamentName={setTournamentName}
        setTournamentSeason={setTournamentSeason}
        setTournamentFormat={setTournamentFormat}
        setShowCreateTournament={setShowCreateTournament}
        setError={setError}
        createTournament={() => void createTournament()}
      />
      <ManagementModal
  selectedTeam={selectedTournament?.teams.find(
    (tournamentTeam) => tournamentTeam.team.id === selectedTeamId,
  )?.team ?? null}
  teamPlayers={teamPlayers}
  availablePlayers={availablePlayers}
  showAddPlayer={showAddPlayer}
  editingPlayerId={editingPlayerId}
  addPlayerMode={addPlayerMode}
  selectedExistingPlayerId={selectedExistingPlayerId}
  loadingAvailablePlayers={loadingAvailablePlayers}
  playerName={playerName}
  playerJerseyNumber={playerJerseyNumber}
  playerBattingStyle={playerBattingStyle}
  playerBowlingStyle={playerBowlingStyle}
  loadingPlayerCreate={loadingPlayerCreate}
  loadingPlayerUpdate={loadingPlayerUpdate}
  setShowAddPlayer={setShowAddPlayer}
  setEditingPlayerId={setEditingPlayerId}
  setSelectedExistingPlayerId={setSelectedExistingPlayerId}
  setAddPlayerMode={setAddPlayerMode}
  setPlayerName={setPlayerName}
  setPlayerJerseyNumber={setPlayerJerseyNumber}
  setPlayerBattingStyle={setPlayerBattingStyle}
  setPlayerBowlingStyle={setPlayerBowlingStyle}
  setError={setError}
  resetPlayerForm={resetPlayerForm}
  loadAvailablePlayers={loadAvailablePlayers}
  addExistingPlayerToTeam={addExistingPlayerToTeam}
  createPlayerForTeam={createPlayerForTeam}
  updatePlayerForTeam={updatePlayerForTeam}
  showAddTeam={showAddTeam}
  selectedTournament={selectedTournament}
  globalTeams={globalTeams}
  loadingGlobalTeams={loadingGlobalTeams}
  addTeamMode={addTeamMode}
  selectedExistingTeamId={selectedExistingTeamId}
  teamName={teamName}
  teamShortName={teamShortName}
  loadingTeamCreate={loadingTeamCreate}
  setAddTeamMode={setAddTeamMode}
  setSelectedExistingTeamId={setSelectedExistingTeamId}
  setTeamName={setTeamName}
  setTeamShortName={setTeamShortName}
  setShowAddTeam={setShowAddTeam}
  addExistingTeamToTournament={addExistingTeamToTournament}
  createTeam={createTeam}
/>

      <MaintenanceModal
        maintenanceMode={maintenanceMode}
        maintenancePin={maintenancePin}
        maintenanceError={maintenanceError}
        setMaintenanceMode={setMaintenanceMode}
        setMaintenancePin={setMaintenancePin}
        setMaintenanceError={setMaintenanceError}
        verifyMaintenancePin={verifyMaintenancePin}
        tournaments={tournaments}
        deletingTournamentId={deletingTournamentId}
        deleteTournament={(tournamentId) => {
          const tournament = tournaments.find((item) => item.id === tournamentId);
          if (tournament) {
            void deleteTournament(tournament);
          }
        }}
      />
    </main>
  );
}



















