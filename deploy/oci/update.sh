#!/usr/bin/env bash
# Deploy golden-frijoles on the shared Oracle VM (off-vercel-hosting S2). Run ON the VM, as `ubuntu`:
#
#   /opt/golden-frijoles/deploy/oci/update.sh               # deploy :main now (or the pin)
#   /opt/golden-frijoles/deploy/oci/update.sh --if-changed  # what the 2-minute timer runs: quiet when nothing moved
#
# A merge to main builds `ghcr.io/danybgoode/golden-frijoles:main` (deploy.yml); the timer notices the new digest and
# runs this. The moving tag never runs: :main is resolved to an immutable DIGEST and that digest is what starts.
#
# Roll back: add `WEB_IMAGE_PIN=ghcr.io/danybgoode/golden-frijoles:<sha>` to deploy/oci/.env and run this; a pin
# always wins over :main. Delete the line to roll forward.
set -euo pipefail

ROOT=/opt/golden-frijoles
DEPLOY="$ROOT/deploy/oci"
ENV_FILE="$DEPLOY/.env"
REPO_IMAGE=ghcr.io/danybgoode/golden-frijoles
CADDY="${EDGE_CADDY:-edge-caddy}"
SITE=/opt/edge/sites/golden-frijoles.caddy
IF_CHANGED=0
[ "${1:-}" = "--if-changed" ] && IF_CHANGED=1

# One deploy at a time: the timer and a hand-run must never interleave.
exec 9> /tmp/golden-frijoles-update.lock
flock -n 9 || { [ "$IF_CHANGED" = 1 ] || echo "another golden-frijoles deploy is running"; exit 0; }

# Pull this repo's deploy files first, then re-run the NEW copy of this script once: bash keeps reading the file it
# started with, so a merge that changed update.sh would otherwise deploy with the old checks.
if [ -z "${GF_UPDATE_REEXEC:-}" ]; then
  git -C "$ROOT" fetch -q --depth 1 origin main
  git -C "$ROOT" reset -q --hard origin/main
  flock -u 9
  GF_UPDATE_REEXEC=1 exec "$DEPLOY/update.sh" "$@"
fi
cd "$DEPLOY"

[ -s web.env ] || { echo "✗ deploy/oci/web.env is missing — restore it from the password manager (0600, owner ubuntu)" >&2; exit 1; }
[ "$(stat -c %a web.env)" = 600 ] || { echo "✗ deploy/oci/web.env must be mode 0600" >&2; exit 1; }
touch "$ENV_FILE"

say() { [ "$IF_CHANGED" = 1 ] && [ -z "${LOUD:-}" ] && return 0; echo "$@"; }

# set_env KEY VALUE — rewrite one managed line of .env.
set_env() {
  if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi
}

# The image to run: the pin when .env has one, else :main resolved to its digest under THIS name. A failed pull fails
# the deploy: falling through to a locally cached :main would report success on the previous build.
resolve() {
  local pin digest
  pin="$(grep -E '^WEB_IMAGE_PIN=' "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
  if [ -n "$pin" ]; then docker pull -q "$pin" > /dev/null || { echo "✗ could not pull $pin" >&2; return 1; }; echo "$pin"; return; fi
  docker pull -q "$REPO_IMAGE:main" > /dev/null || { echo "✗ could not pull $REPO_IMAGE:main — refusing to deploy a cached image" >&2; return 1; }
  digest="$(docker image inspect "$REPO_IMAGE:main" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep -m1 "^$REPO_IMAGE@" || true)"
  [ -n "$digest" ] || { echo "✗ no $REPO_IMAGE digest after pulling :main" >&2; return 1; }
  echo "$digest"
}
rev() { docker image inspect "$1" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' 2>/dev/null || true; }

IMAGE="$(resolve)" || exit 1
PREV_IMAGE="$(grep -E '^WEB_IMAGE=' "$ENV_FILE" | tail -1 | cut -d= -f2- || true)"
RUNNING="$(docker compose ps -q web 2>/dev/null | head -1)"
SITE_SAME=0; cmp -s "$DEPLOY/golden-frijoles.caddy" "$SITE" && SITE_SAME=1

if [ "$IF_CHANGED" = 1 ] && [ "$IMAGE" = "$PREV_IMAGE" ] && [ -n "$RUNNING" ] && [ "$SITE_SAME" = 1 ]; then
  exit 0   # nothing moved: the timer stays silent
fi
LOUD=1
echo "▶ deploying $IMAGE (commit $(rev "$IMAGE" | cut -c1-7)); was ${PREV_IMAGE:-nothing}"

# Start the new image. On a failed health check, put the previous digest back.
rollback() {
  echo "✗ $1" >&2
  if [ -n "$PREV_IMAGE" ] && [ "$PREV_IMAGE" != "$IMAGE" ]; then
    set_env WEB_IMAGE "$PREV_IMAGE"
    WEB_IMAGE="$PREV_IMAGE" docker compose up -d --remove-orphans && echo "↩ rolled back to $PREV_IMAGE" >&2
  fi
  exit 1
}
set_env WEB_IMAGE "$IMAGE"
WEB_IMAGE="$IMAGE" docker compose up -d --remove-orphans

# Health from INSIDE the container: a 200 here is the app, not the proxy or Cloudflare.
healthy=0
for _ in $(seq 1 36); do
  if docker compose exec -T web node -e "fetch('http://127.0.0.1:3000/llms.txt').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))" 2> /dev/null; then
    healthy=1; break
  fi
  sleep 5
done
[ "$healthy" = 1 ] || rollback "golden-frijoles did not answer its health check in 3 min — docker compose logs web"
echo "✓ web healthy"

# The site file goes into a directory the SHARED proxy imports: install, validate inside the running proxy, reload,
# and put the previous copy back on any failure, so a bad file never survives to the proxy's next start.
if [ "$SITE_SAME" != 1 ]; then
  [ -f "$SITE" ] && cp "$SITE" "$SITE.prev"
  install -m 0644 "$DEPLOY/golden-frijoles.caddy" "$SITE"
  if ! docker exec "$CADDY" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile > /dev/null 2>&1 \
    || ! docker exec "$CADDY" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile > /dev/null; then
    if [ -f "$SITE.prev" ]; then mv "$SITE.prev" "$SITE"; else rm -f "$SITE"; fi
    echo "✗ the proxy rejected golden-frijoles.caddy — previous site file restored; the proxy is unchanged" >&2
    exit 1
  fi
  rm -f "$SITE.prev"
  echo "✓ proxy validated + reloaded"
fi

# Superseded images only fill the disk. Dangling only: anything a container uses stays, any build can be re-pulled.
docker image prune -f > /dev/null || true
echo "✓ deployed golden-frijoles $(rev "$IMAGE" | cut -c1-7)"
