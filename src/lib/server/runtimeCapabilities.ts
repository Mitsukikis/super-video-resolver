import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawn } from "node:child_process";

export const resolverDependencyMissingCode = "RESOLVER_DEPENDENCY_MISSING";
export const resolverDependencyMissingMessage =
  `${resolverDependencyMissingCode}: 服务器尚未安装视频解析组件，请联系管理员完成配置。`;

export type ResolverExecutableSource = "YTDLP_PATH" | "YT_DLP_BIN" | "FFMPEG_PATH" | "PATH";

export type ResolverExecutableCheck =
  | {
      available: true;
      command: string;
      source: ResolverExecutableSource;
    }
  | {
      available: false;
      code: typeof resolverDependencyMissingCode;
      message: string;
    };

export type PublicRuntimeCapabilities = {
  resolverReady: boolean;
  ytDlpAvailable: boolean;
  ytDlpVersion?: string;
  ffmpegAvailable: boolean;
  ffmpegVersion?: string;
  tempDirectoryWritable: boolean;
  nodeVersion: string;
  platform: NodeJS.Platform;
  browserMergeEnabled: boolean;
};

type EnvLike = Record<string, string | undefined>;

function canExecuteSync(filePath: string) {
  try {
    if (!existsSync(filePath)) return false;
    return true;
  } catch {
    return false;
  }
}

function pathCandidates(dir: string, binary: string, env: EnvLike) {
  if (process.platform !== "win32") return [join(dir, binary)];
  const extensions = (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  const hasExtension = /\.[a-z0-9]+$/i.test(binary);
  return hasExtension
    ? [join(dir, binary)]
    : [join(dir, binary), ...extensions.map((extension) => join(dir, `${binary}${extension.toLowerCase()}`))];
}

function findInPath(binaryNames: string[], env: EnvLike): string | null {
  const pathValue = env.PATH ?? env.Path ?? env.path ?? "";
  const dirs = pathValue.split(delimiter).filter(Boolean);

  for (const dir of dirs) {
    for (const binary of binaryNames) {
      for (const candidate of pathCandidates(dir, binary, env)) {
        if (canExecuteSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

function isBareCommandName(command: string) {
  return !command.includes("/") && !command.includes("\\");
}

function configuredExecutable(
  env: EnvLike,
  envKeys: ResolverExecutableSource[],
  binaryNames: string[],
  missingMessage: string
): ResolverExecutableCheck {
  for (const key of envKeys) {
    const configured = env[key]?.trim();
    if (!configured) continue;
    if (canExecuteSync(configured)) {
      return { available: true, command: configured, source: key };
    }
    if (key === "YT_DLP_BIN" && isBareCommandName(configured)) {
      const legacyCommand = findInPath([configured], env);
      if (legacyCommand) return { available: true, command: legacyCommand, source: key };
    }
    return {
      available: false,
      code: resolverDependencyMissingCode,
      message: `${missingMessage}：${key} 指向的文件不可用。`
    };
  }

  const fromPath = findInPath(binaryNames, env);
  if (fromPath) return { available: true, command: fromPath, source: "PATH" };

  return {
    available: false,
    code: resolverDependencyMissingCode,
    message: missingMessage
  };
}

export function resolveYtDlpExecutable(env: EnvLike = process.env): ResolverExecutableCheck {
  return configuredExecutable(
    env,
    ["YTDLP_PATH", "YT_DLP_BIN"],
    process.platform === "win32" ? ["yt-dlp", "yt-dlp.exe"] : ["yt-dlp"],
    resolverDependencyMissingMessage
  );
}

export function resolveFfmpegExecutable(env: EnvLike = process.env): ResolverExecutableCheck {
  return configuredExecutable(
    env,
    ["FFMPEG_PATH"],
    process.platform === "win32" ? ["ffmpeg", "ffmpeg.exe"] : ["ffmpeg"],
    "SERVER_FFMPEG_MISSING: 服务器未找到原生 ffmpeg。浏览器 ffmpeg.wasm 不能替代服务端 ffmpeg。"
  );
}

export async function commandVersion(command: string, args: string[] = ["--version"]) {
  return new Promise<string | undefined>((resolve) => {
    const child = spawn(command, args, { shell: false });
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.on("error", () => resolve(undefined));
    child.on("close", () => {
      resolve(stdout.trim().split(/\r?\n/)[0] || undefined);
    });
  });
}

async function tempDirectoryWritable() {
  let tempDir: string | undefined;
  try {
    tempDir = await mkdtemp(join(tmpdir(), "super-video-runtime-"));
    await writeFile(join(tempDir, "probe.txt"), "ok", { encoding: "utf8" });
    return true;
  } catch {
    return false;
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

export async function getPublicRuntimeCapabilities(env: EnvLike = process.env): Promise<PublicRuntimeCapabilities> {
  const ytDlp = resolveYtDlpExecutable(env);
  const ffmpeg = resolveFfmpegExecutable(env);
  const [ytDlpVersion, ffmpegVersion, writable] = await Promise.all([
    ytDlp.available ? commandVersion(ytDlp.command) : Promise.resolve(undefined),
    ffmpeg.available ? commandVersion(ffmpeg.command) : Promise.resolve(undefined),
    tempDirectoryWritable()
  ]);

  const ytDlpAvailable = ytDlp.available;
  const ffmpegAvailable = ffmpeg.available;

  return {
    resolverReady: ytDlpAvailable && writable,
    ytDlpAvailable,
    ytDlpVersion,
    ffmpegAvailable,
    ffmpegVersion,
    tempDirectoryWritable: writable,
    nodeVersion: process.version,
    platform: process.platform,
    browserMergeEnabled: env.DISABLE_BROWSER_MERGE !== "1"
  };
}
