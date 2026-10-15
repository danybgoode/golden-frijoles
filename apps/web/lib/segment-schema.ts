import { z } from 'zod'
import { EVERYONE } from './flag-funnel'

// funnel-truth D9/D10 — a segment definition as the CLI sends it, pure (the route and its unit spec share it). The
// database CHECKs say the same; this answers in words before a write is attempted.

export const SEGMENT_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const segmentKeySchema = z
  .string()
  .max(48, 'a segment key is at most 48 characters')
  .regex(SEGMENT_KEY, 'a segment key is lowercase words joined by hyphens, like power-users')
  .refine((key) => key !== EVERYONE, 'everyone is every project’s built-in segment; it can’t be defined')

export const segmentDefinitionSchema = z.object({
  key: segmentKeySchema,
  event: z.string().trim().min(1, 'name the event').max(200),
  minCount: z.number().int().min(1).max(10_000),
  days: z.number().int().min(1).max(365),
})
export type SegmentDefinition = z.infer<typeof segmentDefinitionSchema>
