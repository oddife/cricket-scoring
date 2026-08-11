-- Configurable tournament points and completion state.
ALTER TABLE "Tournament" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Tournament" ADD COLUMN "winPoints" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Tournament" ADD COLUMN "lossPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tournament" ADD COLUMN "allowTie" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tournament" ADD COLUMN "tiePoints" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Tournament" ADD COLUMN "allowNoResult" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tournament" ADD COLUMN "noResultPoints" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Tournament" ADD COLUMN "completedAt" DATETIME;

-- League/knockout stage and explicit result classification.
ALTER TABLE "Match" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'LEAGUE';
ALTER TABLE "Match" ADD COLUMN "result" TEXT NOT NULL DEFAULT 'NORMAL';

-- Per-match Man of the Match award. Suggested and awarded player may differ.
CREATE TABLE "MatchAward" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "suggestedPlayerId" TEXT,
  "awardedPlayerId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MatchAward_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchAward_suggestedPlayerId_fkey" FOREIGN KEY ("suggestedPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MatchAward_awardedPlayerId_fkey" FOREIGN KEY ("awardedPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MatchAward_matchId_key" ON "MatchAward"("matchId");
CREATE INDEX "MatchAward_suggestedPlayerId_idx" ON "MatchAward"("suggestedPlayerId");
CREATE INDEX "MatchAward_awardedPlayerId_idx" ON "MatchAward"("awardedPlayerId");

-- Tournament-level Man of the Series award and generated shortlist.
CREATE TABLE "TournamentAward" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tournamentId" TEXT NOT NULL,
  "suggestedPlayerIds" TEXT,
  "awardedPlayerId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TournamentAward_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TournamentAward_awardedPlayerId_fkey" FOREIGN KEY ("awardedPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TournamentAward_tournamentId_key" ON "TournamentAward"("tournamentId");
CREATE INDEX "TournamentAward_awardedPlayerId_idx" ON "TournamentAward"("awardedPlayerId");

-- Prisma implicit many-to-many relation for the generated tournament shortlist.
CREATE TABLE "_SuggestedTournamentAwardPlayer" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_SuggestedTournamentAwardPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_SuggestedTournamentAwardPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "TournamentAward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "_SuggestedTournamentAwardPlayer_AB_unique" ON "_SuggestedTournamentAwardPlayer"("A", "B");
CREATE INDEX "_SuggestedTournamentAwardPlayer_B_index" ON "_SuggestedTournamentAwardPlayer"("B");
