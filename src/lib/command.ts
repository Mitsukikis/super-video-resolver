import type { Fallback } from "@/lib/manifest";

function quote(value: string) {
  return `"${value.replaceAll('"', '\\"')}"`;
}

export function buildFallbacks(sourceUrl: string, containsCookie: boolean): Fallback[] {
  const fallbacks: Fallback[] = [
    {
      id: "yt-dlp",
      label: "yt-dlp 最佳视频+音频",
      command: `yt-dlp --no-playlist -f "bv*+ba/b" ${quote(sourceUrl)}`,
      containsSensitiveData: false
    },
    {
      id: "aria2",
      label: "aria2 源链接",
      command: `aria2c ${quote(sourceUrl)}`,
      containsSensitiveData: false
    }
  ];

  if (containsCookie) {
    fallbacks.push({
      id: "yt-dlp-cookies",
      label: "yt-dlp 本地 Cookie",
      command: `yt-dlp --cookies cookies.txt --no-playlist -f "bv*+ba/b" ${quote(sourceUrl)}`,
      containsSensitiveData: true
    });
  }

  return fallbacks;
}

export function buildFfmpegMergeCommand(videoUrl: string, audioUrl: string, output = "output.mp4") {
  return `ffmpeg -i ${quote(videoUrl)} -i ${quote(audioUrl)} -c copy ${quote(output)}`;
}
