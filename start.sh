#!/bin/sh

# Start backend server in background
cd /app/server
npm run db:push
npm run dev &

# Start frontend server
cd /app/client
npm run dev -- --host 0.0.0.0 &

# Keep container running
wait
