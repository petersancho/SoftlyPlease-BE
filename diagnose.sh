#!/usr/bin/env bash
set -euo pipefail

BASE=""
DEF=""
MODE="auto"  # auto | standard | solve
COMPUTE=""
HEADER_JSON="Accept: application/json"
CT_JSON="Content-Type: application/json"

while getopts "b:d:m:c:" opt; do
  case $opt in
    b) BASE="${OPTARG%/}";;
    d) DEF="$OPTARG";;
    m) MODE="$OPTARG";;
    c) COMPUTE="${OPTARG%/}";;
  esac
done

if [[ -z "$BASE" ]]; then
  echo "Usage: $0 -b https://your-appserver -d DefinitionName[.gh] [-m auto|standard|solve] [-c http://compute:6500]"
  exit 1
fi

echo "== 1) Reachability/TLS =="
curl -sS -o /dev/null -w "HTTP %{http_code} from ${BASE}\nIP %{remote_ip} TLS verify %{ssl_verify_result}\n" "$BASE" || true
echo

echo "== 2) AppServer examples page (if present) =="
curl -sS -I "$BASE/examples/" || true
echo

echo "== 3) Try JSON definition list at '/' (AppServer default) =="
curl -sS -H "$HEADER_JSON" "$BASE/" | head -c 800 || echo "[no JSON list at '/']"

if [[ -n "$DEF" ]]; then
  echo
  echo "== 4) Inspect definition metadata (try both endpoint styles) =="
  DEFNOEXT="${DEF%.gh}"

  echo "-- Standard: GET /${DEF}"
  curl -sS -H "$HEADER_JSON" "$BASE/${DEF}" | head -c 800 || true
  echo

  echo "-- Standard v2: GET /definition/${DEF}"
  curl -sS -H "$HEADER_JSON" "$BASE/definition/${DEF}" | head -c 800 || true
  echo

  echo "== 5) CORS preflight check =="
  echo "-- OPTIONS (standard): /${DEF}"
  curl -sS -i -X OPTIONS "$BASE/${DEF}" | sed -n '1,20p' || true
  echo

  echo "-- OPTIONS (solve): /solve/${DEFNOEXT}"
  curl -sS -i -X OPTIONS "$BASE/solve/${DEFNOEXT}" | sed -n '1,20p' || true
  echo

  echo "== 6) POST solve (expect 200 or a helpful 4xx/5xx) =="
  if [[ "$MODE" == "solve" || "$MODE" == "auto" ]]; then
    echo "-- POST /solve/${DEFNOEXT} (custom route)"
    curl -sS -D - -H "$CT_JSON" -X POST "$BASE/solve/${DEFNOEXT}" -d '{"inputs":{}}' | sed -n '1,80p' || true
  fi

  if [[ "$MODE" == "standard" || "$MODE" == "auto" ]]; then
    echo
    echo "-- POST /${DEF} (standard AppServer)"
    curl -sS -D - -H "$CT_JSON" -X POST "$BASE/${DEF}" -d '{"definition":"'"${DEF}"'","inputs":{}}' | sed -n '1,80p' || true
  fi
fi

if [[ -n "$COMPUTE" ]]; then
  echo
  echo "== 7) Rhino Compute healthchecks =="
  echo "-- GET ${COMPUTE}/healthcheck"
  curl -sS -i "${COMPUTE}/healthcheck" | sed -n '1,20p' || true
  echo

  echo "-- GET ${COMPUTE}/version"
  curl -sS -i "${COMPUTE}/version" | sed -n '1,20p' || true
fi

echo
echo "Done."
