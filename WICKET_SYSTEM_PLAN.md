# Wicket / Dismissal System

## Goal
Replace the current simplified wicket assumption with a proper dismissal flow that records dismissal type and relevant player involvement.

## Dismissals
- Bowled — bowler credited
- Caught — select catcher; bowler credited
- LBW — bowler credited
- Run Out — select fielder; bowler NOT credited
- Stumped — select wicketkeeper; bowler credited
- Hit Wicket — bowler credited
- Obstructing the Field — no automatic bowler credit
- Retired Out — no automatic bowler credit
- Timed Out — no automatic bowler credit

## UI requirements
- Wicket dialog appears when Wicket is selected.
- Dismissal type is required.
- Caught, Run Out and Stumped require selecting the relevant current fielding player.
- Player selection comes from the actual fielding team roster; no free-text names.
- Confirm/cancel actions.

## Data/statistics requirements
- Record dismissal type on the wicket/delivery.
- Record involved player/fielder where applicable.
- Correctly credit/debit bowler wicket statistics.
- Show dismissal details in batting scorecard.
- Show fall of wickets with score and over.
- Preserve existing scoring, strike rotation, bowler rotation, resume, tournament and team/player functionality.

## Implementation rule
Backend changes are allowed only if the existing data model/API cannot represent the required dismissal information. Do not alter unrelated scoring logic.
