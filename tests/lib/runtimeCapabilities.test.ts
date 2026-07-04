import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  commandVersion,
  getPublicRuntimeCapabilities,
  resolveFfmpegExecutable,
  resolveYtDlpExecutable
} from "@/lib/server/runtimeCapabilities";

describe("runtimeCapabilities", () => {
  it("prefers YTDLP_PATH over legacy and PATH lookup", () => {
    const resolved = resolveYtDlpExecutable({
      YTDLP_PATH: process.execPath,
      YT_DLP_BIN: "yt-dlp",
      PATH: ""
    });

    expect(resolved).toMatchObject({
      available: true,
      command: process.execPath,
      source: "YTDLP_PATH"
    });
  });

  it("finds yt-dlp and ffmpeg from PATH without hardcoding local absolute paths", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "resolver-runtime-"));
    const ytDlpName = process.platform === "win32" ? "yt-dlp.cmd" : "yt-dlp";
    const ffmpegName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

    try {
      writeFileSync(join(tempDir, ytDlpName), process.platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n");
      writeFileSync(join(tempDir, ffmpegName), process.platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n");

      const env = {
        PATH: tempDir,
        PATHEXT: ".COM;.EXE;.BAT;.CMD"
      };

      expect(resolveYtDlpExecutable(env)).toMatchObject({
        available: true,
        source: "PATH"
      });
      expect(resolveFfmpegExecutable(env)).toMatchObject({
        available: true,
        source: "PATH"
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("supports legacy YT_DLP_BIN command names through PATH lookup", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "resolver-runtime-"));
    const ytDlpName = process.platform === "win32" ? "yt-dlp.cmd" : "yt-dlp";

    try {
      writeFileSync(join(tempDir, ytDlpName), process.platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n");

      expect(
        resolveYtDlpExecutable({
          YT_DLP_BIN: "yt-dlp",
          PATH: tempDir,
          PATHEXT: ".COM;.EXE;.BAT;.CMD"
        })
      ).toMatchObject({
        available: true,
        source: "YT_DLP_BIN"
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("returns a public capability payload without exposing executable paths", async () => {
    const capabilities = await getPublicRuntimeCapabilities({
      YTDLP_PATH: process.execPath,
      FFMPEG_PATH: process.execPath,
      PATH: ""
    });

    const serialized = JSON.stringify(capabilities);
    expect(capabilities.resolverReady).toBe(true);
    expect(capabilities.ytDlpAvailable).toBe(true);
    expect(capabilities.ffmpegAvailable).toBe(true);
    expect(serialized).not.toContain(process.execPath);
    expect(serialized).not.toContain(delimiter);
  });

  it("does not expose warning stderr when reading tool versions", async () => {
    const version = await commandVersion(process.execPath, [
      "-e",
      "console.error(process.execPath); console.log('2026.06.09')"
    ]);

    expect(version).toBe("2026.06.09");
  });
});
