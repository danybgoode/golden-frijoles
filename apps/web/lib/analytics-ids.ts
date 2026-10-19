// landing-launch-experiment D8 — the third-party analytics on the marketing pages. Constants, not env vars and not
// gates: both IDs ship in every visitor's page source, so an env var would hide nothing and add a deploy-ordering step
// (and a preview with no value). Whether they load is the VISITOR's call (lib/consent.ts), not a flag's.

/** GA4 property for goldenfrijoles.com (Daniel, 2026-10-19). */
export const GA4_MEASUREMENT_ID = 'G-BWSJJ7JC9X'
/** Microsoft Clarity project (Daniel, 2026-10-19). */
export const CLARITY_PROJECT_ID = 'z0boh5dqbe'
