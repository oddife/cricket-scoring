# Docker test image

This stack runs the current Next.js application as a production-style container with a persistent SQLite database volume.

## Build and run

```powershell
docker compose -f docker-compose.test.yml up -d --build
```

Open `http://localhost:3000`.

## Logs

```powershell
docker compose -f docker-compose.test.yml logs -f cricket-scoring
```

## Stop

```powershell
docker compose -f docker-compose.test.yml down
```

The SQLite database is kept in the `cricket_scoring_test_data` Docker volume so restarting the container does not reset test data.
