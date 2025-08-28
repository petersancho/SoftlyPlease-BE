#!/usr/bin/env bash
set -euo pipefail
H=${H:-https://www.softlyplease.com}
C=${C:-http://4.248.252.92:6001}
echo "== AppServer =="
curl -sS -o /dev/null -w "GET / -> %{http_code}\n" "$H/"
curl -sSI "$H/examples/" | sed -n '1,3p' || true
echo "== Compute =="
curl -sS -m 5 "$C/version" || echo "[Compute down]"
curl -sS -m 5 "$C/healthcheck" || echo "[Compute healthcheck down]"
echo "== Solve =="
curl -sS -X POST "$H/solve/" -H "Content-Type: application/json"
-d '{"definition":"BranchNodeRnd.gh","inputs":{"Count":5,"Radius":3,"Length":2}}' | head -c 400 || true
echo
