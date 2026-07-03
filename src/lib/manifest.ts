import { z } from "zod";

export const PlatformSchema = z.enum(["x", "bilibili", "youtube"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const TrackSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["video", "audio", "combined", "hls", "dash"]),
  url: z.string().url(),
  container: z.string().optional(),
  codec: z.string().optional(),
  bitrateKbps: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fps: z.number().positive().optional(),
  sizeBytes: z.number().int().positive().optional(),
  headers: z.record(z.string()).optional(),
  expiresAt: z.string().datetime().optional()
});
export type Track = z.infer<typeof TrackSchema>;

export const VariantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["combined", "split", "stream"]),
  action: z.enum(["direct-save", "browser-merge", "local-tool", "unsupported"]),
  videoTrackId: z.string().optional(),
  audioTrackId: z.string().optional(),
  combinedTrackId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  fps: z.number().positive().optional(),
  bitrateKbps: z.number().int().positive().optional(),
  container: z.string().optional(),
  sizeBytes: z.number().int().positive().optional()
});
export type Variant = z.infer<typeof VariantSchema>;

export const FallbackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  command: z.string().min(1),
  containsSensitiveData: z.boolean().default(false)
});
export type Fallback = z.infer<typeof FallbackSchema>;

export const ManifestSchema = z.object({
  sourceUrl: z.string().url(),
  platform: PlatformSchema,
  title: z.string().min(1),
  author: z.string().optional(),
  durationSeconds: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  variants: z.array(VariantSchema),
  tracks: z.array(TrackSchema),
  warnings: z.array(z.string()),
  fallbacks: z.array(FallbackSchema)
});
export type Manifest = z.infer<typeof ManifestSchema>;

