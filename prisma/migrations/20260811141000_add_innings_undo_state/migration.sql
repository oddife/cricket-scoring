-- Add persistent one-step undo state for live scoring corrections.
ALTER TABLE "Innings" ADD COLUMN "undoState" TEXT;
