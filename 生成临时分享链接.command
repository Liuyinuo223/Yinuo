#!/bin/zsh

set -u

GAME_DIR="/Users/liuyinuo/Documents/Codex/2026-07-27/new-chat-2"
LOCAL_URL="http://127.0.0.1:4173"

cd "$GAME_DIR" || exit 1
clear

echo "Preparing the game for sharing..."
echo

OLD_PREVIEW_PID="$(lsof -ti tcp:4173 2>/dev/null || true)"
if [ -n "$OLD_PREVIEW_PID" ]; then
  kill $OLD_PREVIEW_PID 2>/dev/null || true
  sleep 1
fi

npm run start -- --hostname 0.0.0.0 --port 4173 > .share-preview.log 2>&1 &
SERVER_PID=$!

finish() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap finish EXIT INT TERM

for attempt in {1..40}; do
  if curl -fsS "$LOCAL_URL" >/dev/null 2>&1; then
    echo "The game is ready. Creating a public HTTPS link..."
    echo "Keep this window open while other people are playing."
    echo
    npx --yes localtunnel --port 4173
    exit $?
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "The game could not start."
    tail -30 .share-preview.log
    read "?Press Return to close."
    exit 1
  fi
  sleep 0.25
done

echo "The game took too long to start."
tail -30 .share-preview.log
read "?Press Return to close."
exit 1
