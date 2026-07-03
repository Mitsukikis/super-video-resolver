import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

type MergeRequest = {
  videoUrl: string;
  audioUrl: string;
};

self.onmessage = async (event: MessageEvent<MergeRequest>) => {
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => self.postMessage({ type: "log", message }));
  ffmpeg.on("progress", ({ progress }) => self.postMessage({ type: "progress", progress }));

  try {
    await ffmpeg.load();
    await ffmpeg.writeFile("video.mp4", await fetchFile(event.data.videoUrl));
    await ffmpeg.writeFile("audio.m4a", await fetchFile(event.data.audioUrl));
    await ffmpeg.exec(["-i", "video.mp4", "-i", "audio.m4a", "-c", "copy", "output.mp4"]);
    const file = await ffmpeg.readFile("output.mp4");
    self.postMessage({ type: "done", file });
  } catch (error) {
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : "Browser merge failed" });
  }
};

