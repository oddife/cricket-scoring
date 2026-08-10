-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Innings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "battingTeamId" TEXT NOT NULL,
    "bowlingTeamId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "legalBalls" INTEGER NOT NULL DEFAULT 0,
    "singleBatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "target" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "currentStrikerId" TEXT,
    "currentNonStrikerId" TEXT,
    "currentBowlerAId" TEXT,
    "currentBowlerBId" TEXT,
    "previousOverBowlerAId" TEXT,
    "previousOverBowlerBId" TEXT,
    CONSTRAINT "Innings_battingTeamId_fkey" FOREIGN KEY ("battingTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Innings_bowlingTeamId_fkey" FOREIGN KEY ("bowlingTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Innings" ("battingTeamId", "bowlingTeamId", "completedAt", "currentBowlerAId", "currentBowlerBId", "currentNonStrikerId", "currentStrikerId", "id", "inningsNumber", "legalBalls", "matchId", "previousOverBowlerAId", "previousOverBowlerBId", "startedAt", "status", "target", "totalRuns", "wickets") SELECT "battingTeamId", "bowlingTeamId", "completedAt", "currentBowlerAId", "currentBowlerBId", "currentNonStrikerId", "currentStrikerId", "id", "inningsNumber", "legalBalls", "matchId", "previousOverBowlerAId", "previousOverBowlerBId", "startedAt", "status", "target", "totalRuns", "wickets" FROM "Innings";
DROP TABLE "Innings";
ALTER TABLE "new_Innings" RENAME TO "Innings";
CREATE UNIQUE INDEX "Innings_matchId_inningsNumber_key" ON "Innings"("matchId", "inningsNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
