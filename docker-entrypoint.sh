#!/bin/sh
set -e

echo "Running database migrations..."
npm run migration:up

echo "Starting application..."
exec "$@"
