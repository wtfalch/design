#!/usr/bin/env bash
#
# Make the images on the machine that checks them.
#
# `--font` is `-apple-system`. On macOS that is SF; on a Linux runner it is
# whatever fontconfig picks. Baselines written on one and checked on the other
# differ on every glyph of every image, so the suite fails everywhere at once
# and says nothing about the change that triggered it. Since the token names the
# *system* stack on purpose, the fix is to fix the system rather than to ship
# fonts -- so every committed baseline is made inside the same image CI uses,
# and `pnpm e2e` on a laptop writes to a `darwin` directory that is never
# checked in CI and never stands in for the `linux` one.
#
#   pnpm e2e:docker                 # check against the committed baselines
#   pnpm e2e:docker --update-snapshots
#   pnpm e2e:docker --grep toggle
#   bash tools/e2e-docker.sh node scripts/a11y-known.mjs
#
# The gallery is expected on the host at :5199. Override with GALLERY_PORT.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.62.1-noble"
PORT="${GALLERY_PORT:-5199}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The gallery is served *inside* the container by Playwright's own webServer,
# from a build mounted read-only. An earlier version pointed at a dev server on
# the host over `host.docker.internal` and checked reachability from the host --
# which proves nothing about the container, and duly passed while the container
# got a 403 from Vite's host check on all 204 shots.
DIST="${GALLERY_DIST:-${ROOT}/../tf/dashboard/dist}"
if [ ! -f "${DIST}/design.html" ]; then
  echo "No design.html under ${DIST}" >&2
  echo "Build it:  cd ../tf/dashboard && npm run build" >&2
  echo "Or point GALLERY_DIST at a built gallery." >&2
  exit 1
fi
DIST="$(cd "${DIST}" && pwd)"

# `-t` only when there is a terminal: a non-interactive caller (CI, or an agent)
# has no TTY and docker refuses the flag outright rather than ignoring it.
TTY=()
[ -t 0 ] && TTY=(-it)

exec docker run --rm "${TTY[@]}" \
  -v "${ROOT}:${ROOT}" \
  -v "${DIST}:/gallery:ro" \
  -w "${ROOT}/gallery-e2e" \
  -e "GALLERY_DIST=/gallery" \
  -e "GALLERY_PORT=${PORT}" \
  -e "PLAYWRIGHT_BROWSERS_PATH=/ms-playwright" \
  -e CI=1 \
  "${IMAGE}" \
  "$@"
