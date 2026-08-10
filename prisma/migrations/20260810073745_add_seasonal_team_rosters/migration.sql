-- CreateTable
CREATE TABLE "TournamentTeamPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentTeamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentTeamPlayer_tournamentTeamId_fkey" FOREIGN KEY ("tournamentTeamId") REFERENCES "TournamentTeam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentTeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamPlayer_tournamentTeamId_playerId_key" ON "TournamentTeamPlayer"("tournamentTeamId", "playerId");
