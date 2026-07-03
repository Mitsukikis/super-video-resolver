import { createYtDlpResolver } from "./ytDlp";
import type { ResolverPlugin } from "./types";

export const resolverPlugins: ResolverPlugin[] = [
  createYtDlpResolver("youtube"),
  createYtDlpResolver("bilibili"),
  createYtDlpResolver("x")
];

