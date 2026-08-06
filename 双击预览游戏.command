#!/bin/zsh

set -u

GAME_DIR="/Users/liuyinuo/Documents/Codex/2026-07-27/new-chat-2"
PREVIEW_URL="http://127.0.0.1:4173"
HOST_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

cd "$GAME_DIR" || exit 1

clear
echo "Starting A Branch of Summer..."
echo "Please keep this window open while previewing the game."
echo

OLD_PREVIEW_PID="$(lsof -ti tcp:4173 2>/dev/null || true)"
if [ -n "$OLD_PREVIEW_PID" ]; then
  kill $OLD_PREVIEW_PID 2>/dev/null || true
  sleep 1
fi

npm run start -- --hostname 0.0.0.0 --port 4173 > .preview.log 2>&1 &
SERVER_PID=$!

finish() {
  kill "$SERVER_PID" 2>/dev/null
}
trap finish EXIT INT TERM

for attempt in {1..40}; do
  if curl -fsS "$PREVIEW_URL" >/dev/null 2>&1; then
    open "$PREVIEW_URL"
    echo "The preview is open in your browser: $PREVIEW_URL"
    if [ -n "$HOST_IP" ]; then
      echo
      echo "PHONE LINK (same Wi-Fi): http://$HOST_IP:4173"
      echo "http://$HOST_IP:4173" | pbcopy
      echo "The phone link has also been copied to your clipboard."
    fi
    echo "Close this window when you finish previewing."
    wait "$SERVER_PID"
    exit 0
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "The preview could not start. Details:"
    tail -30 .preview.log
    echo
    read "?Press Return to close."
    exit 1
  fi
  sleep 0.25
done

echo "The preview took too long to start. Details:"
tail -30 .preview.log
read "?Press Return to close."
exit 1
