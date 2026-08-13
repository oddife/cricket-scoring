#!/bin/sh
set -eu

mkdir -p /app/data
npx prisma migrate deploy
exec npm run start
