#!/bin/zsh
set -e

cd "$(dirname "$0")"
port="${PORT:-8080}"
url="http://127.0.0.1:${port}"

python3 -m http.server "$port" --bind 127.0.0.1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM

sleep 1
open "$url"
wait "$server_pid"
