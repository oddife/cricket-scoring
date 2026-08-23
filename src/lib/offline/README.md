# Offline scoring foundation

This directory is the foundation for offline-first scoring.

## Design

- The existing server/API remains the source of truth when online.
- Offline match operations will be queued locally and replayed when connectivity returns.
- Match data must remain available after app restart.
- Sync must be idempotent so reconnecting cannot duplicate deliveries or score changes.
- The Android shell will be added with Capacitor after the web offline layer is established.

## Phase 1

1. Add a persistent client-side store for active match state.
2. Add an operation queue for scoring mutations.
3. Add connectivity-aware synchronization.
4. Add PWA install/offline caching.
5. Package the same web application with Capacitor for Android.

Do not modify the existing server database schema for this foundation until the sync contract is implemented and tested.
