import type { Manifest, Platform } from "@/lib/manifest";

export type ResolveInput = {
  url: URL;
  platform: Platform;
  temporaryCookie?: string;
  requestId: string;
};

export type ResolverCapabilities = {
  supportsTemporaryCookie: boolean;
  commonBrowserFetch: "likely" | "mixed" | "unlikely";
  outputTypes: Array<"combined" | "split" | "hls" | "dash">;
};

export type ResolverPlugin = {
  id: Platform;
  displayName: string;
  capabilities: ResolverCapabilities;
  match(url: URL): boolean;
  resolve(input: ResolveInput): Promise<Manifest>;
};

