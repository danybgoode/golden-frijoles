# off-vercel-hosting D5 — the one production image for apps/web. Portable on purpose: any host that runs a container
# (the Oracle VM today, Cloud Run or anything else tomorrow) runs this, with the runtime env supplied by the host.
#
#   docker build -t golden-frijoles \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... .
#   docker run --env-file .env -p 3000:3000 golden-frijoles
#
# The two NEXT_PUBLIC_* values are inlined into the browser bundle by `next build`, so they are BUILD args (they are
# public by design) and are kept in the runtime stage too. Every other variable — secrets included — is runtime env and
# never enters a layer.

ARG NODE_IMAGE=node:24-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/cli/package.json packages/cli/package.json
# --ignore-scripts: the root `prepare` sets a git hooks path (no git here); nothing the build needs has an install
# script (next's compiler and sharp ship as prebuilt optional packages).
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# The commit being built (deploy.yml passes the merge SHA): next.config sends it as `x-gf-revision`.
ARG GF_REVISION=
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    GF_REVISION=${GF_REVISION} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=apps/web

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ARG GF_REVISION=
# What update.sh and an operator read to know which commit a container runs.
LABEL org.opencontainers.image.source="https://github.com/danybgoode/golden-frijoles" \
      org.opencontainers.image.revision="${GF_REVISION}"
# The same two public values again at RUNTIME: lib/supabase-auth.ts reads them by a dynamic key, which Next does not
# inline, so a session read 500s without them (verifier, #444). Public by design; the image is public anyway.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# The standalone server and the traced node_modules, then the two folders Next leaves for a CDN to serve.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/llms.txt').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
