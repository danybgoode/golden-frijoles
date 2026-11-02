# golden-frijoles on the Oracle VM — operate

Production host since off-vercel-hosting (2026-11). One tenant of the shared Oracle VM; the VM's own operating rules
(the tenant contract, the shared proxy, the host baseline) live in the private `oracle-edge` repo.

| | |
|---|---|
| On the VM | `/opt/golden-frijoles` (a sparse checkout of this repo: `deploy/oci` only) |
| Stack | `docker-compose.yml`: one `web` service, capped 0.75 CPU / 768 MB, on the shared `edge` network as `golden-frijoles-web` |
| Edge | Cloudflare (proxied, Full (strict), Authenticated Origin Pulls on) → the shared proxy → `golden-frijoles.caddy` → `golden-frijoles-web:3000` |
| Certs | Origin CA `goldenfrijoles.{pem,key}` (to 2041) and Cloudflare's public `cloudflare-origin-pull-ca.pem` (to **2029-11-01**: replace it before then) beside the other tenants' certs |
| Secrets | `web.env` (0600, `ubuntu`) + a copy in the password manager. Keys: `web.env.example` |

## Deploy and roll back
A merge to `main` that touches the app runs `.github/workflows/deploy.yml`: it builds `linux/arm64`, pushes
`ghcr.io/danybgoode/golden-frijoles:{main,<sha>}`, then waits for the live site to report the merge in its
`x-gf-revision` header and posts the 🚀. On the VM, `golden-frijoles-deploy.timer` runs `update.sh --if-changed` every
2 minutes: it pulls `:main` by digest, starts it, health-checks it from inside the container, installs and validates
the site file, and rolls back to the previous digest on a failed health check.

- Deploy now: `/opt/golden-frijoles/deploy/oci/update.sh`
- Roll back: add `WEB_IMAGE_PIN=ghcr.io/danybgoode/golden-frijoles:<sha>` to `deploy/oci/.env`, run `update.sh`.
  Delete the line to roll forward.
- Change a secret: edit `web.env`, run `update.sh` (it recreates the container with the new env and health-checks it;
  a bare `docker compose restart` does not re-read `web.env`), update the password manager.
- Logs: `docker compose logs -f web`, `journalctl -u golden-frijoles-deploy -n 50`.
- What runs: `docker inspect golden-frijoles-web-1 --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'`
  or `curl -sI https://goldenfrijoles.com/llms.txt | grep x-gf-revision`.

## First install (once, as `ubuntu`)
```bash
sudo install -d -o ubuntu -g ubuntu /opt/golden-frijoles
git clone -q --depth 1 --filter=blob:none --sparse https://github.com/danybgoode/golden-frijoles.git /opt/golden-frijoles
git -C /opt/golden-frijoles sparse-checkout set deploy/oci
cd /opt/golden-frijoles
install -m 0600 /opt/golden-frijoles/deploy/oci/web.env.example /opt/golden-frijoles/deploy/oci/web.env  # then fill it
# The Origin CA cert: `openssl req -new -newkey rsa:2048 -nodes -keyout <certs>/goldenfrijoles.key …` here, POST only the
# CSR to Cloudflare's /certificates, install the answer as goldenfrijoles.pem. Plus Cloudflare's origin-pull CA.
sudo install -m 0644 deploy/oci/systemd/golden-frijoles-deploy.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now golden-frijoles-deploy.timer
```
